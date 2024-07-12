import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { Typed } from '../../src/typed.js';
import { randomStub, resetRandomStub } from '../random-stub.js';
import { DEFAULT_PART_NAME } from '../../src/utils/default-part-name.js';

describe('UnitTest', () => {
  let typed: Typed;
  let result: string;
  let originalRandom: typeof Math.random;
  let cb: (text: string) => void = () => {};
  beforeEach(() => {
    originalRandom = Math.random;
    resetRandomStub();
    Math.random = () => randomStub();
    typed = new Typed({
      callback: str => {
        result = str;
        cb(str);
      },
      errorDelay: 0,
      eraseDelay: 0,
      perLetterDelay: 1,
    });
    typed['_fastForwardOptions'].perLetterDelay = 0;
    typed['_fastForwardOptions'].eraseDelay = 1;
    typed['_fastForwardOptions'].errorDelay = 0;
  });
  afterEach(() => {
    Math.random = originalRandom;
  });

  test('manual ff testing', async () => {
    typed.type('hello');
    typed.fastForward();
    // prettier-ignore
    expect(typed['_ffQueue']['_queues'].get(DEFAULT_PART_NAME as never)!['_items']).toEqual([
      { type: 'sentance', text: 'h', className: undefined, options: undefined, partName: DEFAULT_PART_NAME },
      { type: 'sentance', text: 'e', className: undefined, options: undefined, partName: DEFAULT_PART_NAME },
      { type: 'sentance', text: 'l', className: undefined, options: undefined, partName: DEFAULT_PART_NAME },
      { type: 'sentance', text: 'l', className: undefined, options: undefined, partName: DEFAULT_PART_NAME },
      { type: 'sentance', text: 'o', className: undefined, options: undefined, partName: DEFAULT_PART_NAME },
    ]);
  });

  test('manual named parts ff testing', async () => {
    const typed2 = new Typed({
      callback: str => {},
      errorDelay: 0,
      eraseDelay: 0,
      perLetterDelay: 1,
      namedParts: ['part1', 'part2', 'part3'],
    });
    typed2.type('hello', { namedPart: 'part1' });
    typed2.type('world', { namedPart: 'part2' });
    typed2.type('!', { namedPart: 'part3' });
    typed2.fastForward();
    expect(typed2['_ffQueue']['_queues'].get('part1')!['_items']).toEqual([
      { type: 'sentance', text: 'h', className: undefined, options: undefined, partName: 'part1' },
      { type: 'sentance', text: 'e', className: undefined, options: undefined, partName: 'part1' },
      { type: 'sentance', text: 'l', className: undefined, options: undefined, partName: 'part1' },
      { type: 'sentance', text: 'l', className: undefined, options: undefined, partName: 'part1' },
      { type: 'sentance', text: 'o', className: undefined, options: undefined, partName: 'part1' },
    ]);
    expect(typed2['_ffQueue']['_queues'].get('part2')!['_items']).toEqual([
      { type: 'sentance', text: 'w', className: undefined, options: undefined, partName: 'part2' },
      { type: 'sentance', text: 'o', className: undefined, options: undefined, partName: 'part2' },
      { type: 'sentance', text: 'r', className: undefined, options: undefined, partName: 'part2' },
      { type: 'sentance', text: 'l', className: undefined, options: undefined, partName: 'part2' },
      { type: 'sentance', text: 'd', className: undefined, options: undefined, partName: 'part2' },
    ]);
    expect(typed2['_ffQueue']['_queues'].get('part3')!['_items']).toEqual([
      { type: 'sentance', text: '!', className: undefined, options: undefined, partName: 'part3' },
    ]);
  });
});
