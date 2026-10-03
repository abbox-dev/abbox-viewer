import { useEffect, useId, useMemo, useState } from "react";
import { isAlphaHex } from "../ir/designSystemHex";
import {
  colorStats,
  hexUsageCount,
  initialThemeName,
  invalidColorTokens,
  validColorTokens,
  validThemes,
} from "../ir/designSystemView";
import type { DesignSystemField, ThemeItem, ValidTheme } from "../ir/types";
import { JsonTree } from "./JsonTree";

type DesignSystemSectionProps = {
  designSystem: DesignSystemField;
};

export function DesignSystemSection({
  designSystem,
}: DesignSystemSectionProps) {
  const themes = useMemo(
    () => (designSystem.status === "present" ? validThemes(designSystem) : []),
    [designSystem],
  );
  const [selectedName, setSelectedName] = useState<string | undefined>(() =>
    initialThemeName(themes),
  );
  const tabListId = useId();
  const colorsHeadingId = useId();

  useEffect(() => {
    setSelectedName(initialThemeName(themes));
  }, [themes]);

  const selectedTheme = themes.find((theme) => theme.name === selectedName);

  return (
    <section aria-labelledby="design-system-heading" className="design-system">
      <h3 id="design-system-heading">Design system</h3>
      <p className="lede design-system-lede">
        Declared design tokens from Product IR.
      </p>

      {designSystem.status === "invalid" ? (
        <div className="design-system-invalid">
          <h4>Design system (invalid)</h4>
          <p className="status" role="alert">
            {designSystem.message}
          </p>
          <JsonTree value={designSystem.raw} />
        </div>
      ) : null}

      {designSystem.status === "present" && designSystem.themes.length === 0 ? (
        <p className="design-system-empty">No themes in Product IR.</p>
      ) : null}

      {designSystem.status === "present" && designSystem.themes.length > 0 ? (
        <>
          <InvalidThemes themes={designSystem.themes} />
          {themes.length >= 2 ? (
            <ThemeTabs
              tabListId={tabListId}
              themes={themes}
              selectedName={selectedName}
              onSelect={setSelectedName}
            />
          ) : themes.length === 1 ? (
            <p className="design-system-theme-label">
              Theme: <span className="theme-name">{themes[0]?.name}</span>
            </p>
          ) : null}
          {selectedTheme ? (
            <ThemeColorsPanel
              colorsHeadingId={colorsHeadingId}
              isTabPanel={themes.length >= 2}
              theme={selectedTheme}
            />
          ) : themes.length > 0 ? (
            <p className="design-system-empty">
              No valid themes to display colors.
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function ThemeTabs({
  tabListId,
  themes,
  selectedName,
  onSelect,
}: {
  tabListId: string;
  themes: ValidTheme[];
  selectedName: string | undefined;
  onSelect: (name: string) => void;
}) {
  return (
    <div
      aria-label="Product design themes"
      className="theme-tabs"
      role="tablist"
      id={tabListId}
    >
      {themes.map((theme) => {
        const selected = theme.name === selectedName;
        const panelId = `theme-panel-${theme.name}`;
        return (
          <button
            aria-controls={panelId}
            aria-selected={selected}
            className="theme-tab"
            id={`theme-tab-${theme.name}`}
            key={theme.name}
            role="tab"
            type="button"
            onClick={() => {
              onSelect(theme.name);
            }}
          >
            {theme.name}
          </button>
        );
      })}
    </div>
  );
}

function ThemeColorsPanel({
  theme,
  colorsHeadingId,
  isTabPanel,
}: {
  theme: ValidTheme;
  colorsHeadingId: string;
  isTabPanel: boolean;
}) {
  const stats = colorStats(theme);
  const validTokens = validColorTokens(theme);
  const invalidTokens = invalidColorTokens(theme);
  const panelId = `theme-panel-${theme.name}`;

  return (
    <div
      {...(isTabPanel
        ? {
            "aria-labelledby": `theme-tab-${theme.name}`,
            id: panelId,
            role: "tabpanel" as const,
          }
        : {})}
      className="theme-colors-panel"
    >
      <h4 id={colorsHeadingId}>Colors</h4>
      <p className="product-meta color-stats">
        {stats.tokens === 1 ? "1 token" : `${String(stats.tokens)} tokens`} ·{" "}
        {stats.distinct === 1
          ? "1 distinct color"
          : `${String(stats.distinct)} distinct colors`}
      </p>

      {validTokens.length === 0 ? (
        <p className="design-system-empty">No color tokens in this theme.</p>
      ) : (
        <ul aria-labelledby={colorsHeadingId} className="color-palette">
          {validTokens.map((token, index) => (
            <ColorTokenCard
              key={`${token.name}-${String(index)}`}
              theme={theme}
              token={token}
            />
          ))}
        </ul>
      )}

      {invalidTokens.length > 0 ? (
        <section
          aria-labelledby="invalid-colors-heading"
          className="invalid-colors"
        >
          <h5 id="invalid-colors-heading">Colors (invalid)</h5>
          <ul className="invalid-colors-list">
            {invalidTokens.map((item) =>
              item.kind === "invalid" ? (
                <li
                  className="invalid-entry"
                  key={`color-invalid-${String(item.index)}`}
                >
                  <p>Color entry {item.index} is invalid.</p>
                  <JsonTree value={item.raw} />
                </li>
              ) : null,
            )}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ColorTokenCard({
  token,
  theme,
}: {
  token: {
    name: string;
    value: string;
    sourceFile: string;
    hex?: string;
  };
  theme: ValidTheme;
}) {
  const resolved = token.hex !== undefined;
  const duplicateCount =
    resolved && token.hex !== undefined ? hexUsageCount(theme, token.hex) : 0;

  return (
    <li className="color-token">
      <div
        aria-hidden="true"
        className={
          resolved
            ? isAlphaHex(token.hex ?? "")
              ? "color-swatch color-swatch-checkerboard"
              : "color-swatch"
            : "color-swatch color-swatch-unresolved"
        }
      >
        {resolved ? (
          <span
            className="color-swatch-fill"
            style={{ backgroundColor: token.hex }}
          />
        ) : null}
      </div>
      <p className="color-token-name">{token.name}</p>
      {resolved ? (
        <p className="color-token-hex">{token.hex}</p>
      ) : (
        <p className="color-token-unresolved">Unresolved</p>
      )}
      <p className="color-token-value file">{token.value}</p>
      <p className="color-token-file file">{token.sourceFile}</p>
      {duplicateCount > 1 ? (
        <p className="color-token-reuse">
          {duplicateCount === 1
            ? "1 token uses this color"
            : `${String(duplicateCount)} tokens use this color`}
        </p>
      ) : null}
    </li>
  );
}

function InvalidThemes({ themes }: { themes: ThemeItem[] }) {
  const invalid = themes.filter((theme) => theme.kind === "invalid");
  if (invalid.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="invalid-themes-heading"
      className="invalid-themes"
    >
      <h4 id="invalid-themes-heading">Themes (invalid)</h4>
      <ul className="invalid-themes-list">
        {invalid.map((item) =>
          item.kind === "invalid" ? (
            <li
              className="invalid-entry"
              key={`theme-invalid-${String(item.index)}`}
            >
              <p>Theme entry {item.index} is invalid.</p>
              <JsonTree value={item.raw} />
            </li>
          ) : null,
        )}
      </ul>
    </section>
  );
}
