import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { useQuery } from '@tanstack/react-query';

import type {
  Case,
  TypedUuidSetFilter,
} from '@gen_epix/api';
import { CaseApi } from '@gen_epix/api';

import {
  withDialog,
  type WithDialogRefMethods,
  type WithDialogRenderProps,
} from '../../../hoc/withDialog';
import {
  TestIdUtil,
  QueryUtil,
} from '../../../utils';
import type {
  DialogAction,
  ConfirmationRefMethods,
} from '../../ui';
import { EpiStoreContext } from '../../../stores';
import {
  Spinner,
  ResponseHandler,
  Confirmation,
} from '../../ui';
import {
  useItemQuery,
  useDeleteMutation,
} from '../../../hooks';
import { QUERY_KEY } from '../../../models';
import {
  useCaseRights,
  useDataCollections,
  useDataCollectionsMap,
  useDataCollectionOptions,
} from '../../../dataHooks';
import type { EpiCaseAbacContextValue } from '../../../context/epiCaseAbac/EpiCaseAbacContext';
import { EpiCaseAbacProvider } from '../../../context/epiCaseAbac';

import { EpiCaseSharingForm } from './EpiCaseSharingForm';
import { EpiCaseSharingInfo } from './EpiCaseSharingInfo';
import { EpiCaseContent } from './EpiCaseContent';
import { EpiReadOnlyCaseContent } from './EpiReadOnlyCaseContent';
import { EpiCaseForm } from './EpiCaseForm';
import { EpiCaseCaseSetInfo } from './EpiCaseCaseSetInfo';


export interface EpiCaseInfoDialogOpenProps {
  caseId: string;
}

export interface EpiCaseInfoDialogProps extends WithDialogRenderProps<EpiCaseInfoDialogOpenProps> {
  //
}

export type EpiCaseInfoDialogRefMethods = WithDialogRefMethods<EpiCaseInfoDialogProps, EpiCaseInfoDialogOpenProps>;

