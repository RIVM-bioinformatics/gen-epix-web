import {
  subYears,
  parseISO,
  parse,
} from 'date-fns';
import { t } from 'i18next';

import {
  DimType,
  ColType,
} from '@gen_epix/api';
import type {
  CompleteCaseType,
  CaseTypeCol,
  CaseTypeDim,
  Col,
} from '@gen_epix/api';

import {
  DateFilter,
  FILTER_MODE,
  DEFAULT_FILTER_GROUP,
  GeoFilter,
  MultiSelectFilter,
  NumberRangeFilter,
  SelectionFilter,
  TextFilter,
  TreeFilter,
} from '../../classes';
import type {
  FilterDimension,
  Filters,
  AutoCompleteOption,
} from '../../models';
import {
  EpiCaseTypeUtil,
  SELECTION_FILTER_GROUP,
  TREE_FILTER_GROUP,
} from '../EpiCaseTypeUtil';
import { EpiDataUtil } from '../EpiDataUtil';

export class EpiFilterUtil {

  public static createFilterDimensions(completeCaseType: CompleteCaseType): FilterDimension[] {
    const filterDimensions: FilterDimension[] = [];

    completeCaseType.case_type_dims.forEach(caseTypeDimension => {
      const dimension = completeCaseType.dims[caseTypeDimension.dim_id];
      const cols = caseTypeDimension.case_type_col_order.map(id => completeCaseType.case_type_cols[id]).map(caseTypeColumn => completeCaseType.cols[caseTypeColumn.col_id]);
      if (EpiCaseTypeUtil.isGeneticDistanceDimension(dimension, cols)) {
        return;
      }

      const filterDimension: Omit<FilterDimension, 'preferredFilterId' | 'allowMultipleVisibleFilters' | 'allowOnlyPreferredFilter'> = {
        id: caseTypeDimension.id,
        label: completeCaseType.dims[caseTypeDimension.dim_id].label,
        filterIds: caseTypeDimension.case_type_col_order,
        description: completeCaseType.dims[caseTypeDimension.dim_id].description,
      };
      const caseTypeColumns = caseTypeDimension.case_type_col_order.map(id => completeCaseType.case_type_cols[id]);
      if (!caseTypeColumns.length) {
        return null;
      }

      let preferredFilterId: string;
      let allowMultipleVisibleFilters = false;
      let allowOnlyPreferredFilter = false;

      if (dimension.dim_type === DimType.TIME) {
        const preferredCaseTypeColumn = EpiCaseTypeUtil.getPreferredColumnInDimensionHavingHighestRank(caseTypeColumns, completeCaseType);
        preferredFilterId = preferredCaseTypeColumn.id;
        allowOnlyPreferredFilter = true;
      } else if (dimension.dim_type === DimType.GEO) {
        const preferredCaseTypeColumn = EpiCaseTypeUtil.getPreferredGEOColumn(caseTypeColumns);
        preferredFilterId = preferredCaseTypeColumn.id;
      } else {
        const preferredCaseTypeColumn = EpiCaseTypeUtil.getPreferredColumnInDimensionHavingHighestRank(caseTypeColumns, completeCaseType);
        preferredFilterId = preferredCaseTypeColumn.id;
        allowMultipleVisibleFilters = dimension.dim_type !== DimType.NUMBER;
      }

      filterDimensions.push({
        ...filterDimension,
        preferredFilterId,
        allowMultipleVisibleFilters,
        allowOnlyPreferredFilter,
      });
    });
    return filterDimensions;
  }

