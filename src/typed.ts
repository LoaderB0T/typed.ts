import { keyboards } from './data/keyboards.js';
import { RandomChars } from './utils/random-char.js';
import { Resetter } from './utils/resetter.js';
import { Keyboard } from './types/keyboard.js';
import {
  ConstructorTypingOptions,
  CustomUpdateSetup,
  EraseTypingOptions,
  FactoryTypingOptions,
  FullTypingOptions,
  NamedPartEntry,
  NamedPartsToResultType,
  NamedPartString,
  PartialTypingOptions,
  SentanceTypingOptions,
  WaitTypingOptions,
} from './types/options.js';
import { Backspace, QueueItem, Sentance, Wait } from './types/queue-item.js';
import { ResultItem } from './types/result-item.js';
import { isSpecialChar } from './utils/is-special-char.js';
import { wait } from './utils/wait.js';
import { Letter } from './types/letter.js';
import { Queue } from './types/queue.js';
import { DEFAULT_PART_NAME } from './utils/default-part-name.js';
import { QueueManager } from './types/queue-manager.js';

export class Typed<Updater = never, const NamedParts extends string[] = never> {
  private readonly _setupUpdater?: Updater;

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
  public static factory<Updater, const NamedParts extends string[] = never>(
    customOptions: CustomUpdateSetup<Updater, NamedParts>
  ) {
    return (options?: FactoryTypingOptions) =>
      new Typed<Updater, NamedParts>(options ?? {}, customOptions);
  }

  /**
   * Returns the text data structure that was configured using the factory function.
   * @throws If the factory function was not used to create this instance.
   */
  public get text(): Updater {
    if (!this._setupUpdater) {
      throw new Error('To use this property, use the Typed.factory() function.');
    }
    return this._setupUpdater;
  }

  private readonly _resetter = new Resetter();
  private readonly _randomChars = new RandomChars();
  private readonly _options: ConstructorTypingOptions<NamedParts, never>;
  private readonly _typeQueue: QueueManager<NamedParts>;
  private readonly _ffQueue: QueueManager<NamedParts>;
  private _queue: QueueManager<NamedParts>;
  private _resultItems: ResultItem[] = [];
  private _fastForward: boolean = false;
  private _lettersSinceLastError: number = 0;
  private readonly _endResultItems: ResultItem[] = [];

  private readonly _fastForwardOptions: PartialTypingOptions<NamedParts, never> = {
    perLetterDelay: { min: 5, max: 20 },
    eraseDelay: { min: 5, max: 10 },
    errorMultiplier: 0,
  };

  constructor(options: ConstructorTypingOptions<NamedParts, never>);
  // @internal
  constructor(options: FactoryTypingOptions, customSetup: CustomUpdateSetup<Updater, NamedParts>);
  constructor(
    options: ConstructorTypingOptions<NamedParts, never>,
    customSetup?: CustomUpdateSetup<Updater, NamedParts>
  ) {
    this._options = options;

    if (customSetup) {
      const setupUpdater = customSetup.setUp();
      this._setupUpdater = setupUpdater;
      options.callback = (text: NamedPartsToResultType<NamedParts>) =>
        customSetup?.update(setupUpdater, text);
      if (customSetup.namedParts) {
        this._options.namedParts = customSetup.namedParts;
      }
    }

    this._typeQueue = new QueueManager(
      'type',
      this._resetter,
      this._options.namedParts ?? [DEFAULT_PART_NAME]
    ) as QueueManager<NamedParts>;
    this._ffQueue = new QueueManager(
      'ff',
      this._resetter,
      this._options.namedParts ?? [DEFAULT_PART_NAME]
    ) as QueueManager<NamedParts>;
    this._queue = this._typeQueue;
  }

