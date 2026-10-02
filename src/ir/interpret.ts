import { knownScreenRoutes } from "./navigationView";
import type {
  InterpretResult,
  InvalidNavigationItem,
  InvalidScreenItem,
  JsonValue,
  NavigationField,
  NavigationItem,
  UnrecognizedEntry,
  ValidNavigationItem,
  ValidScreenItem,
} from "./types";

const MAX_FILE_BYTES = 1_000_000;

const FILE_TOO_LARGE = "This file is too large to open in the viewer.";
const INVALID_JSON = "This file is not valid JSON.";
const NOT_OBJECT = "abbox.json must contain a JSON object.";
const SCREENS_REQUIRED =
  "This file is not a valid Product IR. screens is required.";
const SCREENS_MUST_BE_ARRAY = "screens must be an array.";
const NAVIGATION_MUST_BE_ARRAY = "navigation must be an array.";

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function interpret(text: string): InterpretResult {
  if (utf8Bytes(text) > MAX_FILE_BYTES) {
    return { ok: false, kind: "unreadable", message: FILE_TOO_LARGE };
  }

  const source = text.startsWith("\uFEFF") ? text.slice(1) : text;
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    return { ok: false, kind: "unreadable", message: INVALID_JSON };
  }

  if (!isJsonValue(parsed) || !isJsonObject(parsed)) {
    return { ok: false, kind: "unreadable", message: NOT_OBJECT };
  }

  const root = ownRecord(parsed);
  const unrecognized: UnrecognizedEntry[] = [];
  let hasScreens = false;
  let screensValue: JsonValue | undefined;
  let hasNavigation = false;
  let navigationValue: JsonValue | undefined;
  let schemaVersion: "1" | undefined;

  for (const [key, value] of entriesOf(root)) {
    if (key === "screens") {
      hasScreens = true;
      screensValue = value;
      continue;
    }
    if (key === "navigation") {
      hasNavigation = true;
      navigationValue = value;
      continue;
    }
    if (key === "schemaVersion") {
      if (value === "1") {
        schemaVersion = "1";
      } else {
        unrecognized.push({ path: formatKey(key), value });
      }
      continue;
    }
    unrecognized.push({ path: formatKey(key), value });
  }

  if (!hasScreens || screensValue === undefined) {
    return {
      ok: false,
      kind: "invalid-product",
      message: SCREENS_REQUIRED,
      unrecognized,
    };
  }

  if (!Array.isArray(screensValue)) {
    return {
      ok: false,
      kind: "invalid-product",
      message: SCREENS_MUST_BE_ARRAY,
      unrecognized,
      rawScreens: screensValue,
    };
  }

  const items: Array<ValidScreenItem | InvalidScreenItem> = [];
  screensValue.forEach((element, index) => {
    const validated = validateScreen(element, index);
    if (validated.ok) {
      items.push(validated.screen);
      unrecognized.push(...validated.extras);
      return;
    }
    items.push({ kind: "invalid", index: index + 1, raw: element });
  });

  const navigation = parseNavigation(
    hasNavigation,
    navigationValue,
    knownScreenRoutes(items),
    unrecognized,
  );

  return {
    ok: true,
    items,
    navigation,
    ...(schemaVersion !== undefined ? { schemaVersion } : {}),
    unrecognized,
  };
}

function parseNavigation(
  hasNavigation: boolean,
  navigationValue: JsonValue | undefined,
  routes: Set<string>,
  unrecognized: UnrecognizedEntry[],
): NavigationField {
  if (!hasNavigation) {
    return { status: "absent" };
  }

  if (!Array.isArray(navigationValue)) {
    return {
      status: "invalid",
      message: NAVIGATION_MUST_BE_ARRAY,
      raw: navigationValue as JsonValue,
    };
  }

  const items: NavigationItem[] = [];
  navigationValue.forEach((element, index) => {
    const validated = validateNavigationEntry(
      element,
      index,
      routes,
      unrecognized,
    );
    items.push(validated);
  });

  return { status: "present", items };
}

function validateNavigationEntry(
  value: JsonValue,
  index: number,
  routes: Set<string>,
  unrecognized: UnrecognizedEntry[],
): ValidNavigationItem | InvalidNavigationItem {
  if (!isJsonObject(value)) {
    return { kind: "invalid", index: index + 1, raw: value };
  }

  const record = ownRecord(value);
  const from = record.from;
  const to = record.to;
  if (typeof from !== "string" || typeof to !== "string") {
    return { kind: "invalid", index: index + 1, raw: value };
  }

  if (!routes.has(from) || !routes.has(to)) {
    return { kind: "invalid", index: index + 1, raw: value };
  }

  const base = `navigation[${index}]`;
  for (const [key, extra] of entriesOf(record)) {
    if (key === "from" || key === "to") {
      continue;
    }
    unrecognized.push({ path: joinPath(base, key), value: extra });
  }

  return { kind: "valid", from, to };
}

function validateScreen(
  value: JsonValue,
  index: number,
):
  | { ok: true; screen: ValidScreenItem; extras: UnrecognizedEntry[] }
  | { ok: false } {
  if (!isJsonObject(value)) {
    return { ok: false };
  }

  const record = ownRecord(value);
  const route = record.route;
  const source = record.source;
  if (
    typeof route !== "string" ||
    source === undefined ||
    !isJsonObject(source)
  ) {
    return { ok: false };
  }

  const sourceRecord = ownRecord(source);
  const file = sourceRecord.file;
  if (typeof file !== "string") {
    return { ok: false };
  }

  const base = `screens[${index}]`;
  const extras: UnrecognizedEntry[] = [];
  for (const [key, extra] of entriesOf(record)) {
    if (key === "route" || key === "source") {
      continue;
    }
    extras.push({ path: joinPath(base, key), value: extra });
  }
  for (const [key, extra] of entriesOf(sourceRecord)) {
    if (key === "file") {
      continue;
    }
    extras.push({ path: joinPath(`${base}.source`, key), value: extra });
  }

  return {
    ok: true,
    screen: { kind: "valid", route, file },
    extras,
  };
}

function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item));
  }
  if (typeof value === "object") {
    return Object.keys(value).every((key) =>
      isJsonValue((value as Record<string, unknown>)[key]),
    );
  }
  return false;
}

function isJsonObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ownRecord(value: { [key: string]: JsonValue }): {
  [key: string]: JsonValue;
} {
  const out = Object.create(null) as { [key: string]: JsonValue };
  for (const [key, entry] of entriesOf(value)) {
    out[key] = entry;
  }
  return out;
}

function entriesOf(record: {
  [key: string]: JsonValue;
}): Array<[string, JsonValue]> {
  return Object.keys(record).map((key) => [key, record[key] as JsonValue]);
}

function formatKey(key: string): string {
  return IDENTIFIER.test(key) ? key : `[${JSON.stringify(key)}]`;
}

function joinPath(parent: string, key: string): string {
  return IDENTIFIER.test(key)
    ? `${parent}.${key}`
    : `${parent}[${JSON.stringify(key)}]`;
}
