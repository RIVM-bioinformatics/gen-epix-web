import Decimal from 'decimal.js';
import first from 'lodash/first';
import intersection from 'lodash/intersection';
import last from 'lodash/last';
import round from 'lodash/round';
import type { Theme } from '@mui/material';

import type { CompleteCaseType } from '@gen_epix/api';
import { ColType } from '@gen_epix/api';

import { DataUrlUtil } from '../DataUrlUtil';
import type {
  Stratification,
  TreeConfiguration,
  TreeNode,
} from '../../models';
import { NumberUtil } from '../NumberUtil';
import { EpiDataUtil } from '../EpiDataUtil';
import { ColorUtil } from '../ColorUtil';
import { ConfigManager } from '../../classes';

type SanitizeResult = { node: TreeNode; nodesToMove: TreeNode[] };

type PathToTreeNodeMap = Map<Path2D, TreeNode>;

export type TreeAssembly = {
  ancestorTreeLines: Array<{ nodeNames: string[]; shape: Path2D }>;
  ancestorNodes: Array<{ nodeNames: string[]; shape: Path2D }>;
  ancestorClickAreaNodes: Array<{ nodeNames: string[]; shape: Path2D }>;
  leafNodes: Array<{ nodeName: string; shape: Path2D }>;
  leafTreeLines: Array<{ nodeName: string; shape: Path2D }>;
  supportLines: Array<{ nodeName: string; fromX: number; toX: number; y: number }>;
  distanceTexts: Array<{ nodeNames: string[]; x: number; y: number; text: string }>;
  pathToTreeNodeMap: PathToTreeNodeMap;
};

type TreeAssemblyContext = {
  rootNode: TreeNode;
  treeCanvasWidth: number;
  treeAssembly: TreeAssembly;
  pixelToGeneticDistanceRatio: number;
};

type NodeAssemblyResult = {
  x: number;
  y: number;
  caseIds: string[];
};

// [number of lines to draw, genetic distance of single line, minGeneticScaleUnit]
export type TickerMarkScale = [number, number, number];

export class EpiTreeUtil {
  public static getScrollPositionFromTreeVisibility(kwArgs: {
    treeCanvasHeight: number;
    treeHeight: number;
    treeSize: number;
    verticalScrollPosition: number;
    zoomLevel: number;
  }): number {
    const { treeCanvasHeight, treeHeight, verticalScrollPosition, zoomLevel, treeSize } = kwArgs;

    const scaledItemHeight = ConfigManager.instance.config.epiList.TABLE_ROW_HEIGHT / zoomLevel;
    const scrolledByItems = Math.round(verticalScrollPosition / scaledItemHeight);
    const maxItemsInView = Math.round(treeCanvasHeight / scaledItemHeight);

    const firstItemInView = Math.max(0, scrolledByItems);
    const lastItemInView = Math.min(scrolledByItems + maxItemsInView, treeSize);
    const averageItemInView = (firstItemInView + lastItemInView) / 2;

    const newScrollPosition = Math.max(0, Math.min(treeHeight - treeCanvasHeight, averageItemInView * ConfigManager.instance.config.epiList.TABLE_ROW_HEIGHT - treeCanvasHeight / 2));
    return newScrollPosition;
  }


  public static downloadImage(canvas: HTMLCanvasElement, name: string, type: 'PNG' | 'JPEG'): void {
    const dataUrl = canvas.toDataURL(type === 'JPEG' ? 'image/jpeg' : 'image/png');
    DataUrlUtil.downloadUrl(dataUrl, name);
  }

  public static downloadNewick(newick: string, name: string): void {
    DataUrlUtil.downloadUrl(`data:text/x-nh;base64,${btoa(newick)}`, `${name}.txt`);
  }

  public static sanitizeTree(rootNode: TreeNode): TreeNode {
    const sanitize = (node: TreeNode): SanitizeResult => {
      const results: SanitizeResult[] = [];
      node.children?.forEach(child => {
        results.push(sanitize(child));
      });
      results.filter(x => !!x).forEach((result) => {
        node.children.splice(node.children.indexOf(result.node), result.node.children.length === result.nodesToMove.length ? 1 : 0, ...result.nodesToMove);
        node.subTreeNames.splice(node.subTreeNames.indexOf(result.node.name), result.node.children.length === result.nodesToMove.length ? 1 : 0, ...result.nodesToMove.map(n => n.subTreeNames).flat());
      });

      if (node.children?.length) {
        const nodesToMove: TreeNode[] = [];
        node.children.forEach(child => {
          if (node.branchLength.toNumber() === 0 && (node.children?.length || child.branchLength.toNumber() === 0)) {
            nodesToMove.push(child);
          }
        });
        return {
          node,
          nodesToMove,
        };
      }
      return null;
    };
    sanitize(rootNode);
    return rootNode;
  }

