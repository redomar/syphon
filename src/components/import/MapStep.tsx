import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";
import type { AmountMapping, DateFormat, ImportMapping, PreparedRow } from "@/lib/import/types";
import { formatGBP } from "./model";

const NOT_MAPPED = "__nm__";

interface Props {
  headers: string[];
  sample: string[][];
  mapping: ImportMapping;
  onChange: (m: ImportMapping) => void;
  notes: string[];
  preview: PreparedRow[];
}

export function SourceTag({ source }: { source?: string }) {
  if (!source) return null;
  const label = { csv: "from file", rule: "your rule", cleaner: "cleaned", raw: "raw" }[source] ?? source;
  return (
    <span
      className={cn(
        "ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
        source === "raw" ? "bg-red-500/10 text-red-400" : "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  );
}

export function MapStep({ headers, sample, mapping, onChange, notes, preview }: Props) {
  const example = (i: number) => sample.find((r) => (r[i] ?? "").trim())?.[i]?.trim() ?? "";

  const columnSelect = (
    id: string,
    label: string,
    value: number | undefined,
    set: (v: number | undefined) => void,
    optional = true
  ) => (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label} {optional && <span className="normal-case">(optional)</span>}
      </label>
      <Select
        value={value === undefined ? NOT_MAPPED : String(value)}
        onValueChange={(v) => set(v === NOT_MAPPED ? undefined : Number(v))}
      >
        <SelectTrigger id={id} className="bg-muted border-border text-foreground">
          <SelectValue placeholder="Select column" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border text-foreground">
          {optional && <SelectItem value={NOT_MAPPED}>Not mapped</SelectItem>}
          {headers.map((h, i) => (
            <SelectItem key={i} value={String(i)}>
              <span>{h || `Column ${i + 1}`}</span>
              {example(i) ? (
                <span className="ml-2 text-muted-foreground text-xs truncate max-w-[14rem]">e.g. {example(i)}</span>
              ) : (
                <span className="ml-2 text-muted-foreground text-xs">(empty)</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const setAmount = (a: AmountMapping) => onChange({ ...mapping, amount: a });
  const amountMode = mapping.amount.mode;
  const firstCol = (a: AmountMapping) => (a.mode === "split" ? a.outColumn : a.column);

  return (
    <div className="space-y-6">
      {notes.length > 0 && (
        <ul className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-300 space-y-1">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {columnSelect("map-date", "Date", mapping.date, (v) => v !== undefined && onChange({ ...mapping, date: v }), false)}
        <div>
          <label htmlFor="map-date-format" className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Date format
          </label>
          <Select value={mapping.dateFormat} onValueChange={(v) => onChange({ ...mapping, dateFormat: v as DateFormat })}>
            <SelectTrigger id="map-date-format" className="bg-muted border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="ymd">Year-month-day (2026-09-21)</SelectItem>
              <SelectItem value="dmy">Day first (21/09/2026)</SelectItem>
              <SelectItem value="mdy">Month first (09/21/2026)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {columnSelect(
          "map-description",
          "Description (bank text)",
          mapping.rawDescription,
          (v) => v !== undefined && onChange({ ...mapping, rawDescription: v }),
          false
        )}
        {columnSelect("map-merchant", "Merchant name", mapping.merchant, (v) => onChange({ ...mapping, merchant: v }))}
        {columnSelect("map-category", "Category", mapping.category, (v) => onChange({ ...mapping, category: v }))}
        {columnSelect("map-account", "Account", mapping.account, (v) => onChange({ ...mapping, account: v }))}
        {columnSelect("map-provider", "Bank / provider", mapping.accountProvider, (v) => onChange({ ...mapping, accountProvider: v }))}
        {columnSelect("map-status", "Status", mapping.status, (v) =>
          onChange({ ...mapping, status: v, pendingValues: v === undefined ? undefined : mapping.pendingValues ?? ["pending"] })
        )}
      </div>

      {/* amount */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</p>
        <div role="radiogroup" aria-label="Amount layout" className="inline-flex rounded-md border border-border p-0.5 bg-muted">
          {(
            [
              ["signed", "One column (+/−)"],
              ["split", "Paid in / paid out"],
              ["indicator", "Amount + CR/DR"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={amountMode === mode}
              onClick={() => {
                const col = firstCol(mapping.amount);
                if (mode === "signed") setAmount({ mode, column: col });
                if (mode === "split") setAmount({ mode, inColumn: col, outColumn: col });
                if (mode === "indicator") setAmount({ mode, column: col, indicator: col, creditValues: ["cr", "credit"] });
              }}
              className={cn(
                "px-3 py-1.5 text-sm rounded",
                amountMode === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mapping.amount.mode === "signed" && (
            <>
              {columnSelect("map-amount", "Amount column", mapping.amount.column, (v) =>
                v !== undefined && setAmount({ ...(mapping.amount as { mode: "signed"; column: number }), column: v }), false)}
              <label className="flex items-center gap-2 text-sm text-muted-foreground self-end pb-2">
                <input
                  id="map-invert"
                  type="checkbox"
                  checked={!!mapping.amount.invert}
                  onChange={(e) => setAmount({ ...(mapping.amount as { mode: "signed"; column: number }), invert: e.target.checked })}
                />
                Spending is positive in this file (flip signs)
              </label>
            </>
          )}
          {mapping.amount.mode === "split" && (
            <>
              {columnSelect("map-in", "Money in column", mapping.amount.inColumn, (v) =>
                v !== undefined && setAmount({ ...(mapping.amount as Extract<AmountMapping, { mode: "split" }>), inColumn: v }), false)}
              {columnSelect("map-out", "Money out column", mapping.amount.outColumn, (v) =>
                v !== undefined && setAmount({ ...(mapping.amount as Extract<AmountMapping, { mode: "split" }>), outColumn: v }), false)}
            </>
          )}
          {mapping.amount.mode === "indicator" && (
            <>
              {columnSelect("map-ind-amount", "Amount column", mapping.amount.column, (v) =>
                v !== undefined && setAmount({ ...(mapping.amount as Extract<AmountMapping, { mode: "indicator" }>), column: v }), false)}
              {columnSelect("map-ind", "CR/DR column", mapping.amount.indicator, (v) =>
                v !== undefined && setAmount({ ...(mapping.amount as Extract<AmountMapping, { mode: "indicator" }>), indicator: v }), false)}
              <div>
                <label htmlFor="map-credit-values" className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Values meaning money in
                </label>
                <Input
                  id="map-credit-values"
                  className="bg-muted border-border"
                  value={mapping.amount.creditValues.join(", ")}
                  onChange={(e) =>
                    setAmount({
                      ...(mapping.amount as Extract<AmountMapping, { mode: "indicator" }>),
                      creditValues: e.target.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
                    })
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>

      {preview.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Preview: first {preview.length} rows as Syphon will read them</p>
          <div className="border border-border rounded-md overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Merchant</th>
                  <th className="px-3 py-2 text-left">Bank text</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.map((p) => (
                  <tr key={p.index} className={p.outcome !== "import" ? "opacity-50" : undefined}>
                    <td className="px-3 py-2 whitespace-nowrap">{p.date ? format(new Date(p.date), "dd MMM yyyy") : "—"}</td>
                    <td className="px-3 py-2">
                      {p.merchant ?? "—"}
                      <SourceTag source={p.merchantSource} />
                    </td>
                    <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{p.rawDescription}</td>
                    <td className="px-3 py-2">
                      {p.outcome === "skipped" ? (
                        <Badge variant="outline">skip: {p.reason}</Badge>
                      ) : (
                        p.type
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono whitespace-nowrap">
                      {p.signed < 0 ? "−" : "+"}
                      {formatGBP(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
