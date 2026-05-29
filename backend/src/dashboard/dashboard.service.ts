import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toNumber } from '../common/money';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(userId: string) {
    const [accAgg, receitaAgg, gastoAgg, budgetAgg, orcAtivos, ultimas, budgets] = await Promise.all([
      this.prisma.account.aggregate({ where: { userId }, _sum: { balance: true } }),
      this.prisma.transaction.aggregate({ where: { userId, type: 'RECEITA' }, _sum: { amount: true } }),
      this.prisma.transaction.aggregate({ where: { userId, type: 'DESPESA' }, _sum: { amount: true } }),
      this.prisma.budget.aggregate({ where: { userId }, _sum: { limit: true } }),
      this.prisma.budget.count({ where: { userId } }),
      this.prisma.transaction.findMany({
        where: { userId },
        include: { account: true, category: true },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      this.prisma.budget.findMany({ where: { userId }, select: { categoryId: true } }),
    ]);

    // gastoOrcaTotal = total despesa within categories that have a budget
    const budgetCatIds = budgets.map((b) => b.categoryId);
    const gastoOrca = budgetCatIds.length
      ? await this.prisma.transaction.aggregate({
          where: { userId, type: 'DESPESA', categoryId: { in: budgetCatIds } },
          _sum: { amount: true },
        })
      : { _sum: { amount: null } };

    return {
      saldoTotal: toNumber(accAgg._sum.balance),
      receitaTotal: toNumber(receitaAgg._sum.amount),
      gastoTotal: toNumber(gastoAgg._sum.amount),
      gastoOrcaTotal: toNumber(gastoOrca._sum.amount),
      limiteOrcTotal: toNumber(budgetAgg._sum.limit),
      orcAtivos,
      ultimasTransacoes: ultimas.map((t) => ({
        ...t,
        amount: toNumber(t.amount),
        account: { ...t.account, balance: toNumber(t.account.balance) },
      })),
    };
  }
}
