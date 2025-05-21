import type {
  ChangeEvent,
  ReactElement,
} from 'react';
import {
  useCallback,
  useId,
  useRef,
} from 'react';
import {
  FormControl,
  FormLabel,
  Checkbox as MuiCheckbox,
  FormControlLabel,
  FormHelperText,
  FormGroup,
  IconButton,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import type {
  UseControllerReturn,
  FieldValues,
  Path,
  ControllerRenderProps,
} from 'react-hook-form';

import type {
  CheckboxOption,
  FormFieldBaseProps,
} from '../../../../models';
import {
  TestIdUtil,
  FormUtil,
} from '../../../../utils';
import {
  FormFieldHelperText,
  FormFieldLoadingIndicator,
} from '../../helpers';

type CheckBoxGroupValue = Array<string | number>;

export interface CheckboxGroupProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> extends FormFieldBaseProps<TFieldValues, TName, CheckBoxGroupValue> {
  readonly row?: boolean;
  readonly options: CheckboxOption[];
  readonly loading?: boolean;
}

export const CheckboxGroup = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled,
  label,
  name,
  options,
  required,
  row,
  loading,
  warningMessage,
  onChange: onChangeProp,
}: CheckboxGroupProps<TFieldValues, TName>): ReactElement => {
  const id = useId();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);

  const inputRef = useRef<HTMLInputElement>(null);
  const hasError = !!errorMessage;

  const onMuiCheckboxChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange'], itemValue: string | number, currentValue: CheckBoxGroupValue) =>
    (_event: ChangeEvent<unknown>, checked: boolean) => {
      const newValue = currentValue.filter(x => x !== itemValue);
      if (checked) {
        newValue.push(itemValue);
      }

      if (onChangeProp) {
        onChangeProp(newValue as TFieldValues[TName]);
      }
      onChange(newValue);
    }
  , [onChangeProp]);

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });

    const onResetButtonClick = () => {
      onChange([]);
    };
    return (
      <FormControl
        component={'fieldset'}
        error={hasError}
        {...TestIdUtil.createAttributes('CheckboxGroup', { label, name: name as string })}
        fullWidth
        sx={{
          'legend button': {
            display: 'none',
          },
          '&:hover legend button, &:focus-within legend button': {
            display: 'initial',
          },
        }}
      >
        <FormLabel
          component={'legend'}
          disabled={disabled || loading}
          id={id}
          required={required}

        >
          {label}
          <IconButton
            {...TestIdUtil.createAttributes('DateRangePicker-reset')}
            // eslint-disable-next-line react/jsx-no-bind
            onClick={onResetButtonClick}
            sx={{
              position: 'absolute',
              top: '-10px',
              '& svg': {
                fontSize: '16px',
              },
            }}
            tabIndex={-1}
          >
            <ClearIcon />
          </IconButton>
        </FormLabel>
        { !loading && (
          <FormGroup
            aria-labelledby={id}
            onBlur={onBlur}
            row={row}
          >
            { options.map((option, index) => {
              return (
                <FormControlLabel
                  {...TestIdUtil.createAttributes('CheckboxGroup-option', { value: option.value.toString(), label: option.label })}
                  checked={(value as CheckBoxGroupValue)?.includes(option.value)}
                  control={(
                    <MuiCheckbox
                      inputRef={index === 0 ? inputRef : undefined}
                      sx={{
                        padding: '0 9px',
                      }}
                    />
                  )}
                  disabled={loading || disabled}
                  key={option.value.toString()}
                  label={option.label}
                  onChange={onMuiCheckboxChange(onChange, option.value, value)}
                />
              );
            })}
          </FormGroup>
        )}
        { loading && <FormFieldLoadingIndicator inline />}
        <FormHelperText sx={{ ml: 0 }}>
          <FormFieldHelperText
            errorMessage={errorMessage}
            noIndent
            warningMessage={warningMessage}
          />
        </FormHelperText>
      </FormControl>
    );
  }, [hasError, label, name, disabled, loading, id, required, row, options, errorMessage, warningMessage, onMuiCheckboxChange]);

  return (
    <Controller
      control={control}
      defaultValue={null}
      name={name}
      render={renderController}
    />

  );
};
