import type {
  EntitiesField,
  EntityFieldItem,
  ValidEntity,
  ValidEntityField,
} from "./types";

export function showEntitiesSection(field: EntitiesField): boolean {
  return field.status === "present";
}

export function showEntitySummary(field: EntitiesField): boolean {
  return field.status === "present";
}

export function validEntityCount(field: EntitiesField): number {
  if (field.status !== "present") {
    return 0;
  }
  return field.items.filter((item) => item.kind === "valid").length;
}

export function validEntities(field: EntitiesField): ValidEntity[] {
  if (field.status !== "present") {
    return [];
  }
  return field.items.filter(
    (item): item is ValidEntity => item.kind === "valid",
  );
}

export function validEntityFields(entity: ValidEntity): ValidEntityField[] {
  return entity.fields.filter(
    (field): field is ValidEntityField => field.kind === "valid",
  );
}

export function invalidEntityFields(entity: ValidEntity): EntityFieldItem[] {
  return entity.fields.filter((field) => field.kind === "invalid");
}
