import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEY } from '../../models';
import { QueryUtil } from '../../utils';
import type { CaseTypeSetMember } from '../../api';
import { CaseApi } from '../../api';

export const useCaseTypeSetMembers = (): UseQueryResult<CaseTypeSetMember[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_SET_MEMBERS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypeSetMembersGetAll({ signal });
      return response.data;
    },
  });
};
