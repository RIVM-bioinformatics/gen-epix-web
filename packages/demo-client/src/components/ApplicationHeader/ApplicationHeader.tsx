import { Box } from '@mui/material';

import {
  TestIdUtil,
  ApplicationBar,
} from '@gen_epix/core';
import type { ApplicationHeaderProps } from '@gen_epix/core';

import LogoLarge from '../../assets/logo/logoipsum-large.svg?react';
import LogoSmall from '../../assets/logo/logoipsum-small.png';

export const ApplicationHeader = ({
  fullWidth,
  fullHeight,
  singleAction,
}: ApplicationHeaderProps) => {

  return (
    <Box
      {...TestIdUtil.createAttributes('ApplicationHeader')}
      sx={{
        zIndex: 2,
        position: 'relative',
      }}
    >
      {!fullHeight && (
        <Box sx={{
          margin: '0 auto',
          maxWidth: '300px',
          '& svg': {
            width: '60%',
            height: 'auto',
          },
        }}
        >
          <LogoLarge />
        </Box>
      )}
      <ApplicationBar
        fullHeight={fullHeight}
        fullWidth={fullWidth}
        singleAction={singleAction}
        smallLogo={(
          <Box
            alt="Logo"
            component="img"
            src={LogoSmall}
            sx={{ width: '100%', height: 'auto', marginTop: '8px' }}
          />
        )}
      />
    </Box>
  );
};
