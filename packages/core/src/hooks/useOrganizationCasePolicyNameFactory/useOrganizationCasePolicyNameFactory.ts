import { useMemo } from 'react';

import type {
  OrganizationAccessCasePolicy,
  OrganizationShareCasePolicy,
} from '@gen_epix/api';

import {
  useCaseTypeSetsMap,
  useDataCollectionsMap,
  useOrganizationMap,
} from '../../dataHooks';
import type { UseNameFactory } from '../../models';
import { DataUtil } from '../../utils';

export const useOrganizationCasePolicyNameFactory = (): UseNameFactory<OrganizationAccessCasePolicy | OrganizationShareCasePolicy> => {
  const organizationsMap = useOrganizationMap();
  const dataCollectionsMap = useDataCollectionsMap();
  const caseTypeSetsMap = useCaseTypeSetsMap();

  return useMemo(() => {
    const getName = (item: OrganizationAccessCasePolicy | OrganizationShareCasePolicy) => {

      const organization = organizationsMap.map.get(item.organization_id);
      const dataCollection = dataCollectionsMap.map.get(item.data_collection_id)?.name ?? item.data_collection_id;
      const caseTypeSet = caseTypeSetsMap.map.get(item.case_type_set_id)?.name ?? item.case_type_set_id;

      return `${organization.name} → ${dataCollection} → ${caseTypeSet}`;
    };

    return DataUtil.createUseNameFactoryHook(getName, [caseTypeSetsMap, organizationsMap, dataCollectionsMap]);

  }, [caseTypeSetsMap, organizationsMap, dataCollectionsMap]);
};
