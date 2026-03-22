import { updateSettingsAction } from '@/app/actions';
import { Field } from '@/components/forms/field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ensureDefaultSettings } from '@/lib/services';

export default async function SettingsPage() {
  const settings = await ensureDefaultSettings();

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Configurações financeiras</CardTitle>
          <CardDescription>
            Alterações impactam apenas novas cobranças. Valores históricos permanecem imutáveis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateSettingsAction} className="grid gap-4 md:grid-cols-2">
            <Field id="monthlyAmount" label="Mensalidade padrão">
              <Input id="monthlyAmount" name="monthlyAmount" type="number" min="0.01" step="0.01" defaultValue={settings.monthlyAmount.toString()} required />
            </Field>
            <Field id="annualFeeAmount" label="Taxa anual padrão">
              <Input id="annualFeeAmount" name="annualFeeAmount" type="number" min="0.01" step="0.01" defaultValue={settings.annualFeeAmount.toString()} required />
            </Field>
            <Field id="defaultYear" label="Ano de competência padrão">
              <Input id="defaultYear" name="defaultYear" type="number" min="2020" max="2100" defaultValue={settings.defaultYear} required />
            </Field>
            <Field id="dueDay" label="Dia padrão de vencimento">
              <Input id="dueDay" name="dueDay" type="number" min="1" max="28" defaultValue={settings.dueDay} required />
            </Field>
            <Field id="currency" label="Moeda (ISO 4217)">
              <Input id="currency" name="currency" maxLength={3} defaultValue={settings.currency} required />
            </Field>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Salvar configurações</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
