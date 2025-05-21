import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import type { CaseTypeSetMember } from '@gen_epix/api';
import { CaseApi } from '@gen_epix/api';

import { QUERY_KEY } from '../../models';
import { QueryUtil } from '../../utils';

export const useCaseTypeSetMembers = (): UseQueryResult<CaseTypeSetMember[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_SET_MEMBERS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypeSetMembersGetAll({ signal });
      return response.data;
    },
  });
};
