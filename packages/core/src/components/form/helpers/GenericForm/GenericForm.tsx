import { Box } from '@mui/material';
import type { FormEventHandler } from 'react';
import {
  useMemo,
  useCallback,
} from 'react';
import { useTranslation } from 'react-i18next';
import type {
  Path,
  UseFormReturn,
} from 'react-hook-form';
import { FormProvider } from 'react-hook-form';

import {
  FORM_FIELD_DEFINITION_TYPE,
  type FormFieldDefinition,
} from '../../../../models';
import {
  MarkdownEditor,
  TransferList,
  Autocomplete,
  Select,
  DatePicker,
  TextField,
} from '../../fields';
import type { AutocompleteProps } from '../../fields';
import { FormUtil } from '../../../../utils';

export type GenericFormProps<TFormFields> = {
  readonly formFieldDefinitions: FormFieldDefinition<TFormFields>[];
  readonly formId?: string;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
  readonly formMethods: UseFormReturn<TFormFields>;
};

export const GenericForm = <TFormFields, >({
  formFieldDefinitions,
  formId,
  onSubmit,
  formMethods,
}: GenericFormProps<TFormFields>) => {
  const [t] = useTranslation();

  const booleanOptions = useMemo(() => FormUtil.createBooleanOptions(t), [t]);

  const renderFormFieldDefinition = useCallback((formFieldDefinition: FormFieldDefinition<TFormFields>) => {
    switch (formFieldDefinition.definition) {
      case FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE:
        return (
          <Autocomplete
            {...formFieldDefinition as AutocompleteProps<TFormFields, Path<TFormFields>, false>}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST:
        return (
          <TransferList
            {...formFieldDefinition}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.BOOLEAN:
        return (
          <Select
            options={booleanOptions}
            {...formFieldDefinition}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.DATE:
        return (
          <DatePicker
            {...formFieldDefinition}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.MARKDOWN:
        return (
          <MarkdownEditor
            {...formFieldDefinition}
          />
        );
      case FORM_FIELD_DEFINITION_TYPE.TEXTFIELD:
      default:
        return (
          <TextField
            {...formFieldDefinition}
          />
        );
    }
  }, [booleanOptions]);

  return (
    <FormProvider {...formMethods}>
      <form
        autoComplete={'off'}
        id={formId}
        onSubmit={onSubmit}
      >
        {formFieldDefinitions.map(formFieldDefinition => (
          <Box
            key={formFieldDefinition.name}
            marginY={1}
          >
            {renderFormFieldDefinition(formFieldDefinition)}
          </Box>
        ))}
      </form>
    </FormProvider>
  );
};
