import { showActionSummary, validActionCount } from "../ir/actionsView";
import { showDesignSystem } from "../ir/designSystemView";
import {
  showEntitiesSection,
  showEntitySummary,
  validEntityCount,
} from "../ir/entitiesView";
import {
  mainNavigationSummaryLabel,
  showMainNavigationSection,
  showMainNavigationSummary,
  showProductMapSection,
  validMainNavigationCount,
} from "../ir/globalNavigationView";
import { connectionCount, showConnectionSummary } from "../ir/navigationView";
import type {
  ActionsField,
  EntitiesField,
  GlobalNavigationField,
  InvalidProductResult,
  LoadedResult,
  NavigationField,
} from "../ir/types";
import { CollapsibleSection } from "./CollapsibleSection";
import { DesignSystemSection } from "./DesignSystemSection";
import { EntitiesSection } from "./EntitiesSection";
import { GlobalNavigationSection } from "./GlobalNavigationSection";
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
  const entityTotal = validEntityCount(result.entities);
  const mainNavTotal = validMainNavigationCount(result.globalNavigation);

  return (
    <section className="product">
      <div className="product-summary">
        <p className="eyebrow">
          {result.schemaVersion === "1" ? "Product IR v1" : "Product"}
        </p>
        <h2>
          {validCount === 1 ? "1 Screen" : `${String(validCount)} Screens`}
        </h2>
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
        {showEntitySummary(result.entities) ? (
          <p className="product-meta">
            {entityTotal === 1 ? "1 Entity" : `${String(entityTotal)} Entities`}
          </p>
        ) : null}
        {showMainNavigationSummary(result.globalNavigation) ? (
          <p className="product-meta">
            {mainNavigationSummaryLabel(mainNavTotal)}
          </p>
        ) : null}
        {fileName ? <p className="file-name">{fileName}</p> : null}
      </div>
      {showProductMapSection(result.navigation, result.globalNavigation) ? (
        <ProductMapSection
          globalNavigation={result.globalNavigation}
          items={result.items}
          navigation={result.navigation}
        />
      ) : null}
      {showMainNavigationSection(result.globalNavigation) ? (
        <GlobalNavigationSection globalNavigation={result.globalNavigation} />
      ) : null}
      {showEntitiesSection(result.entities) ? (
        <EntitiesSection entities={result.entities} />
      ) : null}
      <ScreensSection
        actions={result.actions}
        items={result.items}
        navigation={result.navigation}
      />
      {showDesignSystem(result.designSystem) ? (
        <DesignSystemSection designSystem={result.designSystem} />
      ) : null}
      <InvalidNavigation navigation={result.navigation} />
      <InvalidGlobalNavigation globalNavigation={result.globalNavigation} />
      <InvalidActions actions={result.actions} />
      <InvalidEntities entities={result.entities} />
      <UnrecognizedData entries={result.unrecognized} />
    </section>
  );
}

function InvalidEntities({ entities }: { entities: EntitiesField }) {
  if (entities.status === "invalid") {
    return (
      <CollapsibleSection
        className="invalid-entities"
        headingId="invalid-entities-heading"
        id="entities"
        title="Entities (invalid)"
      >
        <p className="status" role="alert">
          {entities.message}
        </p>
        <JsonTree value={entities.raw} />
      </CollapsibleSection>
    );
  }

  if (entities.status !== "present") {
    return null;
  }

  const invalidItems = entities.items.filter((item) => item.kind === "invalid");
  if (invalidItems.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      className="invalid-entities"
      headingId="invalid-entities-heading"
      id="entities"
      title="Entities (invalid)"
    >
      <ul className="invalid-entities-list">
        {invalidItems.map((item) => (
          <li
            className="invalid-entry"
            key={`entity-invalid-${String(item.index)}`}
          >
            <p>Entity entry {item.index} is invalid.</p>
            <JsonTree value={item.raw} />
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}

function InvalidActions({ actions }: { actions: ActionsField }) {
  if (actions.status === "invalid") {
    return (
      <CollapsibleSection
        className="invalid-actions"
        headingId="invalid-actions-heading"
        id="actions"
        title="Actions (invalid)"
      >
        <p className="status" role="alert">
          {actions.message}
        </p>
        <JsonTree value={actions.raw} />
      </CollapsibleSection>
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
    <CollapsibleSection
      className="invalid-actions"
      headingId="invalid-actions-heading"
      id="actions"
      title="Actions (invalid)"
    >
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
    </CollapsibleSection>
  );
}

function InvalidGlobalNavigation({
  globalNavigation,
}: {
  globalNavigation: GlobalNavigationField;
}) {
  if (globalNavigation.status === "invalid") {
    return (
      <CollapsibleSection
        className="invalid-main-navigation"
        headingId="invalid-main-navigation-heading"
        id="mainNav"
        title="Main navigation (invalid)"
      >
        <p className="status" role="alert">
          {globalNavigation.message}
        </p>
        <JsonTree value={globalNavigation.raw} />
      </CollapsibleSection>
    );
  }

  if (globalNavigation.status !== "present") {
    return null;
  }

  const invalidItems = globalNavigation.items.filter(
    (item) => item.kind === "invalid",
  );
  if (invalidItems.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      className="invalid-main-navigation"
      headingId="invalid-main-navigation-heading"
      id="mainNav"
      title="Main navigation (invalid)"
    >
      <ul className="invalid-main-navigation-list">
        {invalidItems.map((item) => (
          <li
            className="invalid-entry"
            key={`main-nav-invalid-${String(item.index)}`}
          >
            <p>Main navigation entry {item.index} is invalid.</p>
            <JsonTree value={item.raw} />
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}

function InvalidNavigation({ navigation }: { navigation: NavigationField }) {
  if (navigation.status === "invalid") {
    return (
      <CollapsibleSection
        className="invalid-navigation"
        headingId="invalid-navigation-heading"
        id="navigation"
        title="Navigation (invalid)"
      >
        <p className="status" role="alert">
          {navigation.message}
        </p>
        <JsonTree value={navigation.raw} />
      </CollapsibleSection>
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
    <CollapsibleSection
      className="invalid-navigation"
      headingId="invalid-navigation-heading"
      id="navigation"
      title="Navigation (invalid)"
    >
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
    </CollapsibleSection>
  );
}
