import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
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
  useRoleOptions,
  useOrganizationOptions,
} from '../../dataHooks';
import { CrudPage } from '../CrudPage';
import {
  FORM_FIELD_DEFINITION_TYPE,
  QUERY_KEY,
} from '../../models';
import type { User } from '../../api';
import { OrganizationApi } from '../../api';

type FormFields = Pick<User, 'email' | 'is_active' | 'roles'>;

export const UsersAdminPage = () => {
  const [t] = useTranslation();
  const roleOptions = useRoleOptions();
  const organizationOptions = useOrganizationOptions();

  const loadables = useMemo<Loadable[]>(() => [roleOptions, organizationOptions], [roleOptions, organizationOptions]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    const users = (await OrganizationApi.getInstance().usersGetAll({ signal }))?.data;

    return users;
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: User) => {

    return (await OrganizationApi.getInstance().usersPutOne(item.id, {
      is_active: variables.is_active,
      organization_id: item.organization_id,
      roles: variables.roles,
    })).data;
  }, []);

  const getName = useCallback((item: FormFields) => {
    return item.email;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      email: string().email().required(),
      roles: array().required().min(1),
      is_active: boolean().required(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'email',
        label: t`Email`,
        disabled: true,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'roles',
        label: t`Roles`,
        options: roleOptions.options,
        loading: roleOptions.isLoading,
        multiple: true,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'is_active',
        label: t`Is active`,
      },
    ];
  }, [roleOptions.isLoading, roleOptions.options, t]);

  const tableColumns = useMemo((): TableColumn<User>[] => {
    return [
      TableUtil.createTextColumn<User>({ id: 'name', name: t`Name` }),
      TableUtil.createOptionsColumn<User>({ id: 'organization_id', name: t`Organization`, options: organizationOptions.options }),
      TableUtil.createTextColumn<User>({ id: 'email', name: t`E-Mail` }),
      TableUtil.createOptionsColumn<User>({ id: 'roles', name: t`Roles`, options: roleOptions.options }),
      TableUtil.createBooleanColumn<User>({ id: 'is_active', name: t`Is active` }),
    ];
  }, [organizationOptions.options, roleOptions.options, t]);

  return (
    <CrudPage<FormFields, User>
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.USERS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('UsersAdminPage')}
      title={t`Users`}
      updateOne={updateOne}
    />
  );
};
