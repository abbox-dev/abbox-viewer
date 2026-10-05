import { describe, expect, it } from "vitest";
import {
  showEntitiesSection,
  showEntitySummary,
  validEntities,
  validEntityCount,
  validEntityFields,
} from "../src/ir/entitiesView";
import type { EntitiesField, EntityItem, ValidEntity } from "../src/ir/types";

const presentField = (items: EntityItem[]): EntitiesField => ({
  status: "present",
  items,
});

const validEntity = (
  name: string,
  sourceFile: string,
  fields: ValidEntity["fields"] = [],
): ValidEntity => ({
  kind: "valid",
  name,
  sourceFile,
  fields,
});

describe("entitiesView", () => {
  it("shows summary only when entities key is present", () => {
    expect(showEntitySummary({ status: "absent" })).toBe(false);
    expect(showEntitySummary({ status: "present", items: [] })).toBe(true);
    expect(
      showEntitySummary({
        status: "invalid",
        message: "entities must be an array.",
        raw: null,
      }),
    ).toBe(false);
  });

  it("shows section only for present entities", () => {
    expect(showEntitiesSection({ status: "absent" })).toBe(false);
    expect(showEntitiesSection({ status: "present", items: [] })).toBe(true);
    expect(
      showEntitiesSection({
        status: "invalid",
        message: "entities must be an array.",
        raw: {},
      }),
    ).toBe(false);
  });

  it("counts valid entities only", () => {
    const field = presentField([
      validEntity("A", "a.ts", [{ kind: "valid", name: "x" }]),
      { kind: "invalid", index: 2, raw: {} },
    ]);
    expect(validEntityCount(field)).toBe(1);
    expect(validEntityCount({ status: "absent" })).toBe(0);
    expect(
      validEntityCount({
        status: "invalid",
        message: "entities must be an array.",
        raw: [],
      }),
    ).toBe(0);
  });

  it("filters valid entities and fields in order", () => {
    const field = presentField([
      validEntity("First", "a.ts", [
        { kind: "valid", name: "one" },
        { kind: "invalid", index: 2, raw: null },
        { kind: "valid", name: "two", optional: true },
      ]),
      { kind: "invalid", index: 2, raw: "bad" },
      validEntity("Second", "b.ts"),
    ]);
    expect(validEntities(field).map((entity) => entity.name)).toEqual([
      "First",
      "Second",
    ]);
    const first = validEntities(field)[0];
    expect(first && validEntityFields(first).map((f) => f.name)).toEqual([
      "one",
      "two",
    ]);
  });
});
