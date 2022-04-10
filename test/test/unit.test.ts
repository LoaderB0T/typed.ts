import { Typed } from '../../src/typed';
import { randomStub, resetRandomStub } from '../random-stub';

describe('', () => {
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
      perLetterDelay: 1
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
    expect(typed['_ffQueue']['_items']).toEqual([
      { type: 'sentance', text: 'h', className: undefined, options: undefined },
      { type: 'sentance', text: 'e', className: undefined, options: undefined },
      { type: 'sentance', text: 'l', className: undefined, options: undefined },
      { type: 'sentance', text: 'l', className: undefined, options: undefined },
      { type: 'sentance', text: 'o', className: undefined, options: undefined }
    ]);
  });
});
