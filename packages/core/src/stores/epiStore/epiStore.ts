import { createStore } from 'zustand';
import { produce } from 'immer';
import { t } from 'i18next';
import difference from 'lodash/difference';
import uniqBy from 'lodash/uniqBy';
import uniq from 'lodash/uniq';
import last from 'lodash/last';
import { persist } from 'zustand/middleware';

import type {
  Stratification,
  StratificationLegendaItem,
  EPI_ZONE,
  CaseTypeRowValue,
  TreeConfiguration,
  FilterValues,
  TreeNode,
} from '../../models';
import {
  STRATIFICATION_SELECTED,
  STRATIFICATION_MODE,
  QUERY_KEY,
} from '../../models';
import {
  EpiTreeUtil,
  EpiCaseTypeUtil,
  SELECTION_FILTER_GROUP,
  TREE_FILTER_GROUP,
  EpiNewickUtil,
  ObjectUtil,
  AxiosUtil,
  QueryUtil,
  EpiDataUtil,
  EpiCaseUtil,
  EpiFilterUtil,
} from '../../utils';
import {
  TreeFilter,
  SelectionFilter,
  FILTER_MODE,
  ConfigManager,
  HighlightingManager,
  NotificationManager,
  QueryClientManager,
} from '../../classes';
import type {
  CreateTableStoreKwArgs,
  CreateTableStoreInitialStateKwArgs,
  TableStoreActions,
  TableStoreState,
} from '../tableStore';
import {
  createTableStoreInitialState,
  createTableStoreActions,
  createTableStorePersistConfiguration,
} from '../tableStore';
import type {
  CaseTypeCol,
  Case,
  CompleteCaseType,
  PhylogeneticTree,
  TypedCompositeFilter,
  CaseQuery,
} from '../../api';
import {
  ColType,
  CaseApi,
} from '../../api';

interface WidgetData {
  isUnavailable: boolean;
}

interface StratifiableColumn {
  caseTypeColumn: CaseTypeCol;
  enabled: boolean;
}

interface EpiTreeWidgetData extends WidgetData {
  treeConfiguration: TreeConfiguration;
  verticalScrollPosition: number;
  zoomLevel: number;
}
interface EpiListWidgetData extends WidgetData {
  visibleItemItemIndex: number;
}
interface EpiCurveWidgetData extends WidgetData {
  dimensionId: string;
  columnId: string;
}
interface EpiMapWidgetData extends WidgetData {
  dimensionId: string;
  columnId: string;
}

interface EpiStoreState extends TableStoreState<Case> {
  expandedZone: EPI_ZONE;
  epiCurveWidgetData: EpiCurveWidgetData;
  epiListWidgetData: EpiListWidgetData;
  epiMapWidgetData: EpiMapWidgetData;
  epiTreeWidgetData: EpiTreeWidgetData;
  newick: string;
  stratification: Stratification;
  tree: TreeNode;
  treeResponse: TreeNode;
  treeAddresses: {
    [key: string]: {
      addresses: { [key: string]: string };
      algorithmCode: string;
    };
  };
  completeCaseType: CompleteCaseType;
  caseSetId: string;
  stratifyableColumns: StratifiableColumn[];
  numVisibleAttributesInSummary: number;
}

interface EpiStoreActions extends TableStoreActions<Case> {
  expandZone: (zone: EPI_ZONE) => void;
  removeTreeFilter: () => Promise<void>;
  mutateCachedCase: (caseId: string, item: Case) => void;
  setPhylogeneticTreeResponse: (phylogeneticTree: PhylogeneticTree) => void;
  stratify: (mode: STRATIFICATION_MODE, caseTypeColumn?: CaseTypeCol) => void;
  updateEpiCurveWidgetData: (data: Partial<EpiCurveWidgetData>) => void;
  updateEpiListWidgetData: (data: Partial<EpiListWidgetData>) => void;
  updateEpiMapWidgetData: (data: Partial<EpiMapWidgetData>) => void;
  updateEpiTreeWidgetData: (data: Partial<EpiTreeWidgetData>) => void;
  addTreeFilter: (nodeId: string) => Promise<void>;
  treeFilterStepOut: () => Promise<void>;
  destroy: () => void;
  resetTreeAddresses: () => void;
  setNumVisibleAttributesInSummary: (numVisibleAttributesInSummary: number) => void;

