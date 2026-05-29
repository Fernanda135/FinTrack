import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { toDecimal, toNumber } from '../common/money';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  private serialize = (a: any) => ({ ...a, balance: toNumber(a.balance) });

  async create(userId: string, dto: CreateAccountDto) {
    const acc = await this.prisma.account.create({
      data: {
        userId,
        label: dto.label,
        type: dto.type,
        balance: toDecimal(dto.balance),
        color: dto.color ?? '#AAAAAA',
      },
    });
    return this.serialize(acc);
  }

  async findAll(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId }, orderBy: { createdAt: 'asc' },
    });
    return accounts.map(this.serialize);
  }

  private async assertOwned(userId: string, id: string) {
    const acc = await this.prisma.account.findFirst({ where: { id, userId } });
    if (!acc) throw new NotFoundException('Conta não encontrada');
    return acc;
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    await this.assertOwned(userId, id);
    const acc = await this.prisma.account.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.balance !== undefined && { balance: toDecimal(dto.balance) }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
    });
    return this.serialize(acc);
  }

  async remove(userId: string, id: string) {
    await this.assertOwned(userId, id);
    try {
      await this.prisma.account.delete({ where: { id } });
    } catch (e) {
      // P2003 = FK constraint (the account still has transactions, onDelete: Restrict).
      // Any other error is unexpected — rethrow so it surfaces as a real 500, not a misleading 409.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new ConflictException('Conta possui transações vinculadas');
      }
      throw e;
    }
    return { success: true };
  }
}
