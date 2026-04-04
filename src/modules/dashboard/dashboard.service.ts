import { prisma } from '../../config/database';

// Reuse the same soft-delete guard as the records module
const whereActive = () => ({ deletedAt: null });

export async function getSummary() {
  const [incomeResult, expenseResult, recordCount] = await Promise.all([
    prisma.financialRecord.aggregate({
      where: { ...whereActive(), type: 'INCOME' },
      _sum: { amount: true },
    }),
    prisma.financialRecord.aggregate({
      where: { ...whereActive(), type: 'EXPENSE' },
      _sum: { amount: true },
    }),
    prisma.financialRecord.count({
      where: whereActive(),
    }),
  ]);

  const totalIncome = incomeResult._sum.amount ?? 0;
  const totalExpenses = expenseResult._sum.amount ?? 0;
  const netBalance = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    recordCount,
  };
}

export async function getRecentActivity() {
  const records = await prisma.financialRecord.findMany({
    where: whereActive(),
    orderBy: { date: 'desc' },
    take: 10,
    select: {
      id: true,
      amount: true,
      type: true,
      category: true,
      date: true,
      description: true,
      createdAt: true,
    },
  });

  return records;
}

export async function getCategoryBreakdown() {
  const [incomeByCategory, expenseByCategory] = await Promise.all([
    prisma.financialRecord.groupBy({
      by: ['category'],
      where: { ...whereActive(), type: 'INCOME' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
    prisma.financialRecord.groupBy({
      by: ['category'],
      where: { ...whereActive(), type: 'EXPENSE' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
  ]);

  return {
    income: incomeByCategory.map((r) => ({
      category: r.category,
      total: r._sum.amount ?? 0,
    })),
    expenses: expenseByCategory.map((r) => ({
      category: r.category,
      total: r._sum.amount ?? 0,
    })),
  };
}

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export async function getMonthlyTrends() {
  // $queryRaw is allowed specifically for this date_trunc aggregation per our plan
  const rows = await prisma.$queryRaw<
    Array<{ month: Date; type: string; total: number }>
  >`
    SELECT
      date_trunc('month', date) AS month,
      type,
      SUM(amount)::float AS total
    FROM "FinancialRecord"
    WHERE
      "deletedAt" IS NULL
      AND date >= date_trunc('month', NOW() - INTERVAL '11 months')
    GROUP BY month, type
    ORDER BY month ASC
  `;

  // Collate income and expense rows into a unified month map
  const trendMap = new Map<string, { income: number; expenses: number }>();

  for (const row of rows) {
    const key = new Date(row.month).toISOString().slice(0, 7); // e.g. "2025-04"
    if (!trendMap.has(key)) {
      trendMap.set(key, { income: 0, expenses: 0 });
    }
    const entry = trendMap.get(key)!;
    if (row.type === 'INCOME') {
      entry.income = row.total;
    } else {
      entry.expenses = row.total;
    }
  }

  const trends: MonthlyTrend[] = Array.from(trendMap.entries()).map(
    ([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    }),
  );

  return trends;
}
