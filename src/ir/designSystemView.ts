import type {
  ColorToken,
  DesignSystemField,
  ValidColorToken,
  ValidTheme,
} from "./types";

export function showDesignSystem(field: DesignSystemField): boolean {
  return field.status !== "absent";
}

export function validThemes(field: DesignSystemField): ValidTheme[] {
  if (field.status !== "present") {
    return [];
  }
  return field.themes.filter(
    (theme): theme is ValidTheme => theme.kind === "valid",
  );
}

export function initialThemeName(themes: ValidTheme[]): string | undefined {
  if (themes.length === 0) {
    return undefined;
  }
  const defaultTheme = themes.find((theme) => theme.name === "default");
  if (defaultTheme !== undefined) {
    return defaultTheme.name;
  }
  return themes[0]?.name;
}

export function validColorTokens(theme: ValidTheme): ValidColorToken[] {
  return theme.colors.filter(
    (token): token is ValidColorToken => token.kind === "valid",
  );
}

export function invalidColorTokens(theme: ValidTheme): ColorToken[] {
  return theme.colors.filter((token) => token.kind === "invalid");
}

export function colorStats(theme: ValidTheme): {
  tokens: number;
  distinct: number;
} {
  const valid = validColorTokens(theme);
  const hexSet = new Set<string>();
  for (const token of valid) {
    if (token.hex !== undefined) {
      hexSet.add(token.hex);
    }
  }
  return { tokens: valid.length, distinct: hexSet.size };
}

export function hexUsageCount(theme: ValidTheme, hex: string): number {
  let count = 0;
  for (const token of validColorTokens(theme)) {
    if (token.hex === hex) {
      count += 1;
    }
  }
  return count;
}
