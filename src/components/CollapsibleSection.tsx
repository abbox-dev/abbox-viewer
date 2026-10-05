import { type ReactNode, useSyncExternalStore } from "react";
import {
  getSectionSearch,
  readClosedSections,
  type SectionId,
  subscribeToSectionSearch,
  toggleClosedSection,
} from "../sections/collapsedSections";

type CollapsibleSectionProps = {
  children: ReactNode;
  className?: string;
  describedBy?: string;
  headingId: string;
  id: SectionId;
  title: string;
};

export function CollapsibleSection({
  children,
  className,
  describedBy,
  headingId,
  id,
  title,
}: CollapsibleSectionProps) {
  const search = useSyncExternalStore(
    subscribeToSectionSearch,
    getSectionSearch,
    getSectionSearch,
  );
  const collapsed = readClosedSections(search).has(id);
  const panelId = `${headingId}-panel`;

  return (
    <section
      aria-describedby={describedBy}
      aria-labelledby={headingId}
      className={className ? `section-card ${className}` : "section-card"}
    >
      <h3 className="section-card-heading" id={headingId}>
        <button
          aria-controls={panelId}
          aria-expanded={!collapsed}
          className="section-card-toggle"
          onClick={() => {
            toggleClosedSection(id);
          }}
          type="button"
        >
          <span aria-hidden="true" className="section-card-chevron" />
          {title}
        </button>
      </h3>
      <div className="section-card-body" hidden={collapsed} id={panelId}>
        {children}
      </div>
    </section>
  );
}
