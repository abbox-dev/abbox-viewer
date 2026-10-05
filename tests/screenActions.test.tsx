import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ScreenActions } from "../src/components/ScreenActions";
import type { EffectsField, ValidActionItem } from "../src/ir/types";

import "@testing-library/jest-dom/vitest";

const absent = { status: "absent" } as const;

function action(
  label: string | undefined,
  effects: EffectsField,
): ValidActionItem {
  return {
    kind: "valid",
    route: "/",
    actionKind: "invoke",
    sourceFile: "a.tsx",
    effects,
    ...(label !== undefined ? { label } : {}),
  };
}

describe("ScreenActions", () => {
  afterEach(() => {
    cleanup();
  });

  it("uses fallbacks for empty-string and missing labels", () => {
    const actions: ValidActionItem[] = [
      {
        kind: "valid",
        route: "/",
        actionKind: "invoke",
        sourceFile: "a.tsx",
        label: "",
        effects: absent,
      },
      {
        kind: "valid",
        route: "/",
        actionKind: "submit",
        sourceFile: "a.tsx",
        effects: absent,
      },
      {
        kind: "valid",
        route: "/",
        actionKind: "invoke",
        sourceFile: "a.tsx",
        label: ":",
        effects: absent,
      },
    ];
    render(<ScreenActions actions={actions} sectionId="test" />);
    expect(screen.getAllByText("Unlabeled action")).toHaveLength(1);
    expect(screen.getByText("Submit form")).toBeInTheDocument();
    expect(screen.getByText(":")).toBeInTheDocument();
  });

  it("shows nothing under an action when effects are absent or empty", () => {
    render(
      <ScreenActions
        actions={[
          action("Save", absent),
          action("Clear", { status: "present", items: [] }),
        ]}
        sectionId="empty"
      />,
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Clear")).toBeInTheDocument();
    expect(screen.queryByText("Search params changed")).not.toBeInTheDocument();
    expect(screen.queryByText(/State change/)).not.toBeInTheDocument();
    expect(screen.queryByText("Effect")).not.toBeInTheDocument();
    expect(screen.queryByText("No effect")).not.toBeInTheDocument();
  });

  it("renders search and state effects under the action", () => {
    render(
      <ScreenActions
        actions={[
          action("Filters", {
            status: "present",
            items: [
              {
                kind: "valid",
                effectKind: "state",
                target: "drawer",
                value: true,
              },
            ],
          }),
          action("Card view", {
            status: "present",
            items: [{ kind: "valid", effectKind: "search" }],
          }),
          action("Mode", {
            status: "present",
            items: [
              {
                kind: "valid",
                effectKind: "state",
                target: "mode",
                value: "cards",
              },
              {
                kind: "valid",
                effectKind: "state",
                target: "count",
                value: 2,
              },
              {
                kind: "valid",
                effectKind: "state",
                target: "name",
                value: null,
              },
              { kind: "valid", effectKind: "state", target: "count" },
              { kind: "valid", effectKind: "state", target: "", value: false },
            ],
          }),
        ]}
        sectionId="effects"
      />,
    );
    expect(
      screen.getByText("State change · drawer → true"),
    ).toBeInTheDocument();
    expect(screen.getByText("Search params changed")).toBeInTheDocument();
    expect(
      screen.getByText('State change · mode → "cards"'),
    ).toBeInTheDocument();
    expect(screen.getByText("State change · count → 2")).toBeInTheDocument();
    expect(screen.getByText("State change · name → null")).toBeInTheDocument();
    expect(screen.getByText("State change · count")).toBeInTheDocument();
    expect(screen.getByText('State change · "" → false')).toBeInTheDocument();
    expect(screen.getAllByText("Effect")).toHaveLength(7);
  });

  it("keeps the action visible when an effect is invalid or unsupported", () => {
    render(
      <ScreenActions
        actions={[
          action("Filters", {
            status: "invalid",
            raw: null,
          }),
          action("Save", {
            status: "present",
            items: [
              { kind: "invalid", index: 2, raw: { kind: "state" } },
              {
                kind: "unsupported",
                index: 3,
                raw: { kind: "request", method: "POST" },
              },
            ],
          }),
        ]}
        sectionId="broken"
      />,
    );
    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByText("Effects (invalid)")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Effect entry 2 is invalid.")).toBeInTheDocument();
    expect(screen.getByText("Effect type not supported")).toBeInTheDocument();
    expect(screen.getAllByText("Effect")).toHaveLength(2);
    expect(screen.getByText('"request"')).toBeInTheDocument();
    expect(screen.getByText('"POST"')).toBeInTheDocument();
  });
});
