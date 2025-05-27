import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEY } from '../../models';
import { QueryUtil } from '../../utils';
import type { DataCollectionSetMember } from '../../api';
import { OrganizationApi } from '../../api';

export const useDataCollectionSetMembers = (): UseQueryResult<DataCollectionSetMember[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.DATA_COLLECTION_SET_MEMBERS),
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.getInstance().dataCollectionSetMembersGetAll({ signal });
      return response.data;
    },
  });
};
