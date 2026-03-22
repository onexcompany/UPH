import { format } from 'date-fns';

import { recordPaymentAction } from '@/app/actions';
import { Field } from '@/components/forms/field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, toNumber } from '@/lib/currency';
import { ensureDefaultSettings, getMembersOverview } from '@/lib/services';

export default async function PaymentsPage() {
  const [settings, overview] = await Promise.all([ensureDefaultSettings(), getMembersOverview()]);
  const payments = overview.members.flatMap((member) => member.payments.map((payment) => ({ ...payment, member }))).sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
      <Card>
        <CardHeader>
          <CardTitle>Novo pagamento</CardTitle>
          <CardDescription>O valor é alocado automaticamente nas cobranças abertas mais antigas do membro.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={recordPaymentAction} className="space-y-4">
            <Field id="memberId" label="Membro">
              <select id="memberId" name="memberId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                <option value="">Selecione...</option>
                {overview.members.filter((member) => member.active).map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="amount" label="Valor">
              <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
            </Field>
            <Field id="paidAt" label="Data do pagamento">
              <Input id="paidAt" name="paidAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            </Field>
            <Field id="note" label="Observações">
              <Textarea id="note" name="note" placeholder="Ex.: PIX enviado pela tesouraria" />
            </Field>
            <Button type="submit" className="w-full">Registrar pagamento</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de pagamentos</CardTitle>
          <CardDescription>Rastreabilidade total entre pagamento, alocações e cobranças quitadas.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Membro</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead>Alocações</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{format(payment.paidAt, 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{payment.member.name}</TableCell>
                  <TableCell>{payment.note || '—'}</TableCell>
                  <TableCell>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {payment.allocations.map((allocation) => (
                        <li key={allocation.id}>
                          {allocation.charge.description}: {formatCurrency(toNumber(allocation.amount), settings.currency)}
                        </li>
                      ))}
                      {toNumber(payment.unallocatedAmount) > 0 ? (
                        <li>Saldo não alocado: {formatCurrency(toNumber(payment.unallocatedAmount), settings.currency)}</li>
                      ) : null}
                    </ul>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-700">
                    {formatCurrency(toNumber(payment.amount), settings.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