export const EpiCaseInfoDialog = withDialog<EpiCaseInfoDialogProps, EpiCaseInfoDialogOpenProps>((
  {
    openProps,
    onActionsChange,
    onTitleChange,
    onClose,
  }: EpiCaseInfoDialogProps,
): ReactElement => {
  const [t] = useTranslation();
  const caseIds = useMemo(() => [openProps.caseId], [openProps.caseId]);
  const caseRightsQuery = useCaseRights(caseIds);
  const dataCollectionsQuery = useDataCollections();
  const dataCollectionsMapQuery = useDataCollectionsMap();
  const dataCollectionOptionsQuery = useDataCollectionOptions();

  const epiStore = useContext(EpiStoreContext);
  const fetchData = useStore(epiStore, useShallow((state) => state.fetchData));
  const [isEditingCaseContent, setIsEditingCaseContent] = useState(false);
  const [isEditingDataCollections, setIsEditingDataCollections] = useState(false);
  const [isEpiCaseFormSaving, setIsEpiCaseFormSaving] = useState(false);
  const [isEpiCaseDataCollectionFormSaving, setIsEpiCaseDataCollectionFormSaving] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const deleteConfirmation = useRef<ConfirmationRefMethods>(null);
  const valuesFormId = useId();
  const dataCollectionsFormId = useId();
  const loadables = useMemo(() => [caseRightsQuery, dataCollectionsQuery, dataCollectionsMapQuery, dataCollectionOptionsQuery], [caseRightsQuery, dataCollectionsQuery, dataCollectionsMapQuery, dataCollectionOptionsQuery]);

  // eslint-disable-next-line @typescript-eslint/require-await
  const onDeleteSuccess = useCallback(async () => {
    onClose();
  }, [onClose]);

  // eslint-disable-next-line @typescript-eslint/require-await
  const onDeleteError = useCallback(async () => {
    onClose();
  }, [onClose]);

  const { mutate: deleteMutate, isMutating: isDeleteMutating } = useDeleteMutation<Case>({
    resourceQueryKey: QueryUtil.getGenericKey(QUERY_KEY.CASES),
    associationQueryKeys: QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASES], true),
    queryFn: async (item: Case) => {
      return await CaseApi.getInstance().casesDeleteOne(item.id);
    },
    getProgressNotificationMessage: (data) => t('Deleting case: {{id}}...', { name: data.id }),
    getSuccessNotificationMessage: (data) => t('Case: {{id}}, has been removed.', { name: data.id }),
    getErrorNotificationMessage: (data) => t('Unable to remove case: {{id}}.', { name: data.id }),
    onSuccess: onDeleteSuccess,
    onError: onDeleteError,
  });

  const { isLoading: epiCaseIsLoading, error: epiCaseError, data: epiCase } = useItemQuery<Case>({
    baseQueryKey: QUERY_KEY.CASES_LAZY,
    itemId: openProps.caseId,
    useQueryOptions: {
      queryFn: async ({ signal }) => {
        const response = await CaseApi.getInstance().casesGetOne(openProps.caseId, { signal });
        return response.data;
      },
      enabled: !isDeleteMutating,
    },
  });

  const caseDataCollectionLinksFilter = useMemo<TypedUuidSetFilter>(() => ({
    invert: false,
    key: 'case_id',
    type: 'UUID_SET',
    members: [epiCase?.id],
  }), [epiCase?.id]);
  const { isPending: isCaseDataCollectionLinksLoading, error: caseDataCollectionLinksError, data: caseDataCollectionLinks } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_DATA_COLLECTION_LINKS, caseDataCollectionLinksFilter),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseDataCollectionLinksPostQuery(caseDataCollectionLinksFilter, { signal });
      return response.data;
    },
    enabled: !!epiCase,
  });


  const canEdit = useMemo(() => {
    return !!caseRightsQuery.data && caseRightsQuery.data.some((right) => right.write_case_type_col_ids.length);
  }, [caseRightsQuery.data]);

  const canShare = useMemo(() => {
    return !!caseRightsQuery.data && caseRightsQuery.data.some((right) => right.remove_data_collection_ids.length || right.add_data_collection_ids.length);
  }, [caseRightsQuery.data]);

  const canDelete = useCallback(() => {
    return !!caseRightsQuery.data && caseRightsQuery.data.some((right) => right.can_delete);
  }, [caseRightsQuery]);

  const onEditButtonClick = useCallback(() => {
    setIsEditingCaseContent(true);
  }, []);

  const onShareButtonClick = useCallback(() => {
    setIsEditingDataCollections(true);
  }, []);

  const onCancelButtonClick = useCallback(() => {
    setIsEditingCaseContent(false);
    setIsEditingDataCollections(false);
  }, []);

  const onFinish = useCallback(() => {
    const perform = async () => {
      setIsEpiCaseFormSaving(false);
      setIsEpiCaseDataCollectionFormSaving(false);
      setIsRefreshingData(true);
      setIsEditingCaseContent(false);
      setIsEditingDataCollections(false);
      await fetchData();
      setIsRefreshingData(false);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [fetchData]);


  const onEpiCaseFormIsSavingChange = useCallback((isSaving: boolean) => {
    setIsEpiCaseFormSaving(isSaving);
  }, []);

  const onEpiCaseDataCollectionFormIsSavingChange = useCallback((isSaving: boolean) => {
    setIsEpiCaseDataCollectionFormSaving(isSaving);
  }, []);

  const onDeleteEventButtonClick = useCallback(() => {
    deleteConfirmation.current.open();
  }, []);

  const onDeleteConfirmationConfirm = useCallback(() => {
    deleteMutate(epiCase);
  }, [epiCase, deleteMutate]);

  const isSaving = isEpiCaseFormSaving || isEpiCaseDataCollectionFormSaving;

  useEffect(() => {
    if (isEditingCaseContent) {
      onTitleChange(t`Case information - Edit`);
    } else if (isEditingDataCollections) {
      onTitleChange(t`Case information - Share`);
    } else {
      onTitleChange(t`Case information`);
    }
  }, [isEditingDataCollections, isEditingCaseContent, onTitleChange, t]);

  useEffect(() => {
    const actions: DialogAction[] = [];

    if (isEditingCaseContent || isEditingDataCollections) {
      actions.push({
        ...TestIdUtil.createAttributes('EpiCaseInfoDialog-cancelButton'),
        color: 'primary',
        variant: 'outlined',
        label: t`Cancel`,
        onClick: onCancelButtonClick,
        disabled: isSaving,
      });
    }

    if (isEditingCaseContent) {
      actions.push(
        {
          ...TestIdUtil.createAttributes('EpiCaseInfoDialog-saveButton'),
          color: 'secondary',
          variant: 'contained',
          form: valuesFormId,
          type: 'submit',
          label: t`Save`,
          startIcon: <SaveIcon />,
          disabled: isSaving,
        },
      );
    } else if (isEditingDataCollections) {
      actions.push(
        {
          ...TestIdUtil.createAttributes('EpiCaseInfoDialog-saveButton'),
          color: 'secondary',
          variant: 'contained',
          form: dataCollectionsFormId,
          type: 'submit',
          label: t`Save`,
          startIcon: <SaveIcon />,
          disabled: isSaving,
        },
      );
    } else {
      actions.push(
        {
          ...TestIdUtil.createAttributes('EpiCaseSetInfoDialog-deleteButton'),
          color: 'primary',
          variant: 'outlined',
          onClick: onDeleteEventButtonClick,
          label: t`Delete`,
          startIcon: <DeleteIcon />,
          disabled: !canDelete(),
        },
      );
      actions.push(
        {
          ...TestIdUtil.createAttributes('EpiCaseInfoDialog-editDataCollectionsButton'),
          color: 'primary',
          variant: 'outlined',
          onClick: onShareButtonClick,
          label: t`Sharing`,
          startIcon: <ShareIcon />,
          disabled: !canShare,
        },
      );
      actions.push(
        {
          ...TestIdUtil.createAttributes('EpiCaseInfoDialog-editCaseContentButton'),
          color: 'primary',
          variant: 'outlined',
          onClick: onEditButtonClick,
          label: t`Edit`,
          startIcon: <EditIcon />,
          disabled: !canEdit,
        },
      );
    }
    onActionsChange(actions);
  }, [onActionsChange, onEditButtonClick, t, isEditingCaseContent, onCancelButtonClick, onShareButtonClick, isEditingDataCollections, valuesFormId, dataCollectionsFormId, onClose, isSaving, canShare, onDeleteEventButtonClick, canDelete, canEdit]);

  const caseAbacContextValue = useMemo<EpiCaseAbacContextValue>(() => {
    return {
      userDataCollections: dataCollectionsQuery.data,
      userDataCollectionsMap: dataCollectionsMapQuery.map,
      userDataCollectionOptions: dataCollectionOptionsQuery.options,
      itemDataCollectionLinks: [caseDataCollectionLinks],
      rights: caseRightsQuery.data,
    };
  }, [dataCollectionsQuery.data, dataCollectionsMapQuery.map, dataCollectionOptionsQuery.options, caseDataCollectionLinks, caseRightsQuery.data]);

  if (isRefreshingData) {
    return (
      <Spinner
        inline
        label={t`Refreshing data`}
      />
    );
  }

  return (
    <>
      <ResponseHandler
        error={epiCaseError || caseDataCollectionLinksError}
        inlineSpinner
        isPending={epiCaseIsLoading || isCaseDataCollectionLinksLoading}
        loadables={loadables}
        shouldHideActionButtons
      >
        <EpiCaseAbacProvider caseAbac={caseAbacContextValue}>
          <EpiReadOnlyCaseContent
            epiCase={epiCase}
            marginBottom={2}
          />
          {!isEditingCaseContent && !isEditingDataCollections && (
            <>
              <EpiCaseSharingInfo
                marginBottom={2}
              />
              <EpiCaseCaseSetInfo
                epiCase={epiCase}
                marginBottom={2}
              />
              <EpiCaseContent
                epiCase={epiCase}
                marginBottom={2}
              />
            </>
          )}
          {isEditingCaseContent && (
            <EpiCaseForm
              epiCase={epiCase}
              formId={valuesFormId}
              onFinish={onFinish}
              onIsSavingChange={onEpiCaseFormIsSavingChange}
            />
          )}
          {isEditingDataCollections && (
            <EpiCaseSharingForm
              epiCase={epiCase}
              formId={dataCollectionsFormId}
              onFinish={onFinish}
              onIsSavingChange={onEpiCaseDataCollectionFormIsSavingChange}
            />
          )}
        </EpiCaseAbacProvider>
      </ResponseHandler>
      <Confirmation
        body={t`Are you sure you want to delete the case?`}
        cancelLabel={t`Cancel`}
        confirmLabel={t`Delete`}
        onConfirm={onDeleteConfirmationConfirm}
        ref={deleteConfirmation}
        title={t`Delete case?`}
      />
    </>
  );
}, {
  testId: 'EpiCaseInfoDialog',
  maxWidth: 'lg',
  fullWidth: true,
});
