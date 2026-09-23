import { useMemo, useRef, useState } from "react";
import { useConvex, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, FileSpreadsheet, RotateCcw, Upload } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import { parseCsv } from "@/lib/csv";
import { autoMap } from "@/lib/import/sniff";
import { distinctValues, prepareRows, summarize } from "@/lib/import/classify";
import { headerFingerprint } from "@/lib/import/hash";
import { merchantKey, RuleIndex } from "@/lib/import/merchant";
import { CREATE, EXCLUDE, NONE, TRANSFER, suggestAccount, suggestCategory } from "@/lib/import/suggest";
import type { ImportMapping, MerchantRule, PreparedRow } from "@/lib/import/types";
import { MapStep } from "@/components/import/MapStep";
import { MatchStep } from "@/components/import/MatchStep";
import { ReviewStep } from "@/components/import/ReviewStep";
import { buildValueMaps, formatGBP, isPlaceholder, type ValueStat } from "@/components/import/model";
import { runImport, undoAll, type RunResult } from "@/components/import/runImport";

type Step = "upload" | "map" | "match" | "review" | "importing" | "done";

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "map", label: "Columns" },
  { key: "match", label: "Categories & accounts" },
  { key: "review", label: "Review" },
  { key: "done", label: "Import" },
];

interface LoadedFile {
  name: string;
  headers: string[];
  rows: string[][];
  fingerprint: string;
}

const SPECIAL = new Set([CREATE, TRANSFER, EXCLUDE, NONE]);

