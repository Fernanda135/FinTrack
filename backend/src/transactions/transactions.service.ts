import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { toDecimal, toNumber } from '../common/money';

// receita adds to balance, despesa subtracts. Returns the signed delta.
function delta(type: TransactionType, amount: number): number {
  return type === 'RECEITA' ? amount : -amount;
}

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  private serialize = (t: any) => ({
    ...t,
    amount: toNumber(t.amount),
    account: t.account ? { ...t.account, balance: toNumber(t.account.balance) } : undefined,
  });

  async create(userId: string, dto: CreateTransactionDto) {
    const tx = await this.prisma.$transaction(async (db) => {
      // Ownership checks live INSIDE the transaction to close the TOCTOU gap
      // (an account/category deleted concurrently can't slip a write through).
      const [account, category] = await Promise.all([
        db.account.findFirst({ where: { id: dto.accountId, userId } }),
        db.category.findFirst({ where: { id: dto.categoryId, userId } }),
      ]);
      if (!account) throw new NotFoundException('Conta não encontrada');
      if (!category) throw new NotFoundException('Categoria não encontrada');

      // Apply the balance change FIRST so the included account below reflects the new balance.
      await db.account.update({
        where: { id: dto.accountId },
        data: { balance: { increment: toDecimal(delta(dto.type, dto.amount)) } },
      });
      return db.transaction.create({
        data: {
          userId,
          title: dto.title,
          amount: toDecimal(dto.amount),
          type: dto.type,
          date: new Date(dto.date),
          accountId: dto.accountId,
          categoryId: dto.categoryId,
        },
        include: { account: true, category: true },
      });
    });
    return this.serialize(tx);
  }

  async findAll(userId: string, limit?: number) {
    const list = await this.prisma.transaction.findMany({
      where: { userId },
      include: { account: true, category: true },
      orderBy: { date: 'desc' },
      ...(limit ? { take: limit } : {}),
    });
    return list.map(this.serialize);
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    return this.prisma.$transaction(async (db) => {
      const existing = await db.transaction.findFirst({ where: { id, userId } });
      if (!existing) throw new NotFoundException('Transação não encontrada');

      const newAccountId = dto.accountId ?? existing.accountId;
      const newType = dto.type ?? existing.type;
      const newAmount = dto.amount ?? toNumber(existing.amount);

      if (dto.accountId) {
        const owns = await db.account.findFirst({ where: { id: dto.accountId, userId } });
        if (!owns) throw new NotFoundException('Conta não encontrada');
      }
      if (dto.categoryId) {
        const owns = await db.category.findFirst({ where: { id: dto.categoryId, userId } });
        if (!owns) throw new NotFoundException('Categoria não encontrada');
      }

      const oldDelta = delta(existing.type, toNumber(existing.amount));
      const newDelta = delta(newType, newAmount);

      // reverse old effect on the old account, apply new effect on the (possibly new) account
      await db.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: toDecimal(-oldDelta) } },
      });
      await db.account.update({
        where: { id: newAccountId },
        data: { balance: { increment: toDecimal(newDelta) } },
      });

      return db.transaction.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.amount !== undefined && { amount: toDecimal(dto.amount) }),
          ...(dto.type !== undefined && { type: dto.type }),
          ...(dto.accountId !== undefined && { accountId: dto.accountId }),
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
          ...(dto.date !== undefined && { date: new Date(dto.date) }),
        },
        include: { account: true, category: true },
      });
    }).then((t) => this.serialize(t));
  }

  async remove(userId: string, id: string) {
    // Fetch + delete + balance-reverse all inside one transaction (consistent with
    // create/update; closes the TOCTOU window between the lookup and the delete).
    await this.prisma.$transaction(async (db) => {
      const existing = await db.transaction.findFirst({ where: { id, userId } });
      if (!existing) throw new NotFoundException('Transação não encontrada');
      await db.transaction.delete({ where: { id } });
      await db.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: toDecimal(-delta(existing.type, toNumber(existing.amount))) } },
      });
    });
    return { success: true };
  }
}
