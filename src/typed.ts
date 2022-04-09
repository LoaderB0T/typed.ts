import { keyboards } from './data/keyboards';
import { RandomChars } from './random-char';
import { Keyboard } from './types/keyboard';
import { ConstructorTypingOptions, EraseTypingOptions, FullTypingOptions, SentanceTypingOptions } from './types/options';
import { Backspace, QueueItem, Sentance } from './types/queue-item';
import { Resetter } from './types/resetter';
import { wait } from './utils/wait';

export class Typed {
  private readonly _queue: QueueItem[] = [];
  private _currentQueueIndex: number = 0;
  private _currentQueueDetailIndex: number = 0;
  private _currentText: string = '';
  private readonly _options: ConstructorTypingOptions;
  private readonly _randomChars = new RandomChars();
  private _reset: boolean = false;
  private _resolveReset!: Function;
  private readonly _resetPromise = new Promise<void>(resolve => (this._resolveReset = resolve));
  private readonly _resetter: Resetter = {
    isReset: () => this._reset,
    resetPromise: this._resetPromise
  };

  constructor(options: ConstructorTypingOptions) {
    this._options = options;
  }

  private get options(): FullTypingOptions {
    const defaultOptions: FullTypingOptions = {
      callback: () => {
        // do nothing
      },
      initialDelay: 0,
      eraseDelay: 50,
      errorRate: 0.2,
      locale: 'en',
      perLetterDelay: 50
    };

    const currentQueueItemOptions = this._queue[this._currentQueueIndex]?.options ?? {};

    return {
      ...defaultOptions,
      ...this._options,
      ...currentQueueItemOptions
    };
  }

  public addKeyboard(locale: string, keyboard: Keyboard) {
    keyboards[locale] = keyboard;
  }

  public async reset() {
    this._currentText = '';
    this.updateText();
    while (this._queue.pop()) {
      // do nothing
    }
    this._resolveReset();
    this._reset = true;
    await new Promise<void>(
      resolve =>
        setTimeout(() => {
          this._reset = false;
          this._resetter.resetPromise = new Promise<void>(r => (this._resolveReset = r));
          resolve();
        }, 10) // wait a bit to make sure the reset promise is resolved @todo find a better way
    );
  }

  public type(sentance: string, options?: SentanceTypingOptions): Typed {
    this._queue.push({
      type: 'sentance',
      text: sentance,
      options
    });
    return this;
  }

  public backspace(length: number, options?: EraseTypingOptions): Typed {
    this._queue.push({
      type: 'backspace',
      length,
      options
    });
    return this;
  }

  public async run(): Promise<void> {
    this._currentQueueIndex = 0;
    this._currentQueueDetailIndex = 0;
    this._currentText = '';
    while (await this.doQueueAction()) {
      // do nothing
    }
  }

  private async doQueueAction(): Promise<boolean> {
    const currentQueueItem = this._queue[this._currentQueueIndex];
    switch (currentQueueItem.type) {
      case 'sentance':
        return this.typeLetter();
      case 'backspace':
        return this.typeBackspace();
      default:
        throw new Error('Unknown queue item type');
    }
  }

  private async typeLetter(): Promise<boolean> {
    const currentSentance = this._queue[this._currentQueueIndex] as Sentance;
    const currentLetter = currentSentance.text[this._currentQueueDetailIndex];
    await wait(this.options.initialDelay, this._resetter);
    await this.maybeDoError(currentSentance, 0);
    this._currentText += currentLetter;
    this.updateText();
    await wait(this.options.perLetterDelay, this._resetter);
    return this.endQueueItemStep(currentSentance.text.length);
  }

  private async typeBackspace(): Promise<boolean> {
    const currentBackspaceItem = this._queue[this._currentQueueIndex] as Backspace;
    // await wait(this.options.initialDelay);
    this._currentText = this._currentText.slice(0, -1);
    this.updateText();
    await wait(this.options.eraseDelay, this._resetter);
    return this.endQueueItemStep(currentBackspaceItem.length);
  }

  private endQueueItemStep(maxDetailIndex: number): boolean {
    if (this._reset) {
      return false;
    }
    this._currentQueueDetailIndex++;
    if (this._currentQueueDetailIndex === maxDetailIndex) {
      return this.nextQueueItem();
    } else {
      return true;
    }
  }

  private async maybeDoError(currentSentance: Sentance, indexDelta: number): Promise<void> {
    if (Math.random() > this.options.errorRate) {
      return;
    }
    const intendedChar = currentSentance.text[this._currentQueueDetailIndex + indexDelta];
    if (!intendedChar) {
      return;
    }
    const nearbyChar = this._randomChars.getRandomCharCloseToChar(intendedChar, this.options.locale);
    if (!nearbyChar) {
      return;
    }
    this._currentText += nearbyChar;
    this.updateText();
    await wait(this.options.perLetterDelay, this._resetter);
    await this.maybeDoError(currentSentance, indexDelta + 1);
    this._currentText = this._currentText.slice(0, -1);
    this.updateText();
    await wait(this.options.eraseDelay, this._resetter);
  }

  private nextQueueItem(): boolean {
    if (this._reset) {
      return false;
    }
    this._currentQueueIndex++;
    if (this._currentQueueIndex === this._queue.length) {
      return false;
    }
    this._currentQueueDetailIndex = 0;
    return true;
  }

  private updateText() {
    if (this._reset) {
      return;
    }
    this.options.callback(this._currentText);
  }
}