  public static createTreeAddresses(rootNode: TreeNode): { [key: string]: string } {
    const treeAddresses: { [key: string]: string } = {};
    const traverse = (node: TreeNode, address: number[] = []): TreeNode => {
      treeAddresses[node.name] = address.join('.');
      if (node.children?.length) {
        const hasZeroBranchLength = node.children.some(child => child.branchLength.toNumber() === 0);

        let index = hasZeroBranchLength ? 2 : 1;
        node.children.forEach((child) => {
          if (child.branchLength.toNumber() === 0) {
            traverse(child, [...address, 1]);
          } else {
            traverse(child, [...address, index]);
            index++;
          }
        });
      }
      return node;
    };
    traverse(rootNode);
    return treeAddresses;
  }

  public static findNewTreeRoot(rootNode: TreeNode, nodeName: string, selector: 'node' | 'parent'): TreeNode {
    let newRoot: TreeNode;
    const findNewRoot = (node: TreeNode) => {
      if (newRoot) {
        return;
      }

      if (selector === 'node' && node.name === nodeName) {
        newRoot = node;
      }
      if (node.children) {
        const matchingChild = node.children.find(childNode => childNode.name === nodeName);
        if (selector === 'parent' && matchingChild) {
          newRoot = node;
        } else {
          node.children.forEach(childNode => findNewRoot(childNode));
        }
      }
    };
    findNewRoot(rootNode);
    return {
      ...newRoot,
      branchLength: new Decimal(0),
      maxBranchLength: newRoot.maxBranchLength.sub(newRoot.branchLength),
    };
  }

  public static getMinGeneticScaleUnit(tree: TreeNode): number {
    if (!tree) {
      return Infinity;
    }
    let min: number = Infinity;
    const traverse = (node: TreeNode) => {
      const branchLength = node.branchLength.toNumber();
      if (!node.children?.length && branchLength && branchLength < min) {
        min = node.branchLength.toNumber();
      }
      node?.children?.forEach(child => traverse(child));
    };
    traverse(tree);
    return min;
  }

  /**
   * getTickMarkScale
   *
   * @param canvasWidth width of the canvas in pixels
   * @param geneticTreeWidth
   * @param minGeneticScaleUnit
   * @returns [number of lines to draw, genetic distance of single line, minGeneticScaleUnit]
   */
  public static getTickMarkScale(params: { treeWidthMinusPadding: number; geneticTreeWidth: number; minGeneticScaleUnit: number; zoomLevel: number }): TickerMarkScale {
    const { treeWidthMinusPadding, geneticTreeWidth, minGeneticScaleUnit, zoomLevel } = params;
    if (!treeWidthMinusPadding || !geneticTreeWidth || !minGeneticScaleUnit) {
      return [0, 0, 0];
    }
    const width = treeWidthMinusPadding / zoomLevel;

    let minNumLines = Math.floor(width / ConfigManager.instance.config.epiTree.MAX_SCALE_WIDTH_PX) + 1;
    let maxNumLines = Math.ceil(width / ConfigManager.instance.config.epiTree.MIN_SCALE_WIDTH_PX) + 1;

    if (geneticTreeWidth / minGeneticScaleUnit < maxNumLines) {
      maxNumLines = Math.max(Math.ceil(geneticTreeWidth / minGeneticScaleUnit), 2);
    }
    if (minNumLines > maxNumLines) {
      minNumLines = maxNumLines;
    }
    if (maxNumLines === 2) {
      return [2, minGeneticScaleUnit, minGeneticScaleUnit];
    }

    if (maxNumLines === 2) {
      return [0, geneticTreeWidth, minGeneticScaleUnit];
    }

    const multiplier = 10 ** (Math.floor(Math.log10(geneticTreeWidth)) - 1);
    const multipliedIncrements = ConfigManager.instance.config.epiTree.SCALE_INCREMENTS.map(i => i * multiplier);

    let bestCombination: [number, number, number] = [0, 0, Infinity];

    for (let numLines = minNumLines; numLines <= maxNumLines; numLines++) {
      for (const increment of multipliedIncrements) {
        if (increment < minGeneticScaleUnit) {
          continue;
        }
        const product = increment * numLines;
        const leftover = Math.abs(geneticTreeWidth - product);
        if (leftover < bestCombination[2]) {
          bestCombination = [numLines, increment, leftover];
        }
      }
    }

    return [...bestCombination.slice(0, 2) as [number, number], minGeneticScaleUnit];
  }

