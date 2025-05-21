import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  useEffect,
  useMemo,
} from 'react';

import { CaseApi } from '@gen_epix/api';

import {
  EpiDashboard,
  ResponseHandler,
  PageContainer,
} from '../../components';
import { TestIdUtil } from '../../utils';
import { useCaseTypeMap } from '../../dataHooks';
import {
  useUpdateBreadcrumb,
  useItemQuery,
} from '../../hooks';
import { QUERY_KEY } from '../../models';

export const EventsDetailPage = () => {
  const [t] = useTranslation();
  const { caseSetId, slug } = useParams();

  const caseTypesMap = useCaseTypeMap();
  const updateBreadcrumb = useUpdateBreadcrumb('Event');

  const { isPending, error, data: caseSet } = useItemQuery({
    baseQueryKey: QUERY_KEY.CASE_SETS,
    itemId: caseSetId,
    useQueryOptions: {
      queryFn: async ({ signal }) => (await CaseApi.getInstance().caseSetsGetOne(caseSetId, { signal })).data,
    },
  });

  const title = useMemo(() => {
    if (!caseSet) {
      return t`Event`;
    }
    const caseTypeName = caseTypesMap.isLoading || !caseTypesMap.map.has(caseSet.case_type_id) ? '⌛' : caseTypesMap.map.get(caseSet.case_type_id).name;

    return `${caseSet.name} (${caseTypeName})`;
  }, [caseSet, caseTypesMap.isLoading, caseTypesMap.map, t]);

  useEffect(() => {
    updateBreadcrumb(title);
  }, [title, updateBreadcrumb]);

  const loadables = useMemo(() => [caseTypesMap], [caseTypesMap]);

  return (
    <PageContainer
      fullHeight
      fullWidth
      showBreadcrumbs
      testIdAttributes={TestIdUtil.createAttributes('EventsDetailPage', { 'case-set-id': caseSetId, slug })}
      title={title}
    >
      <ResponseHandler
        error={error}
        isPending={isPending}
        loadables={loadables}
      >
        <EpiDashboard
          caseSet={caseSet}
          caseTypeId={caseSet?.case_type_id}
        />
      </ResponseHandler>
    </PageContainer>
  );
};
