import {
  sharedMainNavigationSourceFile,
  validMainNavigationCount,
  validMainNavigationItems,
} from "../ir/globalNavigationView";
import type { GlobalNavigationField } from "../ir/types";
import { CollapsibleSection } from "./CollapsibleSection";

type GlobalNavigationSectionProps = {
  globalNavigation: GlobalNavigationField;
};

export function GlobalNavigationSection({
  globalNavigation,
}: GlobalNavigationSectionProps) {
  if (globalNavigation.status !== "present") {
    return null;
  }

  const items = validMainNavigationItems(globalNavigation);
  const count = validMainNavigationCount(globalNavigation);
  const title =
    count === 1 ? "Main navigation · 1" : `Main navigation · ${String(count)}`;
  const sharedSource = sharedMainNavigationSourceFile(globalNavigation);

  return (
    <CollapsibleSection
      className="main-navigation"
      headingId="main-navigation-heading"
      id="mainNav"
      title={title}
    >
      <p className="lede main-navigation-lede">
        These destinations are available through persistent application
        navigation. They are not repeated as connections from every screen.
      </p>
      {items.length === 0 ? (
        <p className="main-navigation-empty">
          No main navigation destinations in Product IR.
        </p>
      ) : (
        <>
          <ul className="main-navigation-list">
            {items.map((item, index) => (
              <li
                className="main-navigation-entry"
                key={`main-nav-${String(index)}-${item.to}`}
              >
                <span className="route">{item.to}</span>
                {sharedSource === undefined ? (
                  <span className="file">{item.sourceFile}</span>
                ) : null}
              </li>
            ))}
          </ul>
          {sharedSource !== undefined ? (
            <p className="file main-navigation-source">{sharedSource}</p>
          ) : null}
        </>
      )}
    </CollapsibleSection>
  );
}
