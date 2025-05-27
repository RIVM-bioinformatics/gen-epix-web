import type { TFunction } from 'i18next';

import type {
  DateFilter,
  GeoFilter,
  MultiSelectFilter,
  NumberRangeFilter,
  SelectionFilter,
  TextFilter,
  TreeFilter,
  BooleanFilter,
} from '../classes';
import type {
  Case,
  FiltersInner,
} from '../api';

export interface Filter<TFilterValue, TRowValue> {
  initialFilterValue: TFilterValue;
  filterValue: TFilterValue;
  label: string;
  getPresentationValue: (value?: unknown, t?: TFunction<'translation', undefined>) => string;
  matchRowValue: (rowValue: TRowValue, row?: Case) => boolean;
  isInitialFilterValue: (value?: TFilterValue) => boolean;
  setFilterValue: (value: TFilterValue) => void;
  toBackendFilter: () => FiltersInner;
}

export type Filters = Array<DateFilter | GeoFilter | MultiSelectFilter | TextFilter | BooleanFilter | NumberRangeFilter | TreeFilter | SelectionFilter>;

export type FilterValues = { [key: string]: unknown };

export type FilterDimension = {
  id: string;
  label: string;
  description: string;
  filterIds: string[];
  preferredFilterId: string;
  allowMultipleVisibleFilters: boolean;
  allowOnlyPreferredFilter: boolean;
};
