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
  unrecognized: UnrecognizedEntry[];
};

export type InterpretResult =
  | UnreadableResult
  | InvalidProductResult
  | LoadedResult;
