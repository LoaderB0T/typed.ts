import { MinMax } from './min-max.js';

export type CustomUpdateSetup<T> = {
  setUp: () => T;
  update: (updater: T, text: string) => void;
};

export type RequiredTypingOptions = {
  callback: (text: string) => void;
};

export type TypingOptions = {
  /**
   * The delay between typing characters. Can be a number or a MinMax object to randomize the delay.
   * @default { min: 40, max: 150 }
   */
  perLetterDelay: number | MinMax;
  /**
   * The delay between making errors and correcting them. Can be a number or a MinMax object to randomize the delay.
   * @default { min: 50, max: 100 }
   */
  errorDelay: number | MinMax;
  /**
   * The multiplier for how often an error will be made. The value ranges from 0 to n. 0 means no errors, 1 means normal errors, 2 means twice as many errors, etc. Can be a decimal number.
   * @default 1
   */
  errorMultiplier: number;
  /**
   * If set to true, errors will only be made on letters and numbers. Special characters will always be typed correctly.
   * @default false
   */
  noSpecialCharErrors: boolean;
  /**
   * The locale to use for the keyboard layout. Currently only `en` and `de` are supported, but you can [add your own layouts](https://github.com/LoaderB0T/typed.ts#add-your-own-keyboard-layouts).
   * @default 'en'
   */
  locale: string;
};

export type EraseOptions = {
  /**
   * The delay between erasing characters. Can be a number or a MinMax object to randomize the delay.
   * @default { min: 150, max: 250 }
   */
  eraseDelay: number | MinMax;
};

export type ClassNameOptions = {
  /**
   * The class name to add to the element while typing. More info [here](https://github.com/LoaderB0T/typed.ts#custom-classes).
   * @default undefined
   */
  className: string;
};

export type FullTypingOptions = TypingOptions & RequiredTypingOptions & EraseOptions;
export type PartialTypingOptions = Partial<FullTypingOptions>;
export type ConstructorTypingOptions = Partial<TypingOptions> & RequiredTypingOptions & Partial<EraseOptions>;
export type SentanceTypingOptions = Partial<TypingOptions> & Partial<EraseOptions> & Partial<ClassNameOptions>;
export type EraseTypingOptions = Partial<EraseOptions>;
