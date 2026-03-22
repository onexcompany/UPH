import { format } from 'date-fns';

import { StatCard } from '@/components/dashboard/stat-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, toNumber } from '@/lib/currency';
import { getDashboardData } from '@/lib/services';

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {data.cards.map((card) => (
          <StatCard key={card.title} card={card} currency={data.settings.currency} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recebimentos recentes</CardTitle>
            <CardDescription>Pagamentos e suas alocações automáticas por ordem cronológica.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Membro</TableHead>
                  <TableHead>Alocações</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(payment.paidAt, 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{payment.member.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {payment.allocations.map((allocation) => (
                          <Badge key={allocation.id} variant="outline">
                            {allocation.charge.description}: {formatCurrency(toNumber(allocation.amount), data.settings.currency)}
                          </Badge>
                        ))}
                        {toNumber(payment.unallocatedAmount) > 0 ? (
                          <Badge variant="warning">
                            Saldo não alocado: {formatCurrency(toNumber(payment.unallocatedAmount), data.settings.currency)}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(toNumber(payment.amount), data.settings.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inadimplência</CardTitle>
            <CardDescription>Cobranças em atraso para atuação rápida.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.overdueCharges.length ? (
              data.overdueCharges.map((charge) => (
                <div key={charge.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{charge.member.name}</p>
                      <p className="text-sm text-muted-foreground">{charge.description}</p>
                    </div>
                    <Badge variant={charge.status === 'PARTIAL' ? 'warning' : 'destructive'}>{charge.status}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span>Vencimento {format(charge.dueDate, 'dd/MM/yyyy')}</span>
                    <span className="font-semibold text-rose-700">
                      {formatCurrency(toNumber(charge.amount) - toNumber(charge.paidAmount), data.settings.currency)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma cobrança vencida no momento.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Despesas recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">{format(expense.expenseDate, 'dd/MM/yyyy')}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(toNumber(expense.amount), data.settings.currency)}</p>
                  <p className="text-xs text-muted-foreground">{expense.shouldSplit ? 'Com rateio' : 'Sem rateio'}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doações recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentDonations.map((donation) => (
              <div key={donation.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">{donation.donorName}</p>
                  <p className="text-sm text-muted-foreground">{format(donation.donatedAt, 'dd/MM/yyyy')}</p>
                </div>
                <p className="font-semibold text-emerald-700">{formatCurrency(toNumber(donation.amount), data.settings.currency)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
