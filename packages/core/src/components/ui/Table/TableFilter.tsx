import {
  BooleanFilter,
  DateFilter,
  GeoFilter,
  MultiSelectFilter,
  NumberRangeFilter,
  TextFilter,
} from '../../../classes';
import type {
  Filters,
  UnwrapArray,
} from '../../../models';
import {
  BooleanFilterField,
  DateFilterField,
  GeoFilterField,
  MultiSelectFilterField,
  NumberRangeFilterField,
  TextFilterField,
} from '../../filters';

export type TableFilterProps = {
  readonly filter: UnwrapArray<Filters>;
};

export const TableFilter = ({ filter }: TableFilterProps) => {
  return (
    <>
      {filter instanceof TextFilter && <TextFilterField filter={filter} />}
      {filter instanceof BooleanFilter && <BooleanFilterField filter={filter} />}
      {filter instanceof NumberRangeFilter && <NumberRangeFilterField filter={filter} />}
      {filter instanceof MultiSelectFilter && <MultiSelectFilterField filter={filter} />}
      {filter instanceof GeoFilter && <GeoFilterField filter={filter} />}
      {filter instanceof DateFilter && <DateFilterField filter={filter} />}
    </>
  );
};
