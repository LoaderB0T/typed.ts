export type Keyboards = {
  [locale: string]: Keyboard;
};

export type Keyboard = {
  /**
   * The lower case characters of the keyboard. One array element per row, starting from the top row.
   */
  lower: string[];
  /**
   * The upper case characters of the keyboard. One array element per row, starting from the top row.
   */
  upper: string[];
};
