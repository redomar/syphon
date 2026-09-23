import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CREATE, EXCLUDE, NONE, TRANSFER, tidyLabel } from "@/lib/import/suggest";
import { newCategoryType, type CategoryLite, type ValueStat } from "./model";

interface Props {
  catStats: ValueStat[];
  catChoices: Record<string, string>;
  onCatChange: (value: string, choice: string) => void;
  acctStats: ValueStat[];
  acctChoices: Record<string, string>;
  onAcctChange: (value: string, choice: string) => void;
  categories: CategoryLite[];
  accounts: { _id: string; name: string; provider: string }[];
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export function MatchStep(p: Props) {
  const expense = p.categories.filter((c) => c.type === "expense");
  const income = p.categories.filter((c) => c.type === "income");

  return (
    <div className="space-y-8">
      {p.catStats.length > 0 && (
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-foreground tracking-wider">CATEGORIES</h3>
            <p className="text-sm text-muted-foreground">
              What each category in your file becomes. Transfers are money moving between your own accounts
              and aren't counted as income or spending. Money coming back in a spending category is treated
              as a refund.
            </p>
          </div>
          <div className="border border-border rounded-md overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">In your file</th>
                  <th className="px-3 py-2 text-right">Rows</th>
                  <th className="px-3 py-2 text-right">Out / in</th>
                  <th className="px-3 py-2 text-left w-[45%]">In Syphon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {p.catStats.map((s) => (
                  <tr key={s.value}>
                    <td className="px-3 py-2 font-medium">{tidyLabel(s.value)}</td>
                    <td className="px-3 py-2 text-right font-mono">{s.rows.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                      {s.negative} / {s.positive}
                    </td>
                    <td className="px-3 py-1.5">
                      <Select value={p.catChoices[s.value] ?? NONE} onValueChange={(v) => p.onCatChange(s.value, v)}>
                        <SelectTrigger
                          id={`cat-${slug(s.value)}`}
                          aria-label={`Syphon category for ${s.value}`}
                          className="bg-muted border-border text-foreground h-8"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                          <SelectItem value={CREATE}>
                            Create “{tidyLabel(s.value)}” ({newCategoryType(s)})
                          </SelectItem>
                          <SelectItem value={TRANSFER}>Transfer between my accounts</SelectItem>
                          <SelectItem value={EXCLUDE}>Don't import</SelectItem>
                          <SelectItem value={NONE}>Import uncategorised</SelectItem>
                          {expense.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Spending</SelectLabel>
                              {expense.map((c) => (
                                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                          {income.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Income</SelectLabel>
                              {income.map((c) => (
                                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {p.acctStats.length > 0 && (
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-foreground tracking-wider">ACCOUNTS</h3>
            <p className="text-sm text-muted-foreground">
              New accounts start with a £0 balance and no card digits. You can fill those in later on the
              Accounts page.
            </p>
          </div>
          <div className="border border-border rounded-md overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">In your file</th>
                  <th className="px-3 py-2 text-right">Rows</th>
                  <th className="px-3 py-2 text-left w-[45%]">In Syphon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {p.acctStats.map((s) => (
                  <tr key={s.value}>
                    <td className="px-3 py-2 font-medium">{s.value}</td>
                    <td className="px-3 py-2 text-right font-mono">{s.rows.toLocaleString()}</td>
                    <td className="px-3 py-1.5">
                      <Select value={p.acctChoices[s.value] ?? NONE} onValueChange={(v) => p.onAcctChange(s.value, v)}>
                        <SelectTrigger
                          id={`acct-${slug(s.value)}`}
                          aria-label={`Syphon account for ${s.value}`}
                          className="bg-muted border-border text-foreground h-8"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                          <SelectItem value={CREATE}>Create “{s.value}”</SelectItem>
                          <SelectItem value={NONE}>No account</SelectItem>
                          {p.accounts.map((a) => (
                            <SelectItem key={a._id} value={a._id}>
                              {a.name} <span className="text-muted-foreground">· {a.provider}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
