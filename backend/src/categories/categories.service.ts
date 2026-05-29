import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { toNumber } from '../common/money';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: { userId, label: dto.label, value: dto.value, isIncome: dto.isIncome ?? false },
    });
  }

  async findAll(userId: string) {
    const categories = await this.prisma.category.findMany({ where: { userId } });
    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId },
      _sum: { amount: true },
      _count: { _all: true },
    });
    const map = new Map(grouped.map((g) => [g.categoryId, g]));
    return categories.map((c) => {
      const agg = map.get(c.id);
      return {
        id: c.id,
        label: c.label,
        value: c.value,
        isIncome: c.isIncome,
        valor: toNumber(agg?._sum.amount ?? null),
        transacoes: agg?._count._all ?? 0,
      };
    });
  }
}
