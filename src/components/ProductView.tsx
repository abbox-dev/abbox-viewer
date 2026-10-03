import { showActionSummary, validActionCount } from "../ir/actionsView";
import { showDesignSystem } from "../ir/designSystemView";
import {
  connectionCount,
  showConnectionSummary,
  showProductMap,
} from "../ir/navigationView";
import type {
  ActionsField,
  InvalidProductResult,
  LoadedResult,
  NavigationField,
} from "../ir/types";
import { DesignSystemSection } from "./DesignSystemSection";
import { JsonTree } from "./JsonTree";
import { ProductMapSection } from "./ProductMapSection";
import { ScreensSection } from "./ScreensSection";
import { UnrecognizedData } from "./UnrecognizedData";

type ProductViewProps = {
  fileName: string;
  result: LoadedResult | InvalidProductResult;
};

export function ProductView({ fileName, result }: ProductViewProps) {
  if (!result.ok) {
    return (
      <section className="product">
        {fileName ? <p className="file-name">{fileName}</p> : null}
        <p className="status" role="alert">
          {result.message}
        </p>
        {result.rawScreens !== undefined ? (
          <JsonTree value={result.rawScreens} />
        ) : null}
        <UnrecognizedData entries={result.unrecognized} />
      </section>
    );
  }

  const validCount = result.items.filter(
    (item) => item.kind === "valid",
  ).length;
  const connections = connectionCount(result.navigation);
  const actionTotal = validActionCount(result.actions);

  return (
    <section className="product">
      <p className="eyebrow">
        {result.schemaVersion === "1" ? "Product IR v1" : "Product"}
      </p>
      <h2>{validCount === 1 ? "1 Screen" : `${String(validCount)} Screens`}</h2>
      {showConnectionSummary(result.navigation) ? (
        <p className="product-meta">
          {connections === 1
            ? "1 Connection"
            : `${String(connections)} Connections`}
        </p>
      ) : null}
      {showActionSummary(result.actions) ? (
        <p className="product-meta">
          {actionTotal === 1 ? "1 Action" : `${String(actionTotal)} Actions`}
        </p>
      ) : null}
      {fileName ? <p className="file-name">{fileName}</p> : null}
      {showProductMap(result.navigation) ? (
        <ProductMapSection
          items={result.items}
          navigation={result.navigation}
        />
      ) : null}
      {showDesignSystem(result.designSystem) ? (
        <DesignSystemSection designSystem={result.designSystem} />
      ) : null}
      <ScreensSection
        actions={result.actions}
        items={result.items}
        navigation={result.navigation}
      />
      <InvalidNavigation navigation={result.navigation} />
      <InvalidActions actions={result.actions} />
      <UnrecognizedData entries={result.unrecognized} />
    </section>
  );
}

function InvalidActions({ actions }: { actions: ActionsField }) {
  if (actions.status === "invalid") {
    return (
      <section
        className="invalid-actions"
        aria-labelledby="invalid-actions-heading"
      >
        <h3 id="invalid-actions-heading">Actions (invalid)</h3>
        <p className="status" role="alert">
          {actions.message}
        </p>
        <JsonTree value={actions.raw} />
      </section>
    );
  }

  if (actions.status !== "present") {
    return null;
  }

  const invalidItems = actions.items.filter((item) => item.kind === "invalid");
  if (invalidItems.length === 0) {
    return null;
  }

  return (
    <section
      className="invalid-actions"
      aria-labelledby="invalid-actions-heading"
    >
      <h3 id="invalid-actions-heading">Actions (invalid)</h3>
      <ul className="invalid-actions-list">
        {invalidItems.map((item) => (
          <li
            className="invalid-entry"
            key={`action-invalid-${String(item.index)}`}
          >
            <p>Action entry {item.index} is invalid.</p>
            <JsonTree value={item.raw} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function InvalidNavigation({ navigation }: { navigation: NavigationField }) {
  if (navigation.status === "invalid") {
    return (
      <section
        className="invalid-navigation"
        aria-labelledby="invalid-navigation-heading"
      >
        <h3 id="invalid-navigation-heading">Navigation (invalid)</h3>
        <p className="status" role="alert">
          {navigation.message}
        </p>
        <JsonTree value={navigation.raw} />
      </section>
    );
  }

  if (navigation.status !== "present") {
    return null;
  }

  const invalidItems = navigation.items.filter(
    (item) => item.kind === "invalid",
  );
  if (invalidItems.length === 0) {
    return null;
  }

  return (
    <section
      className="invalid-navigation"
      aria-labelledby="invalid-navigation-heading"
    >
      <h3 id="invalid-navigation-heading">Navigation (invalid)</h3>
      <ul className="invalid-navigation-list">
        {invalidItems.map((item) => (
          <li
            className="invalid-entry"
            key={`nav-invalid-${String(item.index)}`}
          >
            <p>Navigation entry {item.index} is invalid.</p>
            <JsonTree value={item.raw} />
          </li>
        ))}
      </ul>
    </section>
  );
}
