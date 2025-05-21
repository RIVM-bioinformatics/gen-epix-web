import { Box } from '@mui/material';

import {
  CheckboxGroup,
  Autocomplete,
} from '../../form';
import type { MultiSelectFilter } from '../../../classes';

export type MultiSelectFilterFieldProps = {
  readonly filter: MultiSelectFilter;
};

export const MultiSelectFilterField = ({ filter }: MultiSelectFilterFieldProps) => {
  return (
    <Box>
      {filter.options.length <= filter.maxNumOptionsExpanded && (
        <CheckboxGroup
          label={filter.label}
          name={filter.id}
          options={filter.options}
        />
      )}
      {filter.options.length > filter.maxNumOptionsExpanded && (
        <Autocomplete
          label={filter.label}
          multiple
          name={filter.id}
          options={filter.options}
        />
      )}
    </Box>
  );
};
