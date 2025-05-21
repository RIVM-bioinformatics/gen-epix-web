import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';

import type { CaseSetStatus } from '@gen_epix/api';
import {
  CommandName,
  CaseApi,
} from '@gen_epix/api';

import { CrudPage } from '../CrudPage';
import {
  TableUtil,
  TestIdUtil,
} from '../../utils';
import type {
  FormFieldDefinition,
  TableColumn,
} from '../../models';
import {
  FORM_FIELD_DEFINITION_TYPE,
  QUERY_KEY,
} from '../../models';

type FormFields = Pick<CaseSetStatus, 'name' | 'description'>;

export const CaseSetStatusAdminPage = () => {
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.getInstance().caseSetStatusesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseSetStatus) => {
    return await CaseApi.getInstance().caseSetStatusesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseSetStatus) => {
    return (await CaseApi.getInstance().caseSetStatusesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await CaseApi.getInstance().caseSetStatusesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: FormFields) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      description: string().freeFormText().required().max(1000),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`Name`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'description',
        label: t`Description`,
        multiline: true,
        rows: 5,
      },
    ];
  }, [t]);

  const tableColumns = useMemo((): TableColumn<CaseSetStatus>[] => {
    return [
      TableUtil.createTextColumn<CaseSetStatus>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<CaseSetStatus>({ id: 'description', name: t`Description` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, CaseSetStatus>
      createOne={createOne}
      crudCommandType={CommandName.CaseSetStatusCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.CASE_SET_STATUSES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CaseSetStatusAdminPage')}
      title={t`Case set statuses`}
      updateOne={updateOne}
    />
  );
};
