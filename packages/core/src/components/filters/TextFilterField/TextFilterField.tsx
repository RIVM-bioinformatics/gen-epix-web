import { Box } from '@mui/material';

import type { TextFilter } from '../../../classes';
import { TextField } from '../../form';

export type TextFilterFieldProps = {
  readonly filter: TextFilter;
};
export const TextFilterField = ({ filter }: TextFilterFieldProps) => {
  return (
    <Box>
      <TextField
        label={filter.label}
        name={filter.id}
      />
    </Box>
  );
};
