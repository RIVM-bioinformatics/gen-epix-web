import { EventBusAbstract } from '../abstracts';

export type TableEvent = {
  columnVisibilityChange: string[];
  reset: void;
  destroy: void;
};

export class TableEventBus extends EventBusAbstract<TableEvent> {

}
