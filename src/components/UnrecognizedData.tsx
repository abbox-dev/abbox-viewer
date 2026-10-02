import type { UnrecognizedEntry } from "../ir/types";
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
    <section className="unrecognized" aria-labelledby="unrecognized-heading">
      <h2 id="unrecognized-heading">Unrecognized data</h2>
      <ul className="unrecognized-list">
        {entries.map((entry) => (
          <li key={entry.path}>
            <p className="json-path">{entry.path}</p>
            <JsonTree value={entry.value} />
          </li>
        ))}
      </ul>
    </section>
  );
}
