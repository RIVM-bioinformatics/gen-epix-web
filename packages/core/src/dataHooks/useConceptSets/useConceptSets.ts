import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { UseOptions } from '../../models';
import {
  DataUtil,
  QueryUtil,
} from '../../utils';
import { QUERY_KEY } from '../../models';
import type { ConceptSet } from '../../api';
import { OntologyApi } from '../../api';

export const useConceptSets = (): UseQueryResult<ConceptSet[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CONCEPT_SETS),
    queryFn: async ({ signal }) => {
      const response = await OntologyApi.getInstance().conceptSetsGetAll({ signal });
      return response.data;
    },
  });
};

export const useConceptSetOptions = (): UseOptions<string> => {
  const response = useConceptSets();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<ConceptSet>(response, item => item.id, item => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
