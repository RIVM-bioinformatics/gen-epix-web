import {
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useStore } from 'zustand';
import { t } from 'i18next';
import { useShallow } from 'zustand/shallow';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import {
  Box,
  Typography,
  type BoxProps,
} from '@mui/material';

import { EpiStoreContext } from '../../../stores';
import { GenericForm } from '../../form';
import {
  EpiCaseUtil,
  QueryUtil,
  ObjectUtil,
  FormUtil,
} from '../../../utils';
import { Spinner } from '../../ui';
import { QUERY_KEY } from '../../../models';
import { useOrganizations } from '../../../dataHooks';
import { NotificationManager } from '../../../classes';
import type { Case } from '../../../api';
import { CaseApi } from '../../../api';

export type EpiCaseFormProps = {
  readonly epiCase: Case;
  readonly formId: string;
  readonly onFinish: () => void;
  readonly onIsSavingChange: (isSaving: boolean) => void;
} & BoxProps;

export const EpiCaseForm = ({ epiCase, formId, onFinish, onIsSavingChange, ...boxProps }: EpiCaseFormProps) => {
  const organizationsQueryResult = useOrganizations();
  const epiStore = useContext(EpiStoreContext);
  const completeCaseType = useStore(epiStore, (state) => state.completeCaseType);
  const schema = useMemo(() => EpiCaseUtil.createYupSchema(completeCaseType), [completeCaseType]);
  const formFieldDefinitions = useMemo(() => EpiCaseUtil.createFormFieldDefinitions(completeCaseType, organizationsQueryResult), [completeCaseType, organizationsQueryResult]);
  const mutateCachedCase = useStore(epiStore, useShallow((state) => state.mutateCachedCase));
  const [isSaving, setIsSaving] = useState(false);

  const onFormSubmit = useCallback((content: Case['content']) => {
    setIsSaving(true);
    onIsSavingChange(true);
    const perform = async () => {
      const queryKeys = QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASES], true);
      const notificationKey = NotificationManager.instance.showNotification({
        message: t('Saving case data...'),
        severity: 'info',
        isLoading: true,
      });
      try {
        await QueryUtil.cancelQueries(queryKeys);
        const item = {
          ...epiCase,
          content: ObjectUtil.mergeWithUndefined(epiCase.content, content),
        };
        await CaseApi.getInstance().casesPutOne(item.id, item);
        mutateCachedCase(item.id, item);
        NotificationManager.instance.fulfillNotification(notificationKey, t('Successfully saved case data.'), 'success');
      } catch (_error) {
        NotificationManager.instance.fulfillNotification(notificationKey, t('Could not save case data.'), 'error');
      } finally {
        await QueryUtil.invalidateQueryKeys(queryKeys);
        setIsSaving(false);
        onIsSavingChange(false);
        onFinish();
      }
    };
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [epiCase, mutateCachedCase, onFinish, onIsSavingChange]);

  const values = useMemo<Case['content']>(() => FormUtil.createFormValues(formFieldDefinitions, epiCase.content), [formFieldDefinitions, epiCase.content]);
  const formMethods = useForm<Case['content']>({
    resolver: yupResolver(schema) as unknown as Resolver<Case['content']>,
    values,
  });
  const { handleSubmit } = formMethods;

  return (
    <Box {...boxProps}>
      <Typography variant={'h6'}>
        {t`Content`}
      </Typography>
      {isSaving && (
        <Spinner
          inline
          label={t`Saving case data`}
        />
      )}
      {!isSaving && (

        <GenericForm<Case['content']>
          formFieldDefinitions={formFieldDefinitions}
          formId={formId}
          formMethods={formMethods}
          onSubmit={handleSubmit(onFormSubmit)}
        />
      )}
    </Box>
  );
};
