import { Entity } from './Entity';
import { DomainEvent } from '@/shared/base/DomainEvent';

export abstract class AggregateRoot<TProps> extends Entity<TProps> {
  private _domainEvents: DomainEvent[] = [];

  protected constructor(props: TProps, id?: string) {
    super(props, id);
  }

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
