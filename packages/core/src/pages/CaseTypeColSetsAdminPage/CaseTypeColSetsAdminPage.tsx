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
import omit from 'lodash/omit';

import {
  TableUtil,
  TestIdUtil,
} from '../../utils';
import type {
  TableColumn,
  Loadable,
  FormFieldDefinition,
} from '../../models';
import {
  useCaseTypeColOptions,
  useCaseTypeColSetMembers,
} from '../../dataHooks';
import { CrudPage } from '../CrudPage';
import {
  FORM_FIELD_DEFINITION_TYPE,
  QUERY_KEY,
} from '../../models';
import type {
  CaseTypeColSet,
  CaseTypeColSetMember,
  Permission,
} from '../../api';
import {
  CaseApi,
  CommandName,
  PermissionType,
} from '../../api';

type TableData = CaseTypeColSet & { caseTypeColIds: string[] };

type FormFields = Pick<TableData, 'name' | 'description' | 'caseTypeColIds'>;

export const CaseTypeColSetsAdminPage = () => {
  const [t] = useTranslation();

  const caseTypeColOptions = useCaseTypeColOptions();
  const caseTypeColSetMembers = useCaseTypeColSetMembers();

  const loadables = useMemo<Loadable[]>(() => [caseTypeColOptions, caseTypeColSetMembers], [caseTypeColOptions, caseTypeColSetMembers]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await CaseApi.getInstance().caseTypeColSetsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: CaseTypeColSet) => {
    return await CaseApi.getInstance().caseTypeColSetsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: CaseTypeColSet) => {
    await CaseApi.getInstance().caseTypeColSetsPutCaseTypeCols(item.id, {
      case_type_col_set_members: variables.caseTypeColIds.map<CaseTypeColSetMember>(case_type_col_id => ({
        case_type_col_id,
        case_type_col_set_id: item.id,
      })),
    });

    return (await CaseApi.getInstance().caseTypeColSetsPutOne(item.id, omit({ id: item.id, ...variables }, ['caseTypeColIds']))).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    const resultItem = (await CaseApi.getInstance().caseTypeColSetsPostOne(omit(variables, ['caseTypeColIds']))).data;

    await CaseApi.getInstance().caseTypeColSetsPutCaseTypeCols(resultItem.id, {
      case_type_col_set_members: variables.caseTypeColIds.map<CaseTypeColSetMember>(case_type_col_id => ({
        case_type_col_id,
        case_type_col_set_id: resultItem.id,
      })),
    });

    return resultItem;
  }, []);

  const getName = useCallback((item: CaseTypeColSet) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      description: string().freeFormText().nullable(),
      caseTypeColIds: array().of(string().uuid4()).min(1).required(),
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
        name: 'caseTypeColIds',
        label: t`Case type columns`,
        options: caseTypeColOptions.options,
        multiple: true,
        loading: caseTypeColOptions.isLoading,
      },
    ];
  }, [caseTypeColOptions.isLoading, caseTypeColOptions.options, t]);

  const tableColumns = useMemo((): TableColumn<TableData>[] => {
    return [
      TableUtil.createTextColumn<TableData>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<TableData>({ id: 'description', name: t`Description` }),
      {
        type: 'number',
        id: 'numCaseTypeColumns',
        textAlign: 'right',
        valueGetter: (item) => item.row.caseTypeColIds.length,
        displayValueGetter: (item) => `${item.row.caseTypeColIds.length} / ${caseTypeColOptions.options.length}`,
        headerName: t`Case type column count`,
        widthFlex: 0.5,
        isInitiallyVisible: true,
      },
    ];
  }, [caseTypeColOptions.options.length, t]);

  const extraCreateOnePermissions = useMemo<Permission[]>(() => [
    { command_name: CommandName.CaseTypeColSetCaseTypeColUpdateAssociationCommand, permission_type: PermissionType.EXECUTE },
  ], []);
  const extraDeleteOnePermissions = useMemo<Permission[]>(() => [
    { command_name: CommandName.CaseTypeColSetCaseTypeColUpdateAssociationCommand, permission_type: PermissionType.EXECUTE },
  ], []);
  const extraUpdateOnePermissions = useMemo<Permission[]>(() => [
    { command_name: CommandName.CaseTypeColSetCaseTypeColUpdateAssociationCommand, permission_type: PermissionType.EXECUTE },
  ], []);

  const convertToTableData = useCallback((items: CaseTypeColSet[]) => {
    if (!items || !caseTypeColSetMembers.data) {
      return [];
    }
    return items.map<TableData>((item) => {
      const caseTypeColIds = caseTypeColSetMembers.data.filter(member => member.case_type_col_set_id === item.id).map(member => member.case_type_col_id);
      return {
        ...item,
        caseTypeColIds,
      } satisfies TableData;
    });
  }, [caseTypeColSetMembers.data]);

  const associationQueryKeys = useMemo(() => [
    [QUERY_KEY.CASE_TYPE_COL_SET_MEMBERS],
  ], []);

  return (
    <CrudPage<FormFields, CaseTypeColSet, TableData>
      associationQueryKeys={associationQueryKeys}
      convertToTableData={convertToTableData}
      createOne={createOne}
      crudCommandType={CommandName.CaseTypeColSetCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      extraCreateOnePermissions={extraCreateOnePermissions}
      extraDeleteOnePermissions={extraDeleteOnePermissions}
      extraUpdateOnePermissions={extraUpdateOnePermissions}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.CASE_TYPE_COL_SETS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('CaseTypeColSetsAdminPage')}
      title={t`Case type column sets`}
      updateOne={updateOne}
    />
  );
};
