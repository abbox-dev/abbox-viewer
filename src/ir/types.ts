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

export type ValidColorToken = {
  kind: "valid";
  name: string;
  value: string;
  sourceFile: string;
  hex?: string;
};

export type InvalidColorToken = {
  kind: "invalid";
  index: number;
  raw: JsonValue;
};

export type ColorToken = ValidColorToken | InvalidColorToken;

export type ValidTheme = {
  kind: "valid";
  name: string;
  colors: ColorToken[];
};

export type InvalidTheme = {
  kind: "invalid";
  index: number;
  raw: JsonValue;
};

export type ThemeItem = ValidTheme | InvalidTheme;

export type DesignSystemField =
  | { status: "absent" }
  | { status: "invalid"; message: string; raw: JsonValue }
  | { status: "present"; themes: ThemeItem[] };

export type ActionKind = "invoke" | "submit";

export type StateEffect = {
  kind: "valid";
  effectKind: "state";
  target: string;
  value?: string | number | boolean | null;
};

export type SearchEffect = {
  kind: "valid";
  effectKind: "search";
};

export type InvalidEffect = {
  kind: "invalid";
  index: number;
  raw: JsonValue;
};

export type UnsupportedEffect = {
  kind: "unsupported";
  index: number;
  raw: JsonValue;
};

export type EffectItem =
  | StateEffect
  | SearchEffect
  | InvalidEffect
  | UnsupportedEffect;

export type EffectsField =
  | { status: "absent" }
  | { status: "invalid"; raw: JsonValue }
  | { status: "present"; items: EffectItem[] };

export type ValidActionItem = {
  kind: "valid";
  route: string;
  actionKind: ActionKind;
  sourceFile: string;
  label?: string;
  effects: EffectsField;
};

export type InvalidActionItem = {
  kind: "invalid";
  index: number;
  raw: JsonValue;
};

export type ActionItem = ValidActionItem | InvalidActionItem;

export type ActionsField =
  | { status: "absent" }
  | { status: "invalid"; message: string; raw: JsonValue }
  | { status: "present"; items: ActionItem[] };

export type ValidEntityField = {
  kind: "valid";
  name: string;
  optional?: boolean;
};

export type InvalidEntityField = {
  kind: "invalid";
  index: number;
  raw: JsonValue;
};

export type EntityFieldItem = ValidEntityField | InvalidEntityField;

export type ValidEntity = {
  kind: "valid";
  name: string;
  sourceFile: string;
  fields: EntityFieldItem[];
};

export type InvalidEntity = {
  kind: "invalid";
  index: number;
  raw: JsonValue;
};

export type EntityItem = ValidEntity | InvalidEntity;

export type EntitiesField =
  | { status: "absent" }
  | { status: "invalid"; message: string; raw: JsonValue }
  | { status: "present"; items: EntityItem[] };

export type ValidGlobalNavigationItem = {
  kind: "valid";
  to: string;
  sourceFile: string;
};

export type InvalidGlobalNavigationItem = {
  kind: "invalid";
  index: number;
  raw: JsonValue;
};

export type GlobalNavigationItem =
  | ValidGlobalNavigationItem
  | InvalidGlobalNavigationItem;

export type GlobalNavigationField =
  | { status: "absent" }
  | { status: "invalid"; message: string; raw: JsonValue }
  | { status: "present"; items: GlobalNavigationItem[] };

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
  designSystem: DesignSystemField;
  actions: ActionsField;
  entities: EntitiesField;
  globalNavigation: GlobalNavigationField;
  schemaVersion?: "1";
  unrecognized: UnrecognizedEntry[];
};

export type InterpretResult =
  | UnreadableResult
  | InvalidProductResult
  | LoadedResult;
