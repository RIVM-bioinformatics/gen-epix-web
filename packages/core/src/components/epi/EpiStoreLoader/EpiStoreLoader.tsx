import { Box } from '@mui/system';
import type { PropsWithChildren } from 'react';
import {
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { CaseApi } from '@gen_epix/api';
import type { CaseSet } from '@gen_epix/api';

import { useItemQuery } from '../../../hooks';
import { QUERY_KEY } from '../../../models';
import {
  AxiosUtil,
  EpiDataUtil,
} from '../../../utils';
import { ResponseHandler } from '../../ui';

import { EpiStoreLoaderContent } from './EpiStoreLoaderContent';

export type EpiStoreLoaderProps = PropsWithChildren<{
  readonly caseSet?: CaseSet;
  readonly caseTypeId: string;
}>;

export const EpiStoreLoader = ({ caseSet, caseTypeId, children }: EpiStoreLoaderProps) => {
  const [t] = useTranslation();
  const [isSideEffectLoading, setIsSideEffectLoading] = useState(true);
  const [sideEffectError, setSideEffectError] = useState<Error>();

  const { isPending: isCompleteCaseTypePending, error: completeCaseTypeError, data: completeCaseType } = useItemQuery({
    baseQueryKey: QUERY_KEY.COMPLETE_CASE_TYPES,
    itemId: caseTypeId,
    useQueryOptions: {
      queryFn: async ({ signal }) => {
        return (await CaseApi.getInstance().completeCaseTypesGetOne(caseTypeId, { signal })).data;
      },
    },
  });

  useEffect(() => {
    const abortController = new AbortController();
    if (completeCaseType) {
      const perform = async () => {
        try {
          await Promise.all([
            EpiDataUtil.loadMissingConceptSets(completeCaseType, abortController.signal),
            EpiDataUtil.loadMissingRegionSets(completeCaseType, abortController.signal),
            EpiDataUtil.loadTreeAlgorithms(completeCaseType, abortController.signal),
          ]);
          setIsSideEffectLoading(false);
        } catch (error) {
          if (!AxiosUtil.isAxiosCanceledError(error)) {
            setSideEffectError(error as Error);
          }
        }
      };
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      perform();
    }
    return () => {
      abortController.abort();
    };
  }, [completeCaseType]);

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
      }}
    >
      <ResponseHandler
        error={completeCaseTypeError || sideEffectError}
        isPending={isCompleteCaseTypePending || isSideEffectLoading}
        loadingMessage={t`Loading dashboard`}
      >
        <EpiStoreLoaderContent
          caseSet={caseSet}
          completeCaseType={completeCaseType}
        >
          {children}
        </EpiStoreLoaderContent>
      </ResponseHandler>
    </Box>
  );
};
