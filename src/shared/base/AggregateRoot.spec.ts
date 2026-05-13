import { AggregateRoot } from './AggregateRoot';
import { DomainEvent } from './DomainEvent';

class StubEvent extends DomainEvent {
  constructor(readonly name: string) {
    super();
  }
  get eventName() {
    return this.name;
  }
  get payload() {
    return {};
  }
}

class SomeAggregate extends AggregateRoot<{ name: string }> {
  constructor(props: { name: string }, id?: string) {
    super(props, id);
  }

  addEvent(event: DomainEvent) {
    this.addDomainEvent(event);
  }
}

describe('AggregateRoot', () => {
  describe('domainEvents', () => {
    it('should start with no domain events', () => {
      const agg = new SomeAggregate({ name: 'X' });

      expect(agg.domainEvents).toHaveLength(0);
    });

    it('should accumulate events added via addDomainEvent', () => {
      const agg = new SomeAggregate({ name: 'X' });

      agg.addEvent(new StubEvent('event.a'));
      agg.addEvent(new StubEvent('event.b'));

      expect(agg.domainEvents).toHaveLength(2);
    });

    it('should return events in insertion order', () => {
      const agg = new SomeAggregate({ name: 'X' });
      const first = new StubEvent('first');
      const second = new StubEvent('second');

      agg.addEvent(first);
      agg.addEvent(second);

      expect(agg.domainEvents[0]).toBe(first);
      expect(agg.domainEvents[1]).toBe(second);
    });
  });

  describe('clearDomainEvents()', () => {
    it('should remove all domain events', () => {
      const agg = new SomeAggregate({ name: 'X' });
      agg.addEvent(new StubEvent('event.a'));
      agg.addEvent(new StubEvent('event.b'));

      agg.clearDomainEvents();

      expect(agg.domainEvents).toHaveLength(0);
    });
  });

  describe('copyWith()', () => {
    it('should override the given props on the copy', () => {
      const original = new SomeAggregate({ name: 'Original' }, 'agg-id');

      const copy = original.copyWith({ name: 'Updated' });

      expect(copy.props.name).toBe('Updated');
    });

    it('should preserve the same id', () => {
      const original = new SomeAggregate({ name: 'Original' }, 'agg-id');

      const copy = original.copyWith({ name: 'Updated' });

      expect(copy.id).toBe('agg-id');
    });

    it('should copy domain events from the original into the copy', () => {
      const original = new SomeAggregate({ name: 'X' }, 'agg-id');
      const event = new StubEvent('event.a');
      original.addEvent(event);

      const copy = original.copyWith({ name: 'Y' });

      expect(copy.domainEvents).toHaveLength(1);
      expect(copy.domainEvents[0]).toBe(event);
    });

    it('should not share the events array between original and copy', () => {
      const original = new SomeAggregate({ name: 'X' }, 'agg-id');
      original.addEvent(new StubEvent('event.a'));

      const copy = original.copyWith({});
      copy.addEvent(new StubEvent('event.b'));

      expect(original.domainEvents).toHaveLength(1);
      expect(copy.domainEvents).toHaveLength(2);
    });

    it('should not mutate the original props', () => {
      const original = new SomeAggregate({ name: 'Original' }, 'agg-id');

      original.copyWith({ name: 'Different' });

      expect(original.props.name).toBe('Original');
    });
  });
});
