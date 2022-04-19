import { keyboards } from '../data/keyboards.js';
import { ensureLocale } from './ensure-locale.js';
import { isSpecialChar } from './is-special-char.js';
import { randomInt } from './random-int.js';

export class RandomChars {
  public getRandomCharCloseToChar(intendedChar: string, locale: string): string | undefined {
    ensureLocale(locale);
    const keyboard = keyboards[locale];
    let isLowerKey = true;
    // Try to find the intended char in the lower case keyboard
    let rowIndex = keyboard.lower.findIndex(row => row.includes(intendedChar));
    if (rowIndex === -1) {
      // If not found, try to find it in the upper case keyboard
      isLowerKey = false;
      rowIndex = keyboard.upper.findIndex(row => row.includes(intendedChar));
    }
    if (rowIndex === -1) {
      // If not found, return undefined
      return undefined;
    }
    const usedKeyboard = isLowerKey ? keyboard.lower : keyboard.upper;
    const columnIndex = usedKeyboard[rowIndex].indexOf(intendedChar);

    const nearbyChars = this.findNearbyChars(intendedChar, rowIndex, columnIndex, usedKeyboard);

    return nearbyChars[randomInt(0, nearbyChars.length - 1)]; // if list is empty, returns undefined
  }

  private findNearbyChars(intendedChar: string, rowIndex: number, columnIndex: number, usedKeyboard: string[]): string[] {
    const threshold = Math.random() < 0.5 ? 2 : 1;

    const nearbyChars: string[] = [];

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
        if (row < 0 || row >= usedKeyboard.length || column < 0 || column >= usedKeyboard[row].length) {
          // skip out of bounds
          continue;
        }

        const potentialChar = usedKeyboard[row][column];
        if (isSpecialChar(potentialChar) !== isSpecialChar(intendedChar)) {
          // skip if the char is a special char and the intended char is not or vice versa
          continue;
        }
        nearbyChars.push(potentialChar);
      }
    }
    return nearbyChars;
  }
}
