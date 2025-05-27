import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import { QUERY_KEY } from '../../models';
import { QueryUtil } from '../../utils';
import type {
  RetrieveCaseTypeStatsCommand,
  CaseTypeStat,
} from '../../api';
import { CaseApi } from '../../api';

export const useCaseTypeStats = (options?: RetrieveCaseTypeStatsCommand): UseQueryResult<CaseTypeStat[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_STATS, options ?? {}),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().retrieveCaseTypeStats(options ?? {}, { signal });
      return response.data;
    },
  });
};
