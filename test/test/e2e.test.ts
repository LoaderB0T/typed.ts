import { Typed } from '../../src/typed.js';
import { randomStub, resetRandomStub } from '../random-stub.js';

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

  test('hello world', async () => {
    expect(Math.random()).toBe(0.908788990863389);
    expect(Math.random()).toBe(0.7982002517390028);
    expect(Math.random()).toBe(0.4753399903420179);
    expect(Math.random()).toBe(0.00016161331579800375);
  });

  test('hello world', async () => {
    typed.type('Hello World');
    await typed.run();
    expect(result).toBe('Hello World');
  });

  test('Multiple texts', async () => {
    typed.type('Hello World').type(' Hello World').type(' Hello World');
    await typed.run();
    expect(result).toBe('Hello World Hello World Hello World');
  });

  test('className', async () => {
    typed.type('Hello World', { className: 'test' });
    await typed.run();
    expect(result).toBe('<span class="test">Hello World</span>');
  });

  test('ff', async () => {
    typed.type('Hello World');
    typed.fastForward();
    await typed.run();
    expect(result).toBe('Hello World');
  });

  const testComplexff = async () => {
    typed
      .type('1234567890')
      .type('1234567890', { className: 'a' })
      .type('1234567890')
      .type('1234567890', { className: 'b' })
      .type('1234567890')
      .type('1234567890', { className: 'c' })
      .type('1234567890')
      .type('1234567890', { className: 'a' })
      .type('1234567890')
      .type('1234567890', { className: 'b' })
      .type('1234567890')
      .type('1234567890', { className: 'c' })
      .type('1234567890')
      .type('1234567890', { className: 'a' })
      .type('1234567890')
      .type('1234567890', { className: 'b' })
      .type('1234567890')
      .type('1234567890', { className: 'c' });
    typed.fastForward();
    setTimeout(() => {
      typed.fastForward();
    }, 1);
    await typed.run();
    expect(result).toBe(
      '1234567890<span class="a">1234567890</span>1234567890<span class="b">1234567890</span>1234567890<span class="c">1234567890</span>' +
        '1234567890<span class="a">1234567890</span>1234567890<span class="b">1234567890</span>1234567890<span class="c">1234567890</span>' +
        '1234567890<span class="a">1234567890</span>1234567890<span class="b">1234567890</span>1234567890<span class="c">1234567890</span>'
    );
  };

  test('ff complex1', async () => {
    await testComplexff();
  });

  test('ff complex 5ms', async () => {
    typed.type('1234567890', { perLetterDelay: 10 });
    setTimeout(() => {
      typed.fastForward();
    }, 5);
    await typed.run();
    expect(result).toBe('1234567890');
  });

  test('ff complex 15ms', async () => {
    typed.type('1234567890', { perLetterDelay: 10 });
    setTimeout(() => {
      typed.fastForward();
    }, 15);
    await typed.run();
    expect(result).toBe('1234567890');
  });

  test('ff complex 2nd type', async () => {
    typed.type('123').type('456');
    cb = str => {
      if (str === '123') {
        setTimeout(() => {
          typed.fastForward();
        });
      }
    };
    await typed.run();
    expect(result).toBe('123456');
  });
});
