import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  boolean,
  object,
  string,
} from 'yup';

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
  useDataCollectionOptions,
  useCaseTypeColSetOptions,
  useOrganizationOptions,
  useCaseTypeSetOptions,
} from '../../dataHooks';
import { CrudPage } from '../CrudPage';
import {
  FORM_FIELD_DEFINITION_TYPE,
  QUERY_KEY,
} from '../../models';
import { useOrganizationCasePolicyNameFactory } from '../../hooks';
import type { OrganizationAccessCasePolicy } from '../../api';
import {
  AbacApi,
  CommandName,
} from '../../api';

type FormFields = Pick<
  OrganizationAccessCasePolicy,
  'organization_id' |
  'data_collection_id' |
  'case_type_set_id' |
  'read_case_type_col_set_id' |
  'write_case_type_col_set_id' |
  'add_case' |
  'remove_case' |
  'add_case_set' |
  'remove_case_set' |
  'read_case_set' |
  'write_case_set' |
  'is_private' |
  'is_active'
>;

export const OrganizationAccessCasePoliciesAdminPage = () => {
  const [t] = useTranslation();
  const organizationOptions = useOrganizationOptions();
  const dataCollectionOptions = useDataCollectionOptions();
  const caseTypeColSetOptions = useCaseTypeColSetOptions();
  const caseTypeSetOptions = useCaseTypeSetOptions();

  const nameFactory = useOrganizationCasePolicyNameFactory();

  const loadables = useMemo<Loadable[]>(() => [nameFactory, organizationOptions, dataCollectionOptions, caseTypeColSetOptions, caseTypeSetOptions], [nameFactory, caseTypeSetOptions, caseTypeColSetOptions, dataCollectionOptions, organizationOptions]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await AbacApi.getInstance().organizationAccessCasePoliciesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: OrganizationAccessCasePolicy) => {
    return await AbacApi.getInstance().organizationAccessCasePoliciesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: OrganizationAccessCasePolicy) => {
    return (await AbacApi.getInstance().organizationAccessCasePoliciesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await AbacApi.getInstance().organizationAccessCasePoliciesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: OrganizationAccessCasePolicy) => {
    return nameFactory.getName(item);
  }, [nameFactory]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      organization_id: string().uuid4().required().max(100),
      data_collection_id: string().uuid4().required().max(100),
      case_type_set_id: string().uuid4().required().max(100),
      read_case_type_col_set_id: string().uuid4().required().max(100),
      write_case_type_col_set_id: string().uuid4().nullable().notRequired().max(100),
      add_case: boolean().required(),
      remove_case: boolean().required(),
      add_case_set: boolean().required(),
      remove_case_set: boolean().required(),
      read_case_set: boolean().required(),
      write_case_set: boolean().required(),
      is_private: boolean().required(),
      is_active: boolean().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'organization_id',
        label: t`Organization`,
        options: organizationOptions.options,
        loading: organizationOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'data_collection_id',
        label: t`Data collection`,
        options: dataCollectionOptions.options,
        loading: dataCollectionOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_type_set_id',
        label: t`Case type set`,
        options: caseTypeSetOptions.options,
        loading: caseTypeSetOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'read_case_type_col_set_id',
        label: t`Read column set`,
        options: caseTypeColSetOptions.options,
        loading: caseTypeColSetOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'write_case_type_col_set_id',
        label: t`Write column set`,
        options: caseTypeColSetOptions.options,
        loading: caseTypeColSetOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'add_case',
        label: t`Add case`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'remove_case',
        label: t`Remove case`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'add_case_set',
        label: t`Add case set`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'remove_case_set',
        label: t`Remove case set`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'read_case_set',
        label: t`Read case set`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'write_case_set',
        label: t`Write case set`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'is_private',
        label: t`Is private`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'is_active',
        label: t`Is active`,
      },
    ];
  }, [caseTypeColSetOptions.isLoading, caseTypeColSetOptions.options, caseTypeSetOptions.isLoading, caseTypeSetOptions.options, dataCollectionOptions.isLoading, dataCollectionOptions.options, organizationOptions.isLoading, organizationOptions.options, t]);

  const tableColumns = useMemo((): TableColumn<OrganizationAccessCasePolicy>[] => {
    return [
      TableUtil.createOptionsColumn<OrganizationAccessCasePolicy>({ id: 'organization_id', name: t`Organization`, options: organizationOptions.options }),
      TableUtil.createOptionsColumn<OrganizationAccessCasePolicy>({ id: 'data_collection_id', name: t`Data collection`, options: dataCollectionOptions.options }),
      TableUtil.createOptionsColumn<OrganizationAccessCasePolicy>({ id: 'case_type_set_id', name: t`Case type set`, options: caseTypeSetOptions.options }),
      TableUtil.createOptionsColumn<OrganizationAccessCasePolicy>({ id: 'read_case_type_col_set_id', name: t`Read column set`, options: caseTypeColSetOptions.options }),
      TableUtil.createOptionsColumn<OrganizationAccessCasePolicy>({ id: 'write_case_type_col_set_id', name: t`Write column set`, options: caseTypeColSetOptions.options }),

      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'add_case', name: t`Add case` }),
      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'remove_case', name: t`Remove case` }),
      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'add_case_set', name: t`Add case set` }),
      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'remove_case_set', name: t`Remove case set` }),
      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'read_case_set', name: t`Read case set` }),
      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'write_case_set', name: t`Write case set` }),

      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'is_private', name: t`Private` }),
      TableUtil.createBooleanColumn<OrganizationAccessCasePolicy>({ id: 'is_active', name: t`Active` }),
    ];
  }, [caseTypeColSetOptions.options, caseTypeSetOptions.options, dataCollectionOptions.options, organizationOptions.options, t]);

  return (
    <CrudPage<FormFields, OrganizationAccessCasePolicy>
      createOne={createOne}
      crudCommandType={CommandName.OrganizationAccessCasePolicyCrudCommand}
      defaultSortByField={'organization_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.ORGANIZATION_ACCESS_CASE_POLICIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('OrganizationAccessCasePoliciesAdminPage')}
      title={t`Organization access case policies`}
      updateOne={updateOne}
    />
  );
};
