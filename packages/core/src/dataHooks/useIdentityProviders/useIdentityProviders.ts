import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { IdentityProvider } from '@gen_epix/api';
import { AuthApi } from '@gen_epix/api';

import type { UseOptions } from '../../models';
import {
  DataUtil,
  QueryUtil,
} from '../../utils';
import { QUERY_KEY } from '../../models';

export const useIdentityProviders = (): UseQueryResult<IdentityProvider[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.IDENTITY_PROVIDERS),
    queryFn: async ({ signal }) => {
      const response = await AuthApi.getInstance().identityProvidersGetAll({ signal });
      return response.data;
    },
  });
};

export const useIdentityProviderOptions = (): UseOptions<string> => {
  const response = useIdentityProviders();

  return useMemo(() => {
    const options = response.data?.map(item => ({ value: item.name, label: item.name })) ?? [];
    return {
      isLoading: response.isLoading || response.isPending,
      options,
      error: response.error,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
