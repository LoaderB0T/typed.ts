import { Typed } from './typed.js';
import { BehaviorSubject } from 'rxjs';

const typedFac = Typed.factory({
  setUp: () => new BehaviorSubject(''),
  update: (updater, text) => updater.next(text.part1 + text.part2 + text.part3),
  namedParts: ['part1', 'part2', 'part3'],
});

const typed = typedFac({
  // Same arguments as new Typed() except no callback
  perLetterDelay: { min: 20, max: 200 },
});

typed.text.subscribe(console.log);

const line1 = 'abcdefghij';
const line2 = '123123123';
const line3 = 'this is typed really fast, but errors are slow';
const line4 = 'this line is fast forwarded. No errors will be made';

const type = async () => {
  typed.type('Hello', { namedPart: 'part1' });
  typed.type(' ', { namedPart: 'part2' });
  typed.type('World', { namedPart: 'part3' });
  // typed.type(line2, { namedPart: 'part2' });
  // typed.type(line3, { namedPart: 'part3' });
  // typed.backspace(line1.length, { namedPart: 'part1' });
  // typed.backspace(line2.length, { namedPart: 'part2' });
  // typed.type(line4, { namedPart: 'part1' });
  // setTimeout(() => {
  //   typed.fastForward();
  // }, 2000);
  await typed.run();

  console.log('DONE!');
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
