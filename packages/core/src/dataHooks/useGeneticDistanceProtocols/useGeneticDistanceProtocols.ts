import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { UseOptions } from '../../models';
import {
  DataUtil,
  QueryUtil,
} from '../../utils';
import { QUERY_KEY } from '../../models';
import type { GeneticDistanceProtocol } from '../../api';
import { CaseApi } from '../../api';

export const useGeneticDistanceProtocols = (): UseQueryResult<GeneticDistanceProtocol[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.GENETIC_DISTANCE_PROTOCOLS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().geneticDistanceProtocolsGetAll({ signal });
      return response.data;
    },
  });
};

export const useGeneticDistanceProtocolOptions = (): UseOptions<string> => {
  const response = useGeneticDistanceProtocols();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<GeneticDistanceProtocol>(response, item => item.id, item => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
