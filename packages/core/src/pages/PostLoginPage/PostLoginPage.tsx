import type { Path } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'react-oidc-context';

import type { AuthState } from '../../models';
import { PageContainer } from '../../components';
import { RouterManager } from '../../classes';
import { TestIdUtil } from '../../utils';

export const PostLoginPage = () => {
  const [t] = useTranslation();
  const auth = useAuth();
  const authState = auth.user.state as AuthState;

  useEffect(() => {
    let path: Partial<Path> = authState?.preLoginLocation;
    if (!path?.pathname || path.pathname === '/post-login') {
      path = {
        pathname: '/',
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    RouterManager.instance.router.navigate(path);
  }, [authState?.preLoginLocation]);

  return (
    <PageContainer
      ignorePageEvent
      singleAction
      testIdAttributes={TestIdUtil.createAttributes('PostLoginPage')}
      title={t`Logged in`}
    >
      <CircularProgress />
    </PageContainer>
  );
};
