import { keyboards } from './data/keyboards';
import { RandomChars } from './utils/random-char';
import { Resetter } from './utils/resetter';
import { Keyboard } from './types/keyboard';
import {
  ConstructorTypingOptions,
  EraseTypingOptions,
  FullTypingOptions,
  PartialTypingOptions,
  SentanceTypingOptions
} from './types/options';
import { Backspace, Sentance, Wait } from './types/queue-item';
import { ResultItem } from './types/result-item';
import { isSpecialChar } from './utils/is-special-char';
import { wait } from './utils/wait';
import { Letter } from './types/letter';
import { Queue } from './types/queue';

export class Typed {
  private readonly _resetter = new Resetter();
  private readonly _randomChars = new RandomChars();
  private readonly _options: ConstructorTypingOptions;
  private readonly _typeQueue: Queue = new Queue(this._resetter);
  private readonly _ffQueue: Queue = new Queue(this._resetter);
  private _queue = this._typeQueue;
  private _resultItems: ResultItem[] = [];
  private _fastForward: boolean = false;
  private _lettersSinceLastError: number = 0;
  private readonly _endResultItems: ResultItem[] = [];

  constructor(options: ConstructorTypingOptions) {
    this._options = options;
  }

  private get options(): FullTypingOptions {
    const defaultOptions: FullTypingOptions = {
      callback: () => {
        // do nothing
      },
      eraseDelay: { min: 150, max: 250 },
      errorMultiplier: 1,
      noSpecialCharErrors: false,
      locale: 'en',
      perLetterDelay: { min: 40, max: 150 }
    };

    const ffOptions: PartialTypingOptions = this._fastForward
      ? {
          perLetterDelay: { min: 10, max: 20 },
          eraseDelay: { min: 10, max: 20 }
        }
      : {};

    const currentQueueItemOptions = this._queue.item?.options ?? {};

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
    this._ffQueue.clear();
    if (clearTexts) {
      this._typeQueue.clear();
      while (this._endResultItems.pop()) {
        // do nothing
      }
    }
    await this._resetter.reset();
  }

  public type(sentance: string, options?: SentanceTypingOptions): Typed {
    this._typeQueue.add({
      type: 'sentance',
      text: sentance,
      options,
      className: options?.className
    });
    this.addLetterTo(sentance, this._endResultItems, options?.className);
    return this;
  }

  public backspace(length: number, options?: EraseTypingOptions): Typed {
    this._typeQueue.add({
      type: 'backspace',
      length,
      options
    });
    this.deleteLetterFrom(this._endResultItems, length);
    return this;
  }

  public wait(delay: number): Typed {
    this._typeQueue.add({
      type: 'wait',
      delay
    });
    return this;
  }

  public async run(): Promise<void> {
    this._queue = this._typeQueue;
    this._typeQueue.resetIndices();
    this._resultItems = [];
    while (await this.doQueueAction()) {
      // do nothing
    }
  }

  public fastForward(enabled = true) {
    let matchingLetterCount = 0;
    while (true) {
      const currentTextAtIndex = this.getTextAtIndex(this._resultItems, matchingLetterCount);
      const endResultTextAtIndex = this.getTextAtIndex(this._endResultItems, matchingLetterCount);
      if (!currentTextAtIndex || !endResultTextAtIndex) {
        break;
      }
      if (
        currentTextAtIndex.letter === endResultTextAtIndex.letter &&
        currentTextAtIndex.className === endResultTextAtIndex.className
      ) {
        matchingLetterCount++;
      } else {
        break;
      }
    }

    this._ffQueue.clear();
    this._queue = this._ffQueue;

    const currentTextWithoutClasses = this.getCurrentText(this._resultItems, false);
    const currentTextLength = currentTextWithoutClasses.length;
    const neededBackspaces = currentTextLength - matchingLetterCount;
    this._ffQueue.add({
      type: 'backspace',
      length: neededBackspaces
    });
    const resultTextLength = this.getCurrentText(this._endResultItems, false).length;
    for (let i = 0; i < resultTextLength - matchingLetterCount; i++) {
      const letter = this.getTextAtIndex(this._endResultItems, i + matchingLetterCount)!;
      this._ffQueue.add({
        type: 'sentance',
        text: letter.letter,
        options: undefined,
        className: letter.className
      });
    }

    this._fastForward = enabled;
    this._resetter.singleReset();
  }

