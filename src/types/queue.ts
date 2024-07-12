import { Resetter } from '../utils/resetter.js';
import { QueueItem } from './queue-item.js';

export class Queue {
  private readonly _name: string;
  private readonly _resetter: Resetter;
  private readonly _items: QueueItem[] = [];
  private _queueIndex: number = 0;
  private _queueDetailIndex: number = 0;

  constructor(name: string, resetter: Resetter) {
    this._name = name;
    this._resetter = resetter;
  }

  public add(item: QueueItem): void {
    this._items.push(item);
  }

  public clear(): void {
    this._items.length = 0;
    this.resetIndices();
  }

  public resetIndices() {
    this._queueIndex = 0;
    this._queueDetailIndex = 0;
  }

  public get item(): QueueItem {
    return this._items[this._queueIndex];
  }

  public get detailIndex(): number {
    return this._queueDetailIndex;
  }

  public increment(maxDetailIndex?: number): boolean {
    if (this._resetter.isReset) {
      return false;
    }
    this._queueDetailIndex++;
    if (!maxDetailIndex || this._queueDetailIndex === maxDetailIndex) {
      return this.nextQueueItem();
    } else {
      return true;
    }
  }

  private nextQueueItem(): boolean {
    if (this._resetter.isReset) {
      return false;
    }
    this._queueIndex++;
    if (this._queueIndex === this._items.length) {
      return false;
    }
    this._queueDetailIndex = 0;
    return true;
  }
}
