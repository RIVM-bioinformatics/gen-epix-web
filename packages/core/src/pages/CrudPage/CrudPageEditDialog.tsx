import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
} from 'react';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';
import type {
  ObjectSchema,
  AnyObject,
} from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import {
  withDialog,
  type WithDialogRefMethods,
  type WithDialogRenderProps,
} from '../../hoc';
import {
  TestIdUtil,
  FormUtil,
} from '../../utils';
import type { DialogAction } from '../../components';
import { GenericForm } from '../../components';
import type {
  GenericData,
  FormFieldDefinition,
} from '../../models';


export interface CrudPageEditDialogOpenProps<TData extends GenericData> {
  readonly item?: TData;
  readonly hiddenFormFieldValues?: Partial<Record<keyof TData, unknown>>;
}
export interface CrudPageEditDialogProps<TData extends GenericData, TFormFields extends AnyObject> extends WithDialogRenderProps<CrudPageEditDialogOpenProps<TData>> {
  readonly onSave: (formValues: TFormFields, item: TData) => void;
  readonly formFieldDefinitions: FormFieldDefinition<TFormFields>[];
  readonly getName: (item: TData | TFormFields) => string;
  readonly schema: ObjectSchema<TFormFields>;
}
export type CrudPageEditDialogRefMethods<TData extends GenericData, TFormFields extends AnyObject> = WithDialogRefMethods<CrudPageEditDialogProps<TData, TFormFields>, CrudPageEditDialogOpenProps<TData>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CrudPageEditDialog = withDialog<CrudPageEditDialogProps<any, any>, CrudPageEditDialogOpenProps<any>>(<TData extends GenericData, TFormFields extends AnyObject>(
  {
    onSave,
    onClose,
    openProps,
    onTitleChange,
    onActionsChange,
    formFieldDefinitions,
    schema,
    getName,
  }: CrudPageEditDialogProps<TData, TFormFields>,
): ReactElement => {
  const [t] = useTranslation();
  const formId = useId();

  useEffect(() => {
    const actions: DialogAction[] = [];
    actions.push({
      ...TestIdUtil.createAttributes('CrudPageEditDialog-saveButton'),
      color: 'secondary',
      autoFocus: true,
      variant: 'contained',
      form: formId,
      type: 'submit',
      label: t`Save`,
      startIcon: <SaveIcon />,
      disabled: formFieldDefinitions.some(def => def.loading),
    });
    onActionsChange(actions);
  }, [onActionsChange, formId, t, formFieldDefinitions]);

  useEffect(() => {
    if (openProps.item) {
      onTitleChange(`Edit item: ${getName(openProps.item)}`);
    } else {
      onTitleChange(t`Create new item`);
    }
  }, [getName, onTitleChange, openProps, t]);

  const values = useMemo<TFormFields>(() => FormUtil.createFormValues(formFieldDefinitions, openProps.item), [formFieldDefinitions, openProps.item]);

  const formMethods = useForm<TFormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<TFormFields>,
    values,
  });
  const { handleSubmit, formState } = formMethods;

  if (formState.errors && Object.keys(formState.errors).length > 0) {
    console.table(formState.errors);
  }

  const onFormSubmit = useCallback((formFields: TFormFields): void => {
    const data = {
      ...formFields,
      ...(openProps.hiddenFormFieldValues ?? {}),
    } as unknown as TFormFields;
    onSave(data, openProps.item);
    onClose();
  }, [onClose, onSave, openProps.hiddenFormFieldValues, openProps.item]);

  return (
    <GenericForm<TFormFields>
      formFieldDefinitions={formFieldDefinitions}
      formId={formId}
      formMethods={formMethods}
      onSubmit={handleSubmit(onFormSubmit)}
    />
  );
}, {
  testId: 'CrudPageEditDialog',
  maxWidth: 'lg',
  fullWidth: true,
  defaultTitle: '',
});