  public static assembleTree(rootNode: TreeNode, treeCanvasWidth: number, pixelToGeneticDistanceRatio: number): TreeAssembly {
    let leafIndex = 0;
    const treeAssembly: TreeAssembly = {
      ancestorTreeLines: [],
      ancestorNodes: [],
      ancestorClickAreaNodes: [],
      leafNodes: [],
      leafTreeLines: [],
      supportLines: [],
      distanceTexts: [],
      pathToTreeNodeMap: new Map(),
    };

    const treeAssemblyContext: TreeAssemblyContext = {
      treeAssembly,
      treeCanvasWidth,
      pixelToGeneticDistanceRatio,
      rootNode,
    };

    const traverseTree = (node: TreeNode, distance = 0): NodeAssemblyResult => {
      if (!node) {
        return;
      }
      const nodeRenderResults: NodeAssemblyResult[] = [];
      node.children?.forEach(child => {
        nodeRenderResults.push(traverseTree(child, distance + (node.branchLength.toNumber() ?? 0)));
      });

      if (!node.children?.length) {
        const result = EpiTreeUtil.assembleLeafNode(treeAssemblyContext, node, distance, leafIndex);
        leafIndex++;
        return result;
      }

      return EpiTreeUtil.assembleAncestorNode(treeAssemblyContext, node, nodeRenderResults);
    };

    traverseTree(rootNode);

    return treeAssembly;
  }

  private static assembleLeafNode(treeAssemblyContext: TreeAssemblyContext, node: TreeNode, distance = 0, leafIndex = 0): NodeAssemblyResult {
    const leafX = (distance ?? 0) + (node.branchLength.toNumber() ?? 0);
    const leafXPxEnd = Math.ceil(leafX * treeAssemblyContext.pixelToGeneticDistanceRatio) + ConfigManager.instance.config.epiTree.TREE_PADDING_LEFT;
    const leafYPx = ((leafIndex) * ConfigManager.instance.config.epiList.TABLE_ROW_HEIGHT) + (ConfigManager.instance.config.epiList.TABLE_ROW_HEIGHT / 2);
    const leafXPxDistance = (node.branchLength.toNumber() ?? 0) * treeAssemblyContext.pixelToGeneticDistanceRatio;
    const leafXPxStart = leafXPxEnd - leafXPxDistance;
    const label = EpiTreeUtil.getDistanceLabel(treeAssemblyContext, node.branchLength);

    // add horizontal line according to distance
    const horizontalLineAccordingToDistancePath = new Path2D();
    horizontalLineAccordingToDistancePath.moveTo(leafXPxStart, leafYPx);
    horizontalLineAccordingToDistancePath.lineTo(leafXPxEnd, leafYPx);
    horizontalLineAccordingToDistancePath.closePath();
    treeAssemblyContext.treeAssembly.leafTreeLines.push({ nodeName: node.name, shape: horizontalLineAccordingToDistancePath });

    // add distance text
    if (label) {
      treeAssemblyContext.treeAssembly.distanceTexts.push({ nodeNames: [node.name], x: (leafXPxStart + leafXPxEnd) / 2, y: leafYPx + 12, text: label });
    }
    // add horizontal support line to max width
    treeAssemblyContext.treeAssembly.supportLines.push({ nodeName: node.name, fromX: leafXPxEnd, toX: treeAssemblyContext.treeCanvasWidth, y: leafYPx });

    // add a dot to represent the node
    const circlePath = new Path2D();
    circlePath.arc(leafXPxEnd, leafYPx, ConfigManager.instance.config.epiTree.LEAF_DOT_RADIUS, 0, 2 * Math.PI, false);
    circlePath.closePath();

    treeAssemblyContext.treeAssembly.pathToTreeNodeMap.set(circlePath, node);
    treeAssemblyContext.treeAssembly.leafNodes.push({ nodeName: node.name, shape: circlePath });

    return {
      x: leafXPxStart,
      y: leafYPx,
      caseIds: [node.name],
    };
  }

