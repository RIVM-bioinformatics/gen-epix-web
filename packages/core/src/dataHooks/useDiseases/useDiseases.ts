import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type {
  UseMap,
  UseOptions,
} from '../../models';
import {
  DataUtil,
  QueryUtil,
} from '../../utils';
import { QUERY_KEY } from '../../models';
import type { Disease } from '../../api';
import { OntologyApi } from '../../api';

export const useDiseases = (): UseQueryResult<Disease[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.DISEASES),
    queryFn: async ({ signal }) => {
      const response = await OntologyApi.getInstance().diseasesGetAll({ signal });
      return response.data;
    },
  });
};

export const useDiseasesMap = (): UseMap<Disease> => {
  const response = useDiseases();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<Disease>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useDiseaseOptions = (): UseOptions<string> => {
  const response = useDiseases();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<Disease>(response, item => item.id, item => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
