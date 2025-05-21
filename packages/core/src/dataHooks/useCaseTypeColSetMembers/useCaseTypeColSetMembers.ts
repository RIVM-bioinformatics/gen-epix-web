import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import type { CaseTypeColSetMember } from '@gen_epix/api';
import { CaseApi } from '@gen_epix/api';

import { QUERY_KEY } from '../../models';
import { QueryUtil } from '../../utils';

export const useCaseTypeColSetMembers = (): UseQueryResult<CaseTypeColSetMember[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_COL_SET_MEMBERS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypeColSetMembersGetAll({ signal });
      return response.data;
    },
  });
};