  private getOptions(partName: string | false): FullTypingOptions<NamedParts, never> {
    const defaultOptions: FullTypingOptions<NamedParts, never> = {
      callback: () => {
        // do nothing
      },
      eraseDelay: { min: 150, max: 250 },
      errorDelay: { min: 50, max: 100 },
      errorMultiplier: 1,
      noSpecialCharErrors: false,
      locale: 'en',
      perLetterDelay: { min: 40, max: 150 },
      namedParts: [DEFAULT_PART_NAME] as unknown as NamedParts,
    };

    const ffOptions: PartialTypingOptions<NamedParts, never> = this._fastForward
      ? this._fastForwardOptions
      : {};

    const currentQueueItemOptions = (partName && this._queue.get(partName).item?.options) || {};

    return {
      ...defaultOptions,
      ...this._options,
      ...currentQueueItemOptions,
      ...ffOptions,
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
  public type<NamedPart extends NamedPartEntry<NamedParts>>(
    sentance: string,
    options?: SentanceTypingOptions<NamedParts, NamedPart>
  ): Typed<Updater, NamedParts> {
    const partName = options?.namedPart ?? DEFAULT_PART_NAME;

    this._typeQueue.add({
      type: 'sentance',
      partName,
      text: sentance,
      options,
      className: options?.className,
    });
    this.addLetterTo(sentance, this._endResultItems, partName, options?.className);
    return this;
  }

  /**
   * Adds the deletion of a number of letters to the end of the queue.
   * @param length The number of letters to delete.
   * @param options The options for erasing.
   * @returns The Typed instance.
   */
  public backspace<NamedPart extends NamedPartEntry<NamedParts>>(
    length: number,
    options?: EraseTypingOptions<NamedParts, NamedPart>
  ): Typed<Updater, NamedParts> {
    const partName = options?.namedPart ?? DEFAULT_PART_NAME;
    this._typeQueue.add({
      type: 'backspace',
      partName,
      length,
      options,
    });
    this.deleteLetterFrom(this._endResultItems, partName, length);
    return this;
  }

  /**
   * Adds a delay to the end of the queue.
   * @param delay The delay in milliseconds.
   * @returns The Typed instance.
   */
  public wait<NamedPart extends NamedPartEntry<NamedParts>>(
    delay: number,
    options?: WaitTypingOptions<NamedParts, NamedPart>
  ): Typed<Updater, NamedParts> {
    this._typeQueue.add({
      type: 'wait',
      partName: options?.namedPart ?? DEFAULT_PART_NAME,
      delay,
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
    await this.doQueueAction();
  }

  /**
   * Fast forwards the current animation. Skipping all delays and only typing characters that are relevant for the end result.
   * @returns A promise that resolves when the animation has finished.
   */
  public fastForward() {
    if (this._fastForward) {
      return;
    }

    const namedParts = this._options.namedParts?.length
      ? this._options.namedParts
      : [DEFAULT_PART_NAME];

    this._ffQueue.clear();
    this._queue = this._ffQueue;

    namedParts.forEach(partName => this.ff(partName));

    this._fastForward = true;
    this._resetter.singleReset();
  }

  private ff(partName: string) {
    const resultItemsForPart = this._resultItems.filter(item => item.partName === partName);
    const endResultItemsForPart = this._endResultItems.filter(item => item.partName === partName);

    let matchingLetterCount = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const currentTextAtIndex = this.getTextAtIndex(resultItemsForPart, matchingLetterCount);
      const endResultTextAtIndex = this.getTextAtIndex(endResultItemsForPart, matchingLetterCount);
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
    const currentTextWithoutClasses = this.getPartText(resultItemsForPart, false);
    const currentTextLength = currentTextWithoutClasses.length;
    const neededBackspaces = currentTextLength - matchingLetterCount;
    if (neededBackspaces) {
      this._ffQueue.add({
        type: 'backspace',
        partName,
        length: neededBackspaces,
      });
    }
    const resultTextLength = this.getPartText(endResultItemsForPart, false).length;
    for (let i = 0; i < resultTextLength - matchingLetterCount; i++) {
      const letter = this.getTextAtIndex(endResultItemsForPart, i + matchingLetterCount)!;
      this._ffQueue.add({
        type: 'sentance',
        partName,
        text: letter.letter,
        options: undefined,
        className: letter.className,
      });
    }
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

  private async doSingleAction(partName: string, item: QueueItem): Promise<boolean> {
    switch (item.type) {
      case 'sentance':
        return this.typeLetter(partName);
      case 'backspace':
        return this.typeBackspace(partName);
      case 'wait':
        return this.waitItem(partName);
      default:
        throw new Error('Unknown queue item type');
    }
  }

  private async doQueueActionForPart(partName: string): Promise<boolean> {
    let currentQueueItem = this._queue.get(partName).item;

    while (currentQueueItem) {
      const res = await this.doSingleAction(partName, currentQueueItem);

      if (!res) {
        return false;
      }
      currentQueueItem = this._queue.get(partName).item;
    }

    return true;
  }

  private async doQueueAction(): Promise<boolean> {
    const { promise, resolve } = Promise.withResolvers<boolean>();

    const namedParts = this.getOptions(false).namedParts;

    const promises = namedParts.map(part => this.doQueueActionForPart(part));

    Promise.all(promises).then(() => {
      resolve(true);
    });

    return promise;
  }

  private async typeLetter(partName: string): Promise<boolean> {
    const queue = this._queue.get(partName);
    const currentSentance = queue.item as Sentance;
    const currentLetter = currentSentance.text[queue.detailIndex];
    await this.maybeDoError(currentSentance, 0, currentSentance.partName, queue);
    if (queue === this._queue.get(partName)) {
      this.addLetter(currentLetter, currentSentance.partName, currentSentance.className);
      this._lettersSinceLastError++;
      this.updateText();
      await wait(this.getOptions(partName).perLetterDelay, this._resetter);
    }
    return this.incrementQueue(partName, queue, currentSentance.text.length);
  }

  private async typeBackspace(partName: string): Promise<boolean> {
    const queue = this._queue.get(partName);
    const currentBackspaceItem = queue.item as Backspace;
    if (currentBackspaceItem.length > 0) {
      this.deleteLetter(currentBackspaceItem.partName);
      this.updateText();
      await wait(this.getOptions(partName).eraseDelay, this._resetter);
    }
    return this.incrementQueue(partName, queue, currentBackspaceItem.length);
  }

  private async waitItem(partName: string): Promise<boolean> {
    const queue = this._queue.get(partName);
    if (!this._fastForward) {
      const currentWaitItem = queue.item as Wait;
      await wait(currentWaitItem.delay, this._resetter);
    }
    return this.incrementQueue(partName, queue);
  }

  private incrementQueue(partName: string, queue: Queue, maxDetailIndex?: number) {
    if (queue === this._queue.get(partName)) {
      return queue.increment(maxDetailIndex);
    } else {
      return true;
    }
  }

  private async shouldError(
    partName: string,
    currentWrongLettersCount: number,
    intendedChar: string,
    wasFF: boolean,
    nearbyChar?: string
  ): Promise<boolean> {
    const errorProbability = this.calculateErrorProbability(partName, currentWrongLettersCount);
    let willError = true;
    if (Math.random() > errorProbability) {
      willError = false;
    }
    if (!intendedChar) {
      willError = false;
    }
    if (this.getOptions(partName).noSpecialCharErrors && isSpecialChar(intendedChar)) {
      willError = false;
    }
    if (!nearbyChar) {
      willError = false;
    }
    if (!willError || !nearbyChar) {
      if (currentWrongLettersCount > 0) {
        if (!this._fastForward || wasFF) {
          await wait(this.getOptions(partName).errorDelay, this._resetter);
        }
      }
    }
    return willError;
  }

  private async maybeDoError(
    currentSentance: Sentance,
    currentWrongLettersCount: number,
    partName: string,
    queue: Queue
  ): Promise<void> {
    const wasFF = this._fastForward;
    const intendedChar = currentSentance.text[queue.detailIndex + currentWrongLettersCount];
    const nearbyChar = this._randomChars.getRandomCharCloseToChar(
      intendedChar,
      this.getOptions(partName).locale
    );

    const shouldError = await this.shouldError(
      partName,
      currentWrongLettersCount,
      intendedChar,
      wasFF,
      nearbyChar
    );
    if (!shouldError || !nearbyChar) {
      return;
    }

    this._lettersSinceLastError = 0;
    this.addLetter(nearbyChar, partName, currentSentance.className);
    this.updateText();
    await wait(this.getOptions(partName).perLetterDelay, this._resetter);
    if (!this._fastForward || wasFF) {
      await this.maybeDoError(currentSentance, currentWrongLettersCount + 1, partName, queue);
    }
    if (!this._fastForward || wasFF) {
      this.deleteLetter(partName);
      this.updateText();
    }
    if (!this._fastForward || wasFF) {
      await wait(this.getOptions(partName).eraseDelay, this._resetter);
    }
  }

  private calculateErrorProbability(partName: string, currentWrongLettersCount: number): number {
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
    return errorProbability * this.getOptions(partName).errorMultiplier;
  }

  private addLetter(letter: string, partName: string, className?: string) {
    this.addLetterTo(letter, this._resultItems, partName, className);
  }

  private addLetterTo(letter: string, result: ResultItem[], partName: string, className?: string) {
    const lastResultItem = result[result.length - 1];
    if (
      lastResultItem &&
      lastResultItem.className === className &&
      lastResultItem.partName === partName
    ) {
      lastResultItem.text += letter;
    } else {
      result.push({
        text: letter,
        className,
        partName,
      });
    }
  }

  private deleteLetter(partName: string) {
    this.deleteLetterFrom(this._resultItems, partName);
  }

  private deleteLetterFrom(result: ResultItem[], partName: string, length: number = 1) {
    let needsAnotherDelete = false;

    const filteredResult = result.filter(item => item.partName === partName);

    do {
      let deleteAmountForThisItem = length;
      const lastResultItem = filteredResult[filteredResult.length - 1] as ResultItem | undefined;

      if (!lastResultItem) {
        if (this._resetter.isReset) {
          // might happen due to still running code during reset
          return;
        }
        throw new Error('Cannot delete letter from empty text');
      }

      const maxDeletableAmount = lastResultItem?.text.length ?? 0;
      if (maxDeletableAmount < length) {
        deleteAmountForThisItem = maxDeletableAmount;
        length -= maxDeletableAmount;
        needsAnotherDelete = true;
      }

      lastResultItem.text = lastResultItem.text.slice(0, -deleteAmountForThisItem);
      if (!lastResultItem.text) {
        filteredResult.pop();
        const indexInResult = result.indexOf(lastResultItem);
        if (indexInResult !== -1) {
          result.splice(indexInResult, 1);
        }
      }
    } while (needsAnotherDelete);
  }

  private updateText() {
    if (this._resetter.isReset) {
      return;
    }
    const text = this.getCurrentText(this._resultItems);

    if (!this._options.namedParts?.length) {
      this._options.callback(text[DEFAULT_PART_NAME] as NamedPartsToResultType<NamedParts>);
    } else {
      this._options.callback(text as NamedPartsToResultType<NamedParts>);
    }
  }

  private getPartText(part: ResultItem[], includeClasses = true): string {
    return part
      .map(item => {
        if (item.className && includeClasses) {
          return `<span class="${item.className}">${item.text}</span>`;
        } else {
          return item.text;
        }
      })
      .join('');
  }

  private getCurrentText(result: ResultItem[], includeClasses = true): NamedPartString {
    const parts = result.reduce(
      (x, y) => {
        (x[y.partName] = x[y.partName] || []).push(y);
        return x;
      },
      {} as { [key: string]: ResultItem[] }
    );

    const resultText: NamedPartString = {};

    for (const [partName, part] of Object.entries(parts)) {
      if (!part) {
        throw new Error(`Part ${partName} is empty`);
      }
      resultText[partName] = this.getPartText(part, includeClasses);
    }

    for (const part of this._options.namedParts ?? []) {
      if (!resultText[part]) {
        resultText[part] = '';
      }
    }

    return resultText;
  }
}
