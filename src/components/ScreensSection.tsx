import type { ScreenItem } from "../ir/types";
import { JsonTree } from "./JsonTree";

export function ScreensSection({ items }: { items: ScreenItem[] }) {
  return (
    <section className="screens" aria-labelledby="screens-heading">
      <h3 id="screens-heading">Screens</h3>
      {items.length === 0 ? <p>No screens.</p> : null}
      <ul className="screen-list">
        {items.map((item, index) =>
          item.kind === "valid" ? (
            <li className="screen" key={`screen-${String(index)}`}>
              <p className="route">{item.route}</p>
              <p className="file">{item.file}</p>
            </li>
          ) : (
            <li className="invalid-entry" key={`screen-${String(index)}`}>
              <p>Screen {item.index} is invalid.</p>
              <JsonTree value={item.raw} />
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
