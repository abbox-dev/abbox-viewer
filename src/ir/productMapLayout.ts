import { validNavigationItems } from "./navigationView";
import type {
  NavigationField,
  ScreenItem,
  ValidNavigationItem,
  ValidScreenItem,
} from "./types";

export const MAP_NODE_WIDTH = 112;
export const MAP_NODE_HEIGHT = 52;
export const MAP_NODE_GAP = 56;
export const MAP_ROW_PAD_X = 8;
export const MAP_PAD_TOP = 22;
export const MAP_PAD_BOTTOM = 22;
export const MAP_ARC_OFFSET = 12;
export const MAP_EDGE_ENDPOINT_INSET = 5;
export const MAP_COMPONENT_GAP = 8;

export const MAP_FALLBACK_MAX_SCREENS = 40;
export const MAP_FALLBACK_MAX_EDGES = 80;

export type ProductMapNode = {
  screenIndex: number;
  route: string;
  column: number;
  centerX: number;
  centerY: number;
};

export type ProductMapEdge = {
  listIndex: number;
  from: string;
  to: string;
  fromScreenIndex: number;
  toScreenIndex: number;
  componentIndex: number;
};

export type ProductMapComponent = {
  componentIndex: number;
  minScreenIndex: number;
  nodes: ProductMapNode[];
  width: number;
  height: number;
};

export type ProductMapLayout = {
  fallback: boolean;
  components: ProductMapComponent[];
  isolated: ProductMapNode[];
  edges: ProductMapEdge[];
  connections: Array<{ from: string; to: string }>;
};

export function buildProductMapLayout(
  items: ScreenItem[],
  navigation: NavigationField,
): ProductMapLayout {
  const validScreens = collectValidScreens(items);
  const validEdges = validNavigationItems(navigation);
  const connections = validEdges.map((edge) => ({
    from: edge.from,
    to: edge.to,
  }));

  const fallback =
    validScreens.length > MAP_FALLBACK_MAX_SCREENS ||
    validEdges.length > MAP_FALLBACK_MAX_EDGES;

  if (fallback) {
    return {
      fallback: true,
      components: [],
      isolated: [],
      edges: [],
      connections,
    };
  }

  const routesWithOutgoing = new Set<string>();
  const routesWithIncoming = new Set<string>();
  for (const edge of validEdges) {
    routesWithOutgoing.add(edge.from);
    routesWithIncoming.add(edge.to);
  }

  const wccRouteSets = orderWeaklyConnectedComponents(validEdges, validScreens);
  const routeToComponent = new Map<string, number>();
  wccRouteSets.forEach((routes, componentIndex) => {
    for (const route of routes) {
      routeToComponent.set(route, componentIndex);
    }
  });

  const componentScreens = new Map<number, ValidScreenWithIndex[]>();
  const isolatedScreens: ValidScreenWithIndex[] = [];

  for (const screen of validScreens) {
    const hasOutgoing = routesWithOutgoing.has(screen.route);
    const hasIncoming = routesWithIncoming.has(screen.route);
    if (!hasOutgoing && !hasIncoming) {
      isolatedScreens.push(screen);
      continue;
    }
    const componentId = routeToComponent.get(screen.route);
    if (componentId === undefined) {
      isolatedScreens.push(screen);
      continue;
    }
    const list = componentScreens.get(componentId) ?? [];
    list.push(screen);
    componentScreens.set(componentId, list);
  }

  const components: ProductMapComponent[] = [];
  for (const [componentIndex, screens] of componentScreens.entries()) {
    screens.sort((a, b) => a.screenIndex - b.screenIndex);
    const positioned = positionRowNodes(screens);
    components.push({
      componentIndex,
      minScreenIndex: screens[0]?.screenIndex ?? 0,
      nodes: positioned,
      width: rowWidth(positioned.length),
      height: MAP_PAD_TOP + MAP_NODE_HEIGHT + MAP_PAD_BOTTOM,
    });
  }
  components.sort((a, b) => a.minScreenIndex - b.minScreenIndex);

  isolatedScreens.sort((a, b) => a.screenIndex - b.screenIndex);
  const isolated = positionIsolatedNodes(isolatedScreens);

  const nodeByScreenIndex = new Map<number, ProductMapNode>();
  for (const component of components) {
    for (const node of component.nodes) {
      nodeByScreenIndex.set(node.screenIndex, node);
    }
  }

  const edges: ProductMapEdge[] = [];
  validEdges.forEach((edge, listIndex) => {
    const componentIndex = routeToComponent.get(edge.from);
    if (
      componentIndex === undefined ||
      routeToComponent.get(edge.to) !== componentIndex
    ) {
      return;
    }
    const component = components.find(
      (entry) => entry.componentIndex === componentIndex,
    );
    if (!component) {
      return;
    }
    const fromScreenIndex = firstScreenIndexInList(component.nodes, edge.from);
    const toScreenIndex = firstScreenIndexInList(component.nodes, edge.to);
    if (fromScreenIndex === undefined || toScreenIndex === undefined) {
      return;
    }
    edges.push({
      listIndex,
      from: edge.from,
      to: edge.to,
      fromScreenIndex,
      toScreenIndex,
      componentIndex,
    });
  });

  return {
    fallback: false,
    components,
    isolated,
    edges,
    connections,
  };
}