  // Private
  reloadStratification: () => void;
  reloadTree: () => void;
  reloadStratifyableColumns: () => void;
}

export type EpiStore = EpiStoreState & EpiStoreActions;

export type CreateEpiStoreKwArgs = CreateTableStoreKwArgs<Case> & {
  completeCaseType: CompleteCaseType;
  caseSetId: string;
};

export interface CreateEpiStoreInitialStateKwArgs extends CreateTableStoreInitialStateKwArgs<Case> {
  completeCaseType: CompleteCaseType;
  caseSetId: string;
}

const rowValueComperator = (a: CaseTypeRowValue, b: CaseTypeRowValue): number => {
  if (a.raw === b.raw) {
    return 0;
  }
  if (a.isMissing) {
    return 1;
  }
  if (b.isMissing) {
    return -1;
  }
  return a.short.localeCompare(b.short);
};

const createWidgetDataInitialState = (): WidgetData => ({
  isUnavailable: false,
});

const createEpiTreeWidgetDataInitialState = (): EpiTreeWidgetData => ({
  ...createWidgetDataInitialState(),
  treeConfiguration: null,
  verticalScrollPosition: 0,
  zoomLevel: 1,
});

const createEpiStoreInitialState = (kwArgs: CreateEpiStoreInitialStateKwArgs): EpiStoreState => {
  const { completeCaseType, caseSetId, ...createTableStoreInitialStateKwArgs } = kwArgs;

  return {
    ...createTableStoreInitialState<Case>(createTableStoreInitialStateKwArgs),
    filteredData: {
      [SELECTION_FILTER_GROUP]: [],
      [TREE_FILTER_GROUP]: [],
    },
    stratifyableColumns: [],
    frontendFilterPriorities: [SELECTION_FILTER_GROUP, TREE_FILTER_GROUP],
    completeCaseType,
    caseSetId,
    expandedZone: null,
    stratification: null,
    tree: null,
    treeAddresses: {},
    newick: null,
    treeResponse: null,
    epiTreeWidgetData: createEpiTreeWidgetDataInitialState(),
    epiListWidgetData: {
      ...createWidgetDataInitialState(),
      visibleItemItemIndex: 0,
    },
    epiCurveWidgetData: {
      ...createWidgetDataInitialState(),
      dimensionId: null,
      columnId: null,
    },
    epiMapWidgetData: {
      ...createWidgetDataInitialState(),
      dimensionId: null,
      columnId: null,
    },
    numVisibleAttributesInSummary: ConfigManager.instance.config.epi.INITIAL_NUM_VISIBLE_ATTRIBUTES_IN_CASE_SUMMARY,
  };
};

