import { describe, expect, it } from "vitest";
import {
  colorStats,
  validColorTokens,
  validThemes,
} from "../src/ir/designSystemView";
import { interpret } from "../src/ir/interpret";
import { connectionCount } from "../src/ir/navigationView";
import type { ValidScreenItem } from "../src/ir/types";
import designSystemColors from "./fixtures/design-system-colors.json" with {
  type: "json",
};
import emptyScreens from "./fixtures/empty-screens.json" with { type: "json" };
import malformedScreens from "./fixtures/malformed-screens.json" with {
  type: "json",
};
import missingScreens from "./fixtures/missing-screens.json" with {
  type: "json",
};
import notJson from "./fixtures/not-json.txt?raw";
import notObject from "./fixtures/not-object.json" with { type: "json" };
import screens from "./fixtures/screens.json" with { type: "json" };
import screensAndUnknown from "./fixtures/screens-and-unknown.json" with {
  type: "json",
};
import screensWithNavigation from "./fixtures/screens-with-navigation.json" with {
  type: "json",
};
import unknownOnly from "./fixtures/unknown-only.json" with { type: "json" };

const SCREENS_REQUIRED =
  "This file is not a valid Product IR. screens is required.";

const NAVIGATION_ABSENT = { status: "absent" as const };
const DESIGN_SYSTEM_ABSENT = { status: "absent" as const };
const ACTIONS_ABSENT = { status: "absent" as const };

function run(value: unknown) {
  return interpret(JSON.stringify(value));
}

function screen(route: string, file: string): ValidScreenItem {
  return { kind: "valid", route, file };
}

