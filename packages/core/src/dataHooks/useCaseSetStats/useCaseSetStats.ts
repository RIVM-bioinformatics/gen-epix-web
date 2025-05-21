import { useMemo } from 'react';
import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { CaseSetStat } from '@gen_epix/api';
import { CaseApi } from '@gen_epix/api';

import type { UseMap } from '../../models';
import {
  DataUtil,
  QueryUtil,
} from '../../utils';
import { QUERY_KEY } from '../../models';

export const useCaseSetStats = (): UseQueryResult<CaseSetStat[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_STATS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().retrieveCaseSetStats({ signal });
      return response.data;
    },
  });
};

export const useCaseSetStatsMap = (): UseMap<CaseSetStat> => {
  const response = useCaseSetStats();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseSetStat>(response, item => item.case_set_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
