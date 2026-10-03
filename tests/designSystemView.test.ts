import { describe, expect, it } from "vitest";
import {
  colorStats,
  hexUsageCount,
  initialThemeName,
} from "../src/ir/designSystemView";
import type { ValidTheme } from "../src/ir/types";

function theme(name: string, colors: ValidTheme["colors"]): ValidTheme {
  return { kind: "valid", name, colors };
}

describe("designSystemView", () => {
  it("prefers default theme for initial selection", () => {
    const themes = [
      theme("dark", []),
      theme("default", []),
      theme("brand", []),
    ];
    expect(initialThemeName(themes)).toBe("default");
  });

  it("selects first valid theme when default is absent", () => {
    const themes = [theme("dark", []), theme("brand", [])];
    expect(initialThemeName(themes)).toBe("dark");
  });

  it("counts valid tokens and distinct resolved hex values", () => {
    const stats = colorStats(
      theme("default", [
        {
          kind: "valid",
          name: "a",
          value: "x",
          sourceFile: "f.css",
          hex: "#111111",
        },
        {
          kind: "valid",
          name: "b",
          value: "y",
          sourceFile: "f.css",
          hex: "#111111",
        },
        {
          kind: "valid",
          name: "c",
          value: "var(--x)",
          sourceFile: "f.css",
        },
        { kind: "invalid", index: 1, raw: {} },
      ]),
    );
    expect(stats).toEqual({ tokens: 3, distinct: 1 });
  });

  it("counts hex usage for duplicate hint", () => {
    const t = theme("default", [
      {
        kind: "valid",
        name: "a",
        value: "x",
        sourceFile: "f.css",
        hex: "#FFFFFF",
      },
      {
        kind: "valid",
        name: "b",
        value: "y",
        sourceFile: "f.css",
        hex: "#FFFFFF",
      },
    ]);
    expect(hexUsageCount(t, "#FFFFFF")).toBe(2);
  });
});
