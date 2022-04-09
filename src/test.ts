import { Typed } from './typed';

const typed = new Typed({
  callback: text => console.log(text),
  perLetterDelay: { min: 20, max: 200 }
});

const line1 = 'Hello, World!';
const line2 = 'slow';
const line3 = 'this is typed really fast, but errors are slow';
const line4 = 'this line is fast forwarded. No errors will be made';

const type = async () => {
  typed.type(line2);
  typed.wait(1000);
  typed.type(line2, { className: 'error' });
  typed.backspace(line2.length);
  await typed.run();
  // await typed.backspace(line1.length, { minEraseDelay: 20, maxEraseDelay: 40 });
  // await typed.start(line2, { minDelay: 200, maxDelay: 400 });
  // await typed.backspace(line2.length, { minEraseDelay: 20, maxEraseDelay: 40 });
  // await typed.start(line3, { minDelay: 40, maxDelay: 80, minEraseDelay: 200, maxEraseDelay: 400 });
  // await typed.backspace(line3.length, { minEraseDelay: 20, maxEraseDelay: 40 });
  // typed.fastForward();
  // await typed.start(line4);
  // typed.fastForward(false);
  // typed.reset();
};

type();
