import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ScreenActions } from "../src/components/ScreenActions";
import type { ValidActionItem } from "../src/ir/types";

import "@testing-library/jest-dom/vitest";

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
      },
      {
        kind: "valid",
        route: "/",
        actionKind: "submit",
        sourceFile: "a.tsx",
      },
      {
        kind: "valid",
        route: "/",
        actionKind: "invoke",
        sourceFile: "a.tsx",
        label: ":",
      },
    ];
    render(<ScreenActions actions={actions} sectionId="test" />);
    expect(screen.getAllByText("Unlabeled action")).toHaveLength(1);
    expect(screen.getByText("Submit form")).toBeInTheDocument();
    expect(screen.getByText(":")).toBeInTheDocument();
  });
});
