import { format } from 'date-fns';

import { createDonationAction, deleteDonationAction } from '@/app/actions';
import { Field } from '@/components/forms/field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, toNumber } from '@/lib/currency';
import { ensureDefaultSettings, getDonations } from '@/lib/services';

export default async function DonationsPage() {
  const [settings, donations] = await Promise.all([ensureDefaultSettings(), getDonations()]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
      <Card>
        <CardHeader>
          <CardTitle>Nova doação</CardTitle>
          <CardDescription>Registre entradas voluntárias separadas dos pagamentos de membros.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createDonationAction} className="space-y-4">
            <Field id="donorName" label="Doador">
              <Input id="donorName" name="donorName" required />
            </Field>
            <Field id="amount" label="Valor">
              <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
            </Field>
            <Field id="donatedAt" label="Data">
              <Input id="donatedAt" name="donatedAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            </Field>
            <Field id="note" label="Observação">
              <Textarea id="note" name="note" placeholder="Ex.: campanha especial" />
            </Field>
            <Button type="submit" className="w-full">Registrar doação</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de doações</CardTitle>
          <CardDescription>Doações ajudam a compor o saldo e o fluxo de caixa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {donations.map((donation) => (
            <div key={donation.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{donation.donorName}</p>
                <p className="text-sm text-muted-foreground">{format(donation.donatedAt, 'dd/MM/yyyy')} · {donation.note || 'Sem observação'}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-emerald-700">{formatCurrency(toNumber(donation.amount), settings.currency)}</p>
                <form action={deleteDonationAction}>
                  <input type="hidden" name="id" value={donation.id} />
                  <Button type="submit" variant="outline" size="sm">Excluir</Button>
                </form>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
