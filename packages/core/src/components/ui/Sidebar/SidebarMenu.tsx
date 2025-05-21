import {
  useTheme,
  Box,
} from '@mui/material';
import type { PropsWithChildren } from 'react';

import { TestIdUtil } from '../../../utils';
import { ConfigManager } from '../../../classes';

export type SidebarMenuProps = PropsWithChildren;

export const SidebarMenu = ({ children }: SidebarMenuProps) => {
  const theme = useTheme();

  return (
    <Box
      {...TestIdUtil.createAttributes('SidebarMenu')}
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 2,
        width: theme.spacing(ConfigManager.instance.config.layout.SIDEBAR_MENU_WIDTH),
        borderRight: '1px solid #C8DDFB',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </Box>
  );
};
