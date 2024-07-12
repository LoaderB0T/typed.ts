import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { Typed } from '../../src/typed.js';
import { randomStub, resetRandomStub } from '../random-stub.js';

describe('e2e', () => {
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

  test('verify random stub', async () => {
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

  test('Named Parts', async () => {
    let res1 = '';
    let res2 = '';
    let res3 = '';

    const named_typed = new Typed({
      namedParts: ['text_a', 'text_b', 'text_c'],
      callback: str => {
        res1 = str.text_a;
        res2 = str.text_b;
        res3 = str.text_c;
      },
      errorDelay: 0,
      eraseDelay: 0,
      perLetterDelay: 1,
    });

    const t1 = 'Hello';
    const t2 = ' World';
    const t3 = '!';

    named_typed.type(t1, { namedPart: 'text_a' });
    named_typed.type(t2, { namedPart: 'text_b' });
    named_typed.type(t3, { namedPart: 'text_c' });
    named_typed.backspace(t1.length, { namedPart: 'text_a' });
    named_typed.backspace(t2.length, { namedPart: 'text_b' });
    named_typed.backspace(t3.length, { namedPart: 'text_c' });
    named_typed.wait(1000);

    await named_typed.run();

    expect(res1).toBe('');
    expect(res2).toBe('');
    expect(res3).toBe('');
  });
});
