import {
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import DownloadIcon from '@mui/icons-material/Download';
import type { EChartsReactProps } from 'echarts-for-react';
import EChartsReact from 'echarts-for-react';
import {
  TooltipComponent,
  GeoComponent,
  LegendComponent,
} from 'echarts/components';
import { PieChart } from 'echarts/charts';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { ReactElement } from 'react';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  EChartsOption,
  PieSeriesOption,
} from 'echarts';
import { useTranslation } from 'react-i18next';
import intersection from 'lodash/intersection';
import round from 'lodash/round';
import { useStore } from 'zustand';
import { useQuery } from '@tanstack/react-query';

import {
  DimType,
  GeoApi,
} from '@gen_epix/api';
import type {
  CaseTypeCol,
  Region,
  RegionSetShape,
  TypedUuidSetFilter,
} from '@gen_epix/api';

import { EpiWidget } from '../EpiWidget';
import {
  EChartsUtil,
  EpiListUtil,
  EpiMapUtil,
  EpiCaseTypeUtil,
  QueryUtil,
  EpiDataUtil,
} from '../../../utils';
import {
  EPI_ZONE,
  QUERY_KEY,
} from '../../../models';
import type {
  MenuItemData,
  UnwrapArray,
} from '../../../models';
import type { EpiContextMenuConfigWithPosition } from '../EpiContextMenu';
import { EpiContextMenu } from '../EpiContextMenu';
import { useDimensions } from '../../../hooks';
import { EpiStoreContext } from '../../../stores';
import { EpiWidgetUnavailable } from '../EpiWidgetUnavailable';
import {
  ConfigManager,
  HighlightingManager,
} from '../../../classes';

echarts.use([GeoComponent, TooltipComponent, LegendComponent, CanvasRenderer, PieChart]);

type GeoJSON = { features: unknown[] };

type LspPieSeriesOptionEventData = {
  lspData?: {
    caseIds: string[];
    regionId: string;
  };
};
type LspPieSeriesOptionData = Array<UnwrapArray<PieSeriesOption['data']> & LspPieSeriesOptionEventData>;
type LspEchartsEvent = {
  data: LspPieSeriesOptionEventData;
  event: {
    event: MouseEvent;
  };
};

