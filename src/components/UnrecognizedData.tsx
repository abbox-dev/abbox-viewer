import type { UnrecognizedEntry } from "../ir/types";
import { CollapsibleSection } from "./CollapsibleSection";
import { JsonTree } from "./JsonTree";

export function UnrecognizedData({
  entries,
}: {
  entries: UnrecognizedEntry[];
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      className="unrecognized"
      headingId="unrecognized-heading"
      id="unrecognized"
      title="Unrecognized data"
    >
      <ul className="unrecognized-list">
        {entries.map((entry) => (
          <li key={entry.path}>
            <p className="json-path">{entry.path}</p>
            <JsonTree value={entry.value} />
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}
