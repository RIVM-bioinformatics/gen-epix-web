import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';

import {
  TableUtil,
  TestIdUtil,
} from '../../utils';
import type {
  TableColumn,
  FormFieldDefinition,
} from '../../models';
import { CrudPage } from '../CrudPage';
import {
  FORM_FIELD_DEFINITION_TYPE,
  QUERY_KEY,
} from '../../models';
import type { Disease } from '../../api';
import {
  OntologyApi,
  CommandName,
} from '../../api';

type FormFields = Omit<Disease, 'id'>;

export const DiseasesAdminPage = () => {
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OntologyApi.getInstance().diseasesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: Disease) => {
    return await OntologyApi.getInstance().diseasesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Disease) => {
    return (await OntologyApi.getInstance().diseasesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OntologyApi.getInstance().diseasesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: Disease) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      icd_code: string().alphaNumeric().nullable().max(100),
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
        name: 'icd_code',
        label: t`ICD Code`,
      },
    ];
  }, [t]);

  const tableColumns = useMemo((): TableColumn<Disease>[] => {
    return [
      TableUtil.createTextColumn<Disease>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<Disease>({ id: 'icd_code', name: t`ICD Code` }),
    ];
  }, [t]);

  return (
    <CrudPage<FormFields, Disease>
      createOne={createOne}
      crudCommandType={CommandName.DiseaseCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.DISEASES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DiseasesAdminPage')}
      title={t`Diseases`}
      updateOne={updateOne}
    />
  );
};
