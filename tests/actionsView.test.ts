import { describe, expect, it } from "vitest";
import {
  actionsForRoute,
  showActionSummary,
  validActionCount,
} from "../src/ir/actionsView";
import type { ActionItem, ActionsField } from "../src/ir/types";

const presentField = (items: ActionItem[]): ActionsField => ({
  status: "present",
  items,
});

describe("actionsView", () => {
  it("shows summary only when actions key is present", () => {
    expect(showActionSummary({ status: "absent" })).toBe(false);
    expect(showActionSummary({ status: "present", items: [] })).toBe(true);
    expect(
      showActionSummary({
        status: "invalid",
        message: "actions must be an array.",
        raw: null,
      }),
    ).toBe(false);
  });

  it("counts valid actions only", () => {
    const field = presentField([
      {
        kind: "valid",
        route: "/",
        actionKind: "invoke",
        sourceFile: "a.tsx",
      },
      { kind: "invalid", index: 1, raw: {} },
    ]);
    expect(validActionCount(field)).toBe(1);
  });

  it("preserves document order for a route", () => {
    const field = presentField([
      {
        kind: "valid",
        route: "/",
        actionKind: "invoke",
        sourceFile: "a.tsx",
        label: "First",
      },
      {
        kind: "valid",
        route: "/other",
        actionKind: "invoke",
        sourceFile: "b.tsx",
      },
      {
        kind: "valid",
        route: "/",
        actionKind: "submit",
        sourceFile: "a.tsx",
      },
    ]);
    expect(actionsForRoute(field, "/").map((a) => a.label)).toEqual([
      "First",
      undefined,
    ]);
  });
});
