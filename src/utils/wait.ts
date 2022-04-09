import { Resetter } from '../resetter';
import { MinMax } from '../types/min-max';
import { randomInt } from './random-int';

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
