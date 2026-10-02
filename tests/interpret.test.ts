import { describe, expect, it } from "vitest";
import { interpret } from "../src/ir/interpret";
import type { ValidScreenItem } from "../src/ir/types";
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
      unrecognized: [],
    });
  });

  it("loads an empty screens array", () => {
    expect(interpret(JSON.stringify(emptyScreens))).toEqual({
      ok: true,
      items: [],
      navigation: NAVIGATION_ABSENT,
      unrecognized: [],
    });
  });

  it("keeps empty route and source strings", () => {
    expect(run({ screens: [{ route: "", source: { file: "" } }] })).toEqual({
      ok: true,
      items: [screen("", "")],
      navigation: NAVIGATION_ABSENT,
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
      unrecognized: [],
    });
  });

  it("does not invent a source file when source is missing or the wrong type", () => {
    expect(run({ screens: [{ route: "/only" }] })).toEqual({
      ok: true,
      items: [{ kind: "invalid", index: 1, raw: { route: "/only" } }],
      navigation: NAVIGATION_ABSENT,
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
      unrecognized: [],
    });
  });
});
