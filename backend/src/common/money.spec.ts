import { toNumber, toDecimal } from './money';
import { Prisma } from '@prisma/client';

describe('money', () => {
  it('converts Decimal to number with 2 places', () => {
    expect(toNumber(new Prisma.Decimal('39.90'))).toBe(39.9);
  });
  it('converts number to Decimal', () => {
    expect(toDecimal(2300).toString()).toBe('2300');
  });
  it('rounds float drift to 2 decimals when building a Decimal', () => {
    expect(toDecimal(0.1 + 0.2).toString()).toBe('0.3');
  });
  it('returns 0 for null/undefined and keeps Decimal(0) as 0', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber(new Prisma.Decimal('0'))).toBe(0);
  });
});