  public static createFilters(completeCaseType: CompleteCaseType): Filters {
    const filters: Filters = [];
    filters.push(new SelectionFilter({
      id: 'selected',
      label: t`Selected rows`,
      filterMode: FILTER_MODE.FRONTEND,
      filterPriority: SELECTION_FILTER_GROUP,
    }));
    filters.push(new TreeFilter({
      id: 'sequence_id',
      label: t`Tree`,
      filterMode: FILTER_MODE.FRONTEND,
      filterPriority: TREE_FILTER_GROUP,
    }));

    completeCaseType.case_type_dims.forEach((caseTypeDimension) => {
      const dimension = completeCaseType.dims[caseTypeDimension.dim_id];
      const caseTypeColumns = caseTypeDimension.case_type_col_order.map(id => completeCaseType.case_type_cols[id]);
      caseTypeColumns.forEach(caseTypeColumn => {
        const column = completeCaseType.cols[caseTypeColumn.col_id];

        if (dimension.dim_type === DimType.TIME) {
          const today = new Date();
          const todayMinus20Years = subYears(today, 20);
          filters.push(
            new DateFilter({
              id: caseTypeColumn.id,
              label: caseTypeColumn.label,
              filterMode: FILTER_MODE.BACKEND,
              filterPriority: DEFAULT_FILTER_GROUP,
              filterDimensionId: caseTypeDimension.id,
              dateParser: EpiFilterUtil.getDateParser(column),
              minDate: todayMinus20Years,
              maxDate: new Date(),
              backendFilterType: column.col_type === ColType.TIME_DAY ? 'DATE_RANGE' : 'PARTIAL_DATE_RANGE',
            }),
          );
        } else if (dimension.dim_type === DimType.GEO) {
          const regionSet = EpiDataUtil.data.regionSets[column.region_set_id];
          const options = (EpiDataUtil.data.regionsByRegionSetId[column.region_set_id]?.map<AutoCompleteOption>(region => {
            return {
              value: region.id,
              label: regionSet.region_code_as_label ? region.code : region.name,
            };
          }) ?? []).sort((a, b) => a.label.localeCompare(b.label));
          filters.push(new GeoFilter({
            id: caseTypeColumn.id,
            label: caseTypeColumn.label,
            filterMode: FILTER_MODE.BACKEND,
            filterPriority: DEFAULT_FILTER_GROUP,
            filterDimensionId: caseTypeDimension.id,
            options,
          }));
        } else if (dimension.dim_type === DimType.TEXT) {
          filters.push(EpiFilterUtil.createCategoricalFilter(caseTypeColumn, caseTypeDimension, completeCaseType));
        } else if (dimension.dim_type === DimType.NUMBER) {
          if (([ColType.DECIMAL_0, ColType.DECIMAL_1, ColType.DECIMAL_2, ColType.DECIMAL_3, ColType.DECIMAL_4, ColType.DECIMAL_5, ColType.DECIMAL_6] as ColType[]).includes(column.col_type)) {
            filters.push(new NumberRangeFilter({
              id: caseTypeColumn.id,
              label: caseTypeColumn.label,
              filterMode: FILTER_MODE.BACKEND,
              filterPriority: DEFAULT_FILTER_GROUP,
              filterDimensionId: caseTypeDimension.id,
              min: caseTypeColumn.min_value ?? -Infinity,
              max: caseTypeColumn.max_value ?? Infinity,
            }));
          } else {
            filters.push(EpiFilterUtil.createCategoricalFilter(caseTypeColumn, caseTypeDimension, completeCaseType));
          }
        } else if (dimension.dim_type === DimType.ORGANIZATION) {
          // organizations are already sorted
          const options = EpiDataUtil.data.organizations.map<AutoCompleteOption>(organization => {
            return {
              value: organization.id,
              label: organization.name,
            };
          });
          filters.push(new MultiSelectFilter({
            id: caseTypeColumn.id,
            label: caseTypeColumn.label,
            filterMode: FILTER_MODE.BACKEND,
            filterPriority: DEFAULT_FILTER_GROUP,
            filterDimensionId: caseTypeDimension.id,
            options,
          }));
        } else if (column.col_type === ColType.GENETIC_DISTANCE) {
          return;
        } else {
          filters.push(new TextFilter({
            id: caseTypeColumn.id,
            label: caseTypeColumn.label,
            filterMode: FILTER_MODE.BACKEND,
            filterPriority: DEFAULT_FILTER_GROUP,
            filterDimensionId: caseTypeDimension.id,
          }));
        }
      });
    });
    return filters;
  }

  public static createCategoricalFilter(caseTypeColumn: CaseTypeCol, caseTypeDimension: CaseTypeDim, completeCaseType: CompleteCaseType): MultiSelectFilter | TextFilter {
    const column = completeCaseType.cols[caseTypeColumn.col_id];
    if ((column.col_type === ColType.NOMINAL || column.col_type === ColType.ORDINAL || column.col_type === ColType.INTERVAL) && EpiDataUtil.data.conceptsBySetId[column.concept_set_id]) {
      const options = EpiDataUtil.data.conceptsBySetId[column.concept_set_id].map<AutoCompleteOption>(concept => ({
        value: concept.id,
        label: `${concept.abbreviation} (${concept.name})`,
      }));
      return new MultiSelectFilter({
        id: caseTypeColumn.id,
        label: caseTypeColumn.label,
        filterMode: FILTER_MODE.BACKEND,
        filterPriority: DEFAULT_FILTER_GROUP,
        filterDimensionId: caseTypeDimension.id,
        options,
      });
    }
    return new TextFilter({
      id: caseTypeColumn.id,
      label: caseTypeColumn.label,
      filterMode: FILTER_MODE.BACKEND,
      filterPriority: DEFAULT_FILTER_GROUP,
      filterDimensionId: caseTypeDimension.id,
    });
  }

  public static getDateParser(column: Col): (date: string) => Date {
    if (column.col_type === ColType.TIME_QUARTER) {
      return (date: string) => parse(date, 'yyyy-QQQ', new Date());
    }
    return (date: string) => parseISO(date);
  }
}
