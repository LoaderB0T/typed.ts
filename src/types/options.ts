import { MinMax } from './min-max';

export type RequiredTypingOptions = {
  callback: (text: string) => void;
};

export type TypingOptions = {
  initialDelay: number | MinMax;
  perLetterDelay: number | MinMax;
  errorRate: number;
  locale: string;
};

export type EraseOptions = {
  initialDelay: number | MinMax;
  eraseDelay: number | MinMax;
};

export type FullTypingOptions = TypingOptions & RequiredTypingOptions & EraseOptions;
export type PartialTypingOptions = Partial<FullTypingOptions>;
export type ConstructorTypingOptions = Partial<TypingOptions> & RequiredTypingOptions & Partial<EraseOptions>;
export type SentanceTypingOptions = Partial<TypingOptions> & Partial<EraseOptions>;
export type EraseTypingOptions = Partial<EraseOptions>;
