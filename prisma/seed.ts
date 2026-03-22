import { PrismaClient } from '@prisma/client';

import { createDonation, createExpense, createMemberWithCharges, recordPayment, updateSettings } from '../lib/services';

const prisma = new PrismaClient();

async function main() {
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.charge.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.member.deleteMany();
  await prisma.setting.deleteMany();

  await updateSettings({
    monthlyAmount: 120,
    annualFeeAmount: 200,
    defaultYear: new Date().getUTCFullYear(),
    dueDay: 10,
    currency: 'BRL',
  });

  const ana = await createMemberWithCharges('Ana Souza');
  const bruno = await createMemberWithCharges('Bruno Lima');
  const carla = await createMemberWithCharges('Carla Mendes');

  await recordPayment({
    memberId: ana.id,
    amount: 320,
    paidAt: new Date(),
    note: 'Pagamento via PIX',
  });

  await recordPayment({
    memberId: bruno.id,
    amount: 120,
    paidAt: new Date(),
    note: 'Mensalidade do mês',
  });

  await createExpense({
    description: 'Compra de material de apoio',
    amount: 180,
    expenseDate: new Date(),
    shouldSplit: true,
  });

  await createExpense({
    description: 'Manutenção de equipamentos',
    amount: 95,
    expenseDate: new Date(),
    shouldSplit: false,
  });

  await createDonation({
    donorName: 'Comunidade local',
    amount: 500,
    donatedAt: new Date(),
    note: 'Oferta especial',
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
