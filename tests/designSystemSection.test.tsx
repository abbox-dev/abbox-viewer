import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { DesignSystemSection } from "../src/components/DesignSystemSection";
import type { DesignSystemField } from "../src/ir/types";

import "@testing-library/jest-dom/vitest";

describe("DesignSystemSection", () => {
  afterEach(() => {
    cleanup();
  });

  const bothThemes: DesignSystemField = {
    status: "present",
    themes: [
      {
        kind: "valid",
        name: "default",
        colors: [
          {
            kind: "valid",
            name: "primary",
            value: "x",
            sourceFile: "a.css",
            hex: "#111111",
          },
        ],
      },
      {
        kind: "valid",
        name: "dark",
        colors: [
          {
            kind: "valid",
            name: "background",
            value: "y",
            sourceFile: "a.css",
            hex: "#222222",
          },
        ],
      },
    ],
  };

  it("selects default initially and switches palette", async () => {
    const user = userEvent.setup();
    render(<DesignSystemSection designSystem={bothThemes} />);

    expect(screen.getByRole("tab", { name: "default" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("#111111")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "dark" }));
    expect(screen.getByText("#222222")).toBeInTheDocument();
    expect(screen.queryByText("#111111")).not.toBeInTheDocument();
  });
});
