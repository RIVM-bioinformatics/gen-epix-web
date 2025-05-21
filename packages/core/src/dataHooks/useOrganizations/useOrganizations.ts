import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Organization } from '@gen_epix/api';
import { OrganizationApi } from '@gen_epix/api';

import type {
  UseMap,
  UseOptions,
} from '../../models';
import {
  DataUtil,
  StringUtil,
  QueryUtil,
} from '../../utils';
import { QUERY_KEY } from '../../models';

export const useOrganizations = (): UseQueryResult<Organization[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATIONS),
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.getInstance().organizationsGetAll({ signal });
      return response.data;
    },
  });
};

export const useOrganizationMap = (): UseMap<Organization> => {
  const response = useOrganizations();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<Organization>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useOrganizationOptions = (): UseOptions<string> => {
  const response = useOrganizations();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<Organization>(response, item => item.id, item => item.name, [], StringUtil.advancedSortComperator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
