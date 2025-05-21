import type { ReactElement } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import type {
  CaseSet,
  TypedUuidSetFilter,
} from '@gen_epix/api';
import { CaseApi } from '@gen_epix/api';

import {
  withDialog,
  type WithDialogRefMethods,
  type WithDialogRenderProps,
} from '../../../hoc/withDialog';
import {
  ResponseHandler,
  Spinner,
  Confirmation,
} from '../../ui';
import {
  TestIdUtil,
  EpiCaseSetUtil,
  QueryUtil,
} from '../../../utils';
import type {
  DialogAction,
  ConfirmationRefMethods,
} from '../../ui';
import { QUERY_KEY } from '../../../models';
import {
  useDeleteMutation,
  useItemQuery,
} from '../../../hooks';
import { RouterManager } from '../../../classes';
import {
  useCaseSetRights,
  useDataCollectionOptions,
  useDataCollections,
  useDataCollectionsMap,
} from '../../../dataHooks';
import { EpiCaseAbacProvider } from '../../../context';
import type { EpiCaseAbacContextValue } from '../../../context';

import { EpiCaseSetContent } from './EpiCaseSetContent';
import { EpiCaseSetForm } from './EpiCaseSetForm';
import { EpiCaseSetSharingInfo } from './EpiCaseSetSharingInfo';
import { EpiCaseSetSharingForm } from './EpiCaseSetSharingForm';
import { EpiCaseSetDescription } from './EpiCaseSetDescription';


export interface EpiCaseSetInfoDialogOpenProps {
  readonly caseSetId: string;
}

export interface EpiCaseSetInfoDialogProps extends WithDialogRenderProps<EpiCaseSetInfoDialogOpenProps> {
  readonly showNavigationButton?: boolean;
}

export type EpiCaseSetInfoDialogRefMethods = WithDialogRefMethods<EpiCaseSetInfoDialogProps, EpiCaseSetInfoDialogOpenProps>;

