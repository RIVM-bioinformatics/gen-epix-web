import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  number,
  object,
  string,
} from 'yup';

import type { Region } from '@gen_epix/api';
import {
  CommandName,
  GeoApi,
} from '@gen_epix/api';

import {
  TableUtil,
  TestIdUtil,
} from '../../utils';
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
import { useRegionSetOptions } from '../../dataHooks';

type FormFields = Pick<Region, 'name' | 'code' | 'region_set_id' | 'centroid_lat' | 'centroid_lon' | 'center_lat' | 'center_lon'>;

export const RegionsAdminPage = () => {
  const [t] = useTranslation();
  const regionSetOptions = useRegionSetOptions();

  const loadables = useMemo<Loadable[]>(() => [regionSetOptions], [regionSetOptions]);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await GeoApi.getInstance().regionsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: Region) => {
    return await GeoApi.getInstance().regionsDeleteOne(item.id);
  }, []);

  const updateOne = useCallback(async (variables: FormFields, item: Region) => {
    return (await GeoApi.getInstance().regionsPutOne(item.id, { id: item.id, ...variables })).data;
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await GeoApi.getInstance().regionsPostOne(variables)).data;
  }, []);

  const getName = useCallback((item: Region) => {
    return item.name;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      name: string().extendedAlphaNumeric().required().max(100),
      code: string().code().required().max(100),
      region_set_id: string().uuid4().required(),
      centroid_lat: number().required().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      centroid_lon: number().required().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      center_lat: number().required().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
      center_lon: number().required().transform((_val: unknown, orig: string | number) => orig === '' ? undefined : orig),
    });
  }, []);


  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'name',
        label: t`name`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'code',
        label: t`Code`,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'region_set_id',
        label: t`Region set`,
        options: regionSetOptions.options,
        loading: regionSetOptions.isLoading,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'centroid_lat',
        label: t`Centroid latitude`,
        type: 'number',
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'centroid_lon',
        label: t`Centroid longitude`,
        type: 'number',
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'center_lat',
        label: t`Center latitude`,
        type: 'number',
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        name: 'center_lon',
        label: t`Center longitude`,
        type: 'number',
      },
    ];
  }, [regionSetOptions.isLoading, regionSetOptions.options, t]);

  const tableColumns = useMemo((): TableColumn<Region>[] => {
    return [
      TableUtil.createTextColumn<Region>({ id: 'name', name: t`Name` }),
      TableUtil.createTextColumn<Region>({ id: 'code', name: t`Code` }),
      TableUtil.createOptionsColumn<Region>({ id: 'region_set_id', name: t`Region set`, options: regionSetOptions.options }),
    ];
  }, [t, regionSetOptions.options]);

  return (
    <CrudPage<FormFields, Region>
      createOne={createOne}
      crudCommandType={CommandName.RegionCrudCommand}
      defaultSortByField={'name'}
      defaultSortDirection={'asc'}
      deleteOne={deleteOne}
      fetchAll={fetchAll}
      formFieldDefinitions={formFieldDefinitions}
      getName={getName}
      loadables={loadables}
      resourceQueryKeyBase={QUERY_KEY.REGIONS}
      schema={schema}
      tableColumns={tableColumns}
      testIdAttributes={TestIdUtil.createAttributes('RegionsAdminPage')}
      title={t`Regions`}
      updateOne={updateOne}
    />
  );
};
