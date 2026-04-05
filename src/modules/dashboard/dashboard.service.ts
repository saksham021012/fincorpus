import { prisma } from '../../config/database';
import { withCache } from '../../utils/withCache';

// Reuse the same soft-delete guard as the records module
const whereActive = () => ({ deletedAt: null });

export async function getSummary() {
  return withCache('dash:summary', async () => {
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

    const totalIncome = Number((incomeResult._sum.amount ?? 0).toFixed(2));
    const totalExpenses = Number((expenseResult._sum.amount ?? 0).toFixed(2));
    const netBalance = Number((totalIncome - totalExpenses).toFixed(2));

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      recordCount,
    };
  });
}

export async function getRecentActivity() {
  return withCache('dash:recent', async () => {
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
  });
}

export async function getCategoryBreakdown() {
  return withCache('dash:categories', async () => {
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
        total: Number((r._sum.amount ?? 0).toFixed(2)),
      })),
      expenses: expenseByCategory.map((r) => ({
        category: r.category,
        total: Number((r._sum.amount ?? 0).toFixed(2)),
      })),
    };
  });
}

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export async function getMonthlyTrends() {
  return withCache('dash:trends:monthly', async () => {
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
        entry.income = row.total ?? 0;
      } else {
        entry.expenses = row.total ?? 0;
      }
    }

    const trends: MonthlyTrend[] = Array.from(trendMap.entries()).map(
      ([month, data]) => ({
        month,
        income: Number(data.income.toFixed(2)),
        expenses: Number(data.expenses.toFixed(2)),
        net: Number((data.income - data.expenses).toFixed(2)),
      }),
    );

    return trends;
  });
}

interface WeeklyTrend {
  week: string;  // ISO date of the Monday that starts the week, e.g. "2025-03-31"
  income: number;
  expenses: number;
  net: number;
}

export async function getWeeklyTrends() {
  return withCache('dash:trends:weekly', async () => {
    const rows = await prisma.$queryRaw<
      Array<{ week: Date; type: string; total: number }>
    >`
      SELECT
        date_trunc('week', date) AS week,
        type,
        SUM(amount)::float AS total
      FROM "FinancialRecord"
      WHERE
        "deletedAt" IS NULL
        AND date >= date_trunc('week', NOW() - INTERVAL '11 weeks')
      GROUP BY week, type
      ORDER BY week ASC
    `;

    const trendMap = new Map<string, { income: number; expenses: number }>();

    for (const row of rows) {
      const key = new Date(row.week).toISOString().slice(0, 10); // e.g. "2025-03-31"
      if (!trendMap.has(key)) {
        trendMap.set(key, { income: 0, expenses: 0 });
      }
      const entry = trendMap.get(key)!;
      if (row.type === 'INCOME') {
        entry.income = row.total ?? 0;
      } else {
        entry.expenses = row.total ?? 0;
      }
    }

    const trends: WeeklyTrend[] = Array.from(trendMap.entries()).map(
      ([week, data]) => ({
        week,
        income: Number(data.income.toFixed(2)),
        expenses: Number(data.expenses.toFixed(2)),
        net: Number((data.income - data.expenses).toFixed(2)),
      }),
    );

    return trends;
  });
}