  private static assembleAncestorNode(treeAssemblyContext: TreeAssemblyContext, node: TreeNode, childRenderResults: NodeAssemblyResult[]): NodeAssemblyResult {
    const firstChild = first(childRenderResults);
    const lastChild = last(childRenderResults);

    const ancestorXPxEnd = firstChild.x;
    const ancestorXPxDistance = (node.branchLength.toNumber() ?? 0) * treeAssemblyContext.pixelToGeneticDistanceRatio;
    const ancestorXPxStart = ancestorXPxEnd - ancestorXPxDistance;
    const ancestorYPx = (firstChild.y + lastChild.y) / 2;
    const caseIds = childRenderResults.map(r => r.caseIds).flat();
    const label = EpiTreeUtil.getDistanceLabel(treeAssemblyContext, node.branchLength);

    const centerToTopChildRenderResults = childRenderResults.filter(c => c.y < ancestorYPx).sort((a, b) => a.y - b.y);
    const centerToBottomChildRenderResults = childRenderResults.filter(c => c.y > ancestorYPx).sort((a, b) => b.y - a.y);

    [centerToTopChildRenderResults, centerToBottomChildRenderResults].forEach(sortedChildRenderResults => {
      const chunkCaseIds: string[] = [];

      sortedChildRenderResults.forEach((childRenderResult, index) => {
        const lineToYPx = index === sortedChildRenderResults.length - 1 ? ancestorYPx : sortedChildRenderResults[index + 1].y;
        chunkCaseIds.push(...childRenderResult.caseIds);

        const chunkPath = new Path2D();
        chunkPath.moveTo(childRenderResult.x, childRenderResult.y);
        chunkPath.lineTo(childRenderResult.x, lineToYPx);
        chunkPath.closePath();
        treeAssemblyContext.treeAssembly.ancestorTreeLines.push({ nodeNames: [...chunkCaseIds], shape: chunkPath });
      });
    });

    // add horizontal line according to distance
    const horizontalLineAccordingToDistancePath = new Path2D();
    horizontalLineAccordingToDistancePath.moveTo(ancestorXPxStart, ancestorYPx);
    horizontalLineAccordingToDistancePath.lineTo(ancestorXPxEnd, ancestorYPx);
    horizontalLineAccordingToDistancePath.closePath();
    treeAssemblyContext.treeAssembly.ancestorTreeLines.push({ nodeNames: [node.name, ...caseIds], shape: horizontalLineAccordingToDistancePath });

    // add distance text
    if (label) {
      treeAssemblyContext.treeAssembly.distanceTexts.push({ nodeNames: [node.name, ...caseIds], x: (ancestorXPxStart + ancestorXPxEnd) / 2, y: ancestorYPx + 12, text: label });
    }

    if (node.children.every(child => child.branchLength.toNumber() > 0)) {
      // add circle at beginning of the line representing the node itself
      const circlePath = new Path2D();
      circlePath.arc(ancestorXPxEnd, ancestorYPx, ConfigManager.instance.config.epiTree.ANCESTOR_DOT_RADIUS, 0, 2 * Math.PI, false);
      treeAssemblyContext.treeAssembly.ancestorNodes.push({ nodeNames: [node.name, ...caseIds], shape: circlePath });

      // add circle at beginning of the line representing the node itself (click area)
      const circleClickPath = new Path2D();
      circleClickPath.arc(ancestorXPxEnd, ancestorYPx, ConfigManager.instance.config.epiTree.ANCESTOR_DOT_RADIUS_HOVER_ZONE, 0, 2 * Math.PI, false);
      circleClickPath.closePath();
      treeAssemblyContext.treeAssembly.pathToTreeNodeMap.set(circleClickPath, node);
      treeAssemblyContext.treeAssembly.ancestorClickAreaNodes.push({ nodeNames: [node.name, ...caseIds], shape: circleClickPath });
    }

    return {
      x: ancestorXPxStart,
      y: ancestorYPx,
      caseIds,
    };
  }

