import { randomInt } from './random-int.js';
import { Resetter } from './resetter.js';
import { MinMax } from '../types/min-max.js';

export const wait = async (ms: number | MinMax | undefined, resetter: Resetter) => {
  if (!ms) {
    return;
  }

  if (resetter.isReset) {
    return;
  }

  const delay = typeof ms === 'number' ? ms : randomInt(ms.min, ms.max);

  const { promise, resolve } = Promise.withResolvers<void>();
  const interval = setTimeout(() => {
    clearInterval(interval);
    resolve();
  }, delay);

  await Promise.race([promise, resetter.resetPromise, resetter.resetSinglePromise]);
  if (resetter.isSingleReset) {
    resetter.resetSingleResetter();
  }
};