export const EpiMap = () => {
  const [t] = useTranslation();
  const [column, setColumn] = useState<CaseTypeCol>(null);
  const [epiContextMenuConfig, setEpiContextMenuConfig] = useState<EpiContextMenuConfigWithPosition | null>(null);
  const [hasRenderedOnce, setHasRenderedOnce] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsReact>(null);
  const { dimensions: { width, height } } = useDimensions(containerRef);
  const highlightingManager = useMemo(() => HighlightingManager.instance, []);

  const epiStore = useContext(EpiStoreContext);
  const stratification = useStore(epiStore, (state) => state.stratification);
  const isDataLoading = useStore(epiStore, (state) => state.isDataLoading);
  const sortedData = useStore(epiStore, (state) => state.sortedData);
  const updateEpiMapWidgetData = useStore(epiStore, (state) => state.updateEpiMapWidgetData);
  const epiMapWidgetData = useStore(epiStore, (state) => state.epiMapWidgetData);
  const setFilterValue = useStore(epiStore, (state) => state.setFilterValue);
  const completeCaseType = useStore(epiStore, (state) => state.completeCaseType);

  const [focussedRegion, setFocussedRegion] = useState<Region>();
  const geoDimensions = useMemo(() => EpiCaseTypeUtil.getDimensions(completeCaseType, [DimType.GEO]), [completeCaseType]);
  const regionSetShapesFilter = useMemo<TypedUuidSetFilter>(() => {
    return {
      invert: false,
      key: 'region_set_id',
      type: 'UUID_SET',
      members: EpiDataUtil.getRegionSetIds(completeCaseType),
    };
  }, [completeCaseType]);

  const { isLoading: isRegionSetShapesLoading, error: regionSetShapesError, data: regionSetShapes } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.REGION_SET_SHAPES, regionSetShapesFilter),
    queryFn: async ({ signal }) => {
      return (await GeoApi.getInstance().regionSetShapesPostQuery(regionSetShapesFilter, { signal })).data;
    },
    select: (shapes) => Object.fromEntries(shapes.map(regionSetShape => [regionSetShape.region_set_id, regionSetShape])),
    retry: false,
  });

  useEffect(() => {
    if (column) {
      return;
    }
    if (!geoDimensions.length) {
      throw Error('Epi map can not be shown');
    }
    let preferredCaseTypeColumn: CaseTypeCol;
    if (epiMapWidgetData.columnId) {
      preferredCaseTypeColumn = EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType).find(c => c.id === epiMapWidgetData.columnId);
    } else {
      preferredCaseTypeColumn = EpiCaseTypeUtil.getPreferredGEOColumn(EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType, geoDimensions[0].id));
    }
    setColumn(preferredCaseTypeColumn);
  }, [column, completeCaseType, epiMapWidgetData.columnId, geoDimensions]);

  const regions = useMemo(() => {
    if (!column) {
      return [];
    }
    const regionSetId = completeCaseType.cols[column.col_id].region_set_id;
    return EpiDataUtil.data.regionsByRegionSetId[regionSetId];
  }, [column, completeCaseType.cols]);

  const lineListCaseCount = useMemo(() => {
    return EpiListUtil.getCaseCount(sortedData);
  }, [sortedData]);

  const onEpiContextMenuClose = useCallback(() => {
    setEpiContextMenuConfig(null);
    setFocussedRegion(null);
  }, []);

  const isLoading = isRegionSetShapesLoading || isDataLoading;
  const error = regionSetShapesError;

  const regionSetShape = useMemo<RegionSetShape>(() => {
    if (!column || !regionSetShapes) {
      return null;
    }
    const regionSetId = completeCaseType.cols[column.col_id].region_set_id;
    return regionSetShapes[regionSetId];
  }, [column, completeCaseType.cols, regionSetShapes]);

  const numZones = useMemo(() => {
    if (!regionSetShape) {
      return 0;
    }
    try {
      return (JSON.parse(regionSetShape.geo_json) as GeoJSON).features.length;
    } catch {
      return 0;
    }
  }, [regionSetShape]);

  const maxPieChartArea = useMemo(() => {
    if (!width || !height || !numZones) {
      return 0;
    }
    const smallestDimension = Math.min(width, height);
    const mapArea = smallestDimension ** 2;
    const zoneArea = mapArea / numZones;
    const zoneDimension = Math.sqrt(zoneArea);
    const normalizedZoneDimension = zoneDimension / 4;
    const zonePieArea = ((normalizedZoneDimension / 2) ** 2) * Math.PI;

    return zonePieArea;
  }, [height, numZones, width]);

  const lineListRegionStatistics = useMemo(() => EpiMapUtil.getRegionStatistics(sortedData, column?.id, regions), [column?.id, sortedData, regions]);
  const getPieChartRadius = useCallback((numCases: number): number => {
    return EpiMapUtil.getPieChartRadius(numCases, maxPieChartArea, lineListRegionStatistics);
  }, [lineListRegionStatistics, maxPieChartArea]);

  const { series, epiMapCaseCount } = useMemo<{ series: PieSeriesOption[]; epiMapCaseCount: number }>(() => {
    if (!column || !regions) {
      return {
        epiMapCaseCount: undefined,
        series: [],
      };
    }

    const pieSeriesOptions: PieSeriesOption[] = [];

    const { statisticsPerRegion, numCases: totalNumCases } = EpiMapUtil.getRegionStatistics(sortedData, column.id, regions);

    const pieChartOptionsBase: Partial<PieSeriesOption> = {
      type: 'pie',
      label: {
        show: false,
        silent: true,
      },
      labelLine: {
        show: true,
        smooth: true,
      },
      animation: false,
      coordinateSystem: 'geo',
    };

    Object.entries(statisticsPerRegion).forEach(([regionId, regionData]) => {
      const data: LspPieSeriesOptionData = [];

      if (!stratification) {
        const caseIds = regionData.rows.map(row => row.id);
        if (caseIds.length === 0) {
          return;
        }
        data.push({
          name: 'num-cases',
          value: regionData.numCases,
          lspData: {
            caseIds,
            regionId,
          },
          emphasis: {
            focus: 'self',
          },
          label: {
            formatter: () => regionData.region.name,
          },
        });
      } else {
        stratification.legendaItems.forEach(legendaItem => {
          const rows = regionData.rows.filter(row => legendaItem.caseIds.includes(row.id));
          const caseIds = rows.map(row => row.id);
          const numCases = EpiListUtil.getCaseCount(rows);
          data.push({
            name: legendaItem.rowValue.full,
            value: numCases,
            lspData: {
              caseIds,
              regionId,
            },
            emphasis: {
              focus: 'self',
            },
            label: {
              formatter: () => regionData.region.name,
            },
          });
        });
      }

      pieSeriesOptions.push({
        ...pieChartOptionsBase,
        tooltip: {
          formatter: (callbackParams) => {
            const d = (callbackParams as { data: { name: string; value: number } }).data;
            if (stratification) {
              return `${regionData.region.name} - ${d.name} (n=${d.value}, ${Math.round(d.value / regionData.numCases * 100)}%)`;
            }
            return `${regionData.region.name} (n=${regionData.numCases}, ${Math.round(regionData.numCases / totalNumCases * 100)}%)`;
          },
        },
        radius: getPieChartRadius(regionData.numCases),
        center: [regionData.region.center_lon, regionData.region.center_lat],
        data,
      });
    });

    return {
      series: pieSeriesOptions,
      epiMapCaseCount: totalNumCases,
    };
  }, [column, getPieChartRadius, sortedData, regions, stratification]);

  const getOptions = useCallback(() => {
    if (!regionSetShape) {
      return;
    }

    echarts.registerMap(regionSetShape.id, regionSetShape.geo_json);
    return {
      geo: {
        map: regionSetShape.id,
        // !FIXME: calculate according to: https://github.com/apache/echarts/issues/10253
        aspectScale: 0.68,
        scaleLimit: {
          max: 5,
          min: 1,
        },
        roam: true,
        itemStyle: {
          areaColor: '#e7e8ea',
        },
        label: {
          show: false,
          silent: true,
        },
        emphasis: {
          disabled: true,
        },
        silent: true,
        zoom: 1,
      },
      tooltip: {},
      legend: {
        show: false,
      },
      series: series as unknown,
      color: ConfigManager.instance.config.epi.STRATIFICATION_COLORS,
    } satisfies EChartsOption;
  }, [regionSetShape, series]);

  const events = useMemo<EChartsReactProps['onEvents']>(() => {
    return {
      finished: !hasRenderedOnce ? () => {
        const dom = chartRef?.current?.getEchartsInstance()?.getDom();
        dom?.setAttribute('aria-label', t`Figure of a map`);
        dom?.setAttribute('role', 'img');
        setHasRenderedOnce(true);
      } : undefined,
      mouseover: (event: unknown) => {
        try {
          highlightingManager.highlight({
            caseIds: (event as LspEchartsEvent).data.lspData.caseIds,
            origin: EPI_ZONE.MAP,
          });
        } catch (_error) {
          // ignore
        }
      },
      mouseout: () => {
        highlightingManager.highlight({
          caseIds: [],
          origin: EPI_ZONE.MAP,
        });
      },
      mouseup: (event: unknown) => {
        const mouseEvent = (event as LspEchartsEvent)?.event?.event;
        const eventCaseIds = (event as LspEchartsEvent).data.lspData.caseIds;
        const region = regions.find(r => r.id === (event as LspEchartsEvent).data.lspData.regionId);
        setEpiContextMenuConfig({
          caseIds: eventCaseIds,
          position: {
            left: (event as { event: { event: MouseEvent } }).event.event.clientX,
            top: (event as { event: { event: MouseEvent } }).event.event.clientY,
          },
          mouseEvent,
        });
        setFocussedRegion(region);
      },
    };
  }, [hasRenderedOnce, highlightingManager, regions, t]);

  useEffect(() => {
    const unsubscribe = highlightingManager.subscribe((highlighting) => {
      const foundSerieIndexes: number[] = [];
      const foundDataIndexes: number[] = [];
      series.forEach((serie, serieIndex) => {
        serie.data.forEach((dataArray, dataIndex) => {
          const caseIds = (dataArray as LspPieSeriesOptionEventData).lspData.caseIds;
          if (intersection(caseIds, highlighting.caseIds).length) {
            if (!foundSerieIndexes.includes(serieIndex)) {
              foundSerieIndexes.push(serieIndex);
            }
            foundDataIndexes.push(dataIndex);
          }
        });
      });
      if (!chartRef?.current) {
        return;
      }

      if (highlighting.caseIds.length) {
        chartRef.current.getEchartsInstance()?.dispatchAction({
          type: 'highlight',
          seriesIndex: foundSerieIndexes,
          dataIndex: foundDataIndexes,
        });
      } else {
        chartRef.current.getEchartsInstance()?.dispatchAction({
          type: 'downplay',
        });
      }
    });

    // use highlighting imperatively
    return () => {
      unsubscribe();
    };
  }, [chartRef, highlightingManager, series]);

  const titleMenu = useMemo<MenuItemData>(() => {
    const menu: MenuItemData = {
      label: column?.label ? t('Map: {{label}}', { label: column.label }) : t`Map`,
      tooltip: column ? completeCaseType.cols[column.col_id].description : undefined,
      disabled: !geoDimensions?.length,
      items: [],
    };

    EpiCaseTypeUtil.iterateOrderedDimensions(completeCaseType, (_dimension, dimensionCaseTypeColumns, dimIndex) => {
      EpiCaseTypeUtil.iterateCaseTypeColumns(completeCaseType, dimensionCaseTypeColumns, (caseTypeColumn, col, colIndex) => {
        menu.items.push({
          label: caseTypeColumn.label,
          tooltip: col.description,
          active: caseTypeColumn.id === column?.id,
          divider: dimIndex < geoDimensions.length - 1 && colIndex === dimensionCaseTypeColumns.length - 1,
          callback: () => {
            updateEpiMapWidgetData({ columnId: caseTypeColumn.id });
            setColumn(caseTypeColumn);
          },
        });
      });
    }, DimType.GEO);

    return menu;
  }, [column, completeCaseType, geoDimensions.length, t, updateEpiMapWidgetData]);

  const missingCasesCount = epiMapCaseCount !== undefined ? lineListCaseCount - epiMapCaseCount : 0;
  const missingCasesPercentage = missingCasesCount > 0 ? round(missingCasesCount / lineListCaseCount * 100, 1) : 0;
  const shouldShowLoading = isLoading && !error;
  const shouldShowMap = !!column && (regionSetShape?.geo_json && regionSetShape?.geo_json !== 'null') && series.length > 0;

  const primaryMenu = useMemo<MenuItemData[]>(() => {
    const menus: MenuItemData[] = [];
    menus.push(
      {
        label: t`Download`,
        disabled: !shouldShowMap,
        items: [
          {
            label: t`Save as PNG`,
            leftIcon: <DownloadIcon />,
            callback: () => EChartsUtil.downloadImage(chartRef.current.getEchartsInstance(), 'png', t`Map`),
          },
          {
            label: t`Save as JPEG`,
            leftIcon: <DownloadIcon />,
            callback: () => EChartsUtil.downloadImage(chartRef.current.getEchartsInstance(), 'jpeg', t`Map`),
          },
        ],
      },
    );
    return menus;
  }, [chartRef, shouldShowMap, t]);

  const onShowOnlySelectedRegionMenuItemClick = useCallback((onMenuClose: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    setFilterValue(column.id, [focussedRegion.id]);
    onMenuClose();
  }, [column?.id, focussedRegion, setFilterValue]);

  const getEpiContextMenuExtraItems = useCallback((onMenuClose: () => void): ReactElement => {
    if (!column) {
      return null;
    }
    return (
      <MenuItem
        divider
        // eslint-disable-next-line react/jsx-no-bind
        onClick={() => onShowOnlySelectedRegionMenuItemClick(onMenuClose)}
      >
        <ListItemIcon>
          <FilterAltIcon fontSize={'small'} />
        </ListItemIcon>
        <ListItemText>
          {t('Filter (show only {{regionName}})', { regionName: focussedRegion?.name })}
        </ListItemText>
      </MenuItem>
    );
  }, [column, focussedRegion, onShowOnlySelectedRegionMenuItemClick, t]);

  return (
    <EpiWidget
      expandDisabled={!shouldShowMap}
      isLoading={shouldShowLoading}
      primaryMenu={primaryMenu}
      title={titleMenu}
      warningMessage={shouldShowMap && epiMapCaseCount > 0 && missingCasesCount > 0 ? t('Missing cases: {{missingCasesCount}} ({{missingCasesPercentage}}%)', { missingCasesCount, missingCasesPercentage }) : undefined}
      zone={EPI_ZONE.MAP}
    >
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          height: '100%',
        }}
      >
        {!shouldShowLoading && !shouldShowMap && (
          <Box sx={{ position: 'absolute' }}>
            <EpiWidgetUnavailable
              epiZone={EPI_ZONE.MAP}
              widgetName={t`map`}
            />
          </Box>
        )}
        {shouldShowMap && (
          <EChartsReact
            echarts={echarts}
            notMerge
            onEvents={events}
            option={getOptions()}
            ref={chartRef}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
            }}
          />
        )}
        <EpiContextMenu
          config={epiContextMenuConfig}
          getExtraItems={getEpiContextMenuExtraItems}
          onMenuClose={onEpiContextMenuClose}
        />
      </Box>
    </EpiWidget>
  );
};