export const createEpiStore = (kwArgs: CreateEpiStoreKwArgs) => {
  const { completeCaseType, caseSetId, ...createTableStoreKwArgs } = kwArgs;

  const epiStore = createStore<EpiStore>()(
    persist(
      (set, get) => {
        const initialState = createEpiStoreInitialState({
          caseSetId,
          completeCaseType,
          ...createTableStoreKwArgs,
        });
        const tableStoreActions = createTableStoreActions<Case>({
          set,
          get,
        });

        return {
          ...initialState,
          ...tableStoreActions,
          setNumVisibleAttributesInSummary: (numVisibleAttributesInSummary: number) => {
            set({ numVisibleAttributesInSummary });
          },
          resetTreeAddresses: () => {
            set({ treeAddresses: {} });
          },
          addTreeFilter: async (nodeId) => {
            const { setFilterValue, filters, resetTreeAddresses } = get();
            resetTreeAddresses();
            const treeFilter = filters.find(filter => filter instanceof TreeFilter);
            await setFilterValue(treeFilter.id, nodeId);
          },
          treeFilterStepOut: async () => {
            const { setFilterValue, filters, treeResponse, resetTreeAddresses } = get();
            resetTreeAddresses();
            const treeFilter = filters.find(filter => filter instanceof TreeFilter);
            const zoomedInTreeNodeName = EpiTreeUtil.findNewTreeRoot(treeResponse, treeFilter?.filterValue, 'parent').name;
            await setFilterValue(treeFilter.id, zoomedInTreeNodeName === treeResponse.name ? null : zoomedInTreeNodeName);
          },
          removeTreeFilter: async () => {
            const { setFilterValue, filters, resetTreeAddresses } = get();
            const treeFilter = filters.find(filter => filter instanceof TreeFilter);
            if (treeFilter.filterValue) {
              resetTreeAddresses();
              await setFilterValue(treeFilter.id, treeFilter.initialFilterValue);
            }
          },
          stratify: (mode, caseTypeColumn) => {
            const { sortedData, selectedIds } = get();
            const caseIdColors: { [key: string]: string } = {};

            const legendaItems: StratificationLegendaItem[] = [];
            const legendaItemsByColor: { [key: string]: StratificationLegendaItem } = {};
            const legendaItemsByValue: { [key: string]: StratificationLegendaItem } = {};

            const { MAX_STRATIFICATION_UNIQUE_VALUES, STRATIFICATION_COLORS } = ConfigManager.instance.config.epi;

            if (mode === STRATIFICATION_MODE.FIELD) {
              const column = completeCaseType.cols[caseTypeColumn.col_id];
              const conceptSetConceptIds = EpiDataUtil.data.conceptsIdsBySetId[column.concept_set_id];
              if (conceptSetConceptIds) {
                if (conceptSetConceptIds.length < MAX_STRATIFICATION_UNIQUE_VALUES) {
                  conceptSetConceptIds.forEach((conceptId, index) => {
                    const concept = EpiDataUtil.data.conceptsById[conceptId];
                    const color = STRATIFICATION_COLORS[index];
                    const legendaItem: StratificationLegendaItem = {
                      caseIds: [],
                      color,
                      rowValue: {
                        isMissing: false,
                        raw: conceptId,
                        full: `${concept.abbreviation} (${concept.name})`,
                        short: concept.abbreviation,
                        long: concept.name,
                      },
                      columnType: column.col_type,
                    };
                    legendaItemsByColor[color] = legendaItem;
                    legendaItemsByValue[conceptId] = legendaItem;
                    legendaItems.push(legendaItem);
                  });
                  const legendaItemMissingData: StratificationLegendaItem = {
                    caseIds: [],
                    color: STRATIFICATION_COLORS[conceptSetConceptIds.length],
                    rowValue: EpiCaseUtil.getMissingRowValue(''),
                    columnType: column.col_type,
                  };
                  legendaItemsByColor[legendaItemMissingData.color] = legendaItemMissingData;
                  legendaItemsByValue[''] = legendaItemMissingData;
                  legendaItems.push(legendaItemMissingData);

                  sortedData.forEach(row => {
                    const rowValue = EpiCaseUtil.getRowValue(row, caseTypeColumn, completeCaseType);
                    const legendaItem = rowValue.isMissing ? legendaItemMissingData : legendaItemsByValue[rowValue.raw];
                    legendaItem.caseIds.push(row.id);
                    caseIdColors[row.id] = legendaItem.color;
                  });
                  if (legendaItemMissingData.caseIds.length === 0) {
                    legendaItems.splice(legendaItems.indexOf(legendaItemMissingData), 1);
                    delete legendaItemsByColor[legendaItemMissingData.color];
                    delete legendaItemsByValue[''];
                  }
                } else {
                  const rowValues = sortedData.map(row => EpiCaseUtil.getRowValue(row, caseTypeColumn, completeCaseType));
                  const uniqueRowValues = uniqBy(rowValues, (rowValue => rowValue.raw)).sort((a, b) => {
                    if (column.col_type === ColType.ORDINAL) {
                      if (a.isMissing && b.isMissing) {
                        return 0;
                      }
                      if (a.isMissing) {
                        return 1;
                      }
                      if (b.isMissing) {
                        return -1;
                      }
                      return conceptSetConceptIds.indexOf(a.raw) - conceptSetConceptIds.indexOf(b.raw);
                    }
                    return rowValueComperator(a, b);
                  });

                  uniqueRowValues.forEach((rowValue, index) => {
                    const color = STRATIFICATION_COLORS[index];
                    const legendaItem: StratificationLegendaItem = {
                      caseIds: [],
                      color,
                      rowValue,
                      columnType: column.col_type,
                    };

                    legendaItemsByColor[color] = legendaItem;
                    legendaItemsByValue[rowValue.raw] = legendaItem;
                    legendaItems.push(legendaItem);
                  });
                  sortedData.forEach(row => {
                    const rowValue = EpiCaseUtil.getRowValue(row, caseTypeColumn, completeCaseType);
                    const legendaItem = legendaItemsByValue[rowValue.raw];
                    legendaItem.caseIds.push(row.id);
                    caseIdColors[row.id] = legendaItem.color;
                  });
                }

              } else {
                const rawValues = sortedData.map(row => EpiCaseUtil.getRowValue(row, caseTypeColumn, completeCaseType));
                const uniqueRowValues = uniqBy(rawValues, v => v.raw).sort(rowValueComperator);

                uniqueRowValues.forEach((rowValue, index) => {
                  const color = STRATIFICATION_COLORS[index];
                  const legendaItem: StratificationLegendaItem = {
                    caseIds: [],
                    color,
                    rowValue,
                    columnType: column.col_type,
                  };

                  legendaItemsByColor[color] = legendaItem;
                  legendaItemsByValue[rowValue.raw] = legendaItem;
                  legendaItems.push(legendaItem);
                });

                sortedData.forEach(row => {
                  const rowValue = EpiCaseUtil.getRowValue(row, caseTypeColumn, completeCaseType);
                  const legendaItem = legendaItemsByValue[rowValue.raw];
                  legendaItem.caseIds.push(row.id);
                  caseIdColors[row.id] = legendaItem.color;
                });
              }
              set({
                stratification: {
                  mode: STRATIFICATION_MODE.FIELD,
                  caseTypeColumn,
                  caseIdColors,
                  legendaItems,
                  legendaItemsByColor,
                  legendaItemsByValue,
                },
              });
            } else if (mode === STRATIFICATION_MODE.SELECTION) {
              const rawValues: STRATIFICATION_SELECTED[] = [STRATIFICATION_SELECTED.SELECTED, STRATIFICATION_SELECTED.UNSELECTED];

              rawValues.forEach(rawValue => {
                const color = STRATIFICATION_COLORS[rawValue === STRATIFICATION_SELECTED.SELECTED ? 0 : 1];
                const presentationValue = rawValue === STRATIFICATION_SELECTED.SELECTED ? t`Selected` : t`Unselected`;
                const legendaItem: StratificationLegendaItem = {
                  caseIds: [],
                  color,
                  rowValue: {
                    raw: rawValue,
                    full: presentationValue,
                    long: presentationValue,
                    short: presentationValue,
                    isMissing: false,
                  },
                };

                legendaItemsByColor[color] = legendaItem;
                legendaItemsByValue[rawValue] = legendaItem;
                legendaItems.push(legendaItem);
              });

              sortedData.forEach(row => {
                const legendaItem = selectedIds.includes(row.id) ? legendaItemsByValue[STRATIFICATION_SELECTED.SELECTED] : legendaItemsByValue[STRATIFICATION_SELECTED.UNSELECTED];

                legendaItem.caseIds.push(row.id);
                caseIdColors[row.id] = legendaItem.color;
              });
              set({
                stratification: {
                  mode: STRATIFICATION_MODE.SELECTION,
                  caseTypeColumn,
                  caseIdColors,
                  legendaItems,
                  legendaItemsByColor,
                  legendaItemsByValue,
                },
              });
            } else {
              set({ stratification: null });
            }
          },
          setSelectedIds: (selectedIds: string[]) => {
            tableStoreActions.setSelectedIds(selectedIds);

            const { stratification, stratify } = get();

            // Apply stratification
            if (selectedIds.length && (!stratification || stratification?.mode === STRATIFICATION_MODE.SELECTION)) {
              stratify(STRATIFICATION_MODE.SELECTION);
            } else if (stratification?.mode === STRATIFICATION_MODE.SELECTION && !selectedIds.length) {
              stratify(null);
            }
          },
          expandZone: (expandedZone: EPI_ZONE) => {
            set({ expandedZone });
          },
          updateEpiTreeWidgetData: (data: Partial<EpiTreeWidgetData>) => {
            set({ epiTreeWidgetData: produce(get().epiTreeWidgetData, (draft) => ({ ...draft, ...data })) });
          },
          updateEpiListWidgetData: (data: Partial<EpiListWidgetData>) => {
            set({ epiListWidgetData: produce(get().epiListWidgetData, (draft) => ({ ...draft, ...data })) });
          },
          updateEpiCurveWidgetData: (data: Partial<EpiCurveWidgetData>) => {
            set({ epiCurveWidgetData: produce(get().epiCurveWidgetData, (draft) => ({ ...draft, ...data })) });
          },
          updateEpiMapWidgetData: (data: Partial<EpiMapWidgetData>) => {
            set({ epiMapWidgetData: produce(get().epiMapWidgetData, (draft) => ({ ...draft, ...data })) });
          },
          mutateCachedCase: (caseId: string, item: Case) => {
            const queryClient = QueryClientManager.instance.queryClient;
            const currentCases = QueryUtil.getValidQueryData<Case[]>(QueryUtil.getGenericKey(QUERY_KEY.CASES_LAZY));
            queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.CASES_LAZY), currentCases.map(c => c.id === caseId ? item : c));
          },
          setPhylogeneticTreeResponse: (phylogeneticTree) => {
            const { reloadSortedData, reloadTree, reloadSelectedIds } = get();

            if (phylogeneticTree.newick_repr) {
              // parse the newick into a tree
              const parsedTree = EpiNewickUtil.parse(phylogeneticTree.newick_repr);
              const sanitizedTree = EpiTreeUtil.sanitizeTree(parsedTree);

              // the tree determines the order of the line list
              const sortedIds = EpiNewickUtil.getSortedNames(sanitizedTree);

              set({
                newick: phylogeneticTree.newick_repr,
                treeResponse: sanitizedTree,
                tree: sanitizedTree,
                sortedIds,
              });
            } else {
              set({
                newick: phylogeneticTree.newick_repr,
                treeResponse: null,
                tree: null,
                sortedIds: [],
              });
            }

            reloadTree();
            reloadSortedData();
            reloadSelectedIds();
          },

          // Overwrite table store actions
          setFilterValues: async (filterValues: FilterValues) => {
            const { filters: prevFilters } = get();
            const previousFilterValues: FilterValues = {};
            prevFilters.forEach(filter => {
              previousFilterValues[filter.id] = filter.filterValue;
            });
            const filterValuesDiff = ObjectUtil.getObjectDiff(previousFilterValues, filterValues);
            const treeFilter = prevFilters.find(filter => filter instanceof TreeFilter);
            const hadTreeFilter = !treeFilter.isInitialFilterValue(previousFilterValues[treeFilter.id]);
            if (hadTreeFilter && !filterValuesDiff.includes(treeFilter.id)) {
              NotificationManager.instance.showNotification({
                message: t`The tree filter has automatically been removed`,
                severity: 'info',
              });
              await tableStoreActions.setFilterValues({
                ...filterValues,
                [treeFilter.id]: treeFilter.initialFilterValue,
              });
            } else {
              await tableStoreActions.setFilterValues(filterValues);
            }
          },
          reloadFilterData: () => {
            const { reloadStratification, reloadStratifyableColumns } = get();
            tableStoreActions.reloadFilterData();
            reloadStratifyableColumns();
            reloadStratification();
          },

          // Private
          reloadFilterPriorityData: (filterPriority: string, data: Case[]): Case[] => {
            const { filters, reloadTree } = get();
            if (filterPriority === SELECTION_FILTER_GROUP) {
              const selectionFilter = filters.find(filter => filter instanceof SelectionFilter);
              let filteredCases: Case[];
              if (!selectionFilter.isInitialFilterValue()) {
                const caseIdsInSelection = selectionFilter.filterValue;
                filteredCases = data.filter(c => caseIdsInSelection.includes(c.id));
              } else {
                filteredCases = data;
              }
              return filteredCases;
            }
            if (filterPriority === TREE_FILTER_GROUP) {
              const treeFilter = filters.find(filter => filter instanceof TreeFilter);
              reloadTree();
              const { tree } = get();
              let filteredCases: Case[];
              if (!treeFilter.isInitialFilterValue()) {
                const { subTreeNames } = tree;
                filteredCases = data.filter(c => subTreeNames.includes(c.id));
              } else {
                filteredCases = data;
              }
              return filteredCases;
            }
            throw new Error(`Unknown filter group: ${filterPriority}`);
          },
          reloadTree: () => {
            const { filters, treeResponse, epiTreeWidgetData: { treeConfiguration } } = get();
            const zoomedInTreeNodeName = filters.find(filter => filter instanceof TreeFilter)?.filterValue;
            const tree = zoomedInTreeNodeName ? EpiTreeUtil.findNewTreeRoot(treeResponse, zoomedInTreeNodeName, 'node') : treeResponse;
            if (tree) {
              set({
                treeAddresses: {
                  ...get().treeAddresses,
                  [treeConfiguration.caseTypeCol.id]: {
                    addresses: EpiTreeUtil.createTreeAddresses(tree),
                    algorithmCode: treeConfiguration.treeAlgorithm.code,
                  },
                },
              });
            }
            set({ tree });
          },
          reloadStratifyableColumns: () => {
            const { filteredData, frontendFilterPriorities } = get();

            const data = filteredData[last(frontendFilterPriorities)];
            const { ALLOWED_COL_TYPES_FOR_STRATIFICATION, MAX_STRATIFICATION_UNIQUE_VALUES } = ConfigManager.instance.config.epi;

            const filteredCaseTypeColumns = EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType).filter(caseTypeColumn => {
              const column = completeCaseType.cols[caseTypeColumn.col_id];
              if (!ALLOWED_COL_TYPES_FOR_STRATIFICATION.includes(column.col_type)) {
                return false;
              }
              return true;
            });
            const stratifyableColumns = filteredCaseTypeColumns.map<StratifiableColumn>(caseTypeColumn => {
              const numUniqueValues = uniq(data.map(row => EpiCaseUtil.getRowValue(row, caseTypeColumn, completeCaseType).raw)).length;
              let enabled = true;
              if (numUniqueValues === 0 || numUniqueValues > MAX_STRATIFICATION_UNIQUE_VALUES) {
                enabled = false;
              }
              return {
                caseTypeColumn,
                enabled,
              };
            });
            set({ stratifyableColumns });
          },
          reloadStratification: () => {
            const { stratification, stratify, stratifyableColumns } = get();
            if (stratification?.mode === STRATIFICATION_MODE.FIELD) {
              const activeStratifyableColumn = stratifyableColumns.find(c => c.caseTypeColumn.col_id === stratification.caseTypeColumn.col_id);
              if (!activeStratifyableColumn?.enabled) {
                // column no longer stratifiable
                NotificationManager.instance.showNotification({
                  message: t`The grouping column is no longer available. Grouping has been removed.`,
                  severity: 'info',
                });
                stratify(null);
                return;
              }
            }

            if (!stratification) {
              return;
            }
            stratify(stratification.mode, stratification.caseTypeColumn);
          },
          destroy: () => {
            HighlightingManager.instance.reset();
            tableStoreActions.destroy();
          },
          fetchData: async () => {
            const { fetchAbortController: previousFetchAbortController, globalAbortSignal } = get();
            const queryClient = QueryClientManager.instance.queryClient;

            if (previousFetchAbortController && !previousFetchAbortController.signal.aborted) {
              previousFetchAbortController.abort();
            }
            const fetchAbortController = new AbortController();
            const globalAbortSignalListener = () => {
              fetchAbortController.abort();
              globalAbortSignal.removeEventListener('abort', globalAbortSignalListener);
            };
            globalAbortSignal.addEventListener('abort', globalAbortSignalListener);

            set({ fetchAbortController });
            set({ isDataLoading: true });
            const { filters, setBaseData } = get();
            const activeFilters = filters
              .filter(filter => filter.filterMode === FILTER_MODE.BACKEND && !filter.isInitialFilterValue())
              .map(activeFilter => activeFilter.toBackendFilter())
              .filter(x => !!x);
            const compositeFilter: TypedCompositeFilter = activeFilters.length
              ? {
                type: 'COMPOSITE',
                filters: activeFilters,
                operator: 'AND',
              }
              : undefined;

            const caseQuery: CaseQuery = {
              case_type_ids: [completeCaseType.id],
              case_set_ids: caseSetId ? [caseSetId] : undefined,
              filter: compositeFilter,
            };
            const retrieveCaseIdsByQueryQueryKey = QueryUtil.getRetrieveCaseIdsByQueryKey(completeCaseType.id, caseQuery);

            try {
              let currentCaseIdsByQuery = QueryUtil.getValidQueryData<string[]>(retrieveCaseIdsByQueryQueryKey);
              if (!currentCaseIdsByQuery) {
                currentCaseIdsByQuery = (await CaseApi.getInstance().retrieveCaseIdsByQuery(caseQuery, { signal: fetchAbortController.signal })).data;
                queryClient.setQueryData(retrieveCaseIdsByQueryQueryKey, currentCaseIdsByQuery);
              }

              const currentCases = QueryUtil.getValidQueryData<Case[]>(QueryUtil.getGenericKey(QUERY_KEY.CASES_LAZY));
              const currentCaseIds = (currentCases ?? []).map(x => x.id);
              const missingCaseIds = difference(currentCaseIdsByQuery, currentCaseIds);
              if (missingCaseIds.length) {
                const missingCasesResult = (await CaseApi.getInstance().retrieveCasesByIds(missingCaseIds, { signal: fetchAbortController.signal })).data;
                queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.CASES_LAZY), [...currentCases ?? [], ...missingCasesResult]);
              }

              const casesMap = new Map((QueryUtil.getValidQueryData<Case[]>(QueryUtil.getGenericKey(QUERY_KEY.CASES_LAZY)) ?? []).map(x => [x.id, x]));
              casesMap.forEach((item) => {
                queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.CASES_LAZY, item.id), item);
              });
              const cases = currentCaseIdsByQuery.map(id => casesMap.get(id));

              await EpiDataUtil.loadMissingOrganizations(completeCaseType, cases, fetchAbortController.signal);
              setBaseData(cases);
              set({ isDataLoading: false });
            } catch (error: unknown) {
              if (!AxiosUtil.isAxiosCanceledError(error)) {
                set({ dataError: error as Error });
              }
            } finally {
              globalAbortSignal.removeEventListener('abort', globalAbortSignalListener);
            }
          },
        };
      },
      createTableStorePersistConfiguration<Case, EpiStore>(kwArgs.storageNamePostFix, kwArgs.storageVersion, (state) => {
        return {
          epiTreeWidgetData: {
            ...createEpiTreeWidgetDataInitialState(),
            treeConfiguration: state.epiTreeWidgetData.treeConfiguration,
          },
          numVisibleAttributesInSummary: state.numVisibleAttributesInSummary,
        };
      }),
    ),
  );
  epiStore.getState().setFilters(EpiFilterUtil.createFilters(completeCaseType), EpiFilterUtil.createFilterDimensions(completeCaseType), [SELECTION_FILTER_GROUP, TREE_FILTER_GROUP]);
  return epiStore;
};
