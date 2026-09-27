import { DomainEvent } from '../events/domain-event';
import { Entity, EntityDiff, EntityProps } from './entity';
import { Result } from './result';

export abstract class AggregateRoot<
  Type,
  Props extends EntityProps,
  Event extends DomainEvent = DomainEvent,
> extends Entity<Type, Props> {
  private pendingEvents: Event[] = [];

  protected addEvent(event: Event): void {
    this.pendingEvents.push(event);
  }

  public hasEvents(): boolean {
    return this.pendingEvents.length > 0;
  }

  public peekEvents(): readonly Event[] {
    return [...this.pendingEvents];
  }

  public pullEvents(): Event[] {
    const events = [...this.pendingEvents];
    this.clearEvents();
    return events;
  }

  public clearEvents(): void {
    this.pendingEvents = [];
  }

  public override cloneWith(overrides: Partial<Props>): Result<Type> {
    const { props, diff } = this.cloneProps(overrides);
    const constructorRef = this.constructor as any;
    const tryCreate = constructorRef.tryCreate;

    let clonedResult: Result<Type>;
    if (typeof tryCreate === 'function') {
      clonedResult = tryCreate.call(constructorRef, props);
    } else {
      try {
        clonedResult = Result.ok(new constructorRef(props));
      } catch (error: unknown) {
        if (error instanceof Error) {
          clonedResult = Result.fail(error.message);
        } else {
          clonedResult = Result.fail('ENTITY_CLONE_ERROR');
        }
      }
    }

    if (clonedResult.isFailure) {
      return clonedResult;
    }

    // Behavior methods return clones, so pending events must follow the new instance
    // or a chain like `order.pay().instance.confirm()` would drop the first event.
    // The previous instance keeps its own list untouched.
    const cloned = clonedResult.instance as unknown as this;
    cloned.pendingEvents = [...this.pendingEvents, ...cloned.pendingEvents];

    this.applyCloneEvents(cloned, diff);

    return clonedResult;
  }

  protected applyCloneEvents(cloned: this, diff: EntityDiff<Props>): void {
    cloned.onClone(this, diff);
  }

  protected onClone(_previous: this, _diff: EntityDiff<Props>): void {}
}
