import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import type {
  UseMap,
  UseOptions,
} from '../../models';
import {
  DataUtil,
  QueryUtil,
} from '../../utils';
import { QUERY_KEY } from '../../models';
import type { EtiologicalAgent } from '../../api';
import { OntologyApi } from '../../api';

export const useEtiologicalAgents = (): UseQueryResult<EtiologicalAgent[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ETIOLOGICAL_AGENTS),
    queryFn: async ({ signal }) => {
      const response = await OntologyApi.getInstance().etiologicalAgentsGetAll({ signal });
      return response.data;
    },
  });
};

export const useEtiologicalAgentsMap = (): UseMap<EtiologicalAgent> => {
  const response = useEtiologicalAgents();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<EtiologicalAgent>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useEtiologicalAgentOptions = (): UseOptions<string> => {
  const response = useEtiologicalAgents();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<EtiologicalAgent>(response, item => item.id, item => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
