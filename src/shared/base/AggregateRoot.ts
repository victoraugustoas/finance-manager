import { Entity } from './Entity';
import { DomainEvent } from '@/shared/base/DomainEvent';

export abstract class AggregateRoot<TProps> extends Entity<TProps> {
  protected constructor(props: TProps, id?: string) {
    super(props, id);
  }

  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  override copyWith(overrides: Partial<TProps>): this {
    const copy = super.copyWith(overrides);
    copy._domainEvents = [...this._domainEvents];
    return copy;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }
}
