import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

const ACCOUNT_TYPES = [
  { label: 'Conta Corrente', value: 'CONTA_CORRENTE' },
  { label: 'Conta Poupança', value: 'CONTA_POUPANCA' },
  { label: 'Carteira', value: 'CARTEIRA' },
  { label: 'Cartão de Crédito', value: 'CARTAO_CREDITO' },
  { label: 'Investimentos', value: 'INVESTIMENTOS' },
  { label: 'Outros', value: 'OUTROS' },
];

@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private service: AccountsService) {}

  @Get('types')
  types() {
    return ACCOUNT_TYPES;
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAccountDto) {
    return this.service.create(user.userId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.service.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.userId, id);
  }
}
