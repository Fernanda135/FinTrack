import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('throws when DATABASE_URL is missing', () => {
    expect(() => validateEnv({ JWT_ACCESS_SECRET: 'a', JWT_REFRESH_SECRET: 'b' })).toThrow();
  });

  it('throws when DATABASE_URL is not a valid URL', () => {
    expect(() =>
      validateEnv({ DATABASE_URL: 'not-a-url', JWT_ACCESS_SECRET: 'a', JWT_REFRESH_SECRET: 'b' }),
    ).toThrow(/Invalid environment/);
  });

  it('returns parsed config when all required vars present', () => {
    const cfg = validateEnv({
      DATABASE_URL: 'postgresql://x',
      JWT_ACCESS_SECRET: 'a',
      JWT_REFRESH_SECRET: 'b',
    });
    expect(cfg.DATABASE_URL).toBe('postgresql://x');
    expect(cfg.PORT).toBe(3000); // default
  });
});
