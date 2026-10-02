import type { NavigationField, ScreenItem } from "./types";

export function connectionCount(navigation: NavigationField): number {
  if (navigation.status !== "present") {
    return 0;
  }
  return navigation.items.filter((item) => item.kind === "valid").length;
}

export function showConnectionSummary(navigation: NavigationField): boolean {
  return navigation.status !== "absent";
}

export function outgoingByFrom(
  navigation: NavigationField,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  if (navigation.status !== "present") {
    return map;
  }
  for (const item of navigation.items) {
    if (item.kind !== "valid") {
      continue;
    }
    const list = map.get(item.from) ?? [];
    list.push(item.to);
    map.set(item.from, list);
  }
  return map;
}

export function knownScreenRoutes(items: ScreenItem[]): Set<string> {
  const routes = new Set<string>();
  for (const item of items) {
    if (item.kind === "valid") {
      routes.add(item.route);
    }
  }
  return routes;
}
