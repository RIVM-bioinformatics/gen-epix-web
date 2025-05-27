import {
  StrictMode,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Outlet,
  useLocation,
} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AuthProvider } from 'react-oidc-context';
import { UserManager } from 'oidc-client-ts';

import {
  AuthenticationWrapper,
  AuthorizationWrapper,
  OutageWrapper,
  Spinner,
  UserInactivityConfirmation,
  NotificationsStack,
} from '../components';
import {
  ChooseIdentityProviderPage,
  ErrorPage,
  HomePage,
} from '../pages';
import {
  UserManagerUtil,
  QueryUtil,
} from '../utils';
import { QUERY_KEY } from '../models';
import { useSubscribable } from '../hooks';
import {
  AuthenticationManager,
  LogManager,
  NavigationHistoryManager,
} from '../classes';
import {
  AuthApi,
  LogLevel,
} from '../api';

export const RouterRoot = () => {
  const location = useLocation();

  const { isPending: isIdentityProvidersPending, error: identityProvidersError, data: identityProviders } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.IDENTITY_PROVIDERS),
    queryFn: async ({ signal }) => (await AuthApi.getInstance().identityProvidersGetAll({ signal })).data,
    gcTime: Infinity,
    staleTime: Infinity,
  });

  const oidcConfiguration = useSubscribable(AuthenticationManager.instance);

  const onSignin = useCallback(() => {
    LogManager.instance.log([{
      topic: 'USER_LOGIN',
      level: LogLevel.INFO,
    }]);
  }, []);

  useEffect(() => {
    NavigationHistoryManager.instance.navigationHistory.push(location.pathname);
    LogManager.instance.log([{
      topic: 'USER_NAVIGATION',
      level: LogLevel.INFO,
      detail: {
        pathname: location.pathname,
      },
    }]);
  }, [location.pathname]);

  const userManager = useMemo<UserManager>(() => {
    if (!oidcConfiguration || !identityProviders?.length) {
      return null;
    }

    // Validate the storage
    const identityProvider = identityProviders.find(x => x.name === oidcConfiguration.name);
    if (!identityProvider || JSON.stringify(oidcConfiguration) !== JSON.stringify(identityProvider)) {
      AuthenticationManager.instance.next(undefined);
      return null;
    }
    window.userManager = new UserManager(UserManagerUtil.getSettings(oidcConfiguration));
    return window.userManager;
  }, [identityProviders, oidcConfiguration]);

  if (isIdentityProvidersPending) {
    return <Spinner />;
  }

  if (identityProvidersError) {
    return <ErrorPage error={identityProvidersError} />;
  }

  if (!oidcConfiguration) {
    return (
      <ChooseIdentityProviderPage identityProviders={identityProviders} />
    );
  }

  return (
    <AuthProvider
      onSigninCallback={onSignin}
      userManager={userManager}
    >
      <AuthenticationWrapper>
        <OutageWrapper>
          <AuthorizationWrapper>
            <UserInactivityConfirmation />
            <NotificationsStack />
            <StrictMode>
              {/* use key={location.pathname} to force a rerender when the pathname changes */}
              {location?.pathname === '/' ? <HomePage /> : <Outlet key={location.pathname} /> }
            </StrictMode>
          </AuthorizationWrapper>
        </OutageWrapper>
      </AuthenticationWrapper>
    </AuthProvider>
  );
};
