/**
 * Minimal manual mock for @prisma/client used during Jest tests on Node 14.
 * The real @prisma/client bundle uses ??= which is not supported on Node 14,
 * so we substitute just the pieces the tests need.
 */

export enum MessageStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  REPLIED = 'REPLIED',
}

export class PrismaClient {}
