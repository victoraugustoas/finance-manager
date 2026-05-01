export abstract class ValueObject<TProps> {
  protected readonly props: TProps;

  protected constructor(props: TProps) {
    this.props = Object.freeze(props);
  }

  equals(other: ValueObject<TProps>): boolean {
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
