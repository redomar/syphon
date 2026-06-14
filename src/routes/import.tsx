import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";
import { format } from "date-fns";
import { Upload, FileSpreadsheet, RotateCcw } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseCsv, parseAmountToCents, parseDate } from "@/lib/csv";

type FieldKey = "date" | "amount" | "description" | "type" | "category";

function gbp(cents: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    cents / 100
  );
}

const NONE = "__none__";

export default function ImportPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({
    date: NONE,
    amount: NONE,
    description: NONE,
    type: NONE,
    category: NONE,
  });
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);

  const existing = useQuery(api.transactions.getTransactions, {});
  const imports = useQuery(api.imports.getImports);
  const importTransactions = useMutation(api.imports.importTransactions);
  const undoImport = useMutation(api.imports.undoImport);

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) {
      toast.error("CSV needs a header row and at least one data row");
      return;
    }
    setFileName(file.name);
    setHeaders(rows[0]);
    setDataRows(rows.slice(1));
    // naive auto-map by header name
    const guess = (...names: string[]) => {
      const idx = rows[0].findIndex((h) =>
        names.some((n) => h.toLowerCase().includes(n))
      );
      return idx === -1 ? NONE : String(idx);
    };
    setMapping({
      date: guess("date"),
      amount: guess("amount", "value"),
      description: guess("desc", "name", "memo", "narrative"),
      type: guess("type"),
      category: guess("category"),
    });
  };

  // build parsed rows from mapping
  const parsed = useMemo(() => {
    if (mapping.date === NONE || mapping.amount === NONE || mapping.description === NONE) {
      return [];
    }
    const di = Number(mapping.date);
    const ai = Number(mapping.amount);
    const desci = Number(mapping.description);
    const ti = mapping.type === NONE ? -1 : Number(mapping.type);

    return dataRows
      .map((r) => {
        const date = parseDate(r[di] ?? "");
        const cents = parseAmountToCents(r[ai] ?? "");
        const description = (r[desci] ?? "").trim();
        if (date === null || cents === null || !description) return null;
        let type: "INCOME" | "EXPENSE";
        if (ti >= 0) {
          type = /inc|credit|cr\b/i.test(r[ti] ?? "") ? "INCOME" : "EXPENSE";
        } else {
          type = cents >= 0 ? "INCOME" : "EXPENSE";
        }
        return { type, amount: Math.abs(cents), description, date };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [dataRows, mapping]);

  const duplicateCount = useMemo(() => {
    if (!existing) return 0;
    const day = (ms: number) => Math.floor(ms / 86400000);
    const set = new Set(
      existing.map((t) => `${day(t.date)}|${t.amount}|${t.description.toLowerCase()}`)
    );
    return parsed.filter((p) =>
      set.has(`${day(p.date)}|${p.amount}|${p.description.toLowerCase()}`)
    ).length;
  }, [existing, parsed]);

  const reset = () => {
    setFileName("");
    setHeaders([]);
    setDataRows([]);
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleImport = async () => {
    if (parsed.length === 0) {
      toast.error("Map Date, Amount, and Description first");
      return;
    }
    let rows = parsed;
    if (skipDuplicates && existing) {
      const day = (ms: number) => Math.floor(ms / 86400000);
      const set = new Set(
        existing.map((t) => `${day(t.date)}|${t.amount}|${t.description.toLowerCase()}`)
      );
      rows = parsed.filter(
        (p) => !set.has(`${day(p.date)}|${p.amount}|${p.description.toLowerCase()}`)
      );
    }
    if (rows.length === 0) {
      toast.error("Nothing to import after skipping duplicates");
      return;
    }
    setImporting(true);
    try {
      const res = await importTransactions({ fileName, rows });
      toast.success(`Imported ${res.count} transaction${res.count !== 1 ? "s" : ""}`);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const fieldSelect = (key: FieldKey, label: string, optional?: boolean) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label} {optional && <span className="normal-case">(optional)</span>}
      </label>
      <Select
        value={mapping[key]}
        onValueChange={(v) => setMapping((m) => ({ ...m, [key]: v }))}
      >
        <SelectTrigger className="bg-muted border-border text-foreground">
          <SelectValue placeholder="Select column" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border text-foreground">
          {optional && <SelectItem value={NONE}>Not mapped</SelectItem>}
          {headers.map((h, i) => (
            <SelectItem key={i} value={String(i)}>
              {h || `Column ${i + 1}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">
            Import
          </p>
          <h2 className="text-2xl font-semibold text-foreground">
            Bring in your transactions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a CSV (up to 10MB), map the columns, and import. Duplicates are
            detected on date + amount + description.
          </p>
        </div>

        {headers.length === 0 ? (
          <div
            className="p-12 text-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30"
            onClick={() => fileInput.current?.click()}
          >
            <input
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
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-foreground tracking-wider">
                  MAP COLUMNS — {fileName} ({dataRows.length} rows)
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Choose another file
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fieldSelect("date", "Date")}
                {fieldSelect("amount", "Amount")}
                {fieldSelect("description", "Description")}
                {fieldSelect("type", "Type", true)}
              </div>

              {/* Preview */}
              {parsed.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Preview (first 5 of {parsed.length} valid rows)
                  </p>
                  <div className="border border-border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Description</th>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {parsed.slice(0, 5).map((p, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2">{format(new Date(p.date), "PP")}</td>
                            <td className="px-3 py-2">{p.description}</td>
                            <td className="px-3 py-2">{p.type}</td>
                            <td className="px-3 py-2 text-right font-mono">{gbp(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                  />
                  Skip {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""}
                </label>
                <Button
                  onClick={handleImport}
                  disabled={importing || parsed.length === 0}
                  className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import {skipDuplicates ? parsed.length - duplicateCount : parsed.length} rows
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import history */}
        {imports && imports.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground tracking-wider">
                IMPORT HISTORY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {imports.map((imp) => (
                  <div key={imp._id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-foreground">{imp.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {imp.rowCount} rows · {format(new Date(imp.createdAt), "PPp")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const { deleted } = await undoImport({
                            importId: imp._id as Id<"imports">,
                          });
                          toast.success(`Removed ${deleted} transactions`);
                        } catch {
                          toast.error("Failed to undo import");
                        }
                      }}
                      className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Undo
                    </Button>
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
