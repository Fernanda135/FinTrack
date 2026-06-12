import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Category } from '@prisma/client'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
    where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        refreshHash: true,
      }
    });
  }

  create(data: { email: string; name: string; passwordHash: string }) {
    return this.prisma.user.create({ data });
  }

  setRefreshHash(userId: string, refreshHash: string | null) {
    return this.prisma.user.update({ where: { id: userId }, data: { refreshHash } });
  }

    async createCategory(userId: string, category: { label: string; value: string; isIncome: boolean }) {
      return this.prisma.category.create({
        data: {
          label: category.label,
          value: category.value,
          isIncome: category.isIncome,
          userId: userId,
        },
      });
    }

    async createDefaultCategories(userId: string) {
    const DEFAULT_CATEGORIES = [
      { label: 'Alimentação', value: 'alimentacao', isIncome: false },
      { label: 'Transporte', value: 'transporte', isIncome: false },
      { label: 'Moradia', value: 'moradia', isIncome: false },
      { label: 'Assinaturas', value: 'assinaturas', isIncome: false },
      { label: 'Saúde', value: 'saude', isIncome: false },
      { label: 'Lazer', value: 'lazer', isIncome: false },
      { label: 'Educação', value: 'educacao', isIncome: false },
      { label: 'Outros', value: 'outros', isIncome: false },

      { label: 'Salário', value: 'salario', isIncome: true },
      { label: 'Freelancer', value: 'freelancer', isIncome: true },
      { label: 'Investimentos', value: 'investimentos', isIncome: true },
      { label: 'Presentes', value: 'presentes', isIncome: true },
      { label: 'Reembolsos', value: 'reembolsos', isIncome: true },
      { label: 'Outras Receitas', value: 'outras-receitas', isIncome: true },
    ];

    const categories: Category[] = [];

      for (const category of DEFAULT_CATEGORIES) {
        const created = await this.prisma.category.create({
          data: {
            ...category,
            userId,
          },
        });
        categories.push(created);
      }
      return categories;
    }
}
