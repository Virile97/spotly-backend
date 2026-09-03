import { prisma } from '../client';
import type { Prisma } from '../generated/client/client';

export type TransactionClient = Prisma.TransactionClient;

export function runInTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>,
  options?: { maxWait?: number; timeout?: number },
): Promise<T> {
  return prisma.$transaction(fn, {
    maxWait: options?.maxWait ?? 5000,
    timeout: options?.timeout ?? 10000,
  });
}