  private getTextAtIndex(resultItems: ResultItem[], index: number): Letter | undefined {
    let i = 0;
    let skipped = 0;
    while (resultItems[i]) {
      if (resultItems[i].text.length > index - skipped) {
        const letter = resultItems[i].text.substring(index - skipped, index - skipped + 1);
        const className = resultItems[i].className;
        return { letter, className };
      } else {
        skipped += resultItems[i].text.length;
        i++;
      }
    }
    return undefined;
  }

  private async doQueueAction(): Promise<boolean> {
    const currentQueueItem = this._queue.item;
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
    const queue = this._queue;
    const currentSentance = queue.item as Sentance;
    const currentLetter = currentSentance.text[queue.detailIndex];
    await this.maybeDoError(currentSentance, 0, queue);
    this.addLetter(currentLetter, currentSentance.className);
    this._lettersSinceLastError++;
    this.updateText();
    await wait(this.options.perLetterDelay, this._resetter);
    return queue.increment(currentSentance.text.length);
  }

  private async typeBackspace(): Promise<boolean> {
    const queue = this._queue;
    const currentBackspaceItem = queue.item as Backspace;
    if (currentBackspaceItem.length > 0) {
      this.deleteLetter();
      this.updateText();
      await wait(this.options.eraseDelay, this._resetter);
    }
    return queue.increment(currentBackspaceItem.length);
  }

  private async waitItem(): Promise<boolean> {
    const queue = this._queue;
    if (!this._fastForward) {
      const currentWaitItem = queue.item as Wait;
      await wait(currentWaitItem.delay, this._resetter);
    }
    return queue.increment();
  }

  private async maybeDoError(currentSentance: Sentance, currentWrongLettersCount: number, queue: Queue): Promise<void> {
    const errorProbability = this.calculateErrorProbability(currentWrongLettersCount);
    if (Math.random() > errorProbability) {
      return;
    }
    const intendedChar = currentSentance.text[queue.detailIndex + currentWrongLettersCount];
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
    this._lettersSinceLastError = 0;
    this.addLetter(nearbyChar, currentSentance.className);
    this.updateText();
    await wait(this.options.perLetterDelay, this._resetter);
    await this.maybeDoError(currentSentance, currentWrongLettersCount + 1, queue);
    this.deleteLetter();
    this.updateText();
    await wait(this.options.eraseDelay, this._resetter);
  }

  private calculateErrorProbability(currentWrongLettersCount: number): number {
    let errorProbability = 0;

    // The more correct letters we typed, the more likely we are to make an error
    errorProbability += (1 / 1000) * Math.pow(this._lettersSinceLastError, 2);

    // If we just made an error, the more likely we are to make another one
    if (currentWrongLettersCount === 1) {
      errorProbability += 0.4;
    } else if (currentWrongLettersCount === 2) {
      errorProbability += 0.2;
    }

    // Adjust based on the configured modifier
    return errorProbability * this.options.errorMultiplier;
  }

  private addLetter(letter: string, className?: string) {
    this.addLetterTo(letter, this._resultItems, className);
  }

  private addLetterTo(letter: string, result: ResultItem[], className?: string) {
    const lastResultItem = result[result.length - 1];
    if (lastResultItem && lastResultItem.className === className) {
      lastResultItem.text += letter;
    } else {
      result.push({
        text: letter,
        className
      });
    }
  }

  private deleteLetter() {
    this.deleteLetterFrom(this._resultItems);
  }

  private deleteLetterFrom(result: ResultItem[], length: number = 1) {
    let needsAnotherDelete = false;
    do {
      let deleteAmountForThisItem = length;
      const lastResultItem = result[result.length - 1];
      const maxDeletableAmount = lastResultItem.text.length;
      if (maxDeletableAmount < length) {
        deleteAmountForThisItem = maxDeletableAmount;
        length -= maxDeletableAmount;
        needsAnotherDelete = true;
      }
      if (lastResultItem) {
        lastResultItem.text = lastResultItem.text.slice(0, -deleteAmountForThisItem);
        if (!lastResultItem.text) {
          result.pop();
        }
      } else {
        if (this._resetter.isReset) {
          // might happen due to still running code during reset
          return;
        }
        throw new Error('Cannot delete letter from empty text');
      }
    } while (needsAnotherDelete);
  }

  private updateText() {
    if (this._resetter.isReset) {
      return;
    }
    const text = this.getCurrentText(this._resultItems);
    this.options.callback(text);
  }

  private getCurrentText(result: ResultItem[], includeClasses = true) {
    return result
      .map(item => {
        if (item.className && includeClasses) {
          return `<span class="${item.className}">${item.text}</span>`;
        } else {
          return item.text;
        }
      })
      .join('');
  }
}
