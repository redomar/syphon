import { useState } from "react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import type { ImportSummary, PreparedRow } from "@/lib/import/types";
import { formatGBP } from "./model";
import { SourceTag } from "./MapStep";

const PAGE = 100;

interface Props {
  rows: PreparedRow[];
  summary: ImportSummary;
  categoryName: (id: string | undefined) => string | undefined;
  onMerchantEdit: (row: PreparedRow, merchant: string) => void;
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "warn" }) {
  return (
    <div className="rounded-md border border-border p-4 space-y-1">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-xl font-semibold font-mono tabular-nums",
          tone === "good" && "text-emerald-400",
          tone === "warn" && "text-orange-400"
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function MerchantCell({ row, onEdit }: { row: PreparedRow; onEdit: Props["onMerchantEdit"] }) {
  const [draft, setDraft] = useState<string | null>(null);
  if (draft === null) {
    return (
      <button
        type="button"
        className="text-left hover:underline decoration-dotted underline-offset-4"
        title="Rename — applies to every row with this bank text, now and in future imports"
        onClick={() => setDraft(row.merchant ?? "")}
      >
        {row.merchant}
        <SourceTag source={row.merchantSource} />
      </button>
    );
  }
  const commit = () => {
    const v = draft.trim();
    if (v && v !== row.merchant) onEdit(row, v);
    setDraft(null);
  };
  return (
    <input
      id={`merchant-${row.index}`}
      aria-label="Merchant name"
      autoFocus
      className="w-full rounded border border-border bg-muted px-2 py-1 text-sm"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setDraft(null);
      }}
    />
  );
}

function RowTable({ rows, props, showReason }: { rows: PreparedRow[]; props: Props; showReason?: boolean }) {
  const [limit, setLimit] = useState(PAGE);
  if (rows.length === 0) return <p className="py-6 text-sm text-muted-foreground">Nothing here.</p>;
  return (
    <div className="space-y-2">
      <div className="border border-border rounded-md overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Merchant</th>
              <th className="px-3 py-2 text-left">Bank text</th>
              <th className="px-3 py-2 text-left">{showReason ? "Reason" : "Category"}</th>
              <th className="px-3 py-2 text-left">Account</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.slice(0, limit).map((r) => (
              <tr key={r.index}>
                <td className="px-3 py-2 whitespace-nowrap">{r.date ? format(new Date(r.date), "dd MMM yyyy") : "—"}</td>
                <td className="px-3 py-2">
                  {r.outcome === "import" ? <MerchantCell row={r} onEdit={props.onMerchantEdit} /> : r.merchant ?? "—"}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground max-w-[18rem] truncate" title={r.rawDescription}>
                  {r.rawDescription}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {showReason
                    ? r.reason
                    : props.categoryName(r.categoryId) ?? r.externalCategory ?? "—"}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{r.accountKey || "—"}</td>
                <td
                  className={cn(
                    "px-3 py-2 text-right font-mono whitespace-nowrap",
                    r.type === "INCOME" && "text-emerald-400",
                    r.isRefund && "text-sky-400"
                  )}
                >
                  {r.signed < 0 ? "−" : "+"}
                  {formatGBP(r.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > limit && (
        <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setLimit((l) => l + PAGE * 5)}>
          Showing {limit.toLocaleString()} of {rows.length.toLocaleString()}. Show more
        </button>
      )}
    </div>
  );
}

export function ReviewStep(props: Props) {
  const { rows, summary: s } = props;
  const imported = rows.filter((r) => r.outcome === "import" && r.type !== "TRANSFER" && !r.isRefund);
  const transfers = rows.filter((r) => r.outcome === "import" && r.type === "TRANSFER");
  const refunds = rows.filter((r) => r.outcome === "import" && r.isRefund);
  const excluded = rows.filter((r) => r.outcome === "excluded");
  const skipped = rows.filter((r) => r.outcome === "skipped");
  const reasons = Object.entries(s.skippedByReason)
    .map(([k, n]) => `${n} ${k}`)
    .join(", ");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Money in" value={formatGBP(s.income)} tone="good" sub={`${s.toImport.toLocaleString()} rows to import`} />
        <Stat label="Spending" value={formatGBP(s.spend)} tone="warn" sub={s.refunds ? `after ${formatGBP(s.refundAmount)} of refunds` : undefined} />
        <Stat label="Transfers" value={s.transfers.toLocaleString()} sub={`${s.transferPairs} matched pairs · not counted as income or spending`} />
        <Stat
          label="Not imported"
          value={(s.excluded + s.skipped).toLocaleString()}
          sub={[s.excluded ? `${s.excluded} excluded` : "", reasons].filter(Boolean).join(" · ") || "none"}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Rows already in Syphon (same account, day, amount and bank text) are skipped automatically. Click a
        merchant to rename it; the name is remembered for that bank text.
      </p>

      <Tabs defaultValue="import">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="import">Will import ({imported.length.toLocaleString()})</TabsTrigger>
          <TabsTrigger value="transfers">Transfers ({transfers.length.toLocaleString()})</TabsTrigger>
          <TabsTrigger value="refunds">Refunds ({refunds.length.toLocaleString()})</TabsTrigger>
          <TabsTrigger value="excluded">Excluded ({excluded.length.toLocaleString()})</TabsTrigger>
          <TabsTrigger value="skipped">Skipped ({skipped.length.toLocaleString()})</TabsTrigger>
        </TabsList>
        <TabsContent value="import"><RowTable rows={imported} props={props} /></TabsContent>
        <TabsContent value="transfers"><RowTable rows={transfers} props={props} /></TabsContent>
        <TabsContent value="refunds"><RowTable rows={refunds} props={props} /></TabsContent>
        <TabsContent value="excluded"><RowTable rows={excluded} props={props} showReason /></TabsContent>
        <TabsContent value="skipped"><RowTable rows={skipped} props={props} showReason /></TabsContent>
      </Tabs>
    </div>
  );
}
