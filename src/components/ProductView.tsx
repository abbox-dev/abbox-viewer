import type { InvalidProductResult, LoadedResult } from "../ir/types";
import { JsonTree } from "./JsonTree";
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

  return (
    <section className="product">
      <p className="eyebrow">Product</p>
      <h2>{validCount === 1 ? "1 Screen" : `${String(validCount)} Screens`}</h2>
      {fileName ? <p className="file-name">{fileName}</p> : null}
      <ScreensSection items={result.items} />
      <UnrecognizedData entries={result.unrecognized} />
    </section>
  );
}
