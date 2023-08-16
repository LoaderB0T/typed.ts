import { keyboards } from './data/keyboards.js';
import { RandomChars } from './utils/random-char.js';
import { Resetter } from './utils/resetter.js';
import { Keyboard } from './types/keyboard.js';
import {
  ConstructorTypingOptions,
  CustomUpdateSetup,
  EraseTypingOptions,
  FullTypingOptions,
  PartialTypingOptions,
  SentanceTypingOptions
} from './types/options';
import { Backspace, Sentance, Wait } from './types/queue-item.js';
import { ResultItem } from './types/result-item.js';
import { isSpecialChar } from './utils/is-special-char.js';
import { wait } from './utils/wait.js';
import { Letter } from './types/letter.js';
import { Queue } from './types/queue.js';

export class Typed<T = never> {
  private readonly setupUpdater?: T;

  /**
   * Creates a factory function that can be used to create Typed instances with a custom setup.
   * This is useful if you do not want to rely on a callback function to update the text, but rather on a different data structure.
   * @param customOptions The custom setup options.
   * @returns A factory function that can be used to create Typed instances with a custom setup.
   * @example
   * ```ts
   * const typedFactory = Typed.factory({
   *   setUp: () => new BehaviorSubject(''),
   *   update: (textSubj, text) => textSubj.next(text)
   * });
   * // Create a new Typed instance with the custom setup
   * const typed = typedFactory({
   *  // some options
   * });
   * // access the text BehaviorSubject
   * typed.text.subscribe(text => console.log(text));
   * ```
   */
  public static factory<T>(customOptions: CustomUpdateSetup<T>) {
    return (options: Omit<ConstructorTypingOptions, 'callback'>) => new Typed<T>(options, customOptions);
  }

  /**
   * Returns the text data structure that was configured using the factory function.
   * @throws If the factory function was not used to create this instance.
   */
  public get text(): T {
    if (!this.setupUpdater) {
      throw new Error('To use this property, use the Typed.factory() function.');
    }
    return this.setupUpdater;
  }

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

  private readonly _fastForwardOptions: PartialTypingOptions = {
    perLetterDelay: { min: 10, max: 20 },
    eraseDelay: { min: 10, max: 20 },
    errorDelay: { min: 100, max: 200 }
  };

  constructor(options: ConstructorTypingOptions);
  // @internal
  constructor(options: Omit<ConstructorTypingOptions, 'callback'>, customSetup: CustomUpdateSetup<T>);
  constructor(options: ConstructorTypingOptions, customSetup?: CustomUpdateSetup<T>) {
    if (customSetup) {
      const setupUpdater = customSetup.setUp();
      this.setupUpdater = setupUpdater;
      options.callback = (text: string) => customSetup?.update(setupUpdater, text);
    }
    this._options = options;
  }

  private get options(): FullTypingOptions {
    const defaultOptions: FullTypingOptions = {
      callback: () => {
        // do nothing
      },
      eraseDelay: { min: 150, max: 250 },
      errorDelay: { min: 50, max: 100 },
      errorMultiplier: 1,
      noSpecialCharErrors: false,
      locale: 'en',
      perLetterDelay: { min: 40, max: 150 }
    };

    const ffOptions: PartialTypingOptions = this._fastForward ? this._fastForwardOptions : {};

    const currentQueueItemOptions = this._queue.item?.options ?? {};

    return {
      ...defaultOptions,
      ...this._options,
      ...currentQueueItemOptions,
      ...ffOptions
    };
  }

  /**
   * Adds a new keyboard layout to the list of available keyboards.
   * @param locale The locale of the keyboard layout.
   * @param keyboard The keyboard layout.
   * @example
   * ```
   * typed.addKeyboard('de', {
   *   lower: ['1234567890ß', 'qwertzuiopü+', 'asdfghjklöä#', 'yxcvbnm,.-', ' '],
   *   upper: ['!"§$%&/()=?', 'QWERTZUIOPÜ*', "ASDFGHJKLÖÄ'", 'YXCVBNM;:_', ' ']
   * });
   * ```
   * More info [here](https://github.com/LoaderB0T/typed.ts#Add-your-own-keyboard-layouts)
   */
  public addKeyboard(locale: string, keyboard: Keyboard) {
    keyboards[locale] = keyboard;
  }

  /**
   * Stops the current animation.
   * @param clearTexts Whether to clear the texts or not.
   * @returns A promise that resolves when the animation has stopped and can be started again.
   */
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

  /**
   * Adds a string that will be typed out to the end of the queue.
   * @param sentance The string to type out.
   * @param options The options for typing.
   * @returns The Typed instance.
   */
  public type(sentance: string, options?: SentanceTypingOptions): Typed<T> {
    this._typeQueue.add({
      type: 'sentance',
      text: sentance,
      options,
      className: options?.className
    });
    this.addLetterTo(sentance, this._endResultItems, options?.className);
    return this;
  }

