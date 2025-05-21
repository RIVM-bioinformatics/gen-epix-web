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
  Slider,
  FormControl,
  FormHelperText,
  FormLabel,
  Box,
  Input,
  IconButton,
  useTheme,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import type {
  FieldValues,
  ControllerRenderProps,
  UseControllerReturn,
  Path,
} from 'react-hook-form';
import {
  Controller,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import isEqual from 'lodash/isEqual';
import isNumber from 'lodash/isNumber';
import isFinite from 'lodash/isFinite';

import {
  FormFieldHelperText,
  FormFieldLoadingIndicator,
} from '../../helpers';
import {
  TestIdUtil,
  FormUtil,
} from '../../../../utils';
import type { FormFieldBaseProps } from '../../../../models';

export interface NumberRangeInputProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> extends FormFieldBaseProps<TFieldValues, TName, number | number[]> {
  readonly loading?: boolean;
  readonly min: number;
  readonly max: number;
}

export const NumberRangeInput = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled = false,
  label,
  name,
  min,
  max,
  onChange: onChangeProp,
  loading = false,
  required = false,
  warningMessage = '',
}: NumberRangeInputProps<TFieldValues, TName>): ReactElement => {
  const shouldShowSlider = isFinite(min) && isFinite(max);
  const theme = useTheme();

  const [t] = useTranslation();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const outerValue = useWatch({ control, name }) as number[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = useCallback((newValue: number[], onChange: (...event: any[]) => void) => {
    if (isEqual(outerValue, newValue)) {
      return;
    }
    if (onChangeProp) {
      onChangeProp(newValue);
    }
    onChange(newValue);
  }, [onChangeProp, outerValue]);

  const onMuiRangeSliderChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (_event: Event, newValue: number | number[]) => {
      handleChange(newValue as number[], onChange);
    }
  , [handleChange]);

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });

    const leftValue = (value as [number, number])?.[0];
    const rightValue = (value as [number, number])?.[1];

    const onLeftValueChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.value === '') {
        handleChange([null, rightValue], onChange);
      } else if (isFinite(+event.target.value)) {
        handleChange([+event.target.value, rightValue], onChange);
      }
    };
    const onRightValueChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.value === '') {
        handleChange([leftValue, null], onChange);
      } else if (isFinite(+event.target.value)) {
        handleChange([leftValue, +event.target.value], onChange);
      }
    };

    const onLeftValueBlur = () => {
      if (leftValue === null || !isFinite(leftValue)) {
        handleChange([null, rightValue], onChange);
      } else if (leftValue < min) {
        handleChange([min, rightValue], onChange);
      } else if (leftValue > max) {
        handleChange([max, max], onChange);
      } else if (isNumber(rightValue) && leftValue > rightValue) {
        handleChange([rightValue, leftValue], onChange);
      }

      onBlur();
    };
    const onRightValueBlur = () => {
      if (rightValue === null || !isFinite(rightValue)) {
        handleChange([leftValue, null], onChange);
      } else if (rightValue > max) {
        handleChange([leftValue, max], onChange);
      } else if (rightValue < min) {
        handleChange([min, min], onChange);
      } else if (isNumber(leftValue) && rightValue < leftValue) {
        handleChange([rightValue, leftValue], onChange);
      }

      onBlur();
    };

    const onResetButtonClick = () => {
      handleChange([null, null], onChange);
    };

    return (
      <Box
        {...TestIdUtil.createAttributes('RangeSlider', { label, name: name as string })}
        sx={{
          'legend button': {
            display: 'none',
          },
          '&:hover legend button, &:focus-within legend button': {
            display: 'initial',
          },
        }}
      >
        { !loading && (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'max-content auto max-content',
            position: 'relative',
          }}
          >
            <Box sx={{
              width: theme.spacing(shouldShowSlider ? 6 : 16),
              marginTop: 4,
            }}
            >
              <Input
                fullWidth
                inputProps={{
                  ...TestIdUtil.createAttributes('RangeSlider-from-input'),
                  'aria-labelledby': id,
                }}
                // eslint-disable-next-line react/jsx-no-bind
                onBlur={onLeftValueBlur}
                // eslint-disable-next-line react/jsx-no-bind
                onChange={onLeftValueChange}
                placeholder={t`From`}
                size={'small'}
                value={leftValue ?? ''}
              />
            </Box>

            <FormControl
              error={hasError}
              fullWidth
              sx={{
                position: 'initial',
              }}
            >
              <FormLabel
                component={'legend'}
                disabled={disabled || loading}
                id={id}
                required={required}
                sx={{
                  position: 'absolute',
                  left: 0,
                }}
              >
                {label}
                <IconButton
                  {...TestIdUtil.createAttributes('RangeSlider-reset')}
                  aria-label={t`Clear`}
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
              <Box
                marginTop={4}
                marginX={3}
              >
                {shouldShowSlider && (
                  <Slider
                    color={'primary'}
                    max={max}
                    min={min}
                    onBlur={onBlur}
                    onChange={onMuiRangeSliderChange(onChange)}
                    slotProps={{
                      input: {
                        'aria-label': t`Value`,
                      },
                    }}
                    value={value as [number, number]}
                    valueLabelDisplay={'off'}
                  />
                )}
              </Box>
            </FormControl>
            <Box sx={{
              width: theme.spacing(shouldShowSlider ? 6 : 16),
              marginTop: 4,
            }}
            >
              <Input
                fullWidth
                inputProps={{
                  ...TestIdUtil.createAttributes('RangeSlider-to-input'),
                  'aria-labelledby': id,
                }}
                // eslint-disable-next-line react/jsx-no-bind
                onBlur={onRightValueBlur}
                // eslint-disable-next-line react/jsx-no-bind
                onChange={onRightValueChange}
                placeholder={t`To`}
                size={'small'}
                value={rightValue ?? ''}
              />
            </Box>
          </Box>
        )}
        { loading && <FormFieldLoadingIndicator inline />}
        <FormHelperText sx={{ ml: 0 }}>
          <FormFieldHelperText
            errorMessage={errorMessage}
            noIndent
            warningMessage={warningMessage}
          />
        </FormHelperText>
      </Box>
    );
  }, [disabled, errorMessage, handleChange, hasError, id, label, loading, max, min, name, onMuiRangeSliderChange, required, shouldShowSlider, t, warningMessage, theme]);

  return (
    <Controller
      control={control}
      defaultValue={null}
      name={name}
      render={renderController}
    />
  );
};
