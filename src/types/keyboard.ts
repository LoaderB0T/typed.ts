export type Keyboards = {
  [locale: string]: Keyboard;
};

export type Keyboard = {
  lower: string[];
  upper: string[];
};
