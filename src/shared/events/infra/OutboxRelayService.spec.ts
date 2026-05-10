import { OutboxRelayService } from '@/shared/events/infra/OutboxRelayService';
import { OutboxRepository } from '@/shared/events/ports/OutboxRepository';
import { EventPublisher } from '@/shared/events/ports/EventPublisher';
import { OutboxEventData, OutboxEventStatus } from '@/shared/events/OutboxEvent';

const makeEvent = (id = 'evt-1'): OutboxEventData => ({
  id,
  eventName: 'SomeEvent',
  payload: {},
  occurredAt: new Date('2026-01-01'),
  status: OutboxEventStatus.PROCESSING,
  processedAt: null,
  attempts: 0,
  lastError: null,
});

interface TestableOutboxRelayService {
  onApplicationBootstrap(): void;
  onApplicationShutdown(): void;
  relay(): Promise<void>;
}

describe('OutboxRelayService', () => {
  let claimPending: jest.Mock;
  let markProcessed: jest.Mock;
  let markFailed: jest.Mock;
  let publish: jest.Mock;
  let outboxRepo: OutboxRepository;
  let publisher: EventPublisher;
  let service: TestableOutboxRelayService;

  beforeEach(() => {
    claimPending = jest.fn().mockResolvedValue([]);
    markProcessed = jest.fn().mockResolvedValue(undefined);
    markFailed = jest.fn().mockResolvedValue(undefined);
    publish = jest.fn().mockResolvedValue(undefined);

    outboxRepo = { claimPending, markProcessed, markFailed } as unknown as OutboxRepository;
    publisher = { publish } as unknown as EventPublisher;
    service = new OutboxRelayService(
      outboxRepo,
      publisher,
    ) as unknown as TestableOutboxRelayService;
  });

  describe('onApplicationBootstrap()', () => {
    it('should trigger relay on each interval tick', () => {
      jest.useFakeTimers();

      service.onApplicationBootstrap();

      expect(claimPending).not.toHaveBeenCalled();
      jest.advanceTimersByTime(5_000);
      expect(claimPending).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('onApplicationShutdown()', () => {
    it('should stop the relay interval so no further ticks fire', () => {
      jest.useFakeTimers();

      service.onApplicationBootstrap();
      service.onApplicationShutdown();
      jest.advanceTimersByTime(10_000);

      expect(claimPending).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('relay()', () => {
    it('should call claimPending with the batch size', async () => {
      await service.relay();

      expect(claimPending).toHaveBeenCalledWith(100);
    });

    it('should publish and mark processed when publish succeeds', async () => {
      claimPending.mockResolvedValue([makeEvent()]);

      await service.relay();

      expect(publish).toHaveBeenCalledWith(makeEvent());
      expect(markProcessed).toHaveBeenCalledWith('evt-1');
      expect(markFailed).not.toHaveBeenCalled();
    });

    it('should mark event as failed when publish throws', async () => {
      const err = new Error('network timeout');
      claimPending.mockResolvedValue([makeEvent()]);
      publish.mockRejectedValue(err);

      await service.relay();

      expect(markFailed).toHaveBeenCalledWith('evt-1', String(err));
      expect(markProcessed).not.toHaveBeenCalled();
    });

    it('should process all events in the batch', async () => {
      claimPending.mockResolvedValue([makeEvent('evt-1'), makeEvent('evt-2')]);

      await service.relay();

      expect(markProcessed).toHaveBeenCalledWith('evt-1');
      expect(markProcessed).toHaveBeenCalledWith('evt-2');
      expect(markProcessed).toHaveBeenCalledTimes(2);
    });

    it('should continue processing remaining events when one publish fails', async () => {
      claimPending.mockResolvedValue([makeEvent('evt-1'), makeEvent('evt-2')]);
      publish.mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce(undefined);

      await service.relay();

      expect(markFailed).toHaveBeenCalledWith('evt-1', expect.any(String));
      expect(markProcessed).toHaveBeenCalledWith('evt-2');
    });

    it('should skip the relay run if a previous run is still in progress', async () => {
      let resolveClaim!: () => void;
      claimPending.mockReturnValueOnce(
        new Promise<OutboxEventData[]>((resolve) => {
          resolveClaim = () => resolve([]);
        }),
      );

      const first = service.relay();
      const second = service.relay();

      resolveClaim();
      await Promise.all([first, second]);

      expect(claimPending).toHaveBeenCalledTimes(1);
    });

    it('should allow a new relay run after the previous one completes', async () => {
      claimPending.mockResolvedValue([]);

      await service.relay();
      await service.relay();

      expect(claimPending).toHaveBeenCalledTimes(2);
    });

    it('should reset the in-progress flag when claimPending throws', async () => {
      claimPending.mockRejectedValueOnce(new Error('db down')).mockResolvedValue([]);

      await service.relay();
      await service.relay();

      expect(claimPending).toHaveBeenCalledTimes(2);
    });
  });
});
