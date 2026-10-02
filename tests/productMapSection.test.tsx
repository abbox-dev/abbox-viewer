import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProductMapSection } from "../src/components/ProductMapSection";
import { interpret } from "../src/ir/interpret";
import screensWithNavigation from "./fixtures/screens-with-navigation.json" with {
  type: "json",
};

import "@testing-library/jest-dom/vitest";

describe("ProductMapSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders separate directional edge paths for bidirectional navigation", () => {
    const result = interpret(JSON.stringify(screensWithNavigation));
    if (!result.ok) {
      throw new Error("Expected loaded product.");
    }

    const { container } = render(
      <ProductMapSection items={result.items} navigation={result.navigation} />,
    );

    const edgePaths = container.querySelectorAll(".map-edges path[marker-end]");
    expect(edgePaths.length).toBe(3);

    const hidden = container.querySelector("#product-map-connections");
    expect(hidden).toHaveClass("visually-hidden");
    expect(screen.getByText("Connections (discovered)")).toBeInTheDocument();
  });
});
