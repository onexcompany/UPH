import {
  ChargeStatus,
  ChargeType,
  Prisma,
  type PrismaClient,
} from '@prisma/client';
import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';

import { distributeAmount, toNumber } from '@/lib/currency';
import { prisma } from '@/lib/prisma';

type Tx = Prisma.TransactionClient | PrismaClient;

function toDecimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}

export async function ensureDefaultSettings(tx: Tx = prisma) {
  const existing = await tx.setting.findFirst({ orderBy: { createdAt: 'asc' } });

  if (existing) return existing;

  return tx.setting.create({
    data: {
      monthlyAmount: new Prisma.Decimal(120),
      annualFeeAmount: new Prisma.Decimal(200),
      defaultYear: new Date().getUTCFullYear(),
      dueDay: 10,
      currency: 'BRL',
    },
  });
}

export async function createChargesForMember(
  tx: Tx,
  memberId: string,
  settings: Awaited<ReturnType<typeof ensureDefaultSettings>>,
) {
  const year = settings.defaultYear;
  const dueDay = settings.dueDay;

  const charges: Prisma.ChargeCreateManyInput[] = Array.from({ length: 12 }, (_, index) => {
    const dueDate = new Date(Date.UTC(year, index, dueDay, 12, 0, 0));
    return {
      memberId,
      type: ChargeType.MONTHLY,
      status: ChargeStatus.PENDING,
      description: `Mensalidade ${format(dueDate, 'MM/yyyy')}`,
      competenceYear: year,
      competenceMonth: index + 1,
      dueDate,
      amount: settings.monthlyAmount,
      paidAmount: new Prisma.Decimal(0),
    };
  });

  charges.push({
    memberId,
    type: ChargeType.ANNUAL_FEE,
    status: ChargeStatus.PENDING,
    description: `Taxa anual ${year}`,
    competenceYear: year,
    competenceMonth: null,
    dueDate: new Date(Date.UTC(year, 0, dueDay, 12, 0, 0)),
    amount: settings.annualFeeAmount,
    paidAmount: new Prisma.Decimal(0),
  });

  await tx.charge.createMany({ data: charges });
}

export async function createMemberWithCharges(name: string) {
  return prisma.$transaction(async (tx) => {
    const settings = await ensureDefaultSettings(tx);
    const member = await tx.member.create({
      data: { name },
    });

    await createChargesForMember(tx, member.id, settings);

    return member;
  });
}

export async function updateSettings(values: {
  monthlyAmount: number;
  annualFeeAmount: number;
  defaultYear: number;
  dueDay: number;
  currency: string;
}) {
  return prisma.$transaction(async (tx) => {
    const current = await ensureDefaultSettings(tx);

    return tx.setting.update({
      where: { id: current.id },
      data: {
        monthlyAmount: toDecimal(values.monthlyAmount),
        annualFeeAmount: toDecimal(values.annualFeeAmount),
        defaultYear: values.defaultYear,
        dueDay: values.dueDay,
        currency: values.currency,
      },
    });
  });
}

export async function setMemberStatus(memberId: string, active: boolean) {
  return prisma.member.update({
    where: { id: memberId },
    data: {
      active,
      deactivatedAt: active ? null : new Date(),
    },
  });
}

export async function recordPayment(input: {
  memberId: string;
  amount: number;
  paidAt: Date;
  note?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const openCharges = await tx.charge.findMany({
      where: {
        memberId: input.memberId,
        status: { in: [ChargeStatus.PENDING, ChargeStatus.PARTIAL] },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    });

    let remaining = input.amount;

    const payment = await tx.payment.create({
      data: {
        memberId: input.memberId,
        amount: toDecimal(input.amount),
        unallocatedAmount: new Prisma.Decimal(0),
        paidAt: input.paidAt,
        note: input.note || null,
      },
    });

    for (const charge of openCharges) {
      if (remaining <= 0) break;

      const outstanding = toNumber(charge.amount) - toNumber(charge.paidAmount);
      if (outstanding <= 0) continue;

      const allocationAmount = Math.min(remaining, outstanding);
      const paidAmount = toNumber(charge.paidAmount) + allocationAmount;
      const status = paidAmount >= toNumber(charge.amount) ? ChargeStatus.PAID : ChargeStatus.PARTIAL;

      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          chargeId: charge.id,
          amount: toDecimal(allocationAmount),
        },
      });

      await tx.charge.update({
        where: { id: charge.id },
        data: {
          paidAmount: toDecimal(paidAmount),
          status,
        },
      });

      remaining = Number((remaining - allocationAmount).toFixed(2));
    }

    if (remaining > 0) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { unallocatedAmount: toDecimal(remaining) },
      });
    }

    return payment;
  });
}