type ValidScreenWithIndex = ValidScreenItem & { screenIndex: number };

function collectValidScreens(items: ScreenItem[]): ValidScreenWithIndex[] {
  const out: ValidScreenWithIndex[] = [];
  items.forEach((item, screenIndex) => {
    if (item.kind === "valid") {
      out.push({ ...item, screenIndex });
    }
  });
  return out;
}

function weaklyConnectedRouteSets(edges: ValidNavigationItem[]): Set<string>[] {
  const parent = new Map<string, string>();

  function find(route: string): string {
    const existing = parent.get(route);
    if (existing === undefined) {
      parent.set(route, route);
      return route;
    }
    if (existing === route) {
      return route;
    }
    const root = find(existing);
    parent.set(route, root);
    return root;
  }

  function union(a: string, b: string) {
    parent.set(find(a), find(b));
  }

  for (const edge of edges) {
    parent.set(edge.from, edge.from);
    parent.set(edge.to, edge.to);
    union(edge.from, edge.to);
  }

  const groups = new Map<string, Set<string>>();
  for (const route of parent.keys()) {
    const root = find(route);
    const set = groups.get(root) ?? new Set<string>();
    set.add(route);
    groups.set(root, set);
  }

  return [...groups.values()];
}

function orderWeaklyConnectedComponents(
  edges: ValidNavigationItem[],
  validScreens: ValidScreenWithIndex[],
): Set<string>[] {
  const sets = weaklyConnectedRouteSets(edges);
  const minIndexByRoute = new Map<string, number>();
  for (const screen of validScreens) {
    const current = minIndexByRoute.get(screen.route);
    if (current === undefined || screen.screenIndex < current) {
      minIndexByRoute.set(screen.route, screen.screenIndex);
    }
  }

  return sets.sort((a, b) => {
    const minA = minRouteIndex(a, minIndexByRoute);
    const minB = minRouteIndex(b, minIndexByRoute);
    return minA - minB;
  });
}

function minRouteIndex(
  routes: Set<string>,
  minIndexByRoute: Map<string, number>,
): number {
  let min = Number.POSITIVE_INFINITY;
  for (const route of routes) {
    const index = minIndexByRoute.get(route);
    if (index !== undefined && index < min) {
      min = index;
    }
  }
  return min;
}

function positionRowNodes(screens: ValidScreenWithIndex[]): ProductMapNode[] {
  return screens.map((screen, column) => {
    const centerX =
      MAP_ROW_PAD_X +
      column * (MAP_NODE_WIDTH + MAP_NODE_GAP) +
      MAP_NODE_WIDTH / 2;
    const centerY = MAP_PAD_TOP + MAP_NODE_HEIGHT / 2;
    return {
      screenIndex: screen.screenIndex,
      route: screen.route,
      column,
      centerX,
      centerY,
    };
  });
}

function positionIsolatedNodes(
  screens: ValidScreenWithIndex[],
): ProductMapNode[] {
  return screens.map((screen, column) => ({
    screenIndex: screen.screenIndex,
    route: screen.route,
    column,
    centerX: 0,
    centerY: 0,
  }));
}

function rowWidth(nodeCount: number): number {
  if (nodeCount === 0) {
    return 0;
  }
  return (
    MAP_ROW_PAD_X * 2 +
    nodeCount * MAP_NODE_WIDTH +
    (nodeCount - 1) * MAP_NODE_GAP
  );
}

function firstScreenIndexInList(
  nodes: ProductMapNode[],
  route: string,
): number | undefined {
  for (const node of nodes) {
    if (node.route === route) {
      return node.screenIndex;
    }
  }
  return undefined;
}
