import { Box } from '@mui/material';

import type { NumberRangeFilter } from '../../../classes';
import { NumberRangeInput } from '../../form';

export type NumberRangeFilterFieldProps = {
  readonly filter: NumberRangeFilter;
};
export const NumberRangeFilterField = ({ filter }: NumberRangeFilterFieldProps) => {
  return (
    <Box>
      <NumberRangeInput
        label={filter.label}
        max={filter.max}
        min={filter.min}
        name={filter.id}
      />
    </Box>
  );
};
