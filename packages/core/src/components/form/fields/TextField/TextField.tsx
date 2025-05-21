import type {
  ChangeEvent,
  InputHTMLAttributes,
  ReactElement,
} from 'react';
import {
  useCallback,
  useRef,
} from 'react';
import {
  TextField as MuiTextField,
  FormControl,
  IconButton,
  InputAdornment,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import type {
  FieldValues,
  ControllerRenderProps,
  UseControllerReturn,
  PathValue,
  Path,
} from 'react-hook-form';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import classnames from 'classnames';

import {
  FormFieldHelperText,
  FormFieldLoadingIndicator,
} from '../../helpers';
import {
  TestIdUtil,
  FormUtil,
} from '../../../../utils';
import type { FormFieldBaseProps } from '../../../../models';

export interface TextFieldProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> extends FormFieldBaseProps<TFieldValues, TName> {
  readonly multiline?: boolean;
  readonly rows?: number;
  readonly type?: InputHTMLAttributes<unknown>['type'];
  readonly loading?: boolean;
  readonly placeholder?: string;
}

export const TextField = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled = false,
  label,
  rows = 3,
  multiline = false,
  name,
  onChange: onChangeProp,
  loading = false,
  required = false,
  placeholder,
  type = 'text',
  warningMessage,
}: TextFieldProps<TFieldValues, TName>): ReactElement => {
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;
  const hasWarning = !!warningMessage && !hasError;
  const inputRef = useRef<HTMLInputElement>(null);

  const onMuiTextFieldChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = type === 'number' ? (event.target as { valueAsNumber: number }).valueAsNumber ?? '' : event.target.value;
      if (onChangeProp) {
        onChangeProp(value as string);
      }
      onChange(value);
    }
  , [onChangeProp, type]);

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });

    const onResetButtonClick = () => {
      onChange('');
    };

    return (
      <MuiTextField
        FormHelperTextProps={{ className: classnames({ 'Mui-warning': hasWarning }) }}
        InputLabelProps={{
          required: required && !disabled,
          className: classnames({ 'Mui-warning': hasWarning }),
        }}
        InputProps={{
          className: classnames({ 'Mui-warning': hasWarning }),
          endAdornment: (
            <InputAdornment position={'end'}>
              <IconButton
                {...TestIdUtil.createAttributes('TextField-reset')}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={onResetButtonClick}
                sx={{
                  '& svg': {
                    fontSize: '16px',
                  },
                }}
                tabIndex={-1}
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        disabled={disabled || loading}
        error={hasError}
        helperText={(
          <FormFieldHelperText
            errorMessage={errorMessage}
            warningMessage={warningMessage}
          />
        )}
        inputRef={inputRef}
        label={label}
        multiline={multiline}
        onBlur={onBlur}
        onChange={onMuiTextFieldChange(onChange)}
        placeholder={placeholder}
        rows={rows}
        type={type}
        value={value ?? '' as string}
      />
    );
  }, [hasWarning, required, disabled, loading, hasError, errorMessage, warningMessage, label, multiline, onMuiTextFieldChange, placeholder, rows, type]);

  return (
    <FormControl
      {...TestIdUtil.createAttributes('TextField', { label, name: name as string })}
      fullWidth
      sx={{
        button: {
          display: 'none',
        },
        '&:hover button, &:focus-within button': {
          display: 'initial',
        },
      }}
    >
      <Controller
        control={control}
        defaultValue={'' as PathValue<TFieldValues, TName>}
        name={name}
        render={renderController}
      />
      { loading && <FormFieldLoadingIndicator />}
    </FormControl>
  );
};
