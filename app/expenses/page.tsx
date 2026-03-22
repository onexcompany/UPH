import { format } from 'date-fns';

import { createExpenseAction, deleteExpenseAction } from '@/app/actions';
import { Field } from '@/components/forms/field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency, toNumber } from '@/lib/currency';
import { ensureDefaultSettings, getExpenses } from '@/lib/services';

export default async function ExpensesPage() {
  const [settings, expenses] = await Promise.all([ensureDefaultSettings(), getExpenses()]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
      <Card>
        <CardHeader>
          <CardTitle>Nova despesa</CardTitle>
          <CardDescription>Opcionalmente faça o rateio igual entre todos os membros ativos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createExpenseAction} className="space-y-4">
            <Field id="description" label="Descrição">
              <Input id="description" name="description" required />
            </Field>
            <Field id="amount" label="Valor">
              <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
            </Field>
            <Field id="expenseDate" label="Data da despesa">
              <Input id="expenseDate" name="expenseDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            </Field>
            <label className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm font-medium">
              <input type="hidden" name="shouldSplit" value="false" />
              <input type="checkbox" name="shouldSplit" value="true" className="h-4 w-4 rounded border-border" />
              Ratear igualmente entre membros ativos criando cobranças do tipo EXPENSE_SHARE.
            </label>
            <Button type="submit" className="w-full">Registrar despesa</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Despesas registradas</CardTitle>
          <CardDescription>Despesas com e sem rateio, mantendo histórico auditável.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {expenses.map((expense) => (
            <div key={expense.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{expense.description}</p>
                    <Badge variant={expense.shouldSplit ? 'warning' : 'outline'}>
                      {expense.shouldSplit ? 'Rateada' : 'Direta'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{format(expense.expenseDate, 'dd/MM/yyyy')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-rose-700">{formatCurrency(toNumber(expense.amount), settings.currency)}</p>
                  <form action={deleteExpenseAction}>
                    <input type="hidden" name="id" value={expense.id} />
                    <Button type="submit" variant="outline" size="sm">Excluir</Button>
                  </form>
                </div>
              </div>
              {expense.shouldSplit ? (
                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                  <p className="text-sm font-medium">Cobranças criadas para rateio</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {expense.charges.map((charge) => (
                      <span key={charge.id} className="rounded-full bg-white px-3 py-1">
                        {charge.member.name}: {formatCurrency(toNumber(charge.amount), settings.currency)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
