import { type CSSProperties, useMemo } from "react";
import { mainNavigationRouteSet } from "../ir/globalNavigationView";
import {
  buildProductMapLayout,
  MAP_ARC_OFFSET,
  MAP_COMPONENT_GAP,
  MAP_EDGE_ENDPOINT_INSET,
  MAP_NODE_HEIGHT,
  MAP_NODE_WIDTH,
  MAP_PAD_TOP,
  type ProductMapComponent,
  type ProductMapEdge,
  type ProductMapNode,
} from "../ir/productMapLayout";
import type {
  GlobalNavigationField,
  NavigationField,
  ScreenItem,
} from "../ir/types";
import { CollapsibleSection } from "./CollapsibleSection";

type ProductMapSectionProps = {
  globalNavigation: GlobalNavigationField;
  items: ScreenItem[];
  navigation: NavigationField;
};

export function ProductMapSection({
  globalNavigation,
  items,
  navigation,
}: ProductMapSectionProps) {
  const mainNavRoutes = useMemo(
    () => mainNavigationRouteSet(globalNavigation),
    [globalNavigation],
  );
  const layout = useMemo(
    () => buildProductMapLayout(items, navigation),
    [items, navigation],
  );

  return (
    <CollapsibleSection
      className="product-map"
      describedBy={
        layout.connections.length > 0 ? "product-map-connections" : undefined
      }
      headingId="product-map-heading"
      id="map"
      title="Product map"
    >
      <p className="lede map-lede">
        Connections show navigation attributable to a particular screen. Main
        nav markers identify destinations available through persistent
        navigation.
      </p>

      {layout.fallback ? (
        <ProductMapFallback
          layout={layout}
          items={items}
          mainNavRoutes={mainNavRoutes}
        />
      ) : (
        <>
          {layout.connections.length === 0 ? (
            <p className="map-empty">
              No discovered connections between screens.
            </p>
          ) : null}

          <div className="map-flow">
            {layout.components.map((component) => (
              <MapComponentBlock
                component={component}
                edges={layout.edges.filter(
                  (edge) => edge.componentIndex === component.componentIndex,
                )}
                key={`component-${String(component.componentIndex)}`}
                mainNavRoutes={mainNavRoutes}
              />
            ))}

            {layout.isolated.length > 0 ? (
              <div className="map-isolated">
                {layout.connections.length > 0 ? (
                  <p className="map-subheading">No discovered connections</p>
                ) : null}
                <ul className="map-isolated-list">
                  {layout.isolated.map((node) => (
                    <li
                      className="map-node"
                      key={`iso-${String(node.screenIndex)}`}
                    >
                      <MapScreenNode
                        isMainNav={mainNavRoutes.has(node.route)}
                        route={node.route}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {layout.connections.length > 0 ? (
            <div className="visually-hidden" id="product-map-connections">
              <p className="map-subheading">Connections (discovered)</p>
              <ul className="map-connections-list">
                {layout.connections.map((edge, index) => (
                  <li key={`conn-${String(index)}`}>
                    <span className="route">{edge.from}</span>
                    {" → "}
                    <span className="route">{edge.to}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </CollapsibleSection>
  );
}

function ProductMapFallback({
  layout,
  items,
  mainNavRoutes,
}: {
  layout: ReturnType<typeof buildProductMapLayout>;
  items: ScreenItem[];
  mainNavRoutes: Set<string>;
}) {
  const validCount = items.filter((item) => item.kind === "valid").length;
  const mainNavList = [...mainNavRoutes];
  return (
    <div className="map-fallback">
      <p>
        This snapshot has {String(validCount)} screens and{" "}
        {String(layout.connections.length)} discovered connections. The full map
        is omitted for large products; use the Screens list below for details.
      </p>
      {mainNavList.length > 0 ? (
        <p className="map-fallback-main-nav">
          Main navigation:{" "}
          {mainNavList.map((route, index) => (
            <span key={route}>
              {index > 0 ? ", " : null}
              <span className="route">{route}</span>
            </span>
          ))}
        </p>
      ) : null}
      {layout.connections.length > 0 ? (
        <ul className="map-connections-list">
          {layout.connections.map((edge, index) => (
            <li key={`fb-${String(index)}`}>
              <span className="route">{edge.from}</span>
              {" → "}
              <span className="route">{edge.to}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="map-empty">No discovered connections between screens.</p>
      )}
    </div>
  );
}

function MapScreenNode({
  isMainNav,
  route,
}: {
  isMainNav: boolean;
  route: string;
}) {
  return (
    <>
      <span className="route" title={route}>
        {route}
      </span>
      {isMainNav ? <span className="map-main-nav-marker">Main nav</span> : null}
    </>
  );
}

function MapComponentBlock({
  component,
  edges,
  mainNavRoutes,
}: {
  component: ProductMapComponent;
  edges: ProductMapEdge[];
  mainNavRoutes: Set<string>;
}) {
  const nodeByIndex = new Map<number, ProductMapNode>();
  for (const node of component.nodes) {
    nodeByIndex.set(node.screenIndex, node);
  }

  const markerId = `map-arrowhead-${String(component.componentIndex)}`;

  return (
    <div
      className="map-component"
      style={{
        marginBottom: MAP_COMPONENT_GAP,
        width: component.width,
        maxWidth: "100%",
      }}
    >
      <div
        className="map-component-canvas"
        style={
          {
            "--map-pad-top": `${String(MAP_PAD_TOP)}px`,
            position: "relative",
            width: component.width,
            height: component.height,
            maxWidth: "100%",
          } as CSSProperties
        }
      >
        <ul className="map-row" style={{ width: component.width }}>
          {component.nodes.map((node) => (
            <li
              className="map-node"
              key={`node-${String(node.screenIndex)}`}
              style={{ width: MAP_NODE_WIDTH, minHeight: MAP_NODE_HEIGHT }}
            >
              <MapScreenNode
                isMainNav={mainNavRoutes.has(node.route)}
                route={node.route}
              />
            </li>
          ))}
        </ul>
        <svg
          aria-hidden="true"
          className="map-edges"
          height={component.height}
          overflow="visible"
          viewBox={`0 0 ${String(component.width)} ${String(component.height)}`}
          width={component.width}
        >
          <defs>
            <marker
              id={markerId}
              markerHeight="7"
              markerUnits="userSpaceOnUse"
              markerWidth="7"
              orient="auto"
              refX="6"
              refY="3.5"
            >
              <path d="M0,0 L7,3.5 L0,7 z" fill="currentColor" />
            </marker>
          </defs>
          {edges.map((edge) => {
            const fromNode = nodeByIndex.get(edge.fromScreenIndex);
            const toNode = nodeByIndex.get(edge.toScreenIndex);
            if (!fromNode || !toNode) {
              return null;
            }
            return (
              <MapEdgePath
                edge={edge}
                fromNode={fromNode}
                key={`edge-${String(edge.listIndex)}`}
                markerId={markerId}
                toNode={toNode}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function MapEdgePath({
  edge,
  fromNode,
  toNode,
  markerId,
}: {
  edge: ProductMapEdge;
  fromNode: ProductMapNode;
  toNode: ProductMapNode;
  markerId: string;
}) {
  const halfW = MAP_NODE_WIDTH / 2;
  const inset = MAP_EDGE_ENDPOINT_INSET;
  const cy = fromNode.centerY;
  const laneOffset = (edge.listIndex % 3) * 2 - 2;
  /** Separate attachment height for forward vs return edges on the same card pair. */
  const portOffset = 8;

  if (edge.from === edge.to && edge.fromScreenIndex === edge.toScreenIndex) {
    const loopTop = MAP_PAD_TOP - 6;
    const cx = fromNode.centerX;
    const d = `M ${String(cx - halfW - 4)} ${String(cy)} Q ${String(cx - halfW - 4)} ${String(loopTop)} ${String(cx)} ${String(loopTop + 6)} Q ${String(cx + halfW + 4)} ${String(loopTop)} ${String(cx + halfW + 4)} ${String(cy)}`;
    return (
      <path
        d={d}
        fill="none"
        markerEnd={`url(#${markerId})`}
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    );
  }

  const leftToRight = toNode.column > fromNode.column;
  let x1: number;
  let x2: number;
  let y1: number;
  let y2: number;
  let controlY: number;

  if (leftToRight) {
    x1 = fromNode.centerX + halfW + inset;
    x2 = toNode.centerX - halfW - inset;
    y1 = cy - portOffset;
    y2 = cy - portOffset;
    controlY = cy - MAP_ARC_OFFSET - portOffset + laneOffset;
  } else {
    x1 = fromNode.centerX - halfW - inset;
    x2 = toNode.centerX + halfW + inset;
    y1 = cy + portOffset;
    y2 = cy + portOffset;
    controlY = cy + MAP_ARC_OFFSET + portOffset + laneOffset;
  }

  const midX = (x1 + x2) / 2;
  const d = `M ${String(x1)} ${String(y1)} Q ${String(midX)} ${String(controlY)} ${String(x2)} ${String(y2)}`;

  return (
    <path
      d={d}
      fill="none"
      markerEnd={`url(#${markerId})`}
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
    />
  );
}
