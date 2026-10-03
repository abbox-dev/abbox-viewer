export const COMPILER_HEX_PATTERN = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/;

export function isCompilerHex(value: string): boolean {
  return COMPILER_HEX_PATTERN.test(value);
}

export function isAlphaHex(hex: string): boolean {
  return hex.length === 9;
}
