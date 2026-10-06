import { validMainNavigationItems } from "./globalNavigationView";
import { outgoingByFrom } from "./navigationView";
import type {
  GlobalNavigationField,
  NavigationField,
  ScreenItem,
  ValidScreenItem,
} from "./types";

export type ScreenTransitionKind = "connection" | "mainNavigation";

export type ScreenTransition = {
  kind: ScreenTransitionKind;
  to: string;
};

export type ExploreTrailStep = {
  kind: ScreenTransitionKind;
  to: string;
};

export const EXPLORE_MAX_TRAIL_ROUTES = 12;

export function validScreensInOrder(items: ScreenItem[]): ValidScreenItem[] {
  const out: ValidScreenItem[] = [];
  for (const item of items) {
    if (item.kind === "valid") {
      out.push(item);
    }
  }
  return out;
}

export function showExploreSection(items: ScreenItem[]): boolean {
  return validScreensInOrder(items).length > 0;
}

export function transitionsFromScreen(
  fromRoute: string,
  navigation: NavigationField,
  globalNavigation: GlobalNavigationField,
): ScreenTransition[] {
  const transitions: ScreenTransition[] = [];

  const outgoing = outgoingByFrom(navigation).get(fromRoute) ?? [];
  for (const to of outgoing) {
    transitions.push({ kind: "connection", to });
  }

  for (const item of validMainNavigationItems(globalNavigation)) {
    if (item.to !== fromRoute) {
      transitions.push({ kind: "mainNavigation", to: item.to });
    }
  }

  return transitions;
}

export function trailRoutes(
  startRoute: string,
  steps: ExploreTrailStep[],
): string[] {
  return [startRoute, ...steps.map((step) => step.to)];
}

export function currentRouteFromTrail(
  startRoute: string,
  steps: ExploreTrailStep[],
): string {
  const routes = trailRoutes(startRoute, steps);
  const last = routes.at(-1);
  return last ?? startRoute;
}

export function canAppendTrailStep(
  startRoute: string,
  steps: ExploreTrailStep[],
): boolean {
  return trailRoutes(startRoute, steps).length < EXPLORE_MAX_TRAIL_ROUTES;
}

export function transitionKindLabel(kind: ScreenTransitionKind): string {
  return kind === "connection" ? "Connection" : "Main navigation";
}
