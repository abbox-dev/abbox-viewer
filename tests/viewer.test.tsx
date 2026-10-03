import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";
import designSystemColors from "./fixtures/design-system-colors.json" with {
  type: "json",
};
import malformedScreens from "./fixtures/malformed-screens.json" with {
  type: "json",
};
import missingScreens from "./fixtures/missing-screens.json" with {
  type: "json",
};
import notJson from "./fixtures/not-json.txt?raw";
import notObject from "./fixtures/not-object.json" with { type: "json" };
import screens from "./fixtures/screens.json" with { type: "json" };
import screensAndUnknown from "./fixtures/screens-and-unknown.json" with {
  type: "json",
};
import screensWithNavigation from "./fixtures/screens-with-navigation.json" with {
  type: "json",
};
import unknownOnly from "./fixtures/unknown-only.json" with { type: "json" };

import "@testing-library/jest-dom/vitest";

function jsonFile(
  name: string,
  value: unknown,
  type = "application/json",
): File {
  return new File([JSON.stringify(value)], name, { type });
}

async function selectFile(file: File) {
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText("Select file"), file);
}

describe("viewer", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    render(<App />);
  });

  it("starts idle", () => {
    expect(
      screen.getByRole("heading", { name: "Abbox Viewer" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Select file")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Screens" }),
    ).not.toBeInTheDocument();
  });

  it("shows screens from a selected abbox.json file", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await selectFile(jsonFile("abbox.json", screens));

    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "6 Screens" }),
    ).toBeInTheDocument();
    expect(screen.getByText("/")).toBeInTheDocument();
    expect(screen.getByText("src/routes/index.tsx")).toBeInTheDocument();
    expect(screen.getByText("/investors/$investorId")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("keeps the selected file when resetting the input clears its file list", async () => {
    const input = screen.getByLabelText("Select file") as HTMLInputElement;
    const file = jsonFile("abbox.json", screens);
    let listed: File[] = [file];
    Object.defineProperty(input, "files", {
      configurable: true,
      get: () => listed,
    });
    Object.defineProperty(input, "value", {
      configurable: true,
      get: () => "",
      set: (next: string) => {
        if (next === "") {
          listed = [];
        }
      },
    });

    fireEvent.change(input);

    expect(
      await screen.findByRole("heading", { name: "6 Screens" }),
    ).toBeInTheDocument();
    expect(screen.getByText("src/routes/index.tsx")).toBeInTheDocument();
  });

  it("accepts product IR content when the filename is not .json", async () => {
    const input = screen.getByLabelText("Select file");
    fireEvent.change(input, {
      target: { files: [jsonFile("notes.txt", screens, "text/plain")] },
    });
    expect(
      await screen.findByRole("heading", { name: "6 Screens" }),
    ).toBeInTheDocument();
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
  });

  it("shows unknown fields beside valid screens", async () => {
    await selectFile(jsonFile("product.json", screensAndUnknown));
    expect(screen.getByText("/dashboard")).toBeInTheDocument();
    expect(screen.getByText("src/routes/dashboard.tsx")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Unrecognized data" }),
    ).toBeInTheDocument();
    expect(screen.getByText("forms")).toBeInTheDocument();
    expect(screen.getByText("experimentalThing")).toBeInTheDocument();
  });

  it("shows numeric schemaVersion only as unrecognized data", async () => {
    await selectFile(
      jsonFile("versioned.json", {
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        schemaVersion: 1,
      }),
    );
    expect(
      screen.getByRole("heading", { name: "1 Screen" }),
    ).toBeInTheDocument();
    expect(screen.getByText("schemaVersion")).toBeInTheDocument();
    expect(screen.queryByText("Product IR v1")).not.toBeInTheDocument();
  });

  it("shows navigation and Product IR v1 for a versioned snapshot", async () => {
    await selectFile(jsonFile("abbox.json", screensWithNavigation));
    expect(screen.getByText("Product IR v1")).toBeInTheDocument();
    expect(screen.getByText("3 Connections")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Product map" }),
    ).toBeInTheDocument();
    const connectionsList = document.getElementById("product-map-connections");
    expect(connectionsList).toBeTruthy();
    expect(connectionsList).toHaveClass("visually-hidden");
    expect(connectionsList).toHaveTextContent("Connections (discovered)");
    expect(connectionsList).toHaveTextContent("/investors/$investorId");
    const edgePaths = document.querySelectorAll(".map-edges path[marker-end]");
    expect(edgePaths.length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("Navigates to").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("/investors/$investorId").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.queryByRole("heading", { name: "Unrecognized data" }),
    ).not.toBeInTheDocument();
  });

  it("shows design system colors with theme switching and duplicate hints", async () => {
    const user = userEvent.setup();
    await selectFile(jsonFile("design.json", designSystemColors));

    expect(
      screen.getByRole("heading", { name: "Design system" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Colors" })).toBeInTheDocument();
    expect(
      screen.getByText("4 tokens · 3 distinct colors"),
    ).toBeInTheDocument();
    expect(screen.getByText("#604597")).toBeInTheDocument();
    expect(screen.getAllByText("2 tokens use this color")).toHaveLength(2);

    const overlaySwatch = document.querySelector(
      ".color-swatch-checkerboard .color-swatch-fill",
    ) as HTMLElement | null;
    expect(overlaySwatch?.style.backgroundColor).toBeTruthy();

    const defaultTab = screen.getByRole("tab", { name: "default" });
    expect(defaultTab).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("tab", { name: "dark" }));
    expect(screen.getByRole("tab", { name: "dark" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("#020618")).toBeInTheDocument();
    expect(screen.getByText("Unresolved")).toBeInTheDocument();
    expect(screen.getByText("var(--accent-strong)")).toBeInTheDocument();
    expect(
      document.querySelector(".color-swatch-unresolved"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Product map" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Screens" }),
    ).toBeInTheDocument();
  });

  it("does not show design system when designSystem is absent", async () => {
    await selectFile(jsonFile("abbox.json", screens));
    expect(
      screen.queryByRole("heading", { name: "Design system" }),
    ).not.toBeInTheDocument();
  });

  it("shows a single-theme label instead of one tab", async () => {
    await selectFile(
      jsonFile("one-theme.json", {
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        designSystem: {
          themes: [
            {
              name: "default",
              colors: [
                {
                  name: "primary",
                  value: "x",
                  hex: "#604597",
                  source: { file: "src/styles.css" },
                },
              ],
            },
          ],
        },
      }),
    );
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByText("default")).toBeInTheDocument();
    expect(screen.getByText("1 token · 1 distinct color")).toBeInTheDocument();
  });

  it("does not show navigation UI when navigation is absent", async () => {
    await selectFile(jsonFile("abbox.json", screens));
    expect(screen.queryByText("3 Connections")).not.toBeInTheDocument();
    expect(screen.queryByText("Navigates to")).not.toBeInTheDocument();
    expect(
      screen.queryByText("No discovered navigation"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Product map" }),
    ).not.toBeInTheDocument();
  });

  it("shows Product map with no edges when navigation is empty", async () => {
    await selectFile(
      jsonFile("empty-nav.json", {
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        navigation: [],
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Product map" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No discovered connections between screens."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Connections (discovered)"),
    ).not.toBeInTheDocument();
  });

  it("shows Product map without edges for malformed navigation container", async () => {
    await selectFile(
      jsonFile("bad-nav-container.json", {
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        navigation: "nope",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Product map" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "navigation must be an array.",
    );
  });

  it("shows unknown-route navigation as invalid without listing it under Navigates to", async () => {
    await selectFile(
      jsonFile("bad-nav.json", {
        screens: [
          { route: "/", source: { file: "a.tsx" } },
          { route: "/b", source: { file: "b.tsx" } },
        ],
        navigation: [{ from: "/", to: "/ghost" }],
      }),
    );
    expect(screen.getByText("0 Connections")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Navigation (invalid)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Navigation entry 1 is invalid."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Navigates to")).not.toBeInTheDocument();
    expect(document.body.textContent).toContain('"/ghost"');
  });

  it("rejects an object of only unknown fields without a screen count", async () => {
    await selectFile(jsonFile("forms.json", unknownOnly));
    expect(screen.getByRole("alert")).toHaveTextContent("screens is required");
    expect(
      screen.getByRole("heading", { name: "Unrecognized data" }),
    ).toBeInTheDocument();
    expect(screen.getByText("forms")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "0 Screens" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Product")).not.toBeInTheDocument();
  });

  it("rejects an empty object", async () => {
    await selectFile(jsonFile("empty.json", missingScreens));
    expect(screen.getByRole("alert")).toHaveTextContent("screens is required");
    expect(
      screen.queryByRole("heading", { name: "Unrecognized data" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "0 Screens" }),
    ).not.toBeInTheDocument();
  });

  it("shows a JSON error without screen routes", async () => {
    await selectFile(
      new File([notJson], "broken.json", { type: "application/json" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This file is not valid JSON.",
    );
    expect(screen.queryByText("src/routes/index.tsx")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Unrecognized data" }),
    ).not.toBeInTheDocument();
  });

  it("shows an object error for JSON that is not an object", async () => {
    await selectFile(jsonFile("list.json", notObject));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "abbox.json must contain a JSON object.",
    );
    expect(
      screen.queryByRole("heading", { name: "Unrecognized data" }),
    ).not.toBeInTheDocument();
  });

  it("shows a malformed screens value and unknown siblings", async () => {
    await selectFile(jsonFile("bad-screens.json", malformedScreens));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "screens must be an array.",
    );
    expect(screen.getByText('"nope"')).toBeInTheDocument();
    expect(screen.getByText("forms")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "0 Screens" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Product")).not.toBeInTheDocument();
  });

  it("shows a valid screen beside an invalid entry", async () => {
    const user = userEvent.setup();
    await selectFile(
      jsonFile("mixed.json", {
        screens: [
          { route: "/ok", source: { file: "src/ok.tsx" } },
          { title: "Broken" },
        ],
      }),
    );

    expect(
      screen.getByRole("heading", { name: "1 Screen" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "2 Screens" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("/ok")).toBeInTheDocument();
    expect(screen.getByText("src/ok.tsx")).toBeInTheDocument();
    expect(screen.getByText("Screen 2 is invalid.")).toBeInTheDocument();
    await user.click(screen.getByText("Object (1)"));
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText('"Broken"')).toBeInTheDocument();
  });

  it("resets back to idle", async () => {
    const user = userEvent.setup();
    await selectFile(jsonFile("abbox.json", screens));
    expect(screen.getByText("src/routes/saved.tsx")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.queryByText("src/routes/saved.tsx")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "6 Screens" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Select file")).toBeInTheDocument();
  });

  it("replaces the previous file", async () => {
    await selectFile(jsonFile("first.json", screens));
    expect(screen.getByText("src/routes/saved.tsx")).toBeInTheDocument();
    await selectFile(
      jsonFile("second.json", {
        screens: [
          { route: "/settings", source: { file: "src/routes/settings.tsx" } },
        ],
      }),
    );
    expect(screen.queryByText("src/routes/saved.tsx")).not.toBeInTheDocument();
    expect(screen.getByText("/settings")).toBeInTheDocument();
    expect(screen.getByText("src/routes/settings.tsx")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "1 Screen" }),
    ).toBeInTheDocument();
  });

  it("loads a dropped file through the same path", async () => {
    const dropzone = screen.getByText("Drop a file here.").parentElement;
    if (!dropzone) {
      throw new Error("Drop zone not found.");
    }
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [jsonFile("dropped.json", screens)] },
    });
    expect(
      await screen.findByRole("heading", { name: "6 Screens" }),
    ).toBeInTheDocument();
  });
});
