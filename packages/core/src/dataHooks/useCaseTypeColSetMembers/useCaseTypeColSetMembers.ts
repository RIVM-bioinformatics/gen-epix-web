import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEY } from '../../models';
import { QueryUtil } from '../../utils';
import type { CaseTypeColSetMember } from '../../api';
import { CaseApi } from '../../api';

export const useCaseTypeColSetMembers = (): UseQueryResult<CaseTypeColSetMember[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_COL_SET_MEMBERS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypeColSetMembersGetAll({ signal });
      return response.data;
    },
  });
};
