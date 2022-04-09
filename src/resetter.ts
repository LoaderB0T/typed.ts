export class Resetter {
  private _reset: boolean = false;
  private _resolveReset!: Function;
  private _resetPromise = new Promise<void>(resolve => (this._resolveReset = resolve));
  private _singleReset: boolean = false;
  private _resolveSingleReset!: Function;
  private _resetSinglePromise = new Promise<void>(resolve => (this._resolveSingleReset = resolve));

  public async reset(): Promise<void> {
    this._reset = true;
    this._resolveReset();

    await new Promise<void>(
      resolve =>
        setTimeout(() => {
          this.resetResetter();
          resolve();
        }, 10) // wait a bit to make sure the reset promise is resolved @todo find a better way
    );
  }

  private resetResetter(): void {
    this._reset = false;
    this._resetPromise = new Promise<void>(resolve => (this._resolveReset = resolve));
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
    this._resetSinglePromise = new Promise<void>(resolve => (this._resolveSingleReset = resolve));
  }

  public get isSingleReset(): boolean {
    return this._singleReset;
  }

  public get resetSinglePromise(): Promise<void> {
    return this._resetSinglePromise;
  }
}
