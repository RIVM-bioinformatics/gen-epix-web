import {
  Alert,
  CircularProgress,
  AlertTitle,
  Box,
} from '@mui/material';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { Notification } from '../../../models';
import {
  TestIdUtil,
  TimeUtil,
} from '../../../utils';

export type NotificationItemProps = {
  readonly notification: Notification;
  readonly showTimestamp?: boolean;
  readonly onClose: (key: string) => void;
  readonly allowClose: boolean;
};

export const NotificationItem = ({ notification, showTimestamp, onClose, allowClose }: NotificationItemProps) => {
  const [t] = useTranslation();

  const onCloseButtonClick = useCallback(() => {
    onClose(notification.key);
  }, [notification.key, onClose]);

  const now = new Date().getTime();

  return (
    <Alert
      {...TestIdUtil.createAttributes('NotificationItem', { key: notification.key })}
      closeText={t`Close`}
      icon={notification.isLoading ? <CircularProgress size={16} /> : undefined}
      onClose={allowClose ? onCloseButtonClick : undefined}
      severity={notification.isLoading ? 'info' : notification.severity}
      slotProps={{
        message: {
          sx: {
            flexGrow: 1,
          },
        },
      }}
      sx={{
        boxShadow: 1,
        marginBottom: 1,
        backgroundColor: 'background.paper',
      }}
    >
      <AlertTitle sx={{
        width: '100%',
      }}
      >
        {notification.message}
      </AlertTitle>
      {showTimestamp && (
        <Box sx={{
          textAlign: 'right',
        }}
        >
          {TimeUtil.getReadableTimeRemaining(now - notification.timestamp, t, { postFix: ' ago', round: true })}
        </Box>
      )}
    </Alert>
  );
};
