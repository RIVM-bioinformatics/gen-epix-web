import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  object,
  string,
} from 'yup';

import type { Etiology } from '@gen_epix/api';
import {
  OntologyApi,
  CommandName,
} from '@gen_epix/api';

import {
  TableUtil,
  TestIdUtil,
} from '../../utils';
import {
  useEtiologicalAgentOptions,
  useDiseaseOptions,
} from '../../dataHooks';
import type {
  TableColumn,
  Loadable,
  FormFieldDefinition,
} from '../../models';
import { CrudPage } from '../CrudPage';
import {
  FORM_FIELD_DEFINITION_TYPE,
  QUERY_KEY,
} from '../../models';

type FormFields = Pick<Etiology, 'disease_id' | 'etiological_agent_id'>;

export const EtiologiesAdminPage = () => {
  const [t] = useTranslation();
  const diseaseOptions = useDiseaseOptions();
  const etiologicalAgentOptions = useEtiologicalAgentOptions();

  const loadables = useMemo<Loadable[]>(() => [diseaseOptions, etiologicalAgentOptions], [etiologicalAgentOptions, diseaseOptions]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OntologyApi.getInstance().etiologiesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: Etiology) => {
    return await OntologyApi.getInstance().etiologiesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Etiology) => {
    return (await OntologyApi.getInstance().etiologiesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OntologyApi.getInstance().etiologiesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: Etiology) => {
    return item.id;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      disease_id: string().uuid4().required(),
      etiological_agent_id: string().uuid4().required(),
    });
  }, []);


  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'disease_id',
        label: t`Disease`,
        options: diseaseOptions.options,
        loading: diseaseOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'etiological_agent_id',
        label: t`Etiological agent`,
        options: etiologicalAgentOptions.options,
        loading: etiologicalAgentOptions.isLoading,
      },
    ];
  }, [etiologicalAgentOptions.isLoading, etiologicalAgentOptions.options, diseaseOptions.isLoading, diseaseOptions.options, t]);

  const tableColumns = useMemo((): TableColumn<Etiology>[] => {
    return [
      TableUtil.createOptionsColumn<Etiology>({ id: 'disease_id', name: t`Disease`, options: diseaseOptions.options }),
      TableUtil.createOptionsColumn<Etiology>({ id: 'etiological_agent_id', name: t`Etiological agent`, options: etiologicalAgentOptions.options }),
    ];
  }, [etiologicalAgentOptions.options, diseaseOptions.options, t]);

  return (
    <CrudPage<FormFields, Etiology>
      createOne={createOne}
      crudCommandType={CommandName.EtiologyCrudCommand}
      defaultSortByField={'disease_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.ETIOLOGIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('EtiologiesAdminPage')}
      title={t`Etiologies`}
      updateOne={updateOne}
    />
  );
};
