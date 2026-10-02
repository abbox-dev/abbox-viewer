import {
  connectionCount,
  showConnectionSummary,
  showProductMap,
} from "../ir/navigationView";
import type {
  InvalidProductResult,
  LoadedResult,
  NavigationField,
} from "../ir/types";
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
      {fileName ? <p className="file-name">{fileName}</p> : null}
      {showProductMap(result.navigation) ? (
        <ProductMapSection
          items={result.items}
          navigation={result.navigation}
        />
      ) : null}
      <ScreensSection items={result.items} navigation={result.navigation} />
      <InvalidNavigation navigation={result.navigation} />
      <UnrecognizedData entries={result.unrecognized} />
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
