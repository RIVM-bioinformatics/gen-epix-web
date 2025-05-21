import {
  FormProvider,
  useForm,
} from 'react-hook-form';
import {
  Box,
  Button,
} from '@mui/material';
import {
  useCallback,
  useMemo,
} from 'react';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';

import type {
  FilterValues,
  Filters,
  UnwrapArray,
} from '../../../models';
import { useTableStoreContext } from '../../../stores';

import { TableFilter } from './TableFilter';

export type TableHeaderFilterProps = {
  readonly filter: UnwrapArray<Filters>;
  readonly onFilterChange: () => void;
};

export const TableHeaderFilter = <TRowData, >({ filter, onFilterChange }: TableHeaderFilterProps) => {
  const tableStore = useTableStoreContext<TRowData>();
  const [t] = useTranslation();
  const setFilterValue = useStore(tableStore, (state) => state.setFilterValue);

  const initialDefaultValues = useMemo<FilterValues>(() => {
    return {
      [filter.id]: filter.initialFilterValue,
    };
  }, [filter.id, filter.initialFilterValue]);

  const initialValues = useMemo<FilterValues>(() => {
    return {
      [filter.id]: filter.filterValue ?? filter.initialFilterValue,
    };
  }, [filter.id, filter.filterValue, filter.initialFilterValue]);

  const formMethods = useForm<FilterValues>({
    defaultValues: initialDefaultValues,
    values: initialValues,
  });

  const { handleSubmit, formState: { isDirty } } = formMethods;

  const onFormSubmit = useCallback((formFields: FilterValues): void => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    setFilterValue(filter.id, formFields[filter.id]);
    onFilterChange();
  }, [filter.id, onFilterChange, setFilterValue]);

  const onResetButtonClick = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    setFilterValue(filter.id, filter.initialFilterValue);
    onFilterChange();
  }, [filter.id, filter.initialFilterValue, onFilterChange, setFilterValue]);

  return (
    <FormProvider {...formMethods}>
      <Box
        autoComplete={'off'}
        component={'form'}
        id={'Filters'}
        onSubmit={handleSubmit(onFormSubmit)}
        sx={{
          width: '400px',
        }}
      >
        <TableFilter filter={filter} />
        <Box sx={{
          display: 'flex',
          gap: 1,
          justifyContent: 'flex-end',
        }}
        >
          <Button
            disabled={filter.isInitialFilterValue()}
            onClick={onResetButtonClick}
            variant={'outlined'}
          >
            {t`Remove filter`}
          </Button>

          <Button
            disabled={!isDirty}
            type={'submit'}
            variant={'contained'}
          >
            {t`Apply`}
          </Button>

        </Box>
      </Box>
    </FormProvider>
  );
};
