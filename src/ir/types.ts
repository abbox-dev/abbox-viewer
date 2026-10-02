export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type UnrecognizedEntry = {
  path: string;
  value: JsonValue;
};

export type ValidScreenItem = {
  kind: "valid";
  route: string;
  file: string;
};

export type InvalidScreenItem = {
  kind: "invalid";
  index: number;
  raw: JsonValue;
};

export type ScreenItem = ValidScreenItem | InvalidScreenItem;

export type ValidNavigationItem = {
  kind: "valid";
  from: string;
  to: string;
};

export type InvalidNavigationItem = {
  kind: "invalid";
  index: number;
  raw: JsonValue;
};

export type NavigationItem = ValidNavigationItem | InvalidNavigationItem;

export type NavigationField =
  | { status: "absent" }
  | { status: "invalid"; message: string; raw: JsonValue }
  | { status: "present"; items: NavigationItem[] };

export type UnreadableResult = {
  ok: false;
  kind: "unreadable";
  message: string;
};

export type InvalidProductResult = {
  ok: false;
  kind: "invalid-product";
  message: string;
  unrecognized: UnrecognizedEntry[];
  rawScreens?: JsonValue;
};

export type LoadedResult = {
  ok: true;
  items: ScreenItem[];
  navigation: NavigationField;
  schemaVersion?: "1";
  unrecognized: UnrecognizedEntry[];
};

export type InterpretResult =
  | UnreadableResult
  | InvalidProductResult
  | LoadedResult;