  private static getDistanceLabel(treeAssemblyContext: TreeAssemblyContext, branchLength: Decimal): string {
    const labelPrecision = treeAssemblyContext.rootNode?.maxBranchLength ? Math.max(1, 4 - String(Math.round(treeAssemblyContext.rootNode.maxBranchLength.toNumber())).length) : null;
    if (!treeAssemblyContext.rootNode.maxBranchLength || treeAssemblyContext.rootNode.maxBranchLength.toNumber() === 0 || !branchLength || branchLength.toNumber() === 0) {
      return null;
    }
    if (branchLength.div(treeAssemblyContext.rootNode.maxBranchLength).mul(100).lessThan(ConfigManager.instance.config.epiTree.MINIMUM_DISTANCE_PERCENTAGE_TO_SHOW_LABEL)) {
      return null;
    }
    return String(round(branchLength.toNumber(), labelPrecision));
  }

  public static drawTree(params: {
    canvas: HTMLCanvasElement;
    theme: Theme;
    treeAssembly: TreeAssembly;
    stratification: Stratification;
    width: number;
    zoomLevel: number;
    highlightedNodeNames: string[];
    verticalScrollPosition: number;
    shouldShowDistances: boolean;
    devicePixelRatio: number;
  }): void {
    const { canvas, theme, treeAssembly, stratification, width, zoomLevel, verticalScrollPosition, shouldShowDistances, devicePixelRatio, highlightedNodeNames = [] } = params;
    const REGULAR_FILL_COLOR = theme.palette.grey[800];

    const ctx = canvas.getContext('2d');
    ctx.setTransform(
      (1 / zoomLevel) * devicePixelRatio, // The scale factor(X direction)
      0, // The skew factor (X-axis)
      0, // The skew factor (Y-axis)
      (1 / zoomLevel) * devicePixelRatio, // The scale factor(Y direction)
      (width * devicePixelRatio / 2) - ((width * devicePixelRatio / zoomLevel) * 0.5), // The translation (X direction)
      -verticalScrollPosition + 0.5, // The translation (Y direction)
    );

    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.textAlign = 'center';
    ctx.font = theme.epi.tree.font;
    ctx.lineWidth = 1;

    treeAssembly.ancestorTreeLines.forEach(({ shape, nodeNames }) => {
      const isHighlighted = intersection(nodeNames, highlightedNodeNames).length > 0;
      const opacity = !highlightedNodeNames.length || isHighlighted ? 1 : 0.2;
      ctx.strokeStyle = ColorUtil.hexToRgba(REGULAR_FILL_COLOR, opacity);
      ctx.stroke(shape);
    });

    treeAssembly.leafTreeLines.forEach(({ shape, nodeName }) => {
      const isHighlighted = highlightedNodeNames.includes(nodeName);
      const opacity = !highlightedNodeNames.length || isHighlighted ? 1 : 0.2;
      ctx.strokeStyle = ColorUtil.hexToRgba(REGULAR_FILL_COLOR, opacity);
      ctx.stroke(shape);
    });

    if (zoomLevel === 1) {
      treeAssembly.supportLines.forEach(({ nodeName, fromX, toX, y }) => {
        const isHighlighted = highlightedNodeNames.includes(nodeName);
        const opacity = !highlightedNodeNames.length || isHighlighted ? 1 : 0.2;
        ctx.setLineDash([1, 4]);
        ctx.beginPath();
        ctx.strokeStyle = ColorUtil.hexToRgba(REGULAR_FILL_COLOR, opacity);
        ctx.moveTo(fromX, y);
        ctx.lineTo(toX, y);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    if (shouldShowDistances) {
      treeAssembly.distanceTexts.forEach(({ x, y, text, nodeNames }) => {
        const isHighlighted = intersection(nodeNames, highlightedNodeNames).length > 0;
        if (isHighlighted) {
          ctx.fillStyle = REGULAR_FILL_COLOR;
          ctx.fillText(text, x, y);
        }
      });
    }

    treeAssembly.ancestorClickAreaNodes.forEach(({ shape }) => {
      ctx.fillStyle = ColorUtil.hexToRgba('#fff', 0);
      ctx.fill(shape);
    });

    treeAssembly.ancestorNodes.forEach(({ shape, nodeNames }) => {
      const isHighlighted = intersection(nodeNames, highlightedNodeNames).length > 0;
      const opacity = !highlightedNodeNames.length || isHighlighted ? 1 : 0.2;
      ctx.fillStyle = ColorUtil.hexToRgba(REGULAR_FILL_COLOR, opacity);
      ctx.fill(shape);
    });

    treeAssembly.leafNodes.forEach(({ shape, nodeName }) => {
      const isHighlighted = highlightedNodeNames.includes(nodeName);
      const opacity = !highlightedNodeNames.length || isHighlighted ? 1 : 0.2;
      ctx.fillStyle = ColorUtil.hexToRgba(stratification?.caseIdColors?.[nodeName] ?? REGULAR_FILL_COLOR, opacity);
      ctx.fill(shape);
    });
  }

  public static drawTreeCanvas(params: {
    canvas: HTMLCanvasElement;
    theme: Theme;
    treeAssembly: TreeAssembly;
    stratification: Stratification;
    width: number;
    zoomLevel: number;
    highlightedNodeNames?: string[];
    verticalScrollPosition: number;
    treeCanvasWidth: number;
    treeWidthMinusPadding: number;
    treeCanvasHeight: number;
    pixelToGeneticDistanceRatio: number;
    tickerMarkScale: TickerMarkScale;
    shouldShowDistances: boolean;
    devicePixelRatio: number;
  }): void {
    const { devicePixelRatio, canvas, theme, treeAssembly, stratification, width, zoomLevel, highlightedNodeNames, verticalScrollPosition, treeCanvasWidth, treeCanvasHeight, tickerMarkScale, treeWidthMinusPadding, pixelToGeneticDistanceRatio, shouldShowDistances } = params;
    const ctx = canvas.getContext('2d');
    ctx.reset();
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    ctx.imageSmoothingEnabled = zoomLevel > 1;
    ctx.imageSmoothingQuality = 'high';

    EpiTreeUtil.drawBackground({ canvas, theme, treeCanvasWidth, treeCanvasHeight, devicePixelRatio });
    EpiTreeUtil.drawGuides({ canvas, tickerMarkScale, treeWidthMinusPadding, pixelToGeneticDistanceRatio, devicePixelRatio, zoomLevel });
    EpiTreeUtil.drawTree({ canvas, theme, treeAssembly, stratification, highlightedNodeNames, zoomLevel, width, verticalScrollPosition, shouldShowDistances, devicePixelRatio });
  }

  public static drawBackground(params: { canvas: HTMLCanvasElement; theme: Theme; treeCanvasWidth: number; treeCanvasHeight: number; devicePixelRatio: number }): void {
    const { canvas, theme, treeCanvasWidth, treeCanvasHeight, devicePixelRatio } = params;
    EpiTreeUtil.draw(canvas, devicePixelRatio, (ctx) => {
      ctx.fillStyle = theme.palette.background.paper;
      ctx.fillRect(0, 0, treeCanvasWidth, treeCanvasHeight);
    });
  }

  public static drawGuides(params: { canvas: HTMLCanvasElement; tickerMarkScale: TickerMarkScale; treeWidthMinusPadding: number; pixelToGeneticDistanceRatio: number; devicePixelRatio: number; paddingTop?: number; paddingBottom?: number; zoomLevel: number }): void {
    const { canvas, tickerMarkScale, treeWidthMinusPadding, pixelToGeneticDistanceRatio, zoomLevel, devicePixelRatio, paddingTop = 0, paddingBottom = 0 } = params;

    const xOffset = ((treeWidthMinusPadding - (treeWidthMinusPadding / zoomLevel)) / 2);

    EpiTreeUtil.draw(canvas, devicePixelRatio, (ctx) => {
      ctx.strokeStyle = ConfigManager.instance.config.epiTree.REGULAR_FILL_COLOR_SUPPORT_LINE;
      ctx.setLineDash([3, 1]);
      const tickerWidth = (tickerMarkScale[1] * pixelToGeneticDistanceRatio) / zoomLevel;
      for (let i = 0; i <= tickerMarkScale[0]; i++) {
        ctx.beginPath();
        const x = ((treeWidthMinusPadding - (i * tickerWidth)) - xOffset) + ConfigManager.instance.config.epiTree.TREE_PADDING_LEFT;
        ctx.moveTo(x, paddingTop);
        ctx.lineTo(x, canvas.height - paddingBottom);
        ctx.stroke();
        ctx.closePath();
      }
      ctx.setLineDash([0, 0]);
    });
  }

  public static drawScale(params: { canvas: HTMLCanvasElement; theme: Theme; tickerMarkScale: TickerMarkScale; pixelToGeneticDistanceRatio: number; treeWidthMinusPadding: number; zoomLevel: number; devicePixelRatio: number }): void {
    const { canvas, theme, tickerMarkScale, pixelToGeneticDistanceRatio, treeWidthMinusPadding, devicePixelRatio, zoomLevel } = params;

    const xOffset = ((treeWidthMinusPadding - (treeWidthMinusPadding / zoomLevel)) / 2);

    EpiTreeUtil.draw(canvas, devicePixelRatio, (ctx) => {
      const tickerWidth = (tickerMarkScale[1] * pixelToGeneticDistanceRatio) / zoomLevel;
      for (let i = 0; i <= tickerMarkScale[0]; i++) {
        ctx.beginPath();
        const x = ((treeWidthMinusPadding - (i * tickerWidth)) - xOffset) + ConfigManager.instance.config.epiTree.TREE_PADDING_LEFT;
        if (x < 0) {
          continue;
        }
        ctx.textAlign = x < 10 ? 'left' : 'center';
        ctx.font = `bold 11px ${theme.typography.fontFamily}`;
        const label = new Decimal(tickerMarkScale[1]);
        ctx.fillText(NumberUtil.toStringWithPrecision(label.times(i).toNumber(), tickerMarkScale[2]), x, ConfigManager.instance.config.epiTree.HEADER_HEIGHT * 0.61);
        ctx.closePath();
      }
    });
  }

  public static drawDivider(params: { canvas: HTMLCanvasElement; y: number; devicePixelRatio: number }): void {
    const { canvas, y, devicePixelRatio } = params;

    EpiTreeUtil.draw(canvas, devicePixelRatio, (ctx) => {
      ctx.strokeStyle = '#EEEEEE';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    });
  }

  private static draw(canvas: HTMLCanvasElement, devicePixelRatio: number, callback: (ctx: CanvasRenderingContext2D) => void): void {
    const ctx = canvas.getContext('2d');
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.translate(0.5, 0.5);
    callback(ctx);
    ctx.translate(-0.5, -0.5);
    ctx.scale(1 / devicePixelRatio, 1 / devicePixelRatio);
  }

  public static getTreeConfigurations(completeCaseType: CompleteCaseType): TreeConfiguration[] {
    const treeConfigurations: TreeConfiguration[] = [];

    const geneticDistanceCaseTypeCols = Object.values(completeCaseType.case_type_cols).filter(caseTypeCol => {
      const col = completeCaseType.cols[caseTypeCol.col_id];
      return col.col_type === ColType.GENETIC_DISTANCE;
    });

    const sortedTreeAlgorithmCodes = EpiDataUtil.data.treeAlgorithms.map(x => x.code);

    geneticDistanceCaseTypeCols.forEach(caseTypeCol => {
      const col = completeCaseType.cols[caseTypeCol.col_id];
      if (col.col_type !== ColType.GENETIC_DISTANCE) {
        return;
      }
      const geneticDistanceProtocol = completeCaseType.genetic_distance_protocols[col.genetic_distance_protocol_id];
      const treeAlgorithms = [...caseTypeCol.tree_algorithm_codes].sort((a, b) => {
        return sortedTreeAlgorithmCodes.indexOf(a) - sortedTreeAlgorithmCodes.indexOf(b);
      }).map(treeAlgorithmCode => completeCaseType.tree_algorithms[treeAlgorithmCode]);

      treeAlgorithms.forEach(treeAlgorithm => {
        treeConfigurations.push({
          computedId: EpiTreeUtil.getTreeConfigurationId({ caseTypeCol, col, geneticDistanceProtocol, treeAlgorithm }),
          caseTypeCol,
          col,
          geneticDistanceProtocol,
          treeAlgorithm,
        });
      });
    });

    return treeConfigurations;
  }

  public static getTreeConfigurationId(treeConfiguration: Omit<TreeConfiguration, 'computedId'>): string {
    return `${treeConfiguration.caseTypeCol.id}_${treeConfiguration.col.id}_${treeConfiguration.geneticDistanceProtocol.id}_${treeConfiguration.treeAlgorithm.id}`;
  }
}