export async function createExpense(input: {
  description: string;
  amount: number;
  expenseDate: Date;
  shouldSplit: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        description: input.description,
        amount: toDecimal(input.amount),
        expenseDate: input.expenseDate,
        shouldSplit: input.shouldSplit,
      },
    });

    if (!input.shouldSplit) return expense;

    const settings = await ensureDefaultSettings(tx);
    const members = await tx.member.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } });

    if (!members.length) return expense;

    const shares = distributeAmount(input.amount, members.length);

    await tx.expense.update({
      where: { id: expense.id },
      data: { splitMemberCount: members.length },
    });

    await tx.charge.createMany({
      data: members.map((member, index) => ({
        memberId: member.id,
        expenseId: expense.id,
        type: ChargeType.EXPENSE_SHARE,
        status: ChargeStatus.PENDING,
        description: `Rateio: ${input.description}`,
        competenceYear: input.expenseDate.getUTCFullYear(),
        competenceMonth: input.expenseDate.getUTCMonth() + 1,
        dueDate: new Date(
          Date.UTC(
            input.expenseDate.getUTCFullYear(),
            input.expenseDate.getUTCMonth(),
            settings.dueDay,
            12,
            0,
            0,
          ),
        ),
        amount: toDecimal(shares[index]),
        paidAmount: new Prisma.Decimal(0),
      })),
    });

    return expense;
  });
}

export async function createDonation(input: {
  donorName: string;
  amount: number;
  donatedAt: Date;
  note?: string;
}) {
  return prisma.donation.create({
    data: {
      donorName: input.donorName,
      amount: toDecimal(input.amount),
      donatedAt: input.donatedAt,
      note: input.note || null,
    },
  });
}

export async function deleteDonation(id: string) {
  await prisma.donation.delete({ where: { id } });
}

export async function deleteExpense(id: string) {
  await prisma.$transaction(async (tx) => {
    const linkedCharges = await tx.charge.count({ where: { expenseId: id, status: ChargeStatus.PAID } });
    if (linkedCharges > 0) {
      throw new Error('Não é possível excluir despesa já quitada por rateio.');
    }
    await tx.charge.deleteMany({ where: { expenseId: id } });
    await tx.expense.delete({ where: { id } });
  });
}

