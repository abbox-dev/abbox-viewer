import type { JsonValue } from "../ir/types";

export function JsonTree({ value }: { value: JsonValue }) {
  return (
    <div className="json-tree">
      <JsonNode value={value} />
    </div>
  );
}

function JsonNode({ value }: { value: JsonValue }) {
  if (value === null) {
    return <span>null</span>;
  }
  if (typeof value === "string") {
    return <span>{JSON.stringify(value)}</span>;
  }
  if (typeof value === "number") {
    return <span>{String(value)}</span>;
  }
  if (typeof value === "boolean") {
    return <span>{value ? "true" : "false"}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span>[]</span>;
    }
    return (
      <details>
        <summary>Array ({value.length})</summary>
        <ol>
          {value.map((item, index) => (
            <li key={`item-${String(index)}`}>
              <JsonNode value={item} />
            </li>
          ))}
        </ol>
      </details>
    );
  }

  const keys = Object.keys(value);
  if (keys.length === 0) {
    return <span>{"{}"}</span>;
  }
  return (
    <details>
      <summary>Object ({keys.length})</summary>
      <ul>
        {keys.map((key) => (
          <li key={key}>
            <span className="json-key">{key}</span>
            {": "}
            <JsonNode value={value[key] as JsonValue} />
          </li>
        ))}
      </ul>
    </details>
  );
}
