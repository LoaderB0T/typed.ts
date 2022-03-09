import { keyboards } from './data/keyboards';
import { ensureLocale } from './ensure-locale';
import { getRandomCharNear } from './random-char';
import { ErrorDelta } from './types/error-delta';
import {
  ConstructorTypingOptions,
  EraseTypingOptions,
  FullTypingOptions,
  PartialTypingOptions,
  StartTypingOptions
} from './types/options';
import { randomInt } from './utils/random-int';
import { wait } from './utils/wait';

export class Typed {
  private readonly _options: ConstructorTypingOptions;
  private _overrideOptions?: PartialTypingOptions;
  private _isRunning = false;
  private _letters: string[] = [];
  private _errorCount = 0;
  private _lettersSinceError = 0;
  private _lastErrorDelta: ErrorDelta = { row: 0, column: 0 };
  private _currentClassName: string | undefined = undefined;

  private text = '';
  private _fastForward = false;

  constructor(options: ConstructorTypingOptions) {
    this._options = options;
  }

  private get options(): FullTypingOptions {
    const ff = this._fastForward
      ? {
          minDelay: 10,
          maxDelay: 20,
          minEraseDelay: 10,
          maxEraseDelay: 20,
          errorRate: 0
        }
      : {};

    return {
      ...{
        minDelay: 40,
        maxDelay: 150,
        minEraseDelay: 150,
        maxEraseDelay: 250,
        initialDelay: 0,
        errorRate: 0.1,
        callback: () => {},
        locale: 'en'
      },
      ...this._options,
      ...(this._overrideOptions ?? {}),
      ...ff
    };
  }

  public async start(sentance: string, options: StartTypingOptions = {}, className?: string): Promise<void> {
    if (this._isRunning) {
      throw new Error('Typing is already running');
    }
    this._isRunning = true;
    this._overrideOptions = options;
    if (className !== this._currentClassName) {
      this._currentClassName = className;
      if (className) {
        this.options.callback(`${this.text}<span class="${className}"></span>`);
      }
    }
    this._letters = sentance.split('');
    await wait(this.options.initialDelay);
    await wait(randomInt(this.options.minDelay, this.options.maxDelay));
    await this.nextLetter();
    this._isRunning = false;
  }

  public reset() {
    if (this._isRunning) {
      throw new Error('Typing is still running');
    }
    this.fastForward(false);
    this.text = '';
    this.options.callback('');
  }

  private letterCanError(letter: string): boolean {
    return !(letter === ' ' || letter === '\n');
  }

  private async nextLetter(): Promise<void> {
    let letter = '';

    let probabilityForError = this.options.errorRate;
    if (probabilityForError > 0) {
      probabilityForError += (this._lettersSinceError - 10) * 0.01;
      if (this._errorCount === 1 && this._lettersSinceError === 0) {
        probabilityForError += 0.3;
      }
    }

    const isError = Math.random() < probabilityForError && this.letterCanError(this._letters[0]);
    if (isError) {
      letter = this.randomCharNear(this._letters[this._errorCount], this.options.locale);
      this._lettersSinceError = -1;
      this._errorCount++;
    } else {
      if (this._errorCount === 0) {
        letter = this._letters.shift() ?? '';
        if (!letter) {
          return;
        }
      }
    }
    if (!isError && this._errorCount > 0) {
      this.doSingleBackspace();
      this._errorCount--;
      this._lettersSinceError = 1;
      await wait(randomInt(this.options.minEraseDelay, this.options.maxEraseDelay));
    } else {
      this.addLetter(letter);
      this._lettersSinceError++;
      await wait(randomInt(this.options.minDelay, this.options.maxDelay));
    }
    return this.nextLetter();
  }

  private addLetter(letter: string): void {
    const oldValue = this.text;
    if (this._currentClassName) {
      const insertIndex = oldValue.lastIndexOf('</span>');
      const oldValuePrefix = oldValue.substring(0, insertIndex);
      const oldValueSuffix = oldValue.substring(insertIndex);
      this.text = oldValuePrefix + letter + oldValueSuffix;
    } else {
      this.text = oldValue + letter;
    }
    this.options.callback(this.text);
  }

  private doSingleBackspace(): void {
    const oldValue = this.text;
    if (this._currentClassName) {
      const insertIndex = oldValue.lastIndexOf('</span>');
      const oldValuePrefix = oldValue.substring(0, insertIndex);
      const oldValueSuffix = oldValue.substring(insertIndex);
      this.text = oldValuePrefix.substring(0, oldValuePrefix.length - 1) + oldValueSuffix;
    } else {
      this.text = oldValue.substring(0, oldValue.length - 1);
    }
    this.options.callback(this.text);
  }

  public async backspace(count: number, options: EraseTypingOptions = {}): Promise<void> {
    if (this._isRunning) {
      throw new Error('Typing is already running');
    }
    this._isRunning = true;
    this._overrideOptions = options;
    const oldValue = this.text;
    if (oldValue.length < count) {
      throw new Error('Cannot backspace more than the current text length');
    }
    for (let i = 0; i < count; i++) {
      await wait(randomInt(this.options.minEraseDelay, this.options.maxEraseDelay));
      this.doSingleBackspace();
    }
    this._isRunning = false;
  }

  public fastForward(enabled = true) {
    this._fastForward = enabled;
  }

  private randomCharNear(ch: string, locale: string): string {
    ensureLocale(locale);

    const randomChar = getRandomCharNear(ch, keyboards, locale, this._errorCount, this._lastErrorDelta);
    if (typeof randomChar === 'string') {
      return randomChar;
    }

    this._lastErrorDelta = { row: randomChar.row, column: randomChar.column };
    return randomChar.char;
  }
}
