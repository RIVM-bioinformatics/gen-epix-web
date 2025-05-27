import {
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
  useTheme,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import LinkIcon from '@mui/icons-material/Link';
import type {
  ReactElement,
  Ref,
} from 'react';
import {
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';

import {
  Subject,
  TreeFilter,
  ConfigManager,
  DevicePixelRatioManager,
  EpiEventBusManager,
  HighlightingManager,
} from '../../../classes';
import type { EpiContextMenuConfigWithPosition } from '../EpiContextMenu';
import { EpiContextMenu } from '../EpiContextMenu';
import type {
  EpiLinkedScrollSubjectValue,
  Highlighting,
  TreeConfiguration,
  MenuItemData,
  TreeNode,
} from '../../../models';
import { EPI_ZONE } from '../../../models';
import { EpiWidget } from '../EpiWidget';
import { Spinner } from '../../ui';
import {
  EpiStoreContext,
  userProfileStore,
} from '../../../stores';
import type { TreeAssembly } from '../../../utils';
import {
  EpiTreeUtil,
  SELECTION_FILTER_GROUP,
  QueryUtil,
} from '../../../utils';
import { EpiWidgetUnavailable } from '../EpiWidgetUnavailable';
import { EpiTreeDescription } from '../EpiTreeDescription';
import {
  useDimensions,
  useScrollbarSize,
  useSubscribable,
} from '../../../hooks';
import type {
  RetrievePhylogeneticTreeRequestBody,
  GeneticDistanceProtocol,
  TreeAlgorithm,
} from '../../../api';
import { CaseApi } from '../../../api';

type ZoomInMenuItemConfig = {
  caseIds?: string[];
  rootId?: string;
};

type EpiTreeProps = {
  readonly linkedScrollSubject: Subject<EpiLinkedScrollSubjectValue>;
  readonly ref: Ref<EpiTreeRef>;
};

export interface EpiTreeRef {
  link: () => void;
}

export const EpiTree = ({ linkedScrollSubject, ref }: EpiTreeProps) => {
  const theme = useTheme();
  const [t] = useTranslation();
  const scrollbarSize = useScrollbarSize();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { dimensions: { width, height } } = useDimensions(containerRef);
  const [treeCanvas, setTreeCanvas] = useState<HTMLCanvasElement>();
  const [headerCanvas, setHeaderCanvas] = useState<HTMLCanvasElement>();
  const highlightingManager = useMemo(() => HighlightingManager.instance, []);
  const canvasScrollSubject = useMemo<Subject<number>>(() => new Subject(0), []);
  const epiStore = useContext(EpiStoreContext);
  const setPhylogeneticTreeResponse = useStore(epiStore, (state) => state.setPhylogeneticTreeResponse);
  const baseData = useStore(epiStore, (state) => state.baseData);
  const filteredCases = useStore(epiStore, (state) => state.filteredData[SELECTION_FILTER_GROUP]);
  const setSorting = useStore(epiStore, (state) => state.setSorting);
  const tree = useStore(epiStore, (state) => state.tree);
  const sortByField = useStore(epiStore, (state) => state.sortByField);
  const stratification = useStore(epiStore, (state) => state.stratification);
  const completeCaseType = useStore(epiStore, (state) => state.completeCaseType);
  const hasActiveTreeFilter = useStore(epiStore, (state) => !state.filters.find(filter => filter instanceof TreeFilter).isInitialFilterValue());
  const addTreeFilter = useStore(epiStore, (state) => state.addTreeFilter);
  const treeFilterStepOut = useStore(epiStore, (state) => state.treeFilterStepOut);
  const updateEpiTreeWidgetData = useStore(epiStore, (state) => state.updateEpiTreeWidgetData);
  const epiTreeWidgetData = useStore(epiStore, (state) => state.epiTreeWidgetData);
  const removeTreeFilter = useStore(epiStore, (state) => state.removeTreeFilter);
  const isCaseDataLoading = useStore(epiStore, (state) => state.isDataLoading);
  const newick = useStore(epiStore, (state) => state.newick);
  const resetTreeAddresses = useStore(epiStore, (state) => state.resetTreeAddresses);
  const isShowDistancesEnabled = useStore(userProfileStore, (state) => state.epiDashboardTreeSettings.isShowDistancesEnabled);
  const [epiContextMenuConfig, setEpiContextMenuConfig] = useState<EpiContextMenuConfigWithPosition | null>(null);
  const [zoomInMenuItemConfig, setZoomInMenuItemConfig] = useState<ZoomInMenuItemConfig>(null);
  const [extraLeafInfoId, setExtraLeafInfoId] = useState<string>(null);
  const [treeConfiguration, setTreeConfiguration] = useState<TreeConfiguration>(epiTreeWidgetData.treeConfiguration);
  const [treeAssembly, setTreeAssembly] = useState<TreeAssembly>(null);
  const [verticalScrollPosition, setVerticalScrollPosition] = useState<number>(epiTreeWidgetData.verticalScrollPosition);
  const [zoomLevel, setZoomLevel] = useState<number>(epiTreeWidgetData.zoomLevel);
  const [devicePixelRatio, setDevicePixelRatio] = useState<number>(DevicePixelRatioManager.instance.data);
  const [isLinked, setIsLinked] = useState(true);
  const internalHighlightingSubject = useMemo(() => new Subject<Highlighting>({
    caseIds: [],
    origin: null,
  }), []);

  const treeConfigurations = useMemo(() => EpiTreeUtil.getTreeConfigurations(completeCaseType), [completeCaseType]);

  useEffect(() => {
    const unsubscribeHighlightingManager = highlightingManager.subscribe((highlighting) => {
      if (highlighting.origin === EPI_ZONE.TREE) {
        return;
      }
      internalHighlightingSubject.next(highlighting);
    });
    const unsubscribeInternalHighlightingSubject = internalHighlightingSubject.subscribe((highlighting) => {
      if (highlighting.origin !== EPI_ZONE.TREE) {
        return;
      }
      highlightingManager.highlight(highlighting);
    });

    return () => {
      unsubscribeHighlightingManager();
      unsubscribeInternalHighlightingSubject();
    };
  }, [highlightingManager, internalHighlightingSubject]);

  useEffect(() => {
    if (sortByField && isLinked) {
      setIsLinked(false);
      setZoomLevel(ConfigManager.instance.config.epiTree.MIN_UNLINKED_ZOOM_LEVEL);
    }
  }, [isLinked, sortByField]);

  useEffect(() => {
    if (isLinked && zoomLevel > ConfigManager.instance.config.epiTree.MIN_LINKED_ZOOM_LEVEL) {
      setIsLinked(false);
    }
  }, [isLinked, zoomLevel]);

  const resetZoomLevel = useCallback(() => {
    if (isLinked) {
      setZoomLevel(ConfigManager.instance.config.epiTree.MIN_LINKED_ZOOM_LEVEL);
    } else {
      setZoomLevel(ConfigManager.instance.config.epiTree.MIN_UNLINKED_ZOOM_LEVEL);
    }
  }, [isLinked]);

  const caseIds = useMemo(() => filteredCases.map(c => c.id).sort(), [filteredCases]);

  useEffect(() => {
    resetTreeAddresses();
  }, [caseIds, resetTreeAddresses]);

  const hasEnoughSequencesToShowTree = useMemo(() => caseIds.length >= 2 && caseIds.every(x => !!x), [caseIds]);

  const retrievePhylogeneticTreeRequestBody = useMemo<RetrievePhylogeneticTreeRequestBody>(() => ({
    case_ids: caseIds,
    genetic_distance_case_type_col_id: treeConfiguration?.caseTypeCol.id,
    tree_algorithm_code: treeConfiguration?.treeAlgorithm.code,
  }), [caseIds, treeConfiguration?.caseTypeCol.id, treeConfiguration?.treeAlgorithm.code]);

  const { isPending: isTreePending, error: treeError, data: treeData } = useQuery({
    queryKey: QueryUtil.getRetrievePhylogeneticTreeKey(retrievePhylogeneticTreeRequestBody),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().retrievePhylogeneticTree(retrievePhylogeneticTreeRequestBody, { signal });
      return response.data;
    },
    enabled: hasEnoughSequencesToShowTree && !!treeConfiguration,
    retry: false,
    staleTime: Infinity,
  });

  const isLoading = !!treeConfiguration && (isCaseDataLoading || (hasEnoughSequencesToShowTree && isTreePending));
  const isTreeUnavailable = !isCaseDataLoading && ((!isLoading && !!treeError) || !hasEnoughSequencesToShowTree || tree?.maxBranchLength?.toNumber() === 0 || tree?.size === 0 || !treeConfiguration);
  const shouldShowTree = !!treeConfiguration && !isCaseDataLoading && !treeError && !isTreePending && width > 0 && tree?.size > 0 && hasEnoughSequencesToShowTree;

  const treeCanvasWidth = width;
  const treeCanvasHeight = height - ConfigManager.instance.config.epiTree.HEADER_HEIGHT;

  const treeWidthMinusPadding = treeCanvasWidth - ConfigManager.instance.config.epiTree.TREE_PADDING_LEFT - ConfigManager.instance.config.epiTree.TREE_PADDING_RIGHT;
  const pixelToGeneticDistanceRatio = tree?.maxBranchLength ? treeWidthMinusPadding / tree.maxBranchLength.toNumber() : null;
  // Note: There is some magic here, because of the position: sticky for the table header
  const treeHeight = tree?.size ? Math.round((tree.size * ConfigManager.instance.config.epiList.TABLE_ROW_HEIGHT) + scrollbarSize) : ConfigManager.instance.config.epiList.TABLE_ROW_HEIGHT;

  useEffect(() => {
    if (treeData) {
      setPhylogeneticTreeResponse(treeData);
    }
  }, [treeData, setPhylogeneticTreeResponse]);

  useEffect(() => {
    const unsubscribe = canvasScrollSubject.subscribe((data) => {
      setVerticalScrollPosition(data);
    });

    return () => {
      unsubscribe();
    };
  }, [canvasScrollSubject]);

  useEffect(() => {
    if (!treeConfigurations?.length || !!epiTreeWidgetData.treeConfiguration) {
      return;
    }
    setTreeConfiguration(treeConfigurations[0]);
    updateEpiTreeWidgetData({
      treeConfiguration: treeConfigurations[0],
    });
  }, [epiTreeWidgetData.treeConfiguration, treeConfigurations, updateEpiTreeWidgetData]);

  const updateLinkedScrollSubjectDebounced = useDebouncedCallback((position: number) => {
    linkedScrollSubject.next({
      position: position / devicePixelRatio,
      origin: scrollContainerRef.current,
    });
  }, 500);

  const updateScrollPosition = useCallback((position: number, internalZoomLevel: number) => {
    let maxPosition: number;
    let minPosition: number;

    if (internalZoomLevel === ConfigManager.instance.config.epiTree.MIN_LINKED_ZOOM_LEVEL) {
      if (treeHeight < treeCanvasHeight) {
        minPosition = 0;
        maxPosition = 0;
      } else {
        // some magic needs to be done here to prevent the tree from scrolling too far. I can't detect the exact reason, but it seems to be related to the devicePixelRatio
        // this only happens when you use the zoom functionality of the browser
        const roundedDevicePixelRatio = Math.round(devicePixelRatio * 100) / 100;
        const thresholds = [
          [1, 0],
          [1.1, 1],
          [1.25, 4],
          [1.5, 7],
          [1.75, 11],
          [2, 0],
          [2.2, 4],
          [2.5, 7],
          [3, 15],
        ];
        let divePixelRatioOffset = thresholds.find(([threshold]) => roundedDevicePixelRatio <= threshold)?.[1] ?? 0;

        minPosition = 0;
        maxPosition = (treeHeight * devicePixelRatio) - ((treeCanvasHeight) * devicePixelRatio) - divePixelRatioOffset;
      }
    } else {
      minPosition = (-treeCanvasHeight * devicePixelRatio) + ((ConfigManager.instance.config.epiTree.HEADER_HEIGHT / internalZoomLevel) * devicePixelRatio);
      maxPosition = ((treeHeight / internalZoomLevel) * devicePixelRatio) - ((ConfigManager.instance.config.epiTree.HEADER_HEIGHT / internalZoomLevel) * devicePixelRatio);
    }
    const newPosition = Math.round(Math.max(Math.min(maxPosition, position), minPosition));

    canvasScrollSubject.next(newPosition);
    if (internalZoomLevel === ConfigManager.instance.config.epiTree.MIN_LINKED_ZOOM_LEVEL) {
      updateLinkedScrollSubjectDebounced(newPosition);
    }
  }, [treeHeight, canvasScrollSubject, treeCanvasHeight, devicePixelRatio, updateLinkedScrollSubjectDebounced]);

  const devicePixelRatioManagerCallback = useCallback((newDevicePixelRation: number, previousDevicePixelRatio: number) => {
    canvasScrollSubject.next((canvasScrollSubject.data / previousDevicePixelRatio) * newDevicePixelRation);
    setDevicePixelRatio(newDevicePixelRation);
  }, [canvasScrollSubject]);

  useSubscribable(DevicePixelRatioManager.instance, {
    callback: devicePixelRatioManagerCallback,
  });

  const updateEpiTreeWidgetDataDebounced = useDebouncedCallback(() => {
    updateEpiTreeWidgetData({
      zoomLevel,
      verticalScrollPosition,
    });
  }, 500);

  useEffect(() => {
    updateEpiTreeWidgetDataDebounced();
  }, [updateEpiTreeWidgetData, zoomLevel, verticalScrollPosition, updateEpiTreeWidgetDataDebounced]);

  const tickerMarkScale = useMemo(() => {
    return EpiTreeUtil.getTickMarkScale({
      treeWidthMinusPadding,
      geneticTreeWidth: tree?.maxBranchLength?.toNumber(),
      minGeneticScaleUnit: Math.min(EpiTreeUtil.getMinGeneticScaleUnit(tree), treeConfiguration?.geneticDistanceProtocol?.min_scale_unit ?? Infinity),
      zoomLevel,
    });
  }, [treeWidthMinusPadding, tree, treeConfiguration?.geneticDistanceProtocol?.min_scale_unit, zoomLevel]);

  const onEpiContextMenuClose = useCallback(() => {
    setEpiContextMenuConfig(null);
    setZoomInMenuItemConfig(null);
  }, []);

  const linkLineListToTree = useCallback(() => {
    const perform = async () => {
      const newScrollPosition = EpiTreeUtil.getScrollPositionFromTreeVisibility({
        treeHeight,
        treeSize: tree?.size,
        treeCanvasHeight,
        verticalScrollPosition,
        zoomLevel,
      });

      await setSorting(null, null);
      setZoomLevel(ConfigManager.instance.config.epiTree.MIN_LINKED_ZOOM_LEVEL);
      setIsLinked(true);
      updateScrollPosition(newScrollPosition, 1);
      linkedScrollSubject.next({
        position: newScrollPosition,
        origin: scrollContainerRef.current,
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();

  }, [linkedScrollSubject, setSorting, tree?.size, treeCanvasHeight, treeHeight, verticalScrollPosition, updateScrollPosition, zoomLevel]);

  const onLinkButtonClick = useCallback(() => {
    linkLineListToTree();

  }, [linkLineListToTree]);

  const onAddTreeFilterMenuItemClick = useCallback((onMenuClose: () => void) => {
    resetZoomLevel();
    updateScrollPosition(0, 1);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    addTreeFilter(zoomInMenuItemConfig.rootId);
    onMenuClose();
  }, [addTreeFilter, resetZoomLevel, updateScrollPosition, zoomInMenuItemConfig?.rootId]);

  const onRemoveTreeFilterButtonClick = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    removeTreeFilter();
  }, [removeTreeFilter]);

  const onTreeFilterStepOutButtonClick = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    treeFilterStepOut();
  }, [treeFilterStepOut]);

  const getTreeNodeFromCanvas = useCallback((canvas: HTMLCanvasElement, event: MouseEvent): TreeNode => {
    if (!treeAssembly?.pathToTreeNodeMap?.size) {
      return null;
    }
    const ctx = canvas.getContext('2d');

    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const canvasX = (event.clientX - rect.left) * devicePixelRatio;
    const canvasY = (event.clientY - rect.top) * devicePixelRatio;

    for (const path of treeAssembly.pathToTreeNodeMap.keys()) {
      if (ctx.isPointInPath(path, canvasX, canvasY)) {
        return treeAssembly.pathToTreeNodeMap.get(path);
      }
    }
  }, [treeAssembly, devicePixelRatio]);

  useEffect(() => {
    const unsubscribe = linkedScrollSubject.subscribe((data) => {
      if (data.origin === scrollContainerRef.current) {
        return;
      }
      if (zoomLevel === 1) {
        canvasScrollSubject.next(Math.round(data.position * devicePixelRatio));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [linkedScrollSubject, canvasScrollSubject, updateScrollPosition, zoomLevel, devicePixelRatio]);

  // Setup canvas
  useEffect(() => {
    setTreeAssembly(EpiTreeUtil.assembleTree(tree, treeCanvasWidth, pixelToGeneticDistanceRatio));
  }, [pixelToGeneticDistanceRatio, tree, treeCanvasWidth]);

  useEffect(() => {
    if (!treeCanvas || !treeAssembly) {
      return;
    }

    EpiTreeUtil.drawTreeCanvas({ canvas: treeCanvas, theme, treeAssembly, stratification, width, zoomLevel, verticalScrollPosition, treeCanvasWidth, treeWidthMinusPadding, treeCanvasHeight, pixelToGeneticDistanceRatio, tickerMarkScale, shouldShowDistances: isShowDistancesEnabled, devicePixelRatio });
    let animationFrameId: number;
    const unsubscribe = internalHighlightingSubject.subscribe((highlighting) => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        EpiTreeUtil.drawTreeCanvas({ canvas: treeCanvas, theme, treeAssembly, stratification, width, zoomLevel, verticalScrollPosition, treeCanvasWidth, treeWidthMinusPadding, treeCanvasHeight, pixelToGeneticDistanceRatio, tickerMarkScale, highlightedNodeNames: highlighting.caseIds, shouldShowDistances: isShowDistancesEnabled, devicePixelRatio });
      });
    });
    return () => {
      unsubscribe();
      cancelAnimationFrame(animationFrameId);
    };
  }, [treeCanvasHeight, treeCanvas, internalHighlightingSubject, treeWidthMinusPadding, pixelToGeneticDistanceRatio, stratification, theme, tickerMarkScale, treeAssembly, treeCanvasWidth, verticalScrollPosition, width, zoomLevel, isShowDistancesEnabled, devicePixelRatio]);

  // Setup canvas event listeners (note: must be in a separate useEffect to prevent render loop)
  useEffect(() => {
    if (!treeCanvas) {
      return;
    }

    let pos = { y: 0, currentY: 0 };
    let followMouse = false;

    const onMouseDown = (event: MouseEvent) => {
      // store the current mouse position (to be used on mouse move for scrolling)
      pos = {
        y: event.clientY,
        currentY: canvasScrollSubject.data,
      };
      followMouse = true;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (followMouse) {
        treeCanvas.style.cursor = 'move';

        // update the scroll position based on how far the mouse has moved
        // how far the mouse has moved:
        const deltaY = event.clientY - pos.y;
        // the new scroll position:
        const scrolledY = pos.currentY - deltaY;
        // the maximum scroll position:

        updateScrollPosition(scrolledY, zoomLevel);
        return;
      }

      const treeNode = getTreeNodeFromCanvas(treeCanvas, event);
      if (treeNode) {
        treeCanvas.style.cursor = 'pointer';
        internalHighlightingSubject.next({
          caseIds: [...treeNode.subTreeNames, treeNode.name],
          origin: EPI_ZONE.TREE,
        });
      } else {
        treeCanvas.style.cursor = 'default';
        // remove highlighting (only there is highlighting to prevent a render loop)
        if (internalHighlightingSubject.data?.caseIds?.length) {
          internalHighlightingSubject.next({
            caseIds: [],
            origin: EPI_ZONE.TREE,
          });
        }
      }
    };

    const onMouseUp = (event: MouseEvent) => {
      // stop following the mouse for scrolling
      followMouse = false;

      // Handle the click when the user clicked a path in the canvas
      const treeNode = getTreeNodeFromCanvas(treeCanvas, event);
      if (treeNode) {
        setEpiContextMenuConfig({
          position: {
            left: event.clientX,
            top: event.clientY,
          },
          caseIds: treeNode.subTreeLeaveNames ? treeNode.subTreeLeaveNames : [treeNode.name],
          mouseEvent: event,
        });
        if (treeNode.subTreeNames.length && treeNode.name && treeNode.maxBranchLength.toNumber()) {
          setZoomInMenuItemConfig({
            caseIds: treeNode.subTreeLeaveNames,
            rootId: treeNode.name,
          });
        }
        if (treeNode.name && !treeNode.subTreeNames.length) {
          setExtraLeafInfoId(treeNode.name);
        }
      }
    };

    const onMouseWheel = (event: WheelEvent) => {
      event.preventDefault();
      const currentScrollPosition = canvasScrollSubject.data;
      if (event.shiftKey) {
        updateScrollPosition(currentScrollPosition + event.deltaX, zoomLevel);
        return;
      }

      const { MAX_ZOOM_SPEED, MIN_ZOOM_SPEED, MAX_ZOOM_LEVEL, MIN_LINKED_ZOOM_LEVEL, MIN_UNLINKED_ZOOM_LEVEL } = ConfigManager.instance.config.epiTree;

      const zoomSpeed = Math.min(MAX_ZOOM_SPEED, Math.max(MIN_ZOOM_SPEED, treeHeight / treeCanvasHeight * 0.1));
      const newZoomLevel = Math.min(MAX_ZOOM_LEVEL, Math.max(isLinked ? MIN_LINKED_ZOOM_LEVEL : MIN_UNLINKED_ZOOM_LEVEL, zoomLevel + (event.deltaY > 0 ? zoomSpeed : -zoomSpeed)));
      const mouseOnFullSizeTreePosition = (event.offsetY + currentScrollPosition) * zoomLevel;
      const mouseOnCurrentSizeTreePosition = mouseOnFullSizeTreePosition / (treeHeight / (treeHeight / zoomLevel));
      const mouseOnNewSizeTreePosition = mouseOnFullSizeTreePosition / (treeHeight / (treeHeight / newZoomLevel));
      const newScrollPosition = currentScrollPosition - (mouseOnCurrentSizeTreePosition - mouseOnNewSizeTreePosition);

      setZoomLevel(newZoomLevel);
      if (newZoomLevel !== MIN_LINKED_ZOOM_LEVEL) {
        updateScrollPosition(newScrollPosition, newZoomLevel);
      } else {
        updateScrollPosition(linkedScrollSubject.data?.position ?? 0, 1);
      }

      if (newZoomLevel > (isLinked ? MIN_LINKED_ZOOM_LEVEL : MIN_UNLINKED_ZOOM_LEVEL) && newZoomLevel < MAX_ZOOM_LEVEL) {
        // Disconnect the event listener and allow a render cycle to complete
        // But only when zoomLevel is not at it's boundaries, otherwise the event listener will not be reconnected
        treeCanvas.removeEventListener('wheel', onMouseWheel);
      }
    };

    const onMouseOut = () => {
      followMouse = false;

      // reset highlighting (because mouse move event may not have triggered it correctly)
      internalHighlightingSubject.next({
        caseIds: [],
        origin: EPI_ZONE.TREE,
      });
    };

    treeCanvas.addEventListener('mousemove', onMouseMove);
    treeCanvas.addEventListener('mousedown', onMouseDown);
    treeCanvas.addEventListener('mouseup', onMouseUp);
    treeCanvas.addEventListener('mouseout', onMouseOut);
    treeCanvas.addEventListener('wheel', onMouseWheel);

    return () => {
      treeCanvas.removeEventListener('mousemove', onMouseMove);
      treeCanvas.removeEventListener('mousedown', onMouseDown);
      treeCanvas.removeEventListener('mouseup', onMouseUp);
      treeCanvas.removeEventListener('mouseout', onMouseOut);
      treeCanvas.removeEventListener('wheel', onMouseWheel);
    };
  // note: we don't want to re-run this effect when the treeSubject.data changes; it would disconnect the event handles and prevent the user from interacting with the tree
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeCanvasHeight, treeCanvas, getTreeNodeFromCanvas, internalHighlightingSubject, updateScrollPosition, scrollContainerRef, treeHeight, zoomLevel]);

  // Setup header canvas
  useEffect(() => {
    if (!headerCanvas) {
      return;
    }
    const canvas = headerCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    EpiTreeUtil.drawGuides({ canvas, tickerMarkScale, treeWidthMinusPadding, pixelToGeneticDistanceRatio, paddingTop: ConfigManager.instance.config.epiTree.HEADER_HEIGHT * 0.7, paddingBottom: 0, zoomLevel, devicePixelRatio });
    EpiTreeUtil.drawGuides({ canvas, tickerMarkScale, treeWidthMinusPadding, pixelToGeneticDistanceRatio, paddingTop: 0, paddingBottom: ConfigManager.instance.config.epiTree.HEADER_HEIGHT * 0.7, zoomLevel, devicePixelRatio });
    EpiTreeUtil.drawScale({ canvas, theme, tickerMarkScale, pixelToGeneticDistanceRatio, treeWidthMinusPadding, zoomLevel, devicePixelRatio });

    // Draw horizontal top divider
    EpiTreeUtil.drawDivider({ canvas, y: 0, devicePixelRatio });
    // Draw horizontal bottom divider
    EpiTreeUtil.drawDivider({ canvas, y: ConfigManager.instance.config.epiTree.HEADER_HEIGHT - 1, devicePixelRatio });

    ctx.translate(-0.5, -0.5);
  }, [headerCanvas, treeWidthMinusPadding, pixelToGeneticDistanceRatio, theme, tickerMarkScale, zoomLevel, devicePixelRatio]);

  const onShowDetailsSelectionMenuItemClick = useCallback((onMenuClose: () => void) => {
    EpiEventBusManager.instance.emit('openCaseInfoDialog', {
      caseId: baseData.find(c => c.id === extraLeafInfoId).id,
    });
    onMenuClose();
  }, [extraLeafInfoId, baseData]);

  const getEpiContextMenuExtraItems = useCallback((onMenuClose: () => void): ReactElement => {
    if (zoomInMenuItemConfig) {
      return (
        <MenuItem
          divider
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => onAddTreeFilterMenuItemClick(onMenuClose)}
        >
          <ListItemIcon>
            <FilterAltIcon fontSize={'small'} />
          </ListItemIcon>
          <ListItemText>
            {t`Filter (show only this subtree)`}
          </ListItemText>
        </MenuItem>
      );
    }
    if (extraLeafInfoId) {
      return (
        <MenuItem
          divider
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => onShowDetailsSelectionMenuItemClick(onMenuClose)}
        >
          <ListItemIcon>
            <InfoOutlinedIcon fontSize={'small'} />
          </ListItemIcon>
          <ListItemText>
            {t`Show details`}
          </ListItemText>
        </MenuItem>
      );
    }
  }, [extraLeafInfoId, onShowDetailsSelectionMenuItemClick, onAddTreeFilterMenuItemClick, t, zoomInMenuItemConfig]);

  const getTitleMenuLabel = useCallback((geneticDistanceProtocol: GeneticDistanceProtocol, treeAlgorithm: TreeAlgorithm) => {
    return `${geneticDistanceProtocol.name} - ${treeAlgorithm.name}`;
  }, []);

  const titleMenu = useMemo<MenuItemData | string>(() => {
    if (!treeConfigurations?.length) {
      return t`Tree`;
    }

    const menu: MenuItemData = {
      label: treeConfiguration ? t('Tree: {{algorithm}}', { algorithm: getTitleMenuLabel(treeConfiguration.geneticDistanceProtocol, treeConfiguration.treeAlgorithm) }) : t`Tree`,
      tooltip: treeConfiguration
        ? (
          <EpiTreeDescription
            treeConfiguration={treeConfiguration}
          />
        )
        : undefined,
      disabled: !treeConfiguration,
      items: treeConfigurations?.map<MenuItemData>(config => ({
        label: getTitleMenuLabel(config.geneticDistanceProtocol, config.treeAlgorithm),
        callback: () => {
          const perform = async () => {
            await removeTreeFilter();
            updateEpiTreeWidgetData({
              treeConfiguration: config,
            });
            setTreeConfiguration(config);
          };
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          perform();
        },
        active: !!treeConfiguration && treeConfiguration.computedId === config.computedId,
        tooltip: (
          <EpiTreeDescription
            treeConfiguration={config}
          />
        ),
      })) ?? [],
    };

    return menu;
  }, [treeConfigurations, treeConfiguration, t, getTitleMenuLabel, removeTreeFilter, updateEpiTreeWidgetData]);

  const primaryMenu = useMemo<MenuItemData[]>(() => {
    return [
      {
        label: t`Download`,
        disabled: isTreeUnavailable,
        items: [
          {
            label: t`Save as Newick`,
            callback: () => EpiTreeUtil.downloadNewick(newick, t`Tree`),
            leftIcon: <DownloadIcon />,
          },
          {
            label: t`Save as JPEG`,
            callback: () => EpiTreeUtil.downloadImage(treeCanvas, t`Tree`, 'JPEG'),
            leftIcon: <DownloadIcon />,
            disabled: !isLinked,
          },
          {
            label: t`Save as PNG`,
            callback: () => EpiTreeUtil.downloadImage(treeCanvas, t`Tree`, 'PNG'),
            leftIcon: <DownloadIcon />,
            disabled: !isLinked,
          },
        ],
      },
    ];
  }, [t, isTreeUnavailable, isLinked, newick, treeCanvas]);

  const secondaryMenu = useMemo<MenuItemData[]>(() => {
    return [
      {
        disabled: !hasActiveTreeFilter,
        label: t`Change tree filter to nearest ancestor`,
        leftIcon: <ArrowUpwardIcon />,
        callback: onTreeFilterStepOutButtonClick,
      },
      {
        disabled: !hasActiveTreeFilter,
        label: t`Remove tree filter`,
        leftIcon: <ClearIcon />,
        callback: onRemoveTreeFilterButtonClick,
      },
      {
        disabled: isLinked,
        label: t`Link and snap the Line List to the Tree (resets tree zoom level and Line List sorting)`,
        leftIcon: (
          <LinkIcon sx={{
            color: isLinked ? undefined : theme.palette.error.main,
          }}
          />
        ),
        callback: onLinkButtonClick,
      },
    ];
  }, [hasActiveTreeFilter, t, onTreeFilterStepOutButtonClick, onRemoveTreeFilterButtonClick, isLinked, theme.palette.error.main, onLinkButtonClick]);

  const link = useCallback(() => {
    // Link the tree to the current scroll position of the Line List
    setIsLinked(true);
    setZoomLevel(ConfigManager.instance.config.epiTree.MIN_LINKED_ZOOM_LEVEL);
    updateScrollPosition(linkedScrollSubject.data?.position ?? 0, 1);
  }, [linkedScrollSubject.data?.position, updateScrollPosition]);

  useImperativeHandle(ref, () => ({
    link,
  }));

  return (
    <EpiWidget
      expandDisabled={isTreeUnavailable}
      primaryMenu={primaryMenu}
      secondaryMenu={secondaryMenu}
      title={titleMenu}
      zone={EPI_ZONE.TREE}
    >
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          height: '100%',
          width: '100%',
          overflow: 'clip',
        }}
      >
        {isTreeUnavailable && (
          <Box sx={{
            position: 'absolute',
            zIndex: 1,
          }}
          >
            <EpiWidgetUnavailable
              epiZone={EPI_ZONE.TREE}
              widgetName={t`phylogenetic tree`}
            />
          </Box>
        )}
        {(isLoading && !isTreeUnavailable) && (
          <Spinner
            label={t`Loading`}
            takingLongerTimeoutMs={ConfigManager.instance.config.epiTree.TAKING_LONGER_TIMEOUT_MS}
          />
        )}
        {!isTreeUnavailable && shouldShowTree && (
          <Box sx={{
            height: ConfigManager.instance.config.epiTree.HEADER_HEIGHT,
            position: 'absolute',
            background: theme.palette.background.paper,
            width: treeCanvasWidth,
            top: 0,
            zIndex: 1,
          }}
          >
            <Box
              aria-label={t`Figure of a phylogenetic tree scale`.toString()}
              component={'canvas'}
              ref={setHeaderCanvas}
              role={'figure'}
              sx={{
                width: treeCanvasWidth,
                height: ConfigManager.instance.config.epiTree.HEADER_HEIGHT,
              }}
            />
          </Box>
        )}
        <Box
          ref={scrollContainerRef}
          sx={{
            paddingTop: `${ConfigManager.instance.config.epiTree.HEADER_HEIGHT}px`,
            position: 'absolute',
            height,
            width,
            overflowY: 'hidden',
          }}
        >
          {!isTreeUnavailable && shouldShowTree && (
            <Box
              aria-label={t`Figure of a phylogenetic tree`.toString()}
              component={'canvas'}
              ref={setTreeCanvas}
              role={'figure'}
              sx={{
                width: treeCanvasWidth,
                height: treeCanvasHeight,
              }}
            />
          )}
        </Box>
      </Box>

      <EpiContextMenu
        config={epiContextMenuConfig}
        getExtraItems={getEpiContextMenuExtraItems}
        onMenuClose={onEpiContextMenuClose}
      />
    </EpiWidget>
  );
};
