import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { Typed } from '../../src/typed.js';
import { randomStub, resetRandomStub } from '../random-stub.js';

class StringSubject {
  private str = '';
  constructor(private cb: (str: string) => void) {}
  next(str: string) {
    this.str = str;
    this.cb(this.str);
  }
}

describe('Factory', () => {
  let result: string;
  let originalRandom: typeof Math.random;
  let cb: (text: string) => void = () => {};
  beforeEach(() => {
    originalRandom = Math.random;
    resetRandomStub();
    Math.random = () => randomStub();
  });
  afterEach(() => {
    Math.random = originalRandom;
  });

  test('simple', async () => {
    const typedFac = Typed.factory({
      setUp: () => new StringSubject(s => (result = s)),
      update: (updater, text) => {
        updater.next(text);
      },
    });

    const typed = typedFac();

    typed['_fastForwardOptions'].perLetterDelay = 0;
    typed['_fastForwardOptions'].eraseDelay = 1;
    typed['_fastForwardOptions'].errorDelay = 0;

    typed.type('Hello World');
    await typed.run();
    expect(result).toBe('Hello World');
  });

  test('named parts', async () => {
    const typedFac = Typed.factory({
      setUp: () => new StringSubject(s => (result = s)),
      update: (updater, text) => {
        updater.next(text.part1 + text.part2 + text.part3);
      },
      namedParts: ['part1', 'part2', 'part3'],
    });

    const typed = typedFac();

    typed['_fastForwardOptions'].perLetterDelay = 0;
    typed['_fastForwardOptions'].eraseDelay = 1;
    typed['_fastForwardOptions'].errorDelay = 0;

    typed.type('Hello', { namedPart: 'part1' });
    typed.type(' ', { namedPart: 'part2' });
    typed.type('World', { namedPart: 'part3' });
    await typed.run();
    expect(result).toBe('Hello World');
  });
});
