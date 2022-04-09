import { keyboards } from './data/keyboards';
import { RandomChars } from './random-char';
import { Resetter } from './resetter';
import { Keyboard } from './types/keyboard';
import {
  ConstructorTypingOptions,
  EraseTypingOptions,
  FullTypingOptions,
  PartialTypingOptions,
  SentanceTypingOptions
} from './types/options';
import { Backspace, QueueItem, Sentance, Wait } from './types/queue-item';
import { ResultItem } from './types/result-item';
import { isSpecialChar } from './utils/is-special-char';
import { wait } from './utils/wait';

export class Typed {
  private readonly _resetter = new Resetter();
  private readonly _randomChars = new RandomChars();
  private readonly _options: ConstructorTypingOptions;
  private readonly _queue: QueueItem[] = [];
  private _currentQueueIndex: number = 0;
  private _currentQueueDetailIndex: number = 0;
  private _resultItems: ResultItem[] = [];
  private _fastForward: boolean = false;

  constructor(options: ConstructorTypingOptions) {
    this._options = options;
  }

  private get options(): FullTypingOptions {
    const defaultOptions: FullTypingOptions = {
      callback: () => {
        // do nothing
      },
      initialDelay: 0,
      eraseDelay: { min: 150, max: 250 },
      errorRate: 0.2,
      noSpecialCharErrors: false,
      locale: 'en',
      perLetterDelay: { min: 40, max: 150 }
    };

    const ffOptions: PartialTypingOptions = this._fastForward
      ? {
          perLetterDelay: { min: 10, max: 20 },
          eraseDelay: { min: 10, max: 20 },
          initialDelay: 0
        }
      : {};

    const currentQueueItemOptions = this._queue[this._currentQueueIndex]?.options ?? {};

    return {
      ...defaultOptions,
      ...this._options,
      ...currentQueueItemOptions,
      ...ffOptions
    };
  }

  public addKeyboard(locale: string, keyboard: Keyboard) {
    keyboards[locale] = keyboard;
  }

  public async reset(clearTexts: boolean = false): Promise<void> {
    this._resultItems = [];
    this._fastForward = false;
    this.updateText();
    if (clearTexts) {
      while (this._queue.pop()) {
        // do nothing
      }
    }
    await this._resetter.reset();
  }

  public type(sentance: string, options?: SentanceTypingOptions): Typed {
    this._queue.push({
      type: 'sentance',
      text: sentance,
      options,
      className: options?.className
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

  public wait(delay: number): Typed {
    this._queue.push({
      type: 'wait',
      delay
    });
    return this;
  }

  public async run(): Promise<void> {
    this._currentQueueIndex = 0;
    this._currentQueueDetailIndex = 0;
    this._resultItems = [];
    while (await this.doQueueAction()) {
      // do nothing
    }
  }

  public fastForward(enabled = true) {
    this._fastForward = enabled;
    this._resetter.singleReset();
  }

  private async doQueueAction(): Promise<boolean> {
    const currentQueueItem = this._queue[this._currentQueueIndex];
    switch (currentQueueItem.type) {
      case 'sentance':
        return this.typeLetter();
      case 'backspace':
        return this.typeBackspace();
      case 'wait':
        return this.waitItem();
      default:
        throw new Error('Unknown queue item type');
    }
  }

  private async typeLetter(): Promise<boolean> {
    const currentSentance = this._queue[this._currentQueueIndex] as Sentance;
    const currentLetter = currentSentance.text[this._currentQueueDetailIndex];
    await wait(this.options.initialDelay, this._resetter);
    await this.maybeDoError(currentSentance, 0);
    this.addLetter(currentLetter, currentSentance.className);
    this.updateText();
    await wait(this.options.perLetterDelay, this._resetter);
    return this.endQueueItemStep(currentSentance.text.length);
  }

  private async typeBackspace(): Promise<boolean> {
    const currentBackspaceItem = this._queue[this._currentQueueIndex] as Backspace;
    // await wait(this.options.initialDelay);
    this.deleteLetter();
    this.updateText();
    await wait(this.options.eraseDelay, this._resetter);
    return this.endQueueItemStep(currentBackspaceItem.length);
  }

  private async waitItem(): Promise<boolean> {
    if (!this._fastForward) {
      const currentWaitItem = this._queue[this._currentQueueIndex] as Wait;
      await wait(currentWaitItem.delay, this._resetter);
    }
    return this.endQueueItemStep();
  }

  private endQueueItemStep(maxDetailIndex?: number): boolean {
    if (this._resetter.isReset) {
      return false;
    }
    this._currentQueueDetailIndex++;
    if (!maxDetailIndex || this._currentQueueDetailIndex === maxDetailIndex) {
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
    if (this.options.noSpecialCharErrors && isSpecialChar(intendedChar)) {
      return;
    }
    const nearbyChar = this._randomChars.getRandomCharCloseToChar(intendedChar, this.options.locale);
    if (!nearbyChar) {
      return;
    }
    this.addLetter(nearbyChar, currentSentance.className);
    this.updateText();
    await wait(this.options.perLetterDelay, this._resetter);
    await this.maybeDoError(currentSentance, indexDelta + 1);
    this.deleteLetter();
    this.updateText();
    await wait(this.options.eraseDelay, this._resetter);
  }

  private nextQueueItem(): boolean {
    if (this._resetter.isReset) {
      return false;
    }
    this._currentQueueIndex++;
    if (this._currentQueueIndex === this._queue.length) {
      return false;
    }
    this._currentQueueDetailIndex = 0;
    return true;
  }

  private addLetter(letter: string, className?: string) {
    const lastResultItem = this._resultItems[this._resultItems.length - 1];
    if (lastResultItem && lastResultItem.className === className) {
      lastResultItem.text += letter;
    } else {
      this._resultItems.push({
        text: letter,
        className
      });
    }
  }

  private deleteLetter() {
    const lastResultItem = this._resultItems[this._resultItems.length - 1];
    if (lastResultItem) {
      lastResultItem.text = lastResultItem.text.slice(0, -1);
      if (!lastResultItem.text) {
        this._resultItems.pop();
      }
    } else {
      if (this._resetter.isReset) {
        // might happen due to still running code during reset
        return;
      }
      throw new Error('Cannot delete letter from empty text');
    }
  }

  private updateText() {
    if (this._resetter.isReset) {
      return;
    }
    const text = this._resultItems
      .map(item => {
        if (item.className) {
          return `<span class="${item.className}">${item.text}</span>`;
        } else {
          return item.text;
        }
      })
      .join('');
    this.options.callback(text);
  }
}