export const EpiCaseSetInfoDialog = withDialog<EpiCaseSetInfoDialogProps, EpiCaseSetInfoDialogOpenProps>((
  {
    onTitleChange,
    onActionsChange,
    onPermalinkChange,
    openProps,
    onClose,
    showNavigationButton,
  }: EpiCaseSetInfoDialogProps,
): ReactElement => {
  const [t] = useTranslation();
  const caseSetIds = useMemo(() => [openProps.caseSetId], [openProps.caseSetId]);
  const caseSetRightsQuery = useCaseSetRights(caseSetIds);
  const dataCollectionsQuery = useDataCollections();
  const dataCollectionsMapQuery = useDataCollectionsMap();
  const dataCollectionOptionsQuery = useDataCollectionOptions();
  const [isEditingCaseSetContent, setIsEditingCaseSetContent] = useState(false);
  const [isEditingDataCollections, setIsEditingDataCollections] = useState(false);
  const [isEpiCaseSetFormSaving, setIsEpiCaseSetFormSaving] = useState(false);
  const [isEpiCaseSetDataCollectionFormSaving, setIsEpiCaseSetDataCollectionFormSaving] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const deleteConfirmation = useRef<ConfirmationRefMethods>(null);
  const valuesFormId = useId();
  const dataCollectionsFormId = useId();
  const loadables = useMemo(() => [caseSetRightsQuery, dataCollectionsQuery, dataCollectionsMapQuery, dataCollectionOptionsQuery], [caseSetRightsQuery, dataCollectionsQuery, dataCollectionsMapQuery, dataCollectionOptionsQuery]);


  // eslint-disable-next-line @typescript-eslint/require-await
  const onDeleteSuccess = useCallback(async () => {
    onClose();
  }, [onClose]);

  // eslint-disable-next-line @typescript-eslint/require-await
  const onDeleteError = useCallback(async () => {
    onClose();
  }, [onClose]);

  const { mutate: deleteMutate, isMutating: isDeleteMutating } = useDeleteMutation<CaseSet>({
    resourceQueryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS),
    associationQueryKeys: QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASE_SETS], true),
    queryFn: async (item: CaseSet) => {
      return await CaseApi.getInstance().caseSetsDeleteOne(item.id);
    },
    getProgressNotificationMessage: (data) => t('Deleting event: {{name}}...', { name: data.name }),
    getSuccessNotificationMessage: (data) => t('Event: {{name}}, has been removed.', { name: data.name }),
    getErrorNotificationMessage: (data) => t('Unable to remove event: {{name}}.', { name: data.name }),
    onSuccess: onDeleteSuccess,
    onError: onDeleteError,
  });

  const { isLoading: isCaseSetLoading, error: caseSetError, data: caseSet } = useItemQuery<CaseSet>({
    baseQueryKey: QUERY_KEY.CASE_SETS,
    itemId: openProps.caseSetId,
    useQueryOptions: {
      queryFn: async ({ signal }) => {
        const response = await CaseApi.getInstance().caseSetsGetOne(openProps.caseSetId, { signal });
        return response.data;
      },
      enabled: !isDeleteMutating,
    },
  });

  const caseSetDataCollectionLinksFilter = useMemo<TypedUuidSetFilter>(() => ({
    invert: false,
    key: 'case_set_id',
    type: 'UUID_SET',
    members: [caseSet?.id],
  }), [caseSet?.id]);
  const { isPending: isSetCaseDataCollectionLinksLoading, error: caseSetDataCollectionLinksError, data: caseSetDataCollectionLinks } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_DATA_COLLECTION_LINKS, caseSetDataCollectionLinksFilter),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseSetDataCollectionLinksPostQuery(caseSetDataCollectionLinksFilter, { signal });
      return response.data;
    },
    enabled: !!caseSet && !isDeleteMutating,
  });

  const canEdit = useMemo(() => {
    return !!caseSetRightsQuery.data && caseSetRightsQuery.data.some((caseSetRight) => caseSetRight.write_case_set);
  }, [caseSetRightsQuery.data]);

  const canShare = useMemo(() => {
    return !!caseSetRightsQuery.data && caseSetRightsQuery.data.some((caseSetRight) => caseSetRight.remove_data_collection_ids.length || caseSetRight.add_data_collection_ids.length);
  }, [caseSetRightsQuery.data]);

  const canDelete = useCallback(() => {
    return !!caseSetRightsQuery.data && caseSetRightsQuery.data.some((caseSetRight) => caseSetRight.can_delete);
  }, [caseSetRightsQuery]);

  const onEditCaseContentButtonClick = useCallback(() => {
    setIsEditingCaseSetContent(true);
  }, []);

  const onEditDataCollectionsButtonClick = useCallback(() => {
    setIsEditingDataCollections(true);
  }, []);

  const onCancelButtonClick = useCallback(() => {
    setIsEditingCaseSetContent(false);
    setIsEditingDataCollections(false);
  }, []);

  const onFinish = useCallback(() => {
    // FIXME refresh epi store data
    setIsEpiCaseSetFormSaving(false);
    setIsEpiCaseSetDataCollectionFormSaving(false);
    setIsRefreshingData(true);
    setIsEditingCaseSetContent(false);
    setIsEditingDataCollections(false);
    setIsRefreshingData(false);
  }, []);

  const onEpiCaseSetFormIsSavingChange = useCallback((isSaving: boolean) => {
    setIsEpiCaseSetFormSaving(isSaving);
  }, []);

  const onEpiCaseSetDataCollectionFormIsSavingChange = useCallback((isSaving: boolean) => {
    setIsEpiCaseSetDataCollectionFormSaving(isSaving);
  }, []);

  const onDeleteEventButtonClick = useCallback(() => {
    deleteConfirmation.current.open();
  }, []);

  const onDeleteConfirmationConfirm = useCallback(() => {
    deleteMutate(caseSet);
  }, [caseSet, deleteMutate]);

  const isSaving = isEpiCaseSetFormSaving || isEpiCaseSetDataCollectionFormSaving;

  const onGotoEventButtonClick = useCallback(async () => {
    await RouterManager.instance.router.navigate(EpiCaseSetUtil.createCaseSetLink(caseSet));
  }, [caseSet]);

  useEffect(() => {
    onPermalinkChange(EpiCaseSetUtil.createCaseSetLink(caseSet, true));
  }, [caseSet, onPermalinkChange]);

  useEffect(() => {
    if (!caseSet) {
      onTitleChange(t`Loading`);
    } else if (isEditingCaseSetContent) {
      onTitleChange(t('{{name}} - Edit', { name: caseSet.name }));
    } else if (isEditingDataCollections) {
      onTitleChange(t('{{name}} - Share', { name: caseSet.name }));
    } else {
      onTitleChange(caseSet?.name);
    }
  }, [isEditingDataCollections, isEditingCaseSetContent, onTitleChange, t, caseSet]);

  useEffect(() => {
    const actions: DialogAction[] = [];

    if (isEditingCaseSetContent || isEditingDataCollections) {
      actions.push({
        ...TestIdUtil.createAttributes('EpiCaseSetInfoDialog-cancelButton'),
        color: 'primary',
        variant: 'outlined',
        label: t`Cancel`,
        onClick: onCancelButtonClick,
        disabled: isSaving,
      });
    }

    if (isEditingCaseSetContent) {
      actions.push(
        {
          ...TestIdUtil.createAttributes('EpiCaseSetInfoDialog-saveButton'),
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
          ...TestIdUtil.createAttributes('EpiCaseSetInfoDialog-saveButton'),
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
        {
          ...TestIdUtil.createAttributes('EpiCaseSetInfoDialog-editDataCollectionsButton'),
          color: 'primary',
          variant: 'outlined',
          onClick: onEditDataCollectionsButtonClick,
          label: t`Share`,
          startIcon: <ShareIcon />,
          disabled: !canShare,
        },
        {
          ...TestIdUtil.createAttributes('EpiCaseSetInfoDialog-editCaseContentButton'),
          color: 'primary',
          variant: 'outlined',
          onClick: onEditCaseContentButtonClick,
          label: t`Edit`,
          startIcon: <EditIcon />,
          disabled: !canEdit,
        },
      );

      if (showNavigationButton) {
        actions.push(
          {
            ...TestIdUtil.createAttributes('EpiCaseSetInfoDialog-goToEvent'),
            color: 'secondary',
            autoFocus: true,
            onClick: onGotoEventButtonClick,
            variant: 'contained',
            label: t`Go to event`,
          },
        );
      }
    }


    onActionsChange(actions);
  }, [onActionsChange, showNavigationButton, onClose, onGotoEventButtonClick, t, caseSet, isEditingCaseSetContent, isEditingDataCollections, onCancelButtonClick, isSaving, valuesFormId, dataCollectionsFormId, onEditDataCollectionsButtonClick, onEditCaseContentButtonClick, onDeleteEventButtonClick, canEdit, canShare, canDelete]);

  const caseAbacContextValue = useMemo<EpiCaseAbacContextValue>(() => {
    return {
      userDataCollections: dataCollectionsQuery.data,
      userDataCollectionsMap: dataCollectionsMapQuery.map,
      userDataCollectionOptions: dataCollectionOptionsQuery.options,
      itemDataCollectionLinks: [caseSetDataCollectionLinks],
      rights: caseSetRightsQuery.data,
    };
  }, [caseSetDataCollectionLinks, caseSetRightsQuery.data, dataCollectionOptionsQuery.options, dataCollectionsMapQuery.map, dataCollectionsQuery.data]);

  if (isRefreshingData || isDeleteMutating) {
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
        error={caseSetError || caseSetDataCollectionLinksError}
        inlineSpinner
        isPending={isCaseSetLoading || isSetCaseDataCollectionLinksLoading}
        loadables={loadables}
        shouldHideActionButtons
      >
        <EpiCaseAbacProvider caseAbac={caseAbacContextValue}>
          {!isEditingCaseSetContent && !isEditingDataCollections && (
            <>
              <EpiCaseSetContent
                caseSet={caseSet}
                marginBottom={2}
              />
              <EpiCaseSetSharingInfo
                marginBottom={2}
              />
              <EpiCaseSetDescription
                caseSet={caseSet}
                marginBottom={2}
              />
            </>
          )}

          {isEditingCaseSetContent && (
            <EpiCaseSetForm
              caseSet={caseSet}
              formId={valuesFormId}
              onFinish={onFinish}
              onIsSavingChange={onEpiCaseSetFormIsSavingChange}
            />
          )}

          {isEditingDataCollections && (
            <EpiCaseSetSharingForm
              caseSet={caseSet}
              formId={dataCollectionsFormId}
              onFinish={onFinish}
              onIsSavingChange={onEpiCaseSetDataCollectionFormIsSavingChange}
            />
          )}
        </EpiCaseAbacProvider>
      </ResponseHandler>
      <Confirmation
        body={t`Are you sure you want to delete the event?`}
        cancelLabel={t`Cancel`}
        confirmLabel={t`Delete`}
        onConfirm={onDeleteConfirmationConfirm}
        ref={deleteConfirmation}
        title={t`Delete event?`}
      />

    </>
  );
}, {
  testId: 'EpiCaseSetInfoDialog',
  titleVariant: 'h2',
  maxWidth: 'lg',
  fullWidth: true,
});
