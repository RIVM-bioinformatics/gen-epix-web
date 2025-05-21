import { Box } from '@mui/material';

import {
  CheckboxGroup,
  Autocomplete,
} from '../../form';
import type { GeoFilter } from '../../../classes';

export type GeoFilterFieldProps = {
  readonly filter: GeoFilter;
};

export const GeoFilterField = ({ filter }: GeoFilterFieldProps) => {
  return (
    <Box>
      {filter.options.length <= 5 && (
        <CheckboxGroup
          label={filter.label}
          name={filter.id}
          options={filter.options}
        />
      )}
      {filter.options.length > 5 && (
        <Autocomplete
          label={filter.label}
          multiple
          name={filter.id}
          options={filter.options}
          shouldSortOptions
        />
      )}
    </Box>
  );
};
