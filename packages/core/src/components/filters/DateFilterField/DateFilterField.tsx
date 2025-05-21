import { Box } from '@mui/material';

import type { DateFilter } from '../../../classes';
import { DateRangePicker } from '../../form';

export type DateFilterFieldProps = {
  readonly filter: DateFilter;
};

export const DateFilterField = ({ filter }: DateFilterFieldProps) => {
  return (
    <Box>
      <DateRangePicker
        label={filter.label}
        maxDate={filter.maxDate}
        minDate={filter.minDate}
        name={filter.id}
      />
    </Box>
  );
};
