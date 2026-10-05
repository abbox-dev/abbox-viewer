import type { ReactNode } from "react";
import type { EffectsField, StateEffect, ValidActionItem } from "../ir/types";
import { JsonTree } from "./JsonTree";

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

function stateTargetText(target: string): string {
  return target === "" ? '""' : target;
}

function stateValueText(value: string | number | boolean | null): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  return String(value);
}

function stateEffectText(effect: StateEffect): string {
  const target = stateTargetText(effect.target);
  if (effect.value === undefined) {
    return `State change · ${target}`;
  }
  return `State change · ${target} → ${stateValueText(effect.value)}`;
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
          <li className="action-item" key={`action-${String(index)}`}>
            <div className="action-row">
              <span className="action-label">{actionPrimaryLabel(action)}</span>
              <span className="action-kind">
                {actionKindLabel(action.actionKind)}
              </span>
            </div>
            <ActionEffects effects={action.effects} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActionEffects({ effects }: { effects: EffectsField }) {
  if (effects.status === "absent") {
    return null;
  }

  if (effects.status === "invalid") {
    return (
      <div className="effect-issue">
        <p>Effects (invalid)</p>
        <JsonTree value={effects.raw} />
      </div>
    );
  }

  if (effects.items.length === 0) {
    return null;
  }

  return (
    <ul className="effect-list">
      {effects.items.map((effect, index) => {
        if (effect.kind === "valid" && effect.effectKind === "search") {
          return (
            <EffectRow key={`effect-${String(index)}`}>
              Search params changed
            </EffectRow>
          );
        }
        if (effect.kind === "valid" && effect.effectKind === "state") {
          return (
            <EffectRow key={`effect-${String(index)}`}>
              {stateEffectText(effect)}
            </EffectRow>
          );
        }
        if (effect.kind === "unsupported") {
          return (
            <EffectRow issue key={`effect-${String(index)}`}>
              <p>Effect type not supported</p>
              <JsonTree value={effect.raw} />
            </EffectRow>
          );
        }
        return (
          <EffectRow issue key={`effect-${String(index)}`}>
            <p>Effect entry {effect.index} is invalid.</p>
            <JsonTree value={effect.raw} />
          </EffectRow>
        );
      })}
    </ul>
  );
}

function EffectRow({
  children,
  issue = false,
}: {
  children: ReactNode;
  issue?: boolean;
}) {
  return (
    <li className={issue ? "effect-row effect-issue" : "effect-row"}>
      <span className="effect-marker">Effect</span>
      <div className="effect-detail">{children}</div>
    </li>
  );
}
