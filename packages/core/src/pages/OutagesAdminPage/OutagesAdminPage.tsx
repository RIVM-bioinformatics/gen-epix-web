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
import { isValid } from 'date-fns';

import type {
  Outage,
  Permission,
} from '@gen_epix/api';
import {
  CommandName,
  PermissionType,
  SystemApi,
} from '@gen_epix/api';

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

type FormFields = Pick<Outage, 'description' | 'active_from' | 'active_to' | 'visible_from' | 'visible_to' | 'is_active' | 'is_visible'>;

export const OutagesAdminPage = () => {
  const [t] = useTranslation();

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await SystemApi.getInstance().outagesGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: Outage) => {
    return await SystemApi.getInstance().outagesDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Outage) => {
    return (await SystemApi.getInstance().outagesPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await SystemApi.getInstance().outagesPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: Outage) => {
    return item.description;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      description: string().freeFormText().required().max(100),
      active_from: string().transform((_val: unknown, orig: Date) => isValid(orig) ? orig.toISOString() : undefined),
      active_to: string().transform((_val: unknown, orig: Date) => isValid(orig) ? orig.toISOString() : undefined),
      visible_from: string().transform((_val: unknown, orig: Date) => isValid(orig) ? orig.toISOString() : undefined),
      visible_to: string().transform((_val: unknown, orig: Date) => isValid(orig) ? orig.toISOString() : undefined),
      is_active: boolean(),
      is_visible: boolean(),
    });
  }, []);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'description',
        label: t`Description`,
        multiline: true,
        rows: 5,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.DATE,
        name: 'active_from',
        label: t`Active from`,
        withTime: true,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.DATE,
        name: 'active_to',
        label: t`Active to`,
        withTime: true,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.DATE,
        name: 'visible_from',
        label: t`Visible from`,
        withTime: true,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.DATE,
        name: 'visible_to',
        label: t`Visible to`,
        withTime: true,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'is_active',
        label: t`Is active`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
        name: 'is_visible',
        label: t`Is visible`,
      },
    ];
  }, [t]);

  const tableColumns = useMemo((): TableColumn<Outage>[] => {
    return [
      TableUtil.createTextColumn<Outage>({ id: 'description', name: t`Description` }),
      TableUtil.createDateColumn<Outage>({ id: 'active_from', name: t`Active from`, withTime: true }),
      TableUtil.createDateColumn<Outage>({ id: 'active_to', name: t`Active to`, withTime: true }),
      TableUtil.createDateColumn<Outage>({ id: 'visible_from', name: t`Visible from`, withTime: true }),
      TableUtil.createDateColumn<Outage>({ id: 'visible_to', name: t`Visible to`, withTime: true }),
      TableUtil.createBooleanColumn<Outage>({ id: 'is_active', name: t`Is active` }),
      TableUtil.createBooleanColumn<Outage>({ id: 'is_visible', name: t`Is visible` }),
    ];
  }, [t]);


  const extraCreateOnePermissions = useMemo<Permission[]>(() => [
    { command_name: CommandName.OutageCrudCommand, permission_type: PermissionType.CREATE },
  ], []);
  const extraDeleteOnePermissions = useMemo<Permission[]>(() => [
    { command_name: CommandName.OutageCrudCommand, permission_type: PermissionType.DELETE },
  ], []);
  const extraUpdateOnePermissions = useMemo<Permission[]>(() => [
    { command_name: CommandName.OutageCrudCommand, permission_type: PermissionType.UPDATE },
  ], []);

  return (
    <CrudPage<FormFields, Outage>
      createOne={createOne}
      crudCommandType={CommandName.OutageCrudCommand}
      defaultSortByField={'active_from'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      extraCreateOnePermissions={extraCreateOnePermissions}
      extraDeleteOnePermissions={extraDeleteOnePermissions}
      extraUpdateOnePermissions={extraUpdateOnePermissions}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      resourceQueryKeyBase={QUERY_KEY.OUTAGES}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('OutagesAdminPage')}
      title={t`Outages`}
      updateOne={updateOne}
    />
  );
};
