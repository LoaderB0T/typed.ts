import { EraseTypingOptions, SentanceTypingOptions } from './options.js';

export type QueueItem = Sentance | Backspace | Wait;

export type Sentance = {
  type: 'sentance';
  text: string;
  options?: SentanceTypingOptions;
  className?: string;
};

export type Backspace = {
  type: 'backspace';
  length: number;
  options?: EraseTypingOptions;
};

export type Wait = {
  type: 'wait';
  delay: number;
  options?: never;
};
