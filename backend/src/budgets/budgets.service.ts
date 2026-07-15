import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { toDecimal, toNumber } from '../common/money';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBudgetDto) {
    const cat = await this.prisma.category.findFirst({ where: { id: dto.categoryId, userId } });
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    const dup = await this.prisma.budget.findFirst({ where: { userId, categoryId: dto.categoryId } });
    if (dup) throw new ConflictException('Já existe orçamento para esta categoria');
    return this.prisma.budget
      .create({
        data: {
          userId,
          title: dto.title,
          description: dto.description ?? '',
          limit: toDecimal(dto.limit),
          categoryId: dto.categoryId,
        },
      })
      .then((b) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        categoriaId: b.categoryId,
        limite: toNumber(b.limit),
        gasto: 0,
      }));
  }

  async findAll(userId: string) {
    const budgets = await this.prisma.budget.findMany({ where: { userId } });
    const spend = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'DESPESA' },
      _sum: { amount: true },
    });
    const map = new Map(spend.map((s) => [s.categoryId, toNumber(s._sum.amount ?? null)]));
    return budgets.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      categoriaId: b.categoryId,
      limite: toNumber(b.limit),
      gasto: map.get(b.categoryId) ?? 0,
    }));
  }

  private async assertOwned(userId: string, id: string) {
    const b = await this.prisma.budget.findFirst({ where: { id, userId } });
    if (!b) throw new NotFoundException('Orçamento não encontrado');
    return b;
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    await this.assertOwned(userId, id);
    const b = await this.prisma.budget.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.limit !== undefined && { limit: toDecimal(dto.limit) }),
      },
    });
    return {
      id: b.id,
      title: b.title,
      description: b.description,
      categoriaId: b.categoryId,
      limite: toNumber(b.limit),
    };
  }

  async remove(userId: string, id: string) {
    await this.assertOwned(userId, id);
    await this.prisma.budget.delete({ where: { id } });
    return { success: true };
  }
}
