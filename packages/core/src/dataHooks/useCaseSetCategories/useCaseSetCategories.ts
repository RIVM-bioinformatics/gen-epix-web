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
import type { CaseSetCategory } from '../../api';
import { CaseApi } from '../../api';

export const useCaseSetCategories = (): UseQueryResult<CaseSetCategory[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_CATEGORIES),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseSetCategoriesGetAll({ signal });
      return response.data;
    },
  });
};

export const useCaseSetCategoryMap = (): UseMap<CaseSetCategory> => {
  const response = useCaseSetCategories();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseSetCategory>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useCaseSetCategoryOptions = (): UseOptions<string> => {
  const response = useCaseSetCategories();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseSetCategory>(response, item => item.id, (item: CaseSetCategory) => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
