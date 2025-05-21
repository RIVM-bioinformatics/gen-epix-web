import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
  boolean,
  object,
  string,
} from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import difference from 'lodash/difference';
import type { BoxProps } from '@mui/material';
import { Box } from '@mui/material';

import type { CaseSet } from '@gen_epix/api';
import { CaseApi } from '@gen_epix/api';

import {
  type FormFieldDefinition,
  FORM_FIELD_DEFINITION_TYPE,
} from '../../../models';
import { GenericForm } from '../../form';
import { QUERY_KEY } from '../../../models';
import {
  QueryUtil,
  FormUtil,
  EpiCaseUtil,
} from '../../../utils';
import { Spinner } from '../../ui';
import { NotificationManager } from '../../../classes';
import { useEpiCaseAbacContext } from '../../../context';

export type EpiCaseSetSharingFormProps = {
  readonly caseSet: CaseSet;
  readonly formId: string;
  readonly onFinish: () => void;
  readonly onIsSavingChange: (isSaving: boolean) => void;
} & BoxProps;

type FormFields = {
  dataCollectionIds: string[];
  shouldApplySharingToCases: boolean;
};

export const EpiCaseSetSharingForm = ({ formId, caseSet, onFinish, onIsSavingChange, ...boxProps }: EpiCaseSetSharingFormProps) => {
  const [t] = useTranslation();
  const [isSaving, setIsSaving] = useState(false);

  const schema = useMemo(() => object<FormFields>().shape({
    dataCollectionIds: array().of(string().uuid4()).required(),
    shouldApplySharingToCases: boolean().required(),
  }), []);

  const caseAbacContext = useEpiCaseAbacContext();

  const onFormSubmit = useCallback(({ dataCollectionIds, shouldApplySharingToCases }: FormFields) => {
    const perform = async () => {
      setIsSaving(true);
      onIsSavingChange(true);
      const queryKeys = QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASE_SET_DATA_COLLECTION_LINKS], true);
      const notificationKey = NotificationManager.instance.showNotification({
        message: t('Saving case set data collections...'),
        severity: 'info',
        isLoading: true,
      });
      try {
        await QueryUtil.cancelQueries(queryKeys);
        const rights = caseAbacContext?.rights?.[0];
        const dataCollectionIdsToAdd = difference(dataCollectionIds, rights.shared_in_data_collection_ids);
        const dataCollectionIdsToRemove = difference(rights.shared_in_data_collection_ids, dataCollectionIds);

        if (dataCollectionIdsToAdd.length > 0) {
          await CaseApi.getInstance().caseSetDataCollectionLinksPostSome(dataCollectionIdsToAdd.map(data_collection_id => ({
            case_set_id: caseSet.id,
            data_collection_id,
          })));
        }
        if (dataCollectionIdsToRemove.length > 0) {
          await CaseApi.getInstance().caseSetDataCollectionLinksDeleteSome(caseAbacContext.itemDataCollectionLinks[0]?.filter(x => dataCollectionIdsToRemove.includes(x.data_collection_id)).map(x => x.id).join(','));
        }
        NotificationManager.instance.fulfillNotification(notificationKey, t('Successfully saved case set data collections.'), 'success');
      } catch (_error) {
        NotificationManager.instance.fulfillNotification(notificationKey, t('Could not save case set data collections.'), 'error');
      } finally {
        await QueryUtil.invalidateQueryKeys(queryKeys);
        if (shouldApplySharingToCases) {
          await EpiCaseUtil.applyDataCollectionLinks({
            caseSetId: caseSet.id,
            caseSetDataCollectionIds: dataCollectionIds,
          });
        }

        setIsSaving(false);
        onIsSavingChange(false);
        onFinish();
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [onIsSavingChange, t, caseAbacContext?.rights, caseAbacContext.itemDataCollectionLinks, caseSet.id, onFinish]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => [
    {
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      name: 'dataCollectionIds',
      label: t`Data collections`,
      options: caseAbacContext?.itemDataCollectionOptions?.[0] ?? [],
      multiple: true,
    },
    {
      definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
      name: 'shouldApplySharingToCases',
      label: t`Should the same sharing be applied to the cases in the event?`,
    },
  ], [caseAbacContext?.itemDataCollectionOptions, t]);

  const item = useMemo<FormFields>(() => {
    return {
      dataCollectionIds: caseAbacContext?.rights?.[0]?.shared_in_data_collection_ids ?? [],
      shouldApplySharingToCases: true,
    };
  }, [caseAbacContext?.rights]);

  const values = useMemo<FormFields>(() => FormUtil.createFormValues(formFieldDefinitions, item), [formFieldDefinitions, item]);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema),
    values,
  });
  const { handleSubmit } = formMethods;


  if (isSaving) {
    return (
      <Spinner
        inline
        label={t`Saving case set data collections`}
      />
    );
  }

  return (
    <Box {...boxProps}>
      <GenericForm<FormFields>
        formFieldDefinitions={formFieldDefinitions}
        formId={formId}
        formMethods={formMethods}
        onSubmit={handleSubmit(onFormSubmit)}
      />
    </Box>
  );
};
