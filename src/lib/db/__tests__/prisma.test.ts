import { describe, it, expect } from 'vitest';
import { prisma } from '../prisma';

// These are integration tests that require a real database connection
// Run manually with: npm test -- src/lib/db/__tests__/prisma.test.ts
// Skip in regular test runs - set RUN_DB_TESTS=true to run
describe.skipIf(!process.env.RUN_DB_TESTS)('Database Connection', () => {
  it('should connect to the database successfully', async () => {
    // Verify we can execute a simple query
    const result = await prisma.$queryRaw`SELECT 1 as value`;
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should be able to query players table', async () => {
    // Verify the players table exists and is queryable
    const players = await prisma.player.findMany({ take: 1 });
    expect(Array.isArray(players)).toBe(true);
  });

  it('should be able to query games table', async () => {
    // Verify the games table exists and is queryable
    const games = await prisma.game.findMany({ take: 1 });
    expect(Array.isArray(games)).toBe(true);
  });
});