  /**
   * Adds the deletion of a number of letters to the end of the queue.
   * @param length The number of letters to delete.
   * @param options The options for erasing.
   * @returns The Typed instance.
   */
  public backspace(length: number, options?: EraseTypingOptions): Typed<T> {
    this._typeQueue.add({
      type: 'backspace',
      length,
      options
    });
    this.deleteLetterFrom(this._endResultItems, length);
    return this;
  }

  /**
   * Adds a delay to the end of the queue.
   * @param delay The delay in milliseconds.
   * @returns The Typed instance.
   */
  public wait(delay: number): Typed<T> {
    this._typeQueue.add({
      type: 'wait',
      delay
    });
    return this;
  }

  /**
   * Runs the configured animation (queue).
   * @returns A promise that resolves when the animation has finished.
   */
  public async run(): Promise<void> {
    this._queue = this._typeQueue;
    this._typeQueue.resetIndices();
    this._resultItems = [];
    while (await this.doQueueAction()) {
      // do nothing
    }
  }

  /**
   * Fast forwards the current animation. Skipping all delays and only typing characters that are relevant for the end result.
   * @returns A promise that resolves when the animation has finished.
   */
  public fastForward() {
    if (this._fastForward) {
      return;
    }
    let matchingLetterCount = 0;
    // eslint-disable-next-line no-constant-condition
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
    if (neededBackspaces) {
      this._ffQueue.add({
        type: 'backspace',
        length: neededBackspaces
      });
    }
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

    this._fastForward = true;
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
    if (queue === this._queue) {
      this.addLetter(currentLetter, currentSentance.className);
      this._lettersSinceLastError++;
      this.updateText();
      await wait(this.options.perLetterDelay, this._resetter);
    }
    return this.incrementQueue(queue, currentSentance.text.length);
  }

  private async typeBackspace(): Promise<boolean> {
    const queue = this._queue;
    const currentBackspaceItem = queue.item as Backspace;
    if (currentBackspaceItem.length > 0) {
      this.deleteLetter();
      this.updateText();
      await wait(this.options.eraseDelay, this._resetter);
    }
    return this.incrementQueue(queue, currentBackspaceItem.length);
  }

  private async waitItem(): Promise<boolean> {
    const queue = this._queue;
    if (!this._fastForward) {
      const currentWaitItem = queue.item as Wait;
      await wait(currentWaitItem.delay, this._resetter);
    }
    return this.incrementQueue(queue);
  }

  private incrementQueue(queue: Queue, maxDetailIndex?: number) {
    if (queue === this._queue) {
      return queue.increment(maxDetailIndex);
    } else {
      return this.doQueueAction();
    }
  }

  private async shouldError(
    currentWrongLettersCount: number,
    intendedChar: string,
    wasFF: boolean,
    nearbyChar?: string
  ): Promise<boolean> {
    const errorProbability = this.calculateErrorProbability(currentWrongLettersCount);
    let willError = true;
    if (Math.random() > errorProbability) {
      willError = false;
    }
    if (!intendedChar) {
      willError = false;
    }
    if (this.options.noSpecialCharErrors && isSpecialChar(intendedChar)) {
      willError = false;
    }
    if (!nearbyChar) {
      willError = false;
    }
    if (!willError || !nearbyChar) {
      if (currentWrongLettersCount > 0) {
        if (!this._fastForward || wasFF) {
          await wait(this.options.errorDelay, this._resetter);
        }
      }
    }
    return willError;
  }

  private async maybeDoError(currentSentance: Sentance, currentWrongLettersCount: number, queue: Queue): Promise<void> {
    const wasFF = this._fastForward;
    const intendedChar = currentSentance.text[queue.detailIndex + currentWrongLettersCount];
    const nearbyChar = this._randomChars.getRandomCharCloseToChar(intendedChar, this.options.locale);

    const shouldError = await this.shouldError(currentWrongLettersCount, intendedChar, wasFF, nearbyChar);
    if (!shouldError || !nearbyChar) {
      return;
    }

    this._lettersSinceLastError = 0;
    this.addLetter(nearbyChar, currentSentance.className);
    this.updateText();
    await wait(this.options.perLetterDelay, this._resetter);
    if (!this._fastForward || wasFF) {
      await this.maybeDoError(currentSentance, currentWrongLettersCount + 1, queue);
    }
    if (!this._fastForward || wasFF) {
      this.deleteLetter();
      this.updateText();
    }
    if (!this._fastForward || wasFF) {
      await wait(this.options.eraseDelay, this._resetter);
    }
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
