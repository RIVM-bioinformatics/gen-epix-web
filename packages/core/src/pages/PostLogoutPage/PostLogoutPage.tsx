import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { PageContainer } from '../../components';
import { RouterManager } from '../../classes';
import { TestIdUtil } from '../../utils';

export const PostLogoutPage = () => {
  const [t] = useTranslation();
  const onButtonClick = useCallback(async () => {

    await RouterManager.instance.router.navigate('/');
  }, []);

  return (
    <PageContainer
      singleAction
      testIdAttributes={TestIdUtil.createAttributes('PostLogoutPage')}
      title={t`Logged out`}
    >
      <Box>
        <Typography marginBottom={2}>
          {t`You have been logged out. You may close this window or log in again.`}
        </Typography>
        <Button
          onClick={onButtonClick}
        >
          {t`Log in again`}
        </Button>
      </Box>
    </PageContainer>
  );
};
