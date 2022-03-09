export type TypingOptions = {
  minDelay: number;
  maxDelay: number;
  errorRate: number;
  locale: string;
};

export type RequiredTypingOptions = {
  callback: (text: string) => void;
};

export type EraseOptions = {
  minEraseDelay: number;
  maxEraseDelay: number;
  initialDelay: number;
};

export type FullTypingOptions = TypingOptions & RequiredTypingOptions & EraseOptions;
export type PartialTypingOptions = Partial<FullTypingOptions>;
export type ConstructorTypingOptions = Partial<TypingOptions> & RequiredTypingOptions & Partial<EraseOptions>;
export type StartTypingOptions = Partial<TypingOptions> & Partial<EraseOptions>;
export type EraseTypingOptions = Partial<EraseOptions>;
