import { OutboxRepository } from '@/shared/events/ports/OutboxRepository';
import { PrismaOutboxRepository } from '@/shared/events/infra/PrismaOutboxRepository';
import { OutboxEventStatus } from '@/shared/events/OutboxEvent';
import { PrismaService } from '@/shared/infra/PrismaService';

jest.mock('@/shared/infra/PrismaService', () => ({
  PrismaService: class MockPrismaService {},
}));

const baseRow = {
  id: 'evt-1',
  eventName: 'SomeEvent',
  payload: { key: 'val' },
  occurredAt: new Date('2026-01-01'),
  status: OutboxEventStatus.PENDING,
  processedAt: null,
  attempts: 0,
  lastError: null,
  createdAt: new Date('2026-01-01'),
};

describe('PrismaOutboxRepository', () => {
  let findMany: jest.Mock;
  let updateMany: jest.Mock;
  let update: jest.Mock;
  let prisma: PrismaService;
  let repository: OutboxRepository;

  beforeEach(() => {
    findMany = jest.fn().mockResolvedValue([]);
    updateMany = jest.fn().mockResolvedValue(undefined);
    update = jest.fn().mockResolvedValue(undefined);

    const tx = { outboxEvent: { findMany, updateMany } };

    prisma = {
      $transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
      outboxEvent: { update },
    } as unknown as PrismaService;

    repository = new PrismaOutboxRepository(prisma);
  });

  describe('claimPending()', () => {
    it('should query PENDING events ordered by createdAt ascending', async () => {
      await repository.claimPending(10);

      expect(findMany).toHaveBeenCalledWith({
        where: { status: OutboxEventStatus.PENDING },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });
    });

    it('should use 100 as the default limit', async () => {
      await repository.claimPending();

      expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
    });

    it('should update claimed events to PROCESSING status', async () => {
      findMany.mockResolvedValue([baseRow]);

      await repository.claimPending();

      expect(updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['evt-1'] }, status: OutboxEventStatus.PENDING },
        data: { status: OutboxEventStatus.PROCESSING },
      });
    });

    it('should return mapped OutboxEventData for each claimed row', async () => {
      findMany.mockResolvedValue([baseRow]);

      const result = await repository.claimPending();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'evt-1',
        eventName: 'SomeEvent',
        payload: { key: 'val' },
        occurredAt: baseRow.occurredAt,
        status: OutboxEventStatus.PENDING,
        processedAt: null,
        attempts: 0,
        lastError: null,
      });
    });

    it('should not call updateMany and return an empty array when no pending events exist', async () => {
      findMany.mockResolvedValue([]);

      const result = await repository.claimPending();

      expect(updateMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should include all event ids in the updateMany call when claiming multiple events', async () => {
      const secondRow = { ...baseRow, id: 'evt-2' };
      findMany.mockResolvedValue([baseRow, secondRow]);

      await repository.claimPending();

      expect(updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['evt-1', 'evt-2'] }, status: OutboxEventStatus.PENDING },
        }),
      );
    });
  });

  describe('markProcessed()', () => {
    it('should update the event to PROCESSED with a processedAt timestamp', async () => {
      await repository.markProcessed('evt-1');

      expect(update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: {
          status: OutboxEventStatus.PROCESSED,
          processedAt: expect.any(Date),
        },
      });
    });
  });

  describe('markFailed()', () => {
    it('should update the event to FAILED with the error message and incremented attempts', async () => {
      await repository.markFailed('evt-1', 'Error: timeout');

      expect(update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: {
          status: OutboxEventStatus.FAILED,
          lastError: 'Error: timeout',
          attempts: { increment: 1 },
        },
      });
    });
  });
});
