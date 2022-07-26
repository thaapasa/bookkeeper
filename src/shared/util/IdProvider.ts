export class IdProvider {
  private nextValue: number;
  constructor(initialValue?: number) {
    this.nextValue = initialValue ?? 1;
  }

  next = () => {
    const v = this.nextValue;
    this.nextValue++;
    return v;
  };

  nextStr = (prefix?: string) => {
    return (prefix ?? '') + String(this.next());
  };
}
