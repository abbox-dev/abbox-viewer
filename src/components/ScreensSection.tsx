import { actionsForRoute } from "../ir/actionsView";
import { outgoingByFrom } from "../ir/navigationView";
import type { ActionsField, NavigationField, ScreenItem } from "../ir/types";
import { CollapsibleSection } from "./CollapsibleSection";
import { JsonTree } from "./JsonTree";
import { ScreenActions } from "./ScreenActions";

type ScreensSectionProps = {
  items: ScreenItem[];
  navigation: NavigationField;
  actions: ActionsField;
};

export function ScreensSection({
  items,
  navigation,
  actions,
}: ScreensSectionProps) {
  const outgoing = outgoingByFrom(navigation);
  const showPerScreenNav = navigation.status !== "absent";

  return (
    <CollapsibleSection
      className="screens"
      headingId="screens-heading"
      id="screens"
      title="Screens"
    >
      {items.length === 0 ? <p>No screens.</p> : null}
      <ul className="screen-list">
        {items.map((item, index) =>
          item.kind === "valid" ? (
            <li className="screen" key={`screen-${String(index)}`}>
              <p className="route">{item.route}</p>
              <p className="file">{item.file}</p>
              <ScreenActions
                actions={actionsForRoute(actions, item.route)}
                sectionId={`screen-actions-${String(index)}`}
              />
              {showPerScreenNav ? (
                <ScreenNavigation
                  destinations={outgoing.get(item.route) ?? []}
                  navId={`screen-nav-${String(index)}`}
                />
              ) : null}
            </li>
          ) : (
            <li className="invalid-entry" key={`screen-${String(index)}`}>
              <p>Screen {item.index} is invalid.</p>
              <JsonTree value={item.raw} />
            </li>
          ),
        )}
      </ul>
    </CollapsibleSection>
  );
}

function ScreenNavigation({
  destinations,
  navId,
}: {
  destinations: string[];
  navId: string;
}) {
  const headingId = `${navId}-heading`;

  if (destinations.length === 0) {
    return (
      <section className="screen-nav" aria-labelledby={headingId}>
        <p className="nav-heading" id={headingId}>
          No discovered navigation
        </p>
      </section>
    );
  }

  return (
    <section className="screen-nav" aria-labelledby={headingId}>
      <p className="nav-heading" id={headingId}>
        Navigates to
      </p>
      <ul className="nav-out">
        {destinations.map((route, index) => (
          <li key={`${route}-${String(index)}`}>
            <span className="route">{route}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
