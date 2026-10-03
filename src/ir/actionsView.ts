import type { ActionsField, ValidActionItem } from "./types";

export function showActionSummary(field: ActionsField): boolean {
  return field.status === "present";
}

export function validActionCount(field: ActionsField): number {
  if (field.status !== "present") {
    return 0;
  }
  return field.items.filter((item) => item.kind === "valid").length;
}

export function actionsForRoute(
  field: ActionsField,
  route: string,
): ValidActionItem[] {
  if (field.status !== "present") {
    return [];
  }
  const out: ValidActionItem[] = [];
  for (const item of field.items) {
    if (item.kind === "valid" && item.route === route) {
      out.push(item);
    }
  }
  return out;
}
