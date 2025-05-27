import { useMemo } from 'react';
import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import type {
  UseMap,
  UseOptions,
} from '../../models';
import {
  DataUtil,
  QueryUtil,
} from '../../utils';
import { QUERY_KEY } from '../../models';
import type { CaseSet } from '../../api';
import { CaseApi } from '../../api';

export const useCaseSets = (): UseQueryResult<CaseSet[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseSetsGetAll({ signal });
      return response.data;
    },
  });
};

export const useCaseSetsMap = (): UseMap<CaseSet> => {
  const response = useCaseSets();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseSet>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useCaseSetOptions = (): UseOptions<string> => {
  const response = useCaseSets();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseSet>(response, item => item.id, (item: CaseSet) => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
