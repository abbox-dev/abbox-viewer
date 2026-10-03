import type { ValidActionItem } from "../ir/types";

type ScreenActionsProps = {
  actions: ValidActionItem[];
  sectionId: string;
};

function actionPrimaryLabel(action: ValidActionItem): string {
  const label = action.label;
  if (label !== undefined && label !== "") {
    return label;
  }
  if (action.actionKind === "submit") {
    return "Submit form";
  }
  return "Unlabeled action";
}

function actionKindLabel(actionKind: ValidActionItem["actionKind"]): string {
  return actionKind === "submit" ? "Submit" : "Invoke";
}

export function ScreenActions({ actions, sectionId }: ScreenActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  const headingId = `${sectionId}-heading`;
  const count = actions.length;

  return (
    <section className="screen-actions" aria-labelledby={headingId}>
      <p className="nav-heading" id={headingId}>
        {count === 1 ? "Actions · 1" : `Actions · ${String(count)}`}
      </p>
      <ul className="action-list">
        {actions.map((action, index) => (
          <li className="action-row" key={`action-${String(index)}`}>
            <span className="action-label">{actionPrimaryLabel(action)}</span>
            <span className="action-kind">
              {actionKindLabel(action.actionKind)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
