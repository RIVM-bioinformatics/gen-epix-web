import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { DataCollection } from '@gen_epix/api';
import { OrganizationApi } from '@gen_epix/api';

import type {
  UseMap,
  UseOptions,
} from '../../models';
import {
  DataUtil,
  QueryUtil,
} from '../../utils';
import { QUERY_KEY } from '../../models';

export const useDataCollections = (dataCollectionIds?: string[]): UseQueryResult<DataCollection[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.DATA_COLLECTIONS),
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.getInstance().dataCollectionsGetAll({ signal });
      return response.data;
    },
    select: (items) => {
      if (dataCollectionIds) {
        return items.filter(item => dataCollectionIds.includes(item.id));
      }
      return items;
    },
  });
};

export const useDataCollectionsMap = (dataCollectionIds?: string[]): UseMap<DataCollection> => {
  const response = useDataCollections(dataCollectionIds);

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<DataCollection>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useDataCollectionOptions = (dataCollectionIds?: string[]): UseOptions<string> => {
  const response = useDataCollections(dataCollectionIds);

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<DataCollection>(response, item => item.id, item => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
