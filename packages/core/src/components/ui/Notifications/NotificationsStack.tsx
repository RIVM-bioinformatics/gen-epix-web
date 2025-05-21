import type { ReactElement } from 'react';
import { useCallback } from 'react';
import {
  Snackbar,
  Box,
} from '@mui/material';

import { TestIdUtil } from '../../../utils';
import { useSubscribable } from '../../../hooks';
import { NotificationManager } from '../../../classes';

import { NotificationItem } from './NotificationItem';

export const NotificationsStack = (): ReactElement => {
  const visibleNotifications = useSubscribable(NotificationManager.instance, {
    select: (notifications) => notifications.filter(notification => notification.visible),
  });

  const onNotificationItemClose = useCallback((key: string) => {
    NotificationManager.instance.hideNotification(key);
  }, []);

  return (
    <>
      {visibleNotifications.length > 0 && (
        <Snackbar
          {...TestIdUtil.createAttributes('NotificationsStack')}
          anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
          open
        >
          <Box>
            {visibleNotifications.map(notification => (
              <NotificationItem
                allowClose
                key={notification.key}
                notification={notification}
                onClose={onNotificationItemClose}
              />
            ))}
          </Box>
        </Snackbar>)}
    </>
  );
};
