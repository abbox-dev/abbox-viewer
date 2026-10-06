import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ExploreSection } from "../src/components/ExploreSection";
import { EXPLORE_MAX_TRAIL_ROUTES } from "../src/ir/exploreView";
import { interpret } from "../src/ir/interpret";
import exploreFixture from "./fixtures/explore-trail-minimal.json" with {
  type: "json",
};

import "@testing-library/jest-dom/vitest";

function loadedExploreFixture() {
  const result = interpret(JSON.stringify(exploreFixture));
  if (!result.ok) {
    throw new Error("Expected loaded product.");
  }
  return result;
}

describe("ExploreSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("steps through connection and main navigation with actions on current screen", async () => {
    const user = userEvent.setup();
    const result = loadedExploreFixture();

    render(
      <ExploreSection
        actions={result.actions}
        globalNavigation={result.globalNavigation}
        items={result.items}
        navigation={result.navigation}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText("Start screen"),
      "/programs",
    );

    const trail = screen.getByRole("region", { name: "Trail" });
    expect(within(trail).getByText("/programs")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /Connection → \/programs\/\$programId/,
      }),
    );
    expect(within(trail).getByText("/programs/$programId")).toBeInTheDocument();
    expect(screen.getByText("Save program")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Main navigation → \/saved/ }),
    );
    expect(within(trail).getByText("/saved")).toBeInTheDocument();
    expect(screen.queryByText("Save program")).not.toBeInTheDocument();
  });

  it("supports Back, Clear, cycles, and trail limit", async () => {
    const user = userEvent.setup();
    const result = loadedExploreFixture();

    render(
      <ExploreSection
        actions={result.actions}
        globalNavigation={result.globalNavigation}
        items={result.items}
        navigation={result.navigation}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText("Start screen"),
      "/programs",
    );

    const connectionButton = () =>
      screen.getByRole("button", {
        name: /Connection → \/programs\/\$programId/,
      });

    await user.click(connectionButton());
    await user.click(
      screen.getByRole("button", { name: /Connection → \/programs$/ }),
    );

    const trailRegion = screen.getByRole("region", { name: "Trail" });
    const back = screen.getByRole("button", { name: "Back" });
    expect(back).not.toBeDisabled();
    await user.click(back);
    expect(
      within(trailRegion).getByText("/programs/$programId"),
    ).toBeInTheDocument();
    expect(within(trailRegion).getAllByRole("listitem")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByLabelText("Start screen")).toHaveValue("");

    await user.selectOptions(
      screen.getByLabelText("Start screen"),
      "/programs",
    );

    for (let index = 0; index < EXPLORE_MAX_TRAIL_ROUTES - 1; index += 1) {
      const name =
        index % 2 === 0
          ? /Connection → \/programs\/\$programId/
          : /Connection → \/programs$/;
      const next = screen.getByRole("button", { name });
      expect(next).not.toBeDisabled();
      await user.click(next);
    }

    expect(
      screen.getByText(
        new RegExp(
          `Trail limit reached \\(${String(EXPLORE_MAX_TRAIL_ROUTES)}`,
        ),
      ),
    ).toBeInTheDocument();
  });
});
