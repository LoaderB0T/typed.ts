import { Resetter } from './resetter.js';
import { MinMax } from '../types/min-max.js';
import { randomInt } from './random-int.js';

export const wait = async (ms: number | MinMax | undefined, resetter: Resetter) => {
  if (!ms) {
    return;
  }

  if (resetter.isReset) {
    return;
  }

  const delay = typeof ms === 'number' ? ms : randomInt(ms.min, ms.max);

  let resolveFn: Function;
  const promise = new Promise<void>(resolve => (resolveFn = resolve));
  const interval = setTimeout(() => {
    clearInterval(interval);
    resolveFn();
  }, delay);

  await Promise.race([promise, resetter.resetPromise, resetter.resetSinglePromise]);
  if (resetter.isSingleReset) {
    resetter.resetSingleResetter();
  }
};
