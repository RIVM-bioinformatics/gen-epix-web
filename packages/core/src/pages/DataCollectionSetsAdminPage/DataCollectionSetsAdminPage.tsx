import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
  object,
  string,
} from 'yup';

import { CrudPage } from '../CrudPage';
import {
  TableUtil,
  TestIdUtil,
} from '../../utils';
import type {
  FormFieldDefinition,
  Loadable,
  TableColumn,
} from '../../models';
import {
  FORM_FIELD_DEFINITION_TYPE,
  QUERY_KEY,
} from '../../models';
import {
  useDataCollectionSetMembers,
  useDataCollectionOptions,
} from '../../dataHooks';
import type {
  DataCollectionSet,
  DataCollectionSetMember,
} from '../../api';
import {
  OrganizationApi,
  CommandName,
} from '../../api';

type TableData = DataCollectionSet & { dataCollectionIds: string[] };

type FormFields = Pick<TableData, 'name' | 'description' | 'dataCollectionIds'>;

export const DataCollectionSetsAdminPage = () => {
  const [t] = useTranslation();

  const dataCollectionSetMembers = useDataCollectionSetMembers();
  const dataCollectionOptions = useDataCollectionOptions();

  const loadables = useMemo<Loadable[]>(() => [dataCollectionSetMembers, dataCollectionOptions], [dataCollectionSetMembers, dataCollectionOptions]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OrganizationApi.getInstance().dataCollectionSetsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: DataCollectionSet) => {
    return await OrganizationApi.getInstance().dataCollectionSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: DataCollectionSet) => {
    await OrganizationApi.getInstance().dataCollectionSetsPutDataCollections(item.id, {
      data_collection_set_members: variables.dataCollectionIds.map<DataCollectionSetMember>(data_collection_id => ({
        data_collection_id,
        data_collection_set_id: item.id,
      })),
    });
    return (await OrganizationApi.getInstance().dataCollectionsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const resultItem = (await OrganizationApi.getInstance().dataCollectionsPostOne(variables)).data;
    await OrganizationApi.getInstance().dataCollectionSetsPutDataCollections(resultItem.id, {
      data_collection_set_members: variables.dataCollectionIds.map<DataCollectionSetMember>(data_collection_id => ({
        data_collection_id,
        data_collection_set_id: resultItem.id,
      })),
    });
    return resultItem;
  }, []);

  const getName = useCallback((item: DataCollectionSet) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      description: string().freeFormText().required().max(1000),
      dataCollectionIds: array().of(string().uuid4()).min(1).required(),
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
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST,
        name: 'dataCollectionIds',
        label: t`Case type columns`,
        options: dataCollectionOptions.options,
        multiple: true,
        loading: dataCollectionOptions.isLoading,
      },
    ];
  }, [dataCollectionOptions.isLoading, dataCollectionOptions.options, t]);

  const tableColumns = useMemo((): TableColumn<TableData>[] => {
    return [
      TableUtil.createTextColumn<TableData>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<TableData>({ id: 'description', name: t`Description` }),
      {
        type: 'number',
        id: 'numDataCollections',
        textAlign: 'right',
        valueGetter: (item) => item.row.dataCollectionIds.length,
        displayValueGetter: (item) => `${item.row.dataCollectionIds.length} / ${dataCollectionOptions.options.length}`,
        headerName: t`Data collections`,
        widthFlex: 0.5,
        isInitiallyVisible: true,
      },
    ];
  }, [dataCollectionOptions.options.length, t]);

  const convertToTableData = useCallback((items: DataCollectionSet[]) => {
    if (!items || !dataCollectionSetMembers.data) {
      return [];
    }
    return items.map<TableData>((item) => {
      const dataCollectionIds = dataCollectionSetMembers.data.filter(member => member.data_collection_set_id === item.id).map(member => member.data_collection_id);
      return {
        ...item,
        dataCollectionIds,
      } satisfies TableData;
    });
  }, [dataCollectionSetMembers.data]);

  return (
    <CrudPage<FormFields, DataCollectionSet, TableData>
      convertToTableData={convertToTableData}
      createOne={createOne}
      crudCommandType={CommandName.DataCollectionSetCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.DATA_COLLECTION_SETS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('DataCollectionSetsAdminPage')}
      title={t`Data collection sets`}
      updateOne={updateOne}
    />
  );
};
