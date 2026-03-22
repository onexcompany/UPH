import { z } from 'zod';

const positiveMoney = z.coerce.number().positive('Informe um valor maior que zero.');
const validDate = z.coerce.date();
const booleanFromString = z.enum(['true', 'false']).transform((value) => value === 'true');

export const memberSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do membro.'),
});

export const settingSchema = z.object({
  monthlyAmount: positiveMoney,
  annualFeeAmount: positiveMoney,
  defaultYear: z.coerce.number().int().min(2020).max(2100),
  dueDay: z.coerce.number().int().min(1).max(28),
  currency: z.string().trim().min(3).max(3).default('BRL'),
});

export const paymentSchema = z.object({
  memberId: z.string().cuid(),
  amount: positiveMoney,
  paidAt: validDate,
  note: z.string().trim().max(240).optional().or(z.literal('')),
});

export const expenseSchema = z.object({
  description: z.string().trim().min(3),
  amount: positiveMoney,
  expenseDate: validDate,
  shouldSplit: booleanFromString.default('false'),
});

export const donationSchema = z.object({
  donorName: z.string().trim().min(2),
  amount: positiveMoney,
  donatedAt: validDate,
  note: z.string().trim().max(240).optional().or(z.literal('')),
});

export const memberStatusSchema = z.object({
  memberId: z.string().cuid(),
  active: booleanFromString,
});

export function parseFormData<S extends z.ZodTypeAny>(schema: S, formData: FormData): z.infer<S> {
  const raw = Object.fromEntries(formData.entries());
  return schema.parse(raw);
}
