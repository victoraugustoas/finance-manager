export abstract class Entity<TProps> {
  readonly props: TProps;
  private readonly _id: string;

  protected constructor(props: TProps, id?: string) {
    this._id = id ?? crypto.randomUUID();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  equals(other: Entity<TProps>): boolean {
    return other._id === this._id;
  }
}
