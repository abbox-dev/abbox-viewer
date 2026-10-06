import { describe, expect, it } from "vitest";
import abboxExample from "../examples/abbox.json" with { type: "json" };
import {
  canAppendTrailStep,
  currentRouteFromTrail,
  EXPLORE_MAX_TRAIL_ROUTES,
  showExploreSection,
  trailRoutes,
  transitionsFromScreen,
  validScreensInOrder,
} from "../src/ir/exploreView";
import { interpret } from "../src/ir/interpret";
import type {
  GlobalNavigationField,
  NavigationField,
  ScreenItem,
} from "../src/ir/types";

const navPresent: NavigationField = {
  status: "present",
  items: [
    { kind: "valid", from: "/programs", to: "/programs/$programId" },
    { kind: "valid", from: "/programs/$programId", to: "/programs" },
  ],
};

const globalNav: GlobalNavigationField = {
  status: "present",
  items: [
    { kind: "valid", to: "/", sourceFile: "shell.tsx" },
    { kind: "valid", to: "/programs", sourceFile: "shell.tsx" },
    { kind: "valid", to: "/saved", sourceFile: "shell.tsx" },
  ],
};

const screens: ScreenItem[] = [
  { kind: "valid", route: "/", file: "a.tsx" },
  { kind: "valid", route: "/programs", file: "p.tsx" },
  { kind: "valid", route: "/programs/$programId", file: "d.tsx" },
  { kind: "valid", route: "/saved", file: "s.tsx" },
];

describe("exploreView", () => {
  it("lists valid screens in document order", () => {
    expect(validScreensInOrder(screens).map((s) => s.route)).toEqual([
      "/",
      "/programs",
      "/programs/$programId",
      "/saved",
    ]);
  });

  it("hides explore when there are no valid screens", () => {
    expect(showExploreSection([])).toBe(false);
    expect(showExploreSection([{ kind: "invalid", index: 0, raw: {} }])).toBe(
      false,
    );
    expect(showExploreSection(screens)).toBe(true);
  });

  it("orders transitions: connections first, then main navigation", () => {
    const transitions = transitionsFromScreen(
      "/programs",
      navPresent,
      globalNav,
    );
    expect(transitions).toEqual([
      { kind: "connection", to: "/programs/$programId" },
      { kind: "mainNavigation", to: "/" },
      { kind: "mainNavigation", to: "/saved" },
    ]);
  });

  it("omits main navigation to the current screen", () => {
    const transitions = transitionsFromScreen("/", navPresent, globalNav);
    expect(transitions.filter((t) => t.kind === "mainNavigation")).toEqual([
      { kind: "mainNavigation", to: "/programs" },
      { kind: "mainNavigation", to: "/saved" },
    ]);
  });

  it("tracks trail routes and limit", () => {
    const steps = [
      { kind: "connection" as const, to: "/programs/$programId" },
      { kind: "mainNavigation" as const, to: "/saved" },
    ];
    expect(trailRoutes("/programs", steps)).toEqual([
      "/programs",
      "/programs/$programId",
      "/saved",
    ]);
    expect(currentRouteFromTrail("/programs", steps)).toBe("/saved");

    const atLimitSteps = Array.from(
      { length: EXPLORE_MAX_TRAIL_ROUTES - 1 },
      () => ({
        kind: "connection" as const,
        to: "/programs",
      }),
    );
    expect(canAppendTrailStep("/programs", atLimitSteps)).toBe(false);
    expect(canAppendTrailStep("/programs", [])).toBe(true);
  });

  it("examples/abbox.json (founder-compass snapshot): alternate explore trail", () => {
    const result = interpret(JSON.stringify(abboxExample));
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const { navigation, globalNavigation } = result;
    expect(
      transitionsFromScreen("/programs", navigation, globalNavigation).find(
        (t) => t.kind === "connection",
      ),
    ).toBeUndefined();
    expect(
      transitionsFromScreen(
        "/programs/$programId",
        navigation,
        globalNavigation,
      ).some((t) => t.kind === "connection" && t.to === "/programs"),
    ).toBe(true);
    expect(
      transitionsFromScreen("/programs", navigation, globalNavigation).some(
        (t) => t.kind === "mainNavigation" && t.to === "/saved",
      ),
    ).toBe(true);
    expect(
      trailRoutes("/programs/$programId", [
        { kind: "connection", to: "/programs" },
        { kind: "mainNavigation", to: "/saved" },
      ]),
    ).toEqual(["/programs/$programId", "/programs", "/saved"]);
  });
});
