import { keyboards } from './data/keyboards';
import { ensureLocale } from './ensure-locale';
import { CharWithPos } from './types/char-with-pow';
import { ErrorDelta } from './types/error-delta';
import { Keyboards } from './types/keyboard';
import { randomInt } from './utils/random-int';

export const getRandomCharNear = (
  char: string,
  keyboards: Keyboards,
  locale: string,
  errorCount: number,
  lastErrorDelta: ErrorDelta
): CharWithPos | string => {
  const keyboard = keyboards[locale];
  let isLower = true;
  let rowIndex = keyboard.lower.findIndex(row => row.includes(char));
  if (rowIndex === -1) {
    isLower = false;
    rowIndex = keyboard.upper.findIndex(row => row.includes(char));
  }
  if (rowIndex === -1) {
    return randomChar(locale, isLower);
  }
  const usedKeyboard = isLower ? keyboard.lower : keyboard.upper;
  const columnIndex = usedKeyboard[rowIndex].indexOf(char);

  if (errorCount > 0) {
    const { row, column } = lastErrorDelta;
    const newRow = rowIndex + row;
    const newColumn = columnIndex + column;
    if (newRow >= 0 && newRow < usedKeyboard.length && newColumn >= 0 && newColumn < usedKeyboard[newRow].length) {
      return usedKeyboard[newRow][newColumn];
    }
  }

  const threshold = 2;

  const nearbyChars: CharWithPos[] = [];

  for (let r = -1; r <= 1; r++) {
    for (let c = -2; c <= 2; c++) {
      const row = rowIndex + r;
      const column = columnIndex + c;

      if ((r === 0 && c === 0) || Math.abs(r) + Math.abs(c) > threshold) {
        // skip same char and too far away
        continue;
      }
      if (row === 0 && rowIndex !== 0) {
        // We do not want to accidentally switch to the number row, because that is unlikely I think
        continue;
      }
      if (row >= 0 && row < usedKeyboard.length && column >= 0 && column < usedKeyboard[row].length) {
        nearbyChars.push({ row: r, column: c, char: usedKeyboard[row][column] });
      }
    }
  }
  return nearbyChars[randomInt(0, nearbyChars.length - 1)];
};

export const randomChar = (locale: string, lower: boolean) => {
  ensureLocale(locale);
  const keyboard = keyboards[locale];
  const usedKeyboard = lower ? keyboard.lower : keyboard.upper;
  const chars = usedKeyboard.join('');
  return chars.charAt(randomInt(0, chars.length - 1));
};
