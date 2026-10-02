import { describe, expect, it } from "vitest";
import { interpret } from "../src/ir/interpret";
import { buildProductMapLayout } from "../src/ir/productMapLayout";
import screensWithNavigation from "./fixtures/screens-with-navigation.json" with {
  type: "json",
};

function layoutFrom(value: unknown) {
  const result = interpret(JSON.stringify(value));
  if (!result.ok) {
    throw new Error("Expected loaded product.");
  }
  return buildProductMapLayout(result.items, result.navigation);
}

describe("buildProductMapLayout", () => {
  it("partitions the Lovable example into two components and isolated screens", () => {
    const layout = layoutFrom(screensWithNavigation);
    expect(layout.fallback).toBe(false);
    expect(layout.components).toHaveLength(2);
    expect(layout.edges).toHaveLength(3);
    expect(layout.connections).toHaveLength(3);

    const componentRoutes = layout.components.map((component) =>
      component.nodes.map((node) => node.route),
    );
    expect(componentRoutes).toContainEqual(["/", "/investors/$investorId"]);
    expect(componentRoutes).toContainEqual([
      "/programs",
      "/programs/$programId",
    ]);

    expect(layout.isolated.map((node) => node.route)).toEqual([
      "/programs/",
      "/saved",
    ]);
  });

  it("orders component nodes by screen document index", () => {
    const layout = layoutFrom(screensWithNavigation);
    const home = layout.components.find((c) =>
      c.nodes.some((n) => n.route === "/"),
    );
    expect(home?.nodes.map((n) => n.screenIndex)).toEqual([0, 1]);
  });

  it("treats navigation absent as zero edges and all screens isolated", () => {
    const layout = layoutFrom({
      screens: [{ route: "/", source: { file: "a.tsx" } }],
    });
    expect(layout.connections).toHaveLength(0);
    expect(layout.components).toHaveLength(0);
    expect(layout.isolated).toHaveLength(1);
  });

  it("loads navigation empty array with all screens isolated", () => {
    const layout = layoutFrom({
      screens: [
        { route: "/", source: { file: "a.tsx" } },
        { route: "/b", source: { file: "b.tsx" } },
      ],
      navigation: [],
    });
    expect(layout.components).toHaveLength(0);
    expect(layout.isolated).toHaveLength(2);
    expect(layout.edges).toHaveLength(0);
  });

  it("keeps a two-node cycle as one component with two edges", () => {
    const layout = layoutFrom({
      screens: [
        { route: "/a", source: { file: "a.tsx" } },
        { route: "/b", source: { file: "b.tsx" } },
      ],
      navigation: [
        { from: "/a", to: "/b" },
        { from: "/b", to: "/a" },
      ],
    });
    expect(layout.components).toHaveLength(1);
    expect(layout.edges).toHaveLength(2);
    expect(layout.isolated).toHaveLength(0);
  });

  it("supports self-links and duplicate edges", () => {
    const layout = layoutFrom({
      screens: [{ route: "/loop", source: { file: "a.tsx" } }],
      navigation: [
        { from: "/loop", to: "/loop" },
        { from: "/loop", to: "/loop" },
      ],
    });
    expect(layout.edges).toHaveLength(2);
    expect(layout.connections).toHaveLength(2);
  });

  it("excludes invalid navigation from edges", () => {
    const layout = layoutFrom({
      screens: [
        { route: "/", source: { file: "a.tsx" } },
        { route: "/b", source: { file: "b.tsx" } },
      ],
      navigation: [
        { from: "/", to: "/b" },
        { from: "/", to: "/ghost" },
      ],
    });
    expect(layout.edges).toHaveLength(1);
    expect(layout.connections).toHaveLength(1);
  });

  it("uses fallback mode for large products", () => {
    const screens = Array.from({ length: 41 }, (_, index) => ({
      route: `/r${String(index)}`,
      source: { file: `${String(index)}.tsx` },
    }));
    const layout = layoutFrom({ screens, navigation: [] });
    expect(layout.fallback).toBe(true);
    expect(layout.components).toHaveLength(0);
  });

  it("malformed navigation container yields no edges", () => {
    const layout = layoutFrom({
      screens: [{ route: "/", source: { file: "a.tsx" } }],
      navigation: "nope",
    });
    expect(layout.edges).toHaveLength(0);
    expect(layout.isolated).toHaveLength(1);
  });
});
