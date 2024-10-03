export class Resetter {
  private _reset: boolean = false;
  private _resolveReset: () => void = () => {};
  private _resetPromise = new Promise<void>(resolve => (this._resolveReset = resolve));
  private _singleReset: boolean = false;
  private _resolveSingleReset: () => void = () => {};
  private _resetSinglePromise = new Promise<void>(resolve => (this._resolveSingleReset = resolve));

  public async reset(): Promise<void> {
    this._reset = true;
    this._resolveReset();

    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(() => {
      this.resetResetter();
      resolve();
    }, 10); // wait a bit to make sure the reset promise is resolved @todo find a better way

    await promise;
  }

  private resetResetter(): void {
    this._reset = false;
    const { promise, resolve } = Promise.withResolvers<void>();
    this._resolveReset = resolve;
    this._resetPromise = promise;
  }

  public get isReset(): boolean {
    return this._reset;
  }

  public get resetPromise(): Promise<void> {
    return this._resetPromise;
  }

  public singleReset(): void {
    this._singleReset = true;
    this._resolveSingleReset();
  }

  public resetSingleResetter(): void {
    this._singleReset = false;
    const { promise, resolve } = Promise.withResolvers<void>();
    this._resolveSingleReset = resolve;
    this._resetSinglePromise = promise;
  }

  public get isSingleReset(): boolean {
    return this._singleReset;
  }

  public get resetSinglePromise(): Promise<void> {
    return this._resetSinglePromise;
  }
}
