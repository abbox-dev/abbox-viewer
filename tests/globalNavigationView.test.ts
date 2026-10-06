import { describe, expect, it } from "vitest";
import {
  mainNavigationRouteSet,
  mainNavigationSummaryLabel,
  sharedMainNavigationSourceFile,
  showMainNavigationSection,
  showMainNavigationSummary,
  showProductMapSection,
  validMainNavigationCount,
} from "../src/ir/globalNavigationView";
import type { GlobalNavigationField, NavigationField } from "../src/ir/types";

const navAbsent: NavigationField = { status: "absent" };
const navPresent: NavigationField = { status: "present", items: [] };

describe("globalNavigationView", () => {
  it("shows summary and section only when present", () => {
    expect(showMainNavigationSummary({ status: "absent" })).toBe(false);
    expect(showMainNavigationSection({ status: "absent" })).toBe(false);
    expect(showMainNavigationSummary({ status: "present", items: [] })).toBe(
      true,
    );
    expect(
      showMainNavigationSummary({
        status: "invalid",
        message: "globalNavigation must be an array.",
        raw: null,
      }),
    ).toBe(false);
  });

  it("formats summary labels", () => {
    expect(mainNavigationSummaryLabel(0)).toBe(
      "0 main navigation destinations",
    );
    expect(mainNavigationSummaryLabel(1)).toBe("1 main navigation destination");
    expect(mainNavigationSummaryLabel(3)).toBe(
      "3 main navigation destinations",
    );
  });

  it("counts valid entries only", () => {
    const field: GlobalNavigationField = {
      status: "present",
      items: [
        { kind: "valid", to: "/", sourceFile: "a.tsx" },
        { kind: "invalid", index: 2, raw: {} },
      ],
    };
    expect(validMainNavigationCount(field)).toBe(1);
    expect([...mainNavigationRouteSet(field)]).toEqual(["/"]);
  });

  it("dedupes shared source file detection", () => {
    const shared: GlobalNavigationField = {
      status: "present",
      items: [
        { kind: "valid", to: "/", sourceFile: "shell.tsx" },
        { kind: "valid", to: "/b", sourceFile: "shell.tsx" },
      ],
    };
    expect(sharedMainNavigationSourceFile(shared)).toBe("shell.tsx");

    const mixed: GlobalNavigationField = {
      status: "present",
      items: [
        { kind: "valid", to: "/", sourceFile: "a.tsx" },
        { kind: "valid", to: "/b", sourceFile: "b.tsx" },
      ],
    };
    expect(sharedMainNavigationSourceFile(mixed)).toBeUndefined();
  });

  it("shows product map when navigation or globalNavigation is present", () => {
    expect(showProductMapSection(navAbsent, { status: "absent" })).toBe(false);
    expect(showProductMapSection(navPresent, { status: "absent" })).toBe(true);
    expect(
      showProductMapSection(navAbsent, { status: "present", items: [] }),
    ).toBe(true);
  });
});
