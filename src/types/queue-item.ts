import { EraseTypingOptions, SentanceTypingOptions } from './options.js';

export type QueueItem = Sentance | Backspace | Wait;

export type Sentance = {
  type: 'sentance';
  partName: string;
  text: string;
  options?: SentanceTypingOptions<string[], any>;
  className?: string;
};

export type Backspace = {
  type: 'backspace';
  partName: string;
  length: number;
  options?: EraseTypingOptions<string[], any>;
};

export type Wait = {
  type: 'wait';
  partName: string;
  delay: number;
  options?: never;
};