export async function getDashboardData() {
  const settings = await ensureDefaultSettings();
  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);

  const [
    totalPending,
    overdueCharges,
    activeMembers,
    paymentsMonth,
    donationsMonth,
    expensesMonth,
    recentPayments,
    recentExpenses,
    recentDonations,
  ] = await Promise.all([
    prisma.charge.aggregate({
      _sum: { amount: true, paidAmount: true },
      where: { status: { in: [ChargeStatus.PENDING, ChargeStatus.PARTIAL] } },
    }),
    prisma.charge.findMany({
      where: {
        dueDate: { lt: today },
        status: { in: [ChargeStatus.PENDING, ChargeStatus.PARTIAL] },
      },
      include: { member: true },
      orderBy: { dueDate: 'asc' },
      take: 8,
    }),
    prisma.member.count({ where: { active: true } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: start, lte: end } },
    }),
    prisma.donation.aggregate({
      _sum: { amount: true },
      where: { donatedAt: { gte: start, lte: end } },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { expenseDate: { gte: start, lte: end } },
    }),
    prisma.payment.findMany({
      include: { member: true, allocations: { include: { charge: true } } },
      orderBy: { paidAt: 'desc' },
      take: 5,
    }),
    prisma.expense.findMany({ orderBy: { expenseDate: 'desc' }, take: 5 }),
    prisma.donation.findMany({ orderBy: { donatedAt: 'desc' }, take: 5 }),
  ]);

  const pendingTotal = toNumber(totalPending._sum.amount) - toNumber(totalPending._sum.paidAmount);
  const overdueMemberCount = new Set(overdueCharges.map((charge) => charge.memberId)).size;
  const delinquencyRate = activeMembers ? (overdueMemberCount / activeMembers) * 100 : 0;
  const paymentRevenue = toNumber(paymentsMonth._sum.amount);
  const donationsRevenue = toNumber(donationsMonth._sum.amount);
  const expensesTotal = toNumber(expensesMonth._sum.amount);

  return {
    settings,
    cards: [
      {
        title: 'Receitas do mês',
        value: String(paymentRevenue + donationsRevenue),
        helper: `${paymentRevenue.toFixed(2)} em pagamentos + ${donationsRevenue.toFixed(2)} em doações`,
      },
      {
        title: 'Pendências em aberto',
        value: String(pendingTotal),
        helper: `${overdueCharges.length} cobranças vencidas`,
      },
      {
        title: 'Despesas do mês',
        value: String(expensesTotal),
        helper: `${recentExpenses.length} lançamentos recentes`,
      },
      {
        title: 'Saldo do mês',
        value: String(paymentRevenue + donationsRevenue - expensesTotal),
        helper: 'Receitas menos despesas do período atual',
      },
      {
        title: 'Inadimplência',
        value: `${delinquencyRate.toFixed(1)}%`,
        helper: `${overdueMemberCount} membro(s) ativos com atraso`,
      },
    ],
    overdueCharges,
    recentPayments,
    recentExpenses,
    recentDonations,
  };
}

export async function getMembersOverview(selectedMemberId?: string) {
  const members = await prisma.member.findMany({
    include: {
      _count: { select: { charges: true, payments: true } },
      charges: {
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
      },
      payments: {
        orderBy: { paidAt: 'desc' },
        include: {
          allocations: { include: { charge: true } },
        },
      },
    },
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
  });

  const currentMember =
    members.find((member) => member.id === selectedMemberId) ?? members[0] ?? null;

  return { members, currentMember };
}

export async function getExpenses() {
  return prisma.expense.findMany({
    include: { charges: { include: { member: true } } },
    orderBy: { expenseDate: 'desc' },
  });
}

export async function getDonations() {
  return prisma.donation.findMany({ orderBy: { donatedAt: 'desc' } });
}

export async function getCashFlow(params?: { from?: string; to?: string }) {
  const from = params?.from ? new Date(params.from) : addMonths(startOfMonth(new Date()), -2);
  const to = params?.to ? new Date(params.to) : endOfMonth(new Date());

  const [payments, donations, expenses] = await Promise.all([
    prisma.payment.findMany({
      where: { paidAt: { gte: from, lte: to } },
      include: { member: true },
      orderBy: { paidAt: 'asc' },
    }),
    prisma.donation.findMany({
      where: { donatedAt: { gte: from, lte: to } },
      orderBy: { donatedAt: 'asc' },
    }),
    prisma.expense.findMany({
      where: { expenseDate: { gte: from, lte: to } },
      orderBy: { expenseDate: 'asc' },
    }),
  ]);

  const events = [
    ...payments.map((payment) => ({
      id: payment.id,
      date: payment.paidAt,
      type: 'PAYMENT',
      description: `Pagamento de ${payment.member.name}`,
      amount: toNumber(payment.amount),
    })),
    ...donations.map((donation) => ({
      id: donation.id,
      date: donation.donatedAt,
      type: 'DONATION',
      description: `Doação de ${donation.donorName}`,
      amount: toNumber(donation.amount),
    })),
    ...expenses.map((expense) => ({
      id: expense.id,
      date: expense.expenseDate,
      type: 'EXPENSE',
      description: expense.description,
      amount: -toNumber(expense.amount),
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  let balance = 0;
  const withBalance = events.map((event) => {
    balance += event.amount;
    return { ...event, balance };
  });

  return {
    from,
    to,
    events: withBalance,
    totals: {
      income: withBalance.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0),
      expenses: withBalance.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0),
      balance,
    },
  };
}
