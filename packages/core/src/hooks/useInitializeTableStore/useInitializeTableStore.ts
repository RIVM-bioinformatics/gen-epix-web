import {
  useStore,
  type StoreApi,
} from 'zustand';
import { useEffect } from 'react';

import type { TableStore } from '../../stores';
import type { TableColumn } from '../../models';
import { DEFAULT_FILTER_GROUP } from '../../classes';
import { TableUtil } from '../../utils';

export const useInitializeTableStore = <TData,>(store: StoreApi<TableStore<TData>>, columns: TableColumn<TData>[], baseData: TData[], createFiltersFromColumns = false) => {
  const setColumns = useStore(store, (state) => state.setColumns);
  const setBaseData = useStore(store, (state) => state.setBaseData);
  const setFilters = useStore(store, (state) => state.setFilters);
  const initialize = useStore(store, (state) => state.initialize);

  useEffect(() => {
    if (!columns || !baseData) {
      return;
    }
    const abortController = new AbortController();
    setColumns(columns);
    setBaseData(baseData);
    if (createFiltersFromColumns) {
      setFilters(TableUtil.createFiltersFromColumns(columns, baseData), [], [DEFAULT_FILTER_GROUP]);
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    initialize(abortController.signal);
    return () => {
      abortController.abort();
    };
  }, [columns, initialize, setColumns, setFilters, setBaseData, createFiltersFromColumns, baseData]);
};
