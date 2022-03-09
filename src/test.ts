import { Typed } from './typed';

const typed = new Typed({
  callback: text => {
    console.log(text);
  }
});

const line1 = 'Hello, World!';
const line2 = 'slow';
const line3 = 'this is typed really fast, but errors are slow';
const line4 = 'this line is fast forwarded. No errors will be made';

const type = async () => {
  await typed.start(line1);
  await typed.backspace(line1.length, { minEraseDelay: 20, maxEraseDelay: 40 });
  await typed.start(line2, { minDelay: 200, maxDelay: 400 });
  await typed.backspace(line2.length, { minEraseDelay: 20, maxEraseDelay: 40 });
  await typed.start(line3, { minDelay: 40, maxDelay: 80, minEraseDelay: 200, maxEraseDelay: 400 });
  await typed.backspace(line3.length, { minEraseDelay: 20, maxEraseDelay: 40 });
  typed.fastForward();
  await typed.start(line4);
  typed.fastForward(false);
  typed.reset();
};

type();