describe("interpret", () => {
  it("reads the current screens product IR", () => {
    expect(interpret(JSON.stringify(screens))).toEqual({
      ok: true,
      items: [
        screen("/", "src/routes/index.tsx"),
        screen(
          "/investors/$investorId",
          "src/routes/investors/$investorId.tsx",
        ),
        screen("/programs/", "src/routes/programs.index.tsx"),
        screen("/programs", "src/routes/programs.tsx"),
        screen("/programs/$programId", "src/routes/programs/$programId.tsx"),
        screen("/saved", "src/routes/saved.tsx"),
      ],
      navigation: NAVIGATION_ABSENT,
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("keeps document order", () => {
    expect(
      run({
        screens: [
          { route: "/z", source: { file: "z.tsx" } },
          { route: "/a", source: { file: "a.tsx" } },
        ],
      }),
    ).toEqual({
      ok: true,
      items: [screen("/z", "z.tsx"), screen("/a", "a.tsx")],
      navigation: NAVIGATION_ABSENT,
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("keeps duplicate routes", () => {
    expect(
      run({
        screens: [
          { route: "/programs", source: { file: "a.tsx" } },
          { route: "/programs", source: { file: "b.tsx" } },
        ],
      }),
    ).toEqual({
      ok: true,
      items: [screen("/programs", "a.tsx"), screen("/programs", "b.tsx")],
      navigation: NAVIGATION_ABSENT,
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("loads an empty screens array", () => {
    expect(interpret(JSON.stringify(emptyScreens))).toEqual({
      ok: true,
      items: [],
      navigation: NAVIGATION_ABSENT,
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("keeps empty route and source strings", () => {
    expect(run({ screens: [{ route: "", source: { file: "" } }] })).toEqual({
      ok: true,
      items: [screen("", "")],
      navigation: NAVIGATION_ABSENT,
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("does not trim routes or source files", () => {
    expect(
      run({ screens: [{ route: " /x ", source: { file: " a.tsx " } }] }),
    ).toEqual({
      ok: true,
      items: [screen(" /x ", " a.tsx ")],
      navigation: NAVIGATION_ABSENT,
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("rejects an empty object because screens is required", () => {
    expect(interpret(JSON.stringify(missingScreens))).toEqual({
      ok: false,
      kind: "invalid-product",
      message: SCREENS_REQUIRED,
      unrecognized: [],
    });
  });

  it("rejects unknown fields alone and preserves them", () => {
    const result = interpret(JSON.stringify(unknownOnly));
    expect(result).toEqual({
      ok: false,
      kind: "invalid-product",
      message: SCREENS_REQUIRED,
      unrecognized: [{ path: "forms", value: [] }],
    });
    expect(result).not.toHaveProperty("rawScreens");
  });

  it("renders screens and preserves sibling unknown fields", () => {
    expect(interpret(JSON.stringify(screensAndUnknown))).toEqual({
      ok: true,
      items: [screen("/dashboard", "src/routes/dashboard.tsx")],
      navigation: NAVIGATION_ABSENT,
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [
        { path: "forms", value: [{ name: "login" }] },
        { path: "experimentalThing", value: { enabled: true } },
      ],
    });
  });

  it("preserves extra fields on a valid screen and source", () => {
    expect(
      run({
        forms: [],
        screens: [
          {
            route: "/home",
            source: { file: "src/home.tsx", line: 4 },
            title: "Home",
          },
        ],
      }),
    ).toEqual({
      ok: true,
      items: [screen("/home", "src/home.tsx")],
      navigation: NAVIGATION_ABSENT,
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [
        { path: "forms", value: [] },
        { path: "screens[0].title", value: "Home" },
        { path: "screens[0].source.line", value: 4 },
      ],
    });
  });

  it("uses the original array index for nested unknown fields", () => {
    expect(
      run({
        screens: [1, { route: "/ok", source: { file: "ok.tsx" }, title: "Ok" }],
      }),
    ).toEqual({
      ok: true,
      items: [{ kind: "invalid", index: 1, raw: 1 }, screen("/ok", "ok.tsx")],
      navigation: NAVIGATION_ABSENT,
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [{ path: "screens[1].title", value: "Ok" }],
    });
  });

  it("rejects malformed JSON", () => {
    expect(interpret("")).toEqual({
      ok: false,
      kind: "unreadable",
      message: "This file is not valid JSON.",
    });
    expect(interpret(notJson)).toEqual({
      ok: false,
      kind: "unreadable",
      message: "This file is not valid JSON.",
    });
  });

  it("rejects JSON that is not an object", () => {
    for (const value of [notObject, null, 1, "hi"]) {
      expect(interpret(JSON.stringify(value))).toEqual({
        ok: false,
        kind: "unreadable",
        message: "abbox.json must contain a JSON object.",
      });
    }
  });

  it("keeps a non-array screens value raw and preserves siblings", () => {
    expect(interpret(JSON.stringify(malformedScreens))).toEqual({
      ok: false,
      kind: "invalid-product",
      message: "screens must be an array.",
      unrecognized: [{ path: "forms", value: [{ name: "login" }] }],
      rawScreens: "nope",
    });
  });

  it("does not wrap a screen object into an array", () => {
    expect(
      run({
        screens: { route: "/home", source: { file: "src/home.tsx" } },
        forms: [],
      }),
    ).toEqual({
      ok: false,
      kind: "invalid-product",
      message: "screens must be an array.",
      unrecognized: [{ path: "forms", value: [] }],
      rawScreens: { route: "/home", source: { file: "src/home.tsx" } },
    });
  });

  it("keeps valid siblings when some screen entries are invalid", () => {
    expect(
      run({
        screens: [
          { route: "/ok", source: { file: "src/ok.tsx" } },
          1,
          { source: { file: "src/missing-route.tsx" } },
        ],
      }),
    ).toEqual({
      ok: true,
      items: [
        screen("/ok", "src/ok.tsx"),
        { kind: "invalid", index: 2, raw: 1 },
        {
          kind: "invalid",
          index: 3,
          raw: { source: { file: "src/missing-route.tsx" } },
        },
      ],
      navigation: NAVIGATION_ABSENT,
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("does not invent a source file when source is missing or the wrong type", () => {
    expect(run({ screens: [{ route: "/only" }] })).toEqual({
      ok: true,
      items: [{ kind: "invalid", index: 1, raw: { route: "/only" } }],
      navigation: NAVIGATION_ABSENT,
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
    expect(run({ screens: [{ route: "/only", source: { file: 1 } }] })).toEqual(
      {
        ok: true,
        items: [
          {
            kind: "invalid",
            index: 1,
            raw: { route: "/only", source: { file: 1 } },
          },
        ],
        navigation: NAVIGATION_ABSENT,
        designSystem: DESIGN_SYSTEM_ABSENT,
        actions: ACTIONS_ABSENT,
        unrecognized: [],
      },
    );
  });

  it("does not stringify a numeric route", () => {
    expect(run({ screens: [{ route: 4, source: { file: "a.tsx" } }] })).toEqual(
      {
        ok: true,
        items: [
          {
            kind: "invalid",
            index: 1,
            raw: { route: 4, source: { file: "a.tsx" } },
          },
        ],
        navigation: NAVIGATION_ABSENT,
        designSystem: DESIGN_SYSTEM_ABSENT,
        actions: ACTIONS_ABSENT,
        unrecognized: [],
      },
    );
  });

  it("leaves unknown fields inside an invalid screen on the raw entry", () => {
    expect(
      run({ screens: [{ title: "Nope", source: { file: "src/x.tsx" } }] }),
    ).toEqual({
      ok: true,
      items: [
        {
          kind: "invalid",
          index: 1,
          raw: { title: "Nope", source: { file: "src/x.tsx" } },
        },
      ],
      navigation: NAVIGATION_ABSENT,
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("treats numeric schemaVersion as an unknown field", () => {
    expect(
      run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        schemaVersion: 1,
      }),
    ).toEqual({
      ok: true,
      items: [screen("/", "a.tsx")],
      navigation: NAVIGATION_ABSENT,
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [{ path: "schemaVersion", value: 1 }],
    });
  });

  it("recognizes string schemaVersion 1", () => {
    expect(
      run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        schemaVersion: "1",
      }),
    ).toEqual({
      ok: true,
      schemaVersion: "1",
      items: [screen("/", "a.tsx")],
      navigation: NAVIGATION_ABSENT,
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("treats schemaVersion without screens as an unknown field on an invalid product", () => {
    const result = run({ schemaVersion: 1 });
    expect(result).toEqual({
      ok: false,
      kind: "invalid-product",
      message: SCREENS_REQUIRED,
      unrecognized: [{ path: "schemaVersion", value: 1 }],
    });
    expect(result).not.toHaveProperty("rawScreens");
  });

  it("parses a leading byte order mark", () => {
    expect(interpret('\uFEFF{"screens":[]}')).toEqual({
      ok: true,
      items: [],
      navigation: NAVIGATION_ABSENT,
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("rejects text larger than 1 MB before parsing", () => {
    expect(interpret("x".repeat(1_000_001))).toEqual({
      ok: false,
      kind: "unreadable",
      message: "This file is too large to open in the viewer.",
    });
  });

  it("does not apply the size error at exactly 1 MB", () => {
    expect(interpret(" ".repeat(1_000_000))).toEqual({
      ok: false,
      kind: "unreadable",
      message: "This file is not valid JSON.",
    });
  });

  it("reads navigation with valid screen-to-screen edges", () => {
    expect(interpret(JSON.stringify(screensWithNavigation))).toEqual({
      ok: true,
      schemaVersion: "1",
      items: [
        screen("/", "src/routes/index.tsx"),
        screen(
          "/investors/$investorId",
          "src/routes/investors/$investorId.tsx",
        ),
        screen("/programs/", "src/routes/programs.index.tsx"),
        screen("/programs", "src/routes/programs.tsx"),
        screen("/programs/$programId", "src/routes/programs/$programId.tsx"),
        screen("/saved", "src/routes/saved.tsx"),
      ],
      navigation: {
        status: "present",
        items: [
          { kind: "valid", from: "/", to: "/investors/$investorId" },
          { kind: "valid", from: "/investors/$investorId", to: "/" },
          { kind: "valid", from: "/programs/$programId", to: "/programs" },
        ],
      },
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("treats missing navigation as absent", () => {
    const result = run({
      screens: [{ route: "/", source: { file: "a.tsx" } }],
    });
    expect(result.ok && result.navigation).toEqual(NAVIGATION_ABSENT);
  });

  it("loads an empty navigation array", () => {
    expect(
      run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        navigation: [],
      }),
    ).toEqual({
      ok: true,
      items: [screen("/", "a.tsx")],
      navigation: { status: "present", items: [] },
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("rejects a non-array navigation value", () => {
    expect(
      run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        navigation: "nope",
      }),
    ).toEqual({
      ok: true,
      items: [screen("/", "a.tsx")],
      navigation: {
        status: "invalid",
        message: "navigation must be an array.",
        raw: "nope",
      },
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("rejects navigation entries with unknown routes", () => {
    expect(
      run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        navigation: [{ from: "/", to: "/missing" }],
      }),
    ).toEqual({
      ok: true,
      items: [screen("/", "a.tsx")],
      navigation: {
        status: "present",
        items: [
          {
            kind: "invalid",
            index: 1,
            raw: { from: "/", to: "/missing" },
          },
        ],
      },
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("keeps valid navigation beside invalid entries", () => {
    expect(
      run({
        screens: [
          { route: "/", source: { file: "a.tsx" } },
          { route: "/b", source: { file: "b.tsx" } },
        ],
        navigation: [
          { from: "/", to: "/b" },
          { from: "/", to: "/ghost" },
        ],
      }),
    ).toEqual({
      ok: true,
      items: [screen("/", "a.tsx"), screen("/b", "b.tsx")],
      navigation: {
        status: "present",
        items: [
          { kind: "valid", from: "/", to: "/b" },
          {
            kind: "invalid",
            index: 2,
            raw: { from: "/", to: "/ghost" },
          },
        ],
      },
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("preserves extra fields on valid navigation entries", () => {
    expect(
      run({
        screens: [
          { route: "/", source: { file: "a.tsx" } },
          { route: "/b", source: { file: "b.tsx" } },
        ],
        navigation: [{ from: "/", to: "/b", label: "go" }],
      }),
    ).toEqual({
      ok: true,
      items: [screen("/", "a.tsx"), screen("/b", "b.tsx")],
      navigation: {
        status: "present",
        items: [{ kind: "valid", from: "/", to: "/b" }],
      },
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [{ path: "navigation[0].label", value: "go" }],
    });
  });

  it("keeps duplicate valid navigation entries", () => {
    expect(
      run({
        screens: [
          { route: "/", source: { file: "a.tsx" } },
          { route: "/b", source: { file: "b.tsx" } },
        ],
        navigation: [
          { from: "/", to: "/b" },
          { from: "/", to: "/b" },
        ],
      }),
    ).toEqual({
      ok: true,
      items: [screen("/", "a.tsx"), screen("/b", "b.tsx")],
      navigation: {
        status: "present",
        items: [
          { kind: "valid", from: "/", to: "/b" },
          { kind: "valid", from: "/", to: "/b" },
        ],
      },
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  it("keeps navigation and preserves unrelated unknown fields", () => {
    expect(
      run({
        screens: [
          { route: "/", source: { file: "a.tsx" } },
          { route: "/b", source: { file: "b.tsx" } },
        ],
        navigation: [{ from: "/", to: "/b" }],
        forms: [],
      }),
    ).toEqual({
      ok: true,
      items: [screen("/", "a.tsx"), screen("/b", "b.tsx")],
      navigation: {
        status: "present",
        items: [{ kind: "valid", from: "/", to: "/b" }],
      },
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [{ path: "forms", value: [] }],
    });
  });

  it("rejects malformed navigation entry shapes", () => {
    expect(
      run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        navigation: [1, { from: 1, to: "/" }],
      }),
    ).toEqual({
      ok: true,
      items: [screen("/", "a.tsx")],
      navigation: {
        status: "present",
        items: [
          { kind: "invalid", index: 1, raw: 1 },
          { kind: "invalid", index: 2, raw: { from: 1, to: "/" } },
        ],
      },
      designSystem: DESIGN_SYSTEM_ABSENT,
      actions: ACTIONS_ABSENT,
      unrecognized: [],
    });
  });

  describe("designSystem", () => {
    const color = (
      name: string,
      value: string,
      file: string,
      hex?: string,
    ) => ({
      kind: "valid" as const,
      name,
      value,
      sourceFile: file,
      ...(hex !== undefined ? { hex } : {}),
    });

    it("treats missing designSystem as absent", () => {
      const result = run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
      });
      expect(result.ok && result.designSystem).toEqual(DESIGN_SYSTEM_ABSENT);
    });

    it("loads empty themes array", () => {
      expect(
        run({
          screens: [{ route: "/", source: { file: "a.tsx" } }],
          designSystem: { themes: [] },
        }),
      ).toEqual({
        ok: true,
        items: [screen("/", "a.tsx")],
        navigation: NAVIGATION_ABSENT,
        designSystem: { status: "present", themes: [] },
        actions: ACTIONS_ABSENT,
        unrecognized: [],
      });
    });

    it("parses default and dark themes with resolved and unresolved colors", () => {
      expect(
        run({
          screens: [{ route: "/", source: { file: "a.tsx" } }],
          designSystem: {
            themes: [
              {
                name: "default",
                colors: [
                  {
                    name: "primary",
                    value: "oklch(0.46 0.13 296)",
                    hex: "#604597",
                    source: { file: "src/styles.css" },
                  },
                  {
                    name: "overlay",
                    value: "oklch(0.1 0.02 280 / 0.45)",
                    hex: "#11101A73",
                    source: { file: "src/styles.css" },
                  },
                ],
              },
              {
                name: "dark",
                colors: [
                  {
                    name: "accent-strong",
                    value: "var(--accent-strong)",
                    source: { file: "src/styles.css" },
                  },
                ],
              },
            ],
          },
        }),
      ).toEqual({
        ok: true,
        items: [screen("/", "a.tsx")],
        navigation: NAVIGATION_ABSENT,
        designSystem: {
          status: "present",
          themes: [
            {
              kind: "valid",
              name: "default",
              colors: [
                color(
                  "primary",
                  "oklch(0.46 0.13 296)",
                  "src/styles.css",
                  "#604597",
                ),
                color(
                  "overlay",
                  "oklch(0.1 0.02 280 / 0.45)",
                  "src/styles.css",
                  "#11101A73",
                ),
              ],
            },
            {
              kind: "valid",
              name: "dark",
              colors: [
                color(
                  "accent-strong",
                  "var(--accent-strong)",
                  "src/styles.css",
                ),
              ],
            },
          ],
        },
        actions: ACTIONS_ABSENT,
        unrecognized: [],
      });
    });

    it("accepts arbitrary theme name strings", () => {
      const result = run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        designSystem: {
          themes: [
            {
              name: "brand",
              colors: [
                {
                  name: "primary",
                  value: "#604597",
                  hex: "#604597",
                  source: { file: "src/styles.css" },
                },
              ],
            },
          ],
        },
      });
      expect(result.ok && result.designSystem).toEqual({
        status: "present",
        themes: [
          {
            kind: "valid",
            name: "brand",
            colors: [color("primary", "#604597", "src/styles.css", "#604597")],
          },
        ],
      });
    });

    it("rejects invalid compiler hex on a color entry", () => {
      const result = run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        designSystem: {
          themes: [
            {
              name: "default",
              colors: [
                {
                  name: "bad",
                  value: "red",
                  hex: "not-hex",
                  source: { file: "src/styles.css" },
                },
              ],
            },
          ],
        },
      });
      expect(result.ok && result.designSystem).toEqual({
        status: "present",
        themes: [
          {
            kind: "valid",
            name: "default",
            colors: [
              {
                kind: "invalid",
                index: 1,
                raw: {
                  name: "bad",
                  value: "red",
                  hex: "not-hex",
                  source: { file: "src/styles.css" },
                },
              },
            ],
          },
        ],
      });
    });

    it("rejects malformed designSystem container values", () => {
      expect(
        run({
          screens: [{ route: "/", source: { file: "a.tsx" } }],
          designSystem: null,
        }),
      ).toMatchObject({
        ok: true,
        designSystem: {
          status: "invalid",
          message: "designSystem must be an object.",
          raw: null,
        },
      });
      expect(
        run({
          screens: [{ route: "/", source: { file: "a.tsx" } }],
          designSystem: {},
        }),
      ).toMatchObject({
        ok: true,
        designSystem: {
          status: "invalid",
          message: "designSystem.themes is required.",
        },
      });
      expect(
        run({
          screens: [{ route: "/", source: { file: "a.tsx" } }],
          designSystem: { themes: "wrong" },
        }),
      ).toMatchObject({
        ok: true,
        designSystem: {
          status: "invalid",
          message: "designSystem.themes must be an array.",
          raw: "wrong",
        },
      });
    });

    it("preserves nested unrecognized fields on designSystem", () => {
      expect(
        run({
          screens: [{ route: "/", source: { file: "a.tsx" } }],
          designSystem: {
            version: 2,
            themes: [
              {
                name: "default",
                extra: true,
                colors: [
                  {
                    name: "primary",
                    value: "x",
                    hex: "#604597",
                    note: "n",
                    source: { file: "src/styles.css", line: 1 },
                  },
                ],
              },
            ],
          },
        }),
      ).toEqual({
        ok: true,
        items: [screen("/", "a.tsx")],
        navigation: NAVIGATION_ABSENT,
        designSystem: {
          status: "present",
          themes: [
            {
              kind: "valid",
              name: "default",
              colors: [color("primary", "x", "src/styles.css", "#604597")],
            },
          ],
        },
        unrecognized: [
          { path: "designSystem.version", value: 2 },
          { path: "designSystem.themes[0].extra", value: true },
          { path: "designSystem.themes[0].colors[0].note", value: "n" },
          {
            path: "designSystem.themes[0].colors[0].source.line",
            value: 1,
          },
        ],
        actions: ACTIONS_ABSENT,
      });
    });

    it("keeps duplicate hex on separate valid tokens", () => {
      const result = run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        designSystem: {
          themes: [
            {
              name: "default",
              colors: [
                {
                  name: "card",
                  value: "white",
                  hex: "#FFFFFF",
                  source: { file: "a.css" },
                },
                {
                  name: "popover",
                  value: "#fff",
                  hex: "#FFFFFF",
                  source: { file: "a.css" },
                },
              ],
            },
          ],
        },
      });
      expect(result.ok && result.designSystem).toEqual({
        status: "present",
        themes: [
          {
            kind: "valid",
            name: "default",
            colors: [
              color("card", "white", "a.css", "#FFFFFF"),
              color("popover", "#fff", "a.css", "#FFFFFF"),
            ],
          },
        ],
      });
    });

    it("loads screens, navigation, and designSystem in one synthetic snapshot", () => {
      const result = interpret(JSON.stringify(designSystemColors));
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      expect(result.items.filter((item) => item.kind === "valid")).toHaveLength(
        2,
      );
      expect(connectionCount(result.navigation)).toBe(1);
      expect(result.designSystem.status).toBe("present");

      const themes = validThemes(result.designSystem);
      expect(themes.map((theme) => theme.name)).toEqual(["default", "dark"]);

      const defaultTheme = themes[0];
      const darkTheme = themes[1];
      expect(defaultTheme).toBeDefined();
      expect(darkTheme).toBeDefined();
      if (!defaultTheme || !darkTheme) {
        return;
      }

      expect(colorStats(defaultTheme)).toEqual({ tokens: 4, distinct: 3 });
      expect(colorStats(darkTheme)).toEqual({ tokens: 2, distinct: 1 });
      expect(
        validColorTokens(darkTheme).filter((token) => token.hex === undefined),
      ).toHaveLength(1);
    });
  });

  describe("actions", () => {
    const effectsAbsent = { status: "absent" as const };

    function validAction(
      route: string,
      actionKind: "invoke" | "submit",
      sourceFile: string,
      label?: string,
    ) {
      return {
        kind: "valid" as const,
        route,
        actionKind,
        sourceFile,
        effects: effectsAbsent,
        ...(label !== undefined ? { label } : {}),
      };
    }

    it("treats missing actions as absent", () => {
      const result = run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
      });
      expect(result.ok && result.actions).toEqual(ACTIONS_ABSENT);
    });

    it("loads an empty actions array", () => {
      expect(
        run({
          screens: [{ route: "/", source: { file: "a.tsx" } }],
          actions: [],
        }),
      ).toEqual({
        ok: true,
        items: [screen("/", "a.tsx")],
        navigation: NAVIGATION_ABSENT,
        designSystem: DESIGN_SYSTEM_ABSENT,
        actions: { status: "present", items: [] },
        unrecognized: [],
      });
    });

    it("parses labeled invoke, unlabeled invoke, and submit", () => {
      expect(
        run({
          screens: [{ route: "/", source: { file: "a.tsx" } }],
          actions: [
            {
              route: "/",
              kind: "invoke",
              label: "Save",
              source: { file: "a.tsx" },
            },
            {
              route: "/",
              kind: "invoke",
              source: { file: "a.tsx" },
            },
            {
              route: "/",
              kind: "submit",
              source: { file: "a.tsx" },
            },
          ],
        }),
      ).toEqual({
        ok: true,
        items: [screen("/", "a.tsx")],
        navigation: NAVIGATION_ABSENT,
        designSystem: DESIGN_SYSTEM_ABSENT,
        actions: {
          status: "present",
          items: [
            validAction("/", "invoke", "a.tsx", "Save"),
            validAction("/", "invoke", "a.tsx"),
            validAction("/", "submit", "a.tsx"),
          ],
        },
        unrecognized: [],
      });
    });

    it("preserves empty-string label on valid action", () => {
      const result = run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        actions: [
          {
            route: "/",
            kind: "invoke",
            label: "",
            source: { file: "a.tsx" },
          },
        ],
      });
      expect(result.ok && result.actions).toEqual({
        status: "present",
        items: [validAction("/", "invoke", "a.tsx", "")],
      });
    });

    it("rejects unknown route and unknown kind", () => {
      const result = run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        actions: [
          {
            route: "/ghost",
            kind: "invoke",
            source: { file: "a.tsx" },
          },
          {
            route: "/",
            kind: "tap",
            source: { file: "a.tsx" },
          },
        ],
      });
      expect(result.ok && result.actions).toEqual({
        status: "present",
        items: [
          {
            kind: "invalid",
            index: 1,
            raw: {
              route: "/ghost",
              kind: "invoke",
              source: { file: "a.tsx" },
            },
          },
          {
            kind: "invalid",
            index: 2,
            raw: { route: "/", kind: "tap", source: { file: "a.tsx" } },
          },
        ],
      });
    });

    it("rejects malformed actions container", () => {
      expect(
        run({
          screens: [{ route: "/", source: { file: "a.tsx" } }],
          actions: null,
        }),
      ).toMatchObject({
        ok: true,
        actions: {
          status: "invalid",
          message: "actions must be an array.",
          raw: null,
        },
      });
    });

    it("preserves duplicate actions and unknown fields", () => {
      expect(
        run({
          screens: [{ route: "/", source: { file: "a.tsx" } }],
          actions: [
            {
              route: "/",
              kind: "invoke",
              label: "Save",
              source: { file: "a.tsx", line: 1 },
              effect: { type: "api" },
            },
            {
              route: "/",
              kind: "invoke",
              label: "Save",
              source: { file: "a.tsx" },
            },
          ],
        }),
      ).toEqual({
        ok: true,
        items: [screen("/", "a.tsx")],
        navigation: NAVIGATION_ABSENT,
        designSystem: DESIGN_SYSTEM_ABSENT,
        actions: {
          status: "present",
          items: [
            validAction("/", "invoke", "a.tsx", "Save"),
            validAction("/", "invoke", "a.tsx", "Save"),
          ],
        },
        unrecognized: [
          { path: "actions[0].effect", value: { type: "api" } },
          { path: "actions[0].source.line", value: 1 },
        ],
      });
    });

    it("treats a missing effects key as absent", () => {
      const result = run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        actions: [
          {
            route: "/",
            kind: "invoke",
            label: "Save",
            source: { file: "a.tsx" },
          },
        ],
      });
      expect(result.ok && result.actions).toEqual({
        status: "present",
        items: [validAction("/", "invoke", "a.tsx", "Save")],
      });
    });

    it("loads an empty effects array", () => {
      const result = run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        actions: [
          {
            route: "/",
            kind: "invoke",
            source: { file: "a.tsx" },
            effects: [],
          },
        ],
      });
      expect(result.ok && result.actions).toEqual({
        status: "present",
        items: [
          {
            ...validAction("/", "invoke", "a.tsx"),
            effects: { status: "present", items: [] },
          },
        ],
      });
    });

    it("parses search and state effects in source order", () => {
      const result = run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        actions: [
          {
            route: "/",
            kind: "invoke",
            label: "Save",
            source: { file: "a.tsx" },
            effects: [
              { kind: "search" },
              { kind: "state", target: "drawer", value: true },
              { kind: "state", target: "mode", value: "cards" },
              { kind: "state", target: "count", value: 2 },
              { kind: "state", target: "name", value: null },
              { kind: "state", target: "count" },
              { kind: "state", target: "" },
            ],
          },
        ],
      });
      expect(result.ok && result.actions).toEqual({
        status: "present",
        items: [
          {
            ...validAction("/", "invoke", "a.tsx", "Save"),
            effects: {
              status: "present",
              items: [
                { kind: "valid", effectKind: "search" },
                {
                  kind: "valid",
                  effectKind: "state",
                  target: "drawer",
                  value: true,
                },
                {
                  kind: "valid",
                  effectKind: "state",
                  target: "mode",
                  value: "cards",
                },
                {
                  kind: "valid",
                  effectKind: "state",
                  target: "count",
                  value: 2,
                },
                {
                  kind: "valid",
                  effectKind: "state",
                  target: "name",
                  value: null,
                },
                { kind: "valid", effectKind: "state", target: "count" },
                { kind: "valid", effectKind: "state", target: "" },
              ],
            },
          },
        ],
      });
    });

    it("keeps the action when the effects container is not an array", () => {
      const result = run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        actions: [
          {
            route: "/",
            kind: "invoke",
            label: "Save",
            source: { file: "a.tsx" },
            effects: null,
          },
        ],
      });
      expect(result.ok && result.items).toEqual([screen("/", "a.tsx")]);
      expect(result.ok && result.actions).toEqual({
        status: "present",
        items: [
          {
            ...validAction("/", "invoke", "a.tsx", "Save"),
            effects: { status: "invalid", raw: null },
          },
        ],
      });
    });

    it("marks a malformed known effect invalid and keeps a valid sibling", () => {
      const missingTarget = { kind: "state" };
      const badTarget = { kind: "state", target: 123 };
      const badValue = { kind: "state", target: "drawer", value: {} };
      const badKindType = { kind: 1 };
      const result = run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        actions: [
          {
            route: "/",
            kind: "invoke",
            label: "Save",
            source: { file: "a.tsx" },
            effects: [
              { kind: "search" },
              missingTarget,
              badTarget,
              badValue,
              badKindType,
            ],
          },
        ],
      });
      expect(result.ok && result.items).toEqual([screen("/", "a.tsx")]);
      expect(result.ok && result.actions).toEqual({
        status: "present",
        items: [
          {
            ...validAction("/", "invoke", "a.tsx", "Save"),
            effects: {
              status: "present",
              items: [
                { kind: "valid", effectKind: "search" },
                { kind: "invalid", index: 2, raw: missingTarget },
                { kind: "invalid", index: 3, raw: badTarget },
                { kind: "invalid", index: 4, raw: badValue },
                { kind: "invalid", index: 5, raw: badKindType },
              ],
            },
          },
        ],
      });
      expect(result.ok && result.unrecognized).toEqual([]);
    });

    it("keeps an unknown effect kind as unsupported", () => {
      const request = { kind: "request", method: "POST" };
      const result = run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        actions: [
          {
            route: "/",
            kind: "invoke",
            label: "Save",
            source: { file: "a.tsx" },
            effects: [{ kind: "search" }, request],
          },
        ],
      });
      expect(result.ok && result.items).toEqual([screen("/", "a.tsx")]);
      expect(result.ok && result.actions).toEqual({
        status: "present",
        items: [
          {
            ...validAction("/", "invoke", "a.tsx", "Save"),
            effects: {
              status: "present",
              items: [
                { kind: "valid", effectKind: "search" },
                { kind: "unsupported", index: 2, raw: request },
              ],
            },
          },
        ],
      });
      expect(result.ok && result.unrecognized).toEqual([]);
    });

    it("records unknown fields on a valid search effect", () => {
      const result = run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        actions: [
          {
            route: "/",
            kind: "invoke",
            source: { file: "a.tsx" },
            effects: [{ kind: "search", note: true }],
          },
        ],
      });
      expect(result.ok && result.actions).toEqual({
        status: "present",
        items: [
          {
            ...validAction("/", "invoke", "a.tsx"),
            effects: {
              status: "present",
              items: [{ kind: "valid", effectKind: "search" }],
            },
          },
        ],
      });
      expect(result.ok && result.unrecognized).toEqual([
        { path: "actions[0].effects[0].note", value: true },
      ]);
    });

    it("rejects invalid label type and malformed source", () => {
      const result = run({
        screens: [{ route: "/", source: { file: "a.tsx" } }],
        actions: [
          { route: "/", kind: "invoke", label: 1, source: { file: "a.tsx" } },
          { route: "/", kind: "invoke", source: "nope" },
        ],
      });
      expect(result.ok && result.actions).toEqual({
        status: "present",
        items: [
          {
            kind: "invalid",
            index: 1,
            raw: {
              route: "/",
              kind: "invoke",
              label: 1,
              source: { file: "a.tsx" },
            },
          },
          {
            kind: "invalid",
            index: 2,
            raw: { route: "/", kind: "invoke", source: "nope" },
          },
        ],
      });
    });
  });
});