export default function ImportPage() {
  const convex = useConvex();
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [mapping, setMapping] = useState<ImportMapping | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [catChoices, setCatChoices] = useState<Record<string, string>>({});
  const [acctChoices, setAcctChoices] = useState<Record<string, string>>({});
  const [manualRules, setManualRules] = useState<MerchantRule[]>([]);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [progress, setProgress] = useState({ stage: "", done: 0, total: 1 });
  const [result, setResult] = useState<RunResult | null>(null);
  const [confirmUndo, setConfirmUndo] = useState<string | null>(null);
  const [undoing, setUndoing] = useState<string | null>(null);

  const categories = useQuery(api.categories.getCategories, {});
  const accounts = useQuery(api.accounts.getActiveAccounts);
  const rules = useQuery(api.merchantRules.listRules);
  const imports = useQuery(api.imports.getImports);
  const user = useQuery(api.users.getCurrentUser);

  const cats = useMemo(
    () => (categories ?? []).map((c) => ({ _id: c._id as string, name: c.name, type: c.type })),
    [categories]
  );
  const accts = useMemo(
    () =>
      (accounts ?? []).map((a) => ({ _id: a._id as string, name: a.name, provider: a.provider, lastFourDigits: a.lastFourDigits })),
    [accounts]
  );
  const ruleIndex = useMemo(() => new RuleIndex([...(rules ?? []), ...manualRules]), [rules, manualRules]);

  const catStats: ValueStat[] = useMemo(
    () => (file && mapping ? distinctValues(file.rows, mapping.category, mapping) : []),
    [file, mapping]
  );
  const acctStats: ValueStat[] = useMemo(
    () => (file && mapping ? distinctValues(file.rows, mapping.account) : []),
    [file, mapping]
  );
  const acctProviders = useMemo(() => {
    const out: Record<string, string> = {};
    if (!file || mapping?.account === undefined || mapping.accountProvider === undefined) return out;
    for (const r of file.rows) {
      const k = (r[mapping.account] ?? "").trim();
      if (k && !out[k]) out[k] = (r[mapping.accountProvider] ?? "").trim();
    }
    return out;
  }, [file, mapping]);

  const maps = useMemo(
    () => buildValueMaps(catChoices, acctChoices, catStats, cats),
    [catChoices, acctChoices, catStats, cats]
  );
  const prepared: PreparedRow[] = useMemo(() => {
    if (!file || !mapping || step === "upload") return [];
    return prepareRows(file.headers, file.rows, mapping, maps, ruleIndex);
  }, [file, mapping, maps, ruleIndex, step]);
  const summary = useMemo(() => summarize(prepared), [prepared]);
  const preview = useMemo(() => {
    if (!file || !mapping) return [];
    return prepareRows(file.headers, file.rows.slice(0, 8), mapping, { category: {}, account: {} }, ruleIndex);
  }, [file, mapping, ruleIndex]);

  const catName = (id: string | undefined) => {
    if (!id) return undefined;
    if (isPlaceholder(id)) return `${id.slice(8)} (new)`;
    return cats.find((c) => c._id === id)?.name;
  };

  /** Pre-fills category/account choices from a saved profile, falling back to suggestions. */
  const fillChoices = (
    m: ImportMapping,
    rows: string[][],
    saved?: { categoryMap: Record<string, string>; accountMap: Record<string, string> }
  ) => {
    const catIds = new Set(cats.map((c) => c._id));
    const acctIds = new Set(accts.map((a) => a._id));
    const cc: Record<string, string> = {};
    for (const s of distinctValues(rows, m.category, m)) {
      const prev = saved?.categoryMap[s.value];
      cc[s.value] =
        prev && (SPECIAL.has(prev) || catIds.has(prev)) ? prev : suggestCategory(s.value, s.positive / (s.rows || 1), cats);
    }
    const ac: Record<string, string> = {};
    for (const s of distinctValues(rows, m.account)) {
      const prev = saved?.accountMap[s.value];
      ac[s.value] = prev && (SPECIAL.has(prev) || acctIds.has(prev)) ? prev : suggestAccount(s.value, accts);
    }
    setCatChoices(cc);
    setAcctChoices(ac);
  };

  const handleFile = async (f: File) => {
    if (categories === undefined || accounts === undefined || rules === undefined) {
      toast.error("Still loading your categories — try again in a moment");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    const table = parseCsv(await f.text());
    if (table.length < 2) {
      toast.error("CSV needs a header row and at least one data row");
      return;
    }
    const [headers, ...rows] = table;
    const fingerprint = headerFingerprint(headers);
    setFile({ name: f.name, headers, rows, fingerprint });
    setManualRules([]);

    const profile = await convex.query(api.importProfiles.getByFingerprint, { headerFingerprint: fingerprint });
    if (profile) {
      const m = profile.mapping as ImportMapping;
      setMapping(m);
      setNotes([]);
      setProfileName(profile.name);
      fillChoices(m, rows, profile);
      setStep("review");
      return;
    }
    const auto = autoMap(headers, rows);
    setNotes(auto.notes);
    setProfileName(null);
    if (!auto.mapping) {
      // let the user pick; start from the first columns
      setMapping({ date: 0, dateFormat: "dmy", amount: { mode: "signed", column: Math.min(1, headers.length - 1) }, rawDescription: 0 });
    } else {
      setMapping(auto.mapping);
      fillChoices(auto.mapping, rows);
    }
    setStep("map");
  };

  const reset = () => {
    setStep("upload");
    setFile(null);
    setMapping(null);
    setResult(null);
    setManualRules([]);
    if (fileInput.current) fileInput.current.value = "";
  };

  const onMerchantEdit = (row: PreparedRow, merchant: string) => {
    const pattern = merchantKey(row.rawDescription || row.merchant || "");
    if (!pattern) return;
    setManualRules((prev) => [...prev.filter((r) => r.pattern !== pattern), { pattern, merchant, source: "manual" }]);
    if (row.merchantSource === "csv") {
      toast.message("This file names the merchant itself, so your rename applies to files without a merchant column.");
    }
  };

  const hasValueStep = catStats.length > 0 || acctStats.length > 0;

  const startImport = async () => {
    if (!file || !mapping) return;
    setStep("importing");
    try {
      const res = await runImport(
        convex,
        {
          fileName: file.name,
          headers: file.headers,
          rows: file.rows,
          mapping,
          catChoices,
          acctChoices,
          catStats,
          acctProviders,
          categories: cats,
          accounts: accts,
          rules: rules ?? [],
          manualRules,
          fingerprint: file.fingerprint,
          profileName: profileName ?? file.name.replace(/\.csv$/i, ""),
          currency: user?.currency ?? "GBP",
        },
        (stage, done, total) => setProgress({ stage, done, total: Math.max(total, 1) })
      );
      setResult(res);
      setStep("done");
      toast.success(`Imported ${res.inserted.toLocaleString()} transactions`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
      setStep("review");
    }
  };

  const undo = async (importId: string) => {
    setConfirmUndo(null);
    setUndoing(importId);
    try {
      const deleted = await undoAll(convex, importId as Id<"imports">);
      toast.success(`Removed ${deleted.toLocaleString()} transactions`);
    } catch {
      toast.error("Failed to undo import");
    } finally {
      setUndoing(null);
    }
  };

  const currentIdx = STEPS.findIndex((s) => s.key === (step === "importing" ? "done" : step));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">Import</p>
          <h2 className="text-2xl font-semibold text-foreground">Bring in your transactions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a bank or aggregator CSV (up to 10MB). Syphon works out the columns, names merchants,
            spots transfers and refunds, and skips anything already imported.
          </p>
        </div>

        <ol className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Import steps">
          {STEPS.filter((s) => s.key !== "match" || hasValueStep || step === "upload").map((s, i) => {
            const idx = STEPS.findIndex((x) => x.key === s.key);
            return (
              <li
                key={s.key}
                aria-current={idx === currentIdx ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2",
                  idx === currentIdx ? "text-foreground font-medium" : idx < currentIdx ? "text-muted-foreground" : "text-muted-foreground/60"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px]",
                    idx === currentIdx ? "border-orange-500 text-orange-400" : "border-border"
                  )}
                >
                  {i + 1}
                </span>
                {s.label}
              </li>
            );
          })}
        </ol>

        {step === "upload" && (
          <div
            role="button"
            tabIndex={0}
            className="p-12 text-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
            onClick={() => fileInput.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
          >
            <input
              id="import-file"
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-1">Choose a CSV file</p>
            <p className="text-sm text-muted-foreground">or drop it here</p>
          </div>
        )}

        {file && mapping && ["map", "match", "review"].includes(step) && (
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium text-foreground tracking-wider">
                  {step === "map" && "MATCH COLUMNS"}
                  {step === "match" && "CATEGORIES & ACCOUNTS"}
                  {step === "review" && "REVIEW"} · {file.name} ({file.rows.length.toLocaleString()} rows)
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Choose another file
                </Button>
              </div>
              {step === "review" && profileName && (
                <p className="text-sm text-muted-foreground">
                  Recognised this file layout. Using your saved settings for <b>{profileName}</b>.{" "}
                  <button type="button" className="underline underline-offset-4 hover:text-foreground" onClick={() => setStep("map")}>
                    Edit settings
                  </button>
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {step === "map" && (
                <MapStep headers={file.headers} sample={file.rows.slice(0, 50)} mapping={mapping} onChange={(m) => {
                  setMapping(m);
                  if (m.category !== mapping.category || m.account !== mapping.account) fillChoices(m, file.rows);
                }} notes={notes} preview={preview} />
              )}
              {step === "match" && (
                <MatchStep
                  catStats={catStats}
                  catChoices={catChoices}
                  onCatChange={(v, c) => setCatChoices((p) => ({ ...p, [v]: c }))}
                  acctStats={acctStats}
                  acctChoices={acctChoices}
                  onAcctChange={(v, c) => setAcctChoices((p) => ({ ...p, [v]: c }))}
                  categories={cats}
                  accounts={accts}
                />
              )}
              {step === "review" && (
                <ReviewStep rows={prepared} summary={summary} categoryName={catName} onMerchantEdit={onMerchantEdit} />
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  className="gap-2"
                  disabled={step === "map"}
                  onClick={() => setStep(step === "review" && hasValueStep ? "match" : "map")}
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                {step !== "review" ? (
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                    onClick={() => setStep(step === "map" && hasValueStep ? "match" : "review")}
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                    disabled={summary.toImport === 0 || categories === undefined || accounts === undefined}
                    onClick={startImport}
                  >
                    <Upload className="w-4 h-4" />
                    Import {summary.toImport.toLocaleString()} rows
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {step === "importing" && (
          <Card className="bg-card border-border">
            <CardContent className="py-10 space-y-3">
              <p className="text-sm text-foreground">{progress.stage}…</p>
              <Progress value={Math.round((progress.done / progress.total) * 100)} aria-label="Import progress" />
              <p className="text-xs text-muted-foreground">
                {progress.done.toLocaleString()} of {progress.total.toLocaleString()}. Keep this tab open. If it's
                interrupted, run the same file again; rows already imported are skipped.
              </p>
            </CardContent>
          </Card>
        )}

        {step === "done" && result && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground tracking-wider">IMPORT COMPLETE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm space-y-1">
                <li><b>{result.inserted.toLocaleString()}</b> transactions added</li>
                {result.duplicate > 0 && <li>{result.duplicate.toLocaleString()} already in Syphon, skipped</li>}
                <li>{summary.transfers.toLocaleString()} transfers ({result.linked} matched pairs), {summary.refunds} refunds</li>
                <li>Money in {formatGBP(summary.income)} · spending {formatGBP(summary.spend)}</li>
                {(result.createdCategories > 0 || result.createdAccounts > 0) && (
                  <li>Created {result.createdCategories} categories and {result.createdAccounts} accounts</li>
                )}
                <li>{result.rulesLearned.toLocaleString()} merchant names learned for future imports</li>
              </ul>
              <div className="flex gap-3">
                <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Link to="/transactions">View transactions</Link>
                </Button>
                <Button variant="ghost" onClick={reset}>Import another file</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {imports && imports.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground tracking-wider">IMPORT HISTORY</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {imports.map((imp) => (
                  <div key={imp._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5" data-testid="import-history-row">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {imp.fileName}
                        {imp.status === "in_progress" && (
                          <span className="ml-2 text-xs text-amber-400">incomplete. Run the file again to finish</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {imp.rowCount.toLocaleString()} added
                        {imp.counts ? ` · ${imp.counts.duplicate} duplicates · ${imp.counts.transfers} transfers · ${imp.counts.refunds} refunds · ${imp.counts.excluded + imp.counts.skipped} not imported` : ""}
                        {" · "}
                        {format(new Date(imp.createdAt), "PPp")}
                      </p>
                    </div>
                    {confirmUndo === imp._id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Remove {imp.rowCount.toLocaleString()} transactions?</span>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10" onClick={() => undo(imp._id)}>
                          Remove
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmUndo(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={undoing === imp._id}
                        onClick={() => setConfirmUndo(imp._id)}
                        className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {undoing === imp._id ? "Undoing…" : "Undo"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
