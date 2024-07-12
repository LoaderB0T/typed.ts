import { Resetter } from '../utils/resetter.js';
import { Queue } from './queue.js';
import { QueueItem } from './queue-item.js';
import { throwExp } from './throw.js';
import { DEFAULT_PART_NAME } from '../utils/default-part-name.js';

export class QueueManager<const NamedParts extends string[]> {
  private readonly _name: string;
  private readonly _namedParts: NamedParts;

  private readonly _queues: Map<NamedParts[number], Queue> = new Map();

  constructor(name: string, resetter: Resetter, namedParts: NamedParts) {
    this._name = name;
    this._namedParts = namedParts;
    this._namedParts.forEach(part => {
      this._queues.set(part, new Queue(this._name, resetter));
    });
  }

  public get(part: NamedParts[number]): Queue {
    return this._queues.get(part) ?? throwExp(`No queue found for part: ${part}`);
  }

  public clear() {
    this._queues.forEach(queue => queue.clear());
  }

  public add(item: QueueItem) {
    if (item.partName === DEFAULT_PART_NAME && !this._namedParts.includes(DEFAULT_PART_NAME)) {
      this._queues.forEach(queue => queue.add(item));
      return;
    }
    this.get(item.partName).add(item);
  }

  public resetIndices(): void {
    this._queues.forEach(queue => queue.resetIndices());
  }
}
