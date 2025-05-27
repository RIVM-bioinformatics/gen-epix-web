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
  useOrganizationAdminPolicyNameFactory,
  useOrganizationOptions,
  useUserOptions,
} from '../../dataHooks';
import { CrudPage } from '../CrudPage';
import {
  FORM_FIELD_DEFINITION_TYPE,
  QUERY_KEY,
} from '../../models';
import type { OrganizationAdminPolicy } from '../../api';
import {
  AbacApi,
  CommandName,
} from '../../api';

type FormFields = Pick<OrganizationAdminPolicy, 'is_active' | 'organization_id' | 'user_id'>;

export const OrganizationAdminPoliciesAdminPage = () => {
  const [t] = useTranslation();
  const organizationOptions = useOrganizationOptions();
  const userOptions = useUserOptions();
  const organizationAdminPolicyNameFactory = useOrganizationAdminPolicyNameFactory();

  const loadables = useMemo<Loadable[]>(() => [organizationOptions, userOptions, organizationAdminPolicyNameFactory], [organizationOptions, userOptions, organizationAdminPolicyNameFactory]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await AbacApi.getInstance().organizationAdminPoliciesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: OrganizationAdminPolicy) => {
    return await AbacApi.getInstance().organizationAdminPoliciesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: OrganizationAdminPolicy) => {
    return (await AbacApi.getInstance().organizationAdminPoliciesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await AbacApi.getInstance().organizationAdminPoliciesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: OrganizationAdminPolicy) => {
    return organizationAdminPolicyNameFactory.getName(item) ?? item.id;
  }, [organizationAdminPolicyNameFactory]);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      is_active: boolean(),
      organization_id: string().uuid4().nullable().max(100),
      user_id: string().uuid4().nullable().max(100),
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
        name: 'user_id',
        label: t`User`,
        options: userOptions.options,
        loading: userOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'is_active',
        label: t`Active`,
      },
    ];
  }, [organizationOptions.isLoading, organizationOptions.options, t, userOptions.isLoading, userOptions.options]);

  const tableColumns = useMemo((): TableColumn<OrganizationAdminPolicy>[] => {
    return [
      TableUtil.createOptionsColumn<OrganizationAdminPolicy>({ id: 'organization_id', name: t`Organization`, options: organizationOptions.options }),
      TableUtil.createOptionsColumn<OrganizationAdminPolicy>({ id: 'user_id', name: t`User`, options: userOptions.options }),
      TableUtil.createBooleanColumn<OrganizationAdminPolicy>({ id: 'is_active', name: t`Is active` }),
    ];
  }, [organizationOptions.options, t, userOptions.options]);

  return (
    <CrudPage<FormFields, OrganizationAdminPolicy>
      createOne={createOne}
      crudCommandType={CommandName.OrganizationAdminPolicyCrudCommand}
      defaultSortByField={'organization_id'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.ORGANIZATION_ADMIN_POLICIES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('OrganizationAdminPoliciesAdminPage')}
      title={t`Organization admin policies`}
      updateOne={updateOne}
    />
  );
};
