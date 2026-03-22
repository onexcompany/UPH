import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { DashboardCard } from '@/lib/types';

export function StatCard({ card, currency }: { card: DashboardCard; currency: string }) {
  const isPercent = card.value.endsWith('%');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{card.title}</CardDescription>
        <CardTitle className="text-3xl font-bold text-slate-900">
          {isPercent ? card.value : formatCurrency(card.value, currency)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{card.helper}</p>
      </CardContent>
    </Card>
  );
}
