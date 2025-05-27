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
import type { CaseTypeSetCategory } from '../../api';
import { CaseApi } from '../../api';

export const useCaseTypeSetCategories = (): UseQueryResult<CaseTypeSetCategory[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_SET_CATEGORIES),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypeSetCategoriesGetAll({ signal });
      const items = response.data;
      items.sort((a, b) => a.rank - b.rank);
      return items;
    },
  });
};

export const useCaseTypeSetCategoryMap = (): UseMap<CaseTypeSetCategory> => {
  const response = useCaseTypeSetCategories();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseTypeSetCategory>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useCaseTypeSetCategoryOptions = (): UseOptions<string> => {
  const response = useCaseTypeSetCategories();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseTypeSetCategory>(response, item => item.id, item => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
