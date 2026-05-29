import { Prisma } from '@prisma/client';

// Round at the boundary so float drift in `value` (e.g. 0.1 + 0.2) can never be
// encoded into the stored Decimal. The column is Decimal(14,2), so 2dp is canonical.
export function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

export function toNumber(value: Prisma.Decimal | null | undefined): number {
  return value != null ? Number(value.toFixed(2)) : 0;
}
