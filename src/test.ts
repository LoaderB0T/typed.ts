import { BehaviorSubject } from 'rxjs';

import { Typed } from './typed.js';

const typedFac = Typed.factory({
  setUp: () => new BehaviorSubject(''),
  update: (updater, text) => updater.next(text)
});

const typed = typedFac({
  // Same arguments as new Typed() except no callback
  perLetterDelay: { min: 20, max: 200 }
});

typed.text.subscribe(console.log);

const line1 = 'this is some text that will be deleted';
const line2 = 'slow';
const line3 = 'this is typed really fast, but errors are slow';
const line4 = 'this line is fast forwarded. No errors will be made';

const type = async () => {
  typed.type(line1).backspace(line1.length).type(line4);
  setTimeout(() => {
    typed.fastForward();
  }, 1000);
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
