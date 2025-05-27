import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useCaseTypeSetsMap,
  useDataCollectionsMap,
  useUsersMap,
} from '../../dataHooks';
import type { UseNameFactory } from '../../models';
import { DataUtil } from '../../utils';
import type {
  UserAccessCasePolicy,
  UserShareCasePolicy,
} from '../../api';

export const useUserCasePolicyNameFactory = (): UseNameFactory<UserAccessCasePolicy | UserShareCasePolicy> => {
  const [t] = useTranslation();

  const usersMap = useUsersMap();
  const dataCollectionsMap = useDataCollectionsMap();
  const caseTypeSetsMap = useCaseTypeSetsMap();

  return useMemo(() => {
    const getName = (item: UserAccessCasePolicy | UserShareCasePolicy) => {

      const user = usersMap.map.get(item.user_id);
      const dataCollection = dataCollectionsMap.map.get(item.data_collection_id)?.name ?? item.data_collection_id;
      const caseTypeSet = caseTypeSetsMap.map.get(item.case_type_set_id)?.name ?? item.case_type_set_id;

      const userName = DataUtil.getUserDisplayValue(user, t);

      return `${userName} → ${dataCollection} → ${caseTypeSet}`;
    };

    return DataUtil.createUseNameFactoryHook(getName, [caseTypeSetsMap, usersMap, dataCollectionsMap]);

  }, [caseTypeSetsMap, usersMap, dataCollectionsMap, t]);
};
