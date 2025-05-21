import { Box } from '@mui/material';
import { useMemo } from 'react';

import type { BooleanFilter } from '../../../classes';
import { Select } from '../../form';
import type { SelectOption } from '../../../models';

export type BooleanFilterFieldProps = {
  readonly filter: BooleanFilter;
};
export const BooleanFilterField = ({ filter }: BooleanFilterFieldProps) => {
  const options = useMemo<SelectOption<boolean>[]>(() => [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
  ], []);
  return (
    <Box>
      <Select
        label={filter.label}
        name={filter.id}
        options={options}
      />
    </Box>
  );
};
