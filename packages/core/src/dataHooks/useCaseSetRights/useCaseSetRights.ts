import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import type { CaseSetRights } from '@gen_epix/api';
import { CaseApi } from '@gen_epix/api';

import { QUERY_KEY } from '../../models';
import {
  QueryUtil,
  DataUtil,
} from '../../utils';

export const useCaseSetRights = (caseSetIds: string[]): UseQueryResult<CaseSetRights[]> => {
  const queryResult = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_RIGHTS, caseSetIds),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().retrieveCaseSetRights(caseSetIds, { signal });
      return response.data;
    },
  });

  return useMemo(() => {
    return queryResult;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(queryResult)]);
};
