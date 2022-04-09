import { EraseTypingOptions, SentanceTypingOptions } from './options';

export type QueueItem = Sentance | Backspace;

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
