import { MinMax } from './min-max.js';

export type RequiredTypingOptions = {
  callback: (text: string) => void;
};

export type TypingOptions = {
  perLetterDelay: number | MinMax;
  errorDelay: number | MinMax;
  errorMultiplier: number;
  noSpecialCharErrors: boolean;
  locale: string;
};

export type EraseOptions = {
  eraseDelay: number | MinMax;
};

export type ClassNameOptions = {
  className: string;
};

export type FullTypingOptions = TypingOptions & RequiredTypingOptions & EraseOptions;
export type PartialTypingOptions = Partial<FullTypingOptions>;
export type ConstructorTypingOptions = Partial<TypingOptions> & RequiredTypingOptions & Partial<EraseOptions>;
export type SentanceTypingOptions = Partial<TypingOptions> & Partial<EraseOptions> & Partial<ClassNameOptions>;
export type EraseTypingOptions = Partial<EraseOptions>;
