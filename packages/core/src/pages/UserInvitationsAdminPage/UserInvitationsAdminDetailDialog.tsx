import { useTranslation } from 'react-i18next';
import EmailIcon from '@mui/icons-material/Email';
import {
  Box,
  Typography,
} from '@mui/material';
import type { ReactElement } from 'react';
import {
  useEffect,
  useMemo,
} from 'react';
import { format } from 'date-fns';

import type { UserInvitation } from '@gen_epix/api';

import { TestIdUtil } from '../../utils';
import { CopyToClipboardButton } from '../../components';
import {
  type WithDialogRenderProps,
  type WithDialogRefMethods,
  withDialog,
} from '../../hoc';
import {
  ConfigManager,
  WindowManager,
} from '../../classes';

export interface UserInvitationsAdminDetailDialogOpenProps {
  item: UserInvitation;
}

export interface UserInvitationsAdminDetailDialogProps extends WithDialogRenderProps<UserInvitationsAdminDetailDialogOpenProps> {
}

export type UserInvitationsAdminDetailDialogRefMethods = WithDialogRefMethods<UserInvitationsAdminDetailDialogProps, UserInvitationsAdminDetailDialogOpenProps>;

export const UserInvitationsAdminDetailDialog = withDialog<UserInvitationsAdminDetailDialogProps, UserInvitationsAdminDetailDialogOpenProps>((
  {
    onTitleChange,
    openProps,
    onActionsChange,
  }: UserInvitationsAdminDetailDialogProps,
): ReactElement => {
  const [t] = useTranslation();

  useEffect(() => {
    onTitleChange(t('Invitation details for {{email}}', { email: openProps.item.email }));
  }, [onTitleChange, openProps.item.email, t]);

  const expiryDate = useMemo(() => {
    return format(openProps.item.expires_at, 'yyyy-MM-dd');
  }, [openProps.item.expires_at]);

  const invitationLink = useMemo(() => {
    const url = new URL(WindowManager.instance.window.location.href);
    url.search = '';
    url.hash = '';
    url.pathname = `/accept-invitation/${openProps.item.token}`;
    return url.toString();
  }, [openProps.item.token]);

  const shareInvitationHref = useMemo(() => {
    return `mailto:?subject=${t('Invitation to join {{applicationName}}', { applicationName: ConfigManager.instance.config.applicationName })}&body=${t('Use the following link to accept the invitation: {{invitationLink}}. This link will expire: {{expiryDate}}.', { invitationLink, expiryDate })}&to=${openProps.item.email}`;
  }, [expiryDate, invitationLink, openProps.item.email, t]);


  useEffect(() => {
    onActionsChange([
      {
        ...TestIdUtil.createAttributes('UserInvitationsAdminDetailDialog-agree'),
        href: shareInvitationHref,
        color: 'primary',
        variant: 'contained',
        startIcon: <EmailIcon />,
        label: t('Email invitation link'),
      },
      <CopyToClipboardButton
        buttonText={t('Copy invitation link to clipboard')}
        clipboardValue={invitationLink}
        key={'copyToClipboard'}
      />,
    ]);
  }, [onActionsChange, shareInvitationHref, t, invitationLink]);

  return (
    <Box>
      <Box>
        <Typography>
          {t('The invitation for {{email}} will expire on {{expiryDate}}.', { email: openProps.item.email, expiryDate })}
        </Typography>
      </Box>
      <Box marginY={1}>
        {t('Invitation link: {{invitationLink}}', { email: openProps.item.email, invitationLink })}
      </Box>
    </Box>
  );
}, {
  testId: 'UserInvitationsAdminDetailDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
});
