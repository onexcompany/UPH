import Link from 'next/link';
import { format } from 'date-fns';

import { createMemberAction, updateMemberStatusAction } from '@/app/actions';
import { Field } from '@/components/forms/field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, toNumber } from '@/lib/currency';
import { ensureDefaultSettings, getMembersOverview } from '@/lib/services';

export default async function MembersPage({
  searchParams,
}: {
  searchParams?: Promise<{ memberId?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [settings, overview] = await Promise.all([ensureDefaultSettings(), getMembersOverview(params.memberId)]);
  const currentMember = overview.currentMember;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Novo membro</CardTitle>
            <CardDescription>Ao salvar, o sistema cria 12 mensalidades e 1 taxa anual com os valores atuais.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createMemberAction} className="space-y-4">
              <Field id="name" label="Nome">
                <Input id="name" name="name" placeholder="Nome completo" required />
              </Field>
              <Button type="submit" className="w-full">Cadastrar membro</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membros</CardTitle>
            <CardDescription>Selecione um membro para ver o extrato completo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.members.map((member) => {
              const pending = member.charges.reduce((sum, charge) => sum + (toNumber(charge.amount) - toNumber(charge.paidAmount)), 0);
              return (
                <div key={member.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/members?memberId=${member.id}`} className="font-semibold text-slate-900 hover:text-primary">
                          {member.name}
                        </Link>
                        <Badge variant={member.active ? 'success' : 'outline'}>{member.active ? 'Ativo' : 'Inativo'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {member._count.charges} cobranças · {member._count.payments} pagamento(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{formatCurrency(pending, settings.currency)}</p>
                      <form action={updateMemberStatusAction}>
                        <input type="hidden" name="memberId" value={member.id} />
                        <input type="hidden" name="active" value={String(!member.active)} />
                        <Button type="submit" variant="outline" size="sm">
                          {member.active ? 'Inativar' : 'Reativar'}
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Extrato individual</CardTitle>
          <CardDescription>
            {currentMember ? `Histórico consolidado de ${currentMember.name}.` : 'Cadastre ou selecione um membro.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentMember ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">Total cobrado</p>
                  <p className="mt-2 text-2xl font-bold">
                    {formatCurrency(currentMember.charges.reduce((sum, charge) => sum + toNumber(charge.amount), 0), settings.currency)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">Total pago</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">
                    {formatCurrency(currentMember.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0), settings.currency)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">Saldo em aberto</p>
                  <p className="mt-2 text-2xl font-bold text-amber-700">
                    {formatCurrency(
                      currentMember.charges.reduce((sum, charge) => sum + (toNumber(charge.amount) - toNumber(charge.paidAmount)), 0),
                      settings.currency,
                    )}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cobrança</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentMember.charges.map((charge) => (
                      <TableRow key={charge.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{charge.description}</p>
                            <p className="text-xs text-muted-foreground">Criada em {format(charge.createdAt, 'dd/MM/yyyy')}</p>
                          </div>
                        </TableCell>
                        <TableCell>{charge.type}</TableCell>
                        <TableCell>{format(charge.dueDate, 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant={charge.status === 'PAID' ? 'success' : charge.status === 'PARTIAL' ? 'warning' : 'destructive'}>
                            {charge.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-semibold">{formatCurrency(toNumber(charge.amount), settings.currency)}</p>
                          <p className="text-xs text-muted-foreground">
                            Pago {formatCurrency(toNumber(charge.paidAmount), settings.currency)}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Pagamentos registrados</h3>
                {currentMember.payments.map((payment) => (
                  <div key={payment.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{format(payment.paidAt, 'dd/MM/yyyy')}</p>
                        <p className="text-sm text-muted-foreground">{payment.note || 'Sem observações.'}</p>
                      </div>
                      <div className="text-right font-semibold text-emerald-700">
                        {formatCurrency(toNumber(payment.amount), settings.currency)}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {payment.allocations.map((allocation) => (
                        <Badge key={allocation.id} variant="outline">
                          {allocation.charge.description}: {formatCurrency(toNumber(allocation.amount), settings.currency)}
                        </Badge>
                      ))}
                      {toNumber(payment.unallocatedAmount) > 0 ? (
                        <Badge variant="warning">
                          Não alocado: {formatCurrency(toNumber(payment.unallocatedAmount), settings.currency)}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum membro encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
