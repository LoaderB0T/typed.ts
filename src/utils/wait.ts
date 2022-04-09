import { MinMax } from '../types/min-max';
import { Resetter } from '../types/resetter';
import { randomInt } from './random-int';

export const wait = async (ms: number | MinMax | undefined, resetter: Resetter) => {
  if (!ms) {
    return;
  }

  if (resetter.isReset()) {
    return;
  }

  let remainingDely = typeof ms === 'number' ? ms : randomInt(ms.min, ms.max);

  let resolveFn: Function;
  const promise = new Promise<void>(resolve => (resolveFn = resolve));

  const interval = setInterval(() => {
    remainingDely -= 10;
    if (remainingDely <= 0 || resetter.isReset()) {
      clearInterval(interval);
      resolveFn();
    }
  }, 10);

  return Promise.race([promise, resetter.resetPromise]);
};
