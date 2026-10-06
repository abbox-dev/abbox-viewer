import type {
  GlobalNavigationField,
  NavigationField,
  ValidGlobalNavigationItem,
} from "./types";

export function showMainNavigationSection(
  field: GlobalNavigationField,
): boolean {
  return field.status === "present";
}

export function showMainNavigationSummary(
  field: GlobalNavigationField,
): boolean {
  return field.status === "present";
}

export function validMainNavigationCount(field: GlobalNavigationField): number {
  if (field.status !== "present") {
    return 0;
  }
  return field.items.filter((item) => item.kind === "valid").length;
}

export function validMainNavigationItems(
  field: GlobalNavigationField,
): ValidGlobalNavigationItem[] {
  if (field.status !== "present") {
    return [];
  }
  return field.items.filter(
    (item): item is ValidGlobalNavigationItem => item.kind === "valid",
  );
}

export function mainNavigationRouteSet(
  field: GlobalNavigationField,
): Set<string> {
  return new Set(validMainNavigationItems(field).map((item) => item.to));
}

export function mainNavigationSummaryLabel(count: number): string {
  if (count === 1) {
    return "1 main navigation destination";
  }
  return `${String(count)} main navigation destinations`;
}

export function sharedMainNavigationSourceFile(
  field: GlobalNavigationField,
): string | undefined {
  const items = validMainNavigationItems(field);
  if (items.length === 0) {
    return undefined;
  }
  const first = items[0]?.sourceFile;
  if (first === undefined) {
    return undefined;
  }
  return items.every((item) => item.sourceFile === first) ? first : undefined;
}

export function showProductMapSection(
  navigation: NavigationField,
  globalNavigation: GlobalNavigationField,
): boolean {
  return navigation.status !== "absent" || globalNavigation.status !== "absent";
}
