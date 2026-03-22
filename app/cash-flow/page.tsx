import { format } from 'date-fns';

import { Field } from '@/components/forms/field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import { ensureDefaultSettings, getCashFlow } from '@/lib/services';

export default async function CashFlowPage({
  searchParams,
}: {
  searchParams?: Promise<{ from?: string; to?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [settings, cashFlow] = await Promise.all([ensureDefaultSettings(), getCashFlow(params)]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de caixa</CardTitle>
          <CardDescription>Consulte entradas e saídas por período com saldo acumulado.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <Field id="from" label="De">
              <Input id="from" name="from" type="date" defaultValue={cashFlow.from.toISOString().slice(0, 10)} />
            </Field>
            <Field id="to" label="Até">
              <Input id="to" name="to" type="date" defaultValue={cashFlow.to.toISOString().slice(0, 10)} />
            </Field>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Filtrar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Entradas</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-700">{formatCurrency(cashFlow.totals.income, settings.currency)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Saídas</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-bold text-rose-700">{formatCurrency(Math.abs(cashFlow.totals.expenses), settings.currency)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Saldo acumulado</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(cashFlow.totals.balance, settings.currency)}</p></CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Movimentações</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashFlow.events.map((event) => (
                <TableRow key={`${event.type}-${event.id}`}>
                  <TableCell>{format(event.date, 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={event.amount > 0 ? 'success' : 'destructive'}>{event.type}</Badge>
                  </TableCell>
                  <TableCell>{event.description}</TableCell>
                  <TableCell className={`text-right font-semibold ${event.amount > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(Math.abs(event.amount), settings.currency)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(event.balance, settings.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
