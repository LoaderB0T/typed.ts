import { MinMax } from './min-max.js';

export type CustomUpdateSetup<Updater, NamedParts> = {
  setUp: () => Updater;
  update: (updater: Updater, text: NamedPartsToResultType<NamedParts>) => void;
  namedParts?: NamedParts;
};

// @internal
export type NamedPartString = { [part: string]: string };

export type NamedPartEntry<NamedParts> = NamedParts extends string[] ? NamedParts[number] : never;

export type NamedPartsToResultType<NamedParts> = NamedParts extends string[]
  ? NamedParts['length'] extends 0
    ? string
    : NamedParts extends never
      ? string
      : { [K in NamedPartEntry<NamedParts>]: string }
  : string;

export type RequiredTypingOptions<NamedParts> = {
  callback: (text: NamedPartsToResultType<NamedParts>) => void;
};

export type NamedPartsTypingOptions<NamedParts> = {
  namedParts?: NamedParts;
};

export type TypingOptions<
  NamedParts extends string[],
  NamedPart extends NamedPartEntry<NamedParts>,
> = {
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

  namedPart?: NamedPart;
};

export type EraseOptions<
  NamedParts extends string[],
  NamedPart extends NamedPartEntry<NamedParts>,
> = {
  /**
   * The delay between erasing characters. Can be a number or a MinMax object to randomize the delay.
   * @default { min: 150, max: 250 }
   */
  eraseDelay: number | MinMax;

  namedPart?: NamedPart;
};

export type WaitOptions<
  NamedParts extends string[],
  NamedPart extends NamedPartEntry<NamedParts>,
> = {
  namedPart?: NamedPart;
};

export type ClassNameOptions = {
  /**
   * The class name to add to the element while typing. More info [here](https://github.com/LoaderB0T/typed.ts#custom-classes).
   * @default undefined
   */
  className: string;
};

export type FullTypingOptions<
  NamedParts extends string[],
  NamedPart extends NamedPartEntry<NamedParts>,
> = TypingOptions<NamedParts, NamedPart> &
  RequiredTypingOptions<NamedParts> &
  EraseOptions<NamedParts, NamedPart> &
  WaitOptions<NamedParts, NamedPart> &
  NamedPartsTypingOptions<NamedParts> &
  NamedPartsTypingOptions<NamedParts>;

export type PartialTypingOptions<
  NamedParts extends string[],
  NamedPart extends NamedPartEntry<NamedParts>,
> = Partial<FullTypingOptions<NamedParts, NamedPart>>;

export type ConstructorTypingOptions<
  NamedParts extends string[],
  NamedPart extends NamedPartEntry<NamedParts>,
> = Partial<Omit<TypingOptions<NamedParts, never>, 'namedPart'>> &
  RequiredTypingOptions<NamedParts> &
  NamedPartsTypingOptions<NamedParts> &
  Partial<EraseOptions<NamedParts, NamedPart>>;

export type FactoryTypingOptions = Omit<
  ConstructorTypingOptions<string[], never>,
  'callback' | 'namedParts' | 'namedPart'
>;

export type SentanceTypingOptions<
  NamedParts extends string[],
  NamedPart extends NamedPartEntry<NamedParts>,
> = Partial<TypingOptions<NamedParts, NamedPart>> &
  Partial<EraseOptions<NamedParts, NamedPart>> &
  Partial<ClassNameOptions>;

export type EraseTypingOptions<
  NamedParts extends string[],
  NamedPart extends NamedPartEntry<NamedParts>,
> = Partial<EraseOptions<NamedParts, NamedPart>>;

export type WaitTypingOptions<
  NamedParts extends string[],
  NamedPart extends NamedPartEntry<NamedParts>,
> = Partial<WaitOptions<NamedParts, NamedPart>>;
