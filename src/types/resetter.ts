export type Resetter = {
  resetPromise: Promise<void>;
  isReset: () => boolean;
};
