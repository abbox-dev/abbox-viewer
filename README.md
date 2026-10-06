# Abbox Viewer

Abbox Viewer is the open-source reference visualizer for `abbox.json`.

It answers one question: what does this `abbox.json` describe?

Open a Product IR file in the browser. The file is parsed locally. It is not uploaded, stored, or sent to a server. No account is required.

The official site will be [viewer.abbox.com](https://viewer.abbox.com).

Abbox Viewer shows one Product IR snapshot. It is not the [Abbox compiler](https://github.com/abbox-dev/abbox), and it does not include Abbox Cloud.

## What the Viewer recognizes

`screens` is required. A valid screen has a string `route` and a string `source.file`. Those values are shown as written. Routes are not sorted, deduplicated, or turned into a hierarchy.

An empty `screens` array is a valid snapshot with zero screens. A JSON object without `screens`, including `{}`, is not a valid current Product IR.

`navigation` is optional. When present, it must be an array. A valid navigation entry is an object with string `from` and string `to` where both routes exactly match a valid screen `route`. Valid edges are shown under each screen as outgoing navigation. The product summary shows a connection count when `navigation` is present. An empty `navigation` array means zero discovered connections. When the `navigation` key is absent, the Viewer does not show connection counts or per-screen navigation copy.

`schemaVersion` is recognized only when it is the string `"1"`, shown as Product IR v1. Other `schemaVersion` values are preserved as unrecognized data.

Additional fields are preserved and shown as unrecognized data. That includes extra top-level fields and extra fields on a valid screen, its `source` object, or a valid navigation entry.

Malformed `screens` data is labeled invalid and is not rewritten into a valid shape. Valid screens beside an invalid entry still render. The raw invalid value stays inspectable.

Malformed `navigation` data (including entries whose routes are not on a valid screen) is labeled invalid and stays inspectable. Valid navigation entries beside invalid ones still render in the screen list.

When the `navigation` or `globalNavigation` key is present, a **Product map** section appears above Explore, Main navigation, and Screens. When there is at least one valid screen, an **Explore** section lets you pick a start screen and step through declared **Connection** and **Main navigation** transitions only (no inferred flows). Explore shows actions for the current screen in the trail. When there are zero valid screens, Explore is not shown. **Connections** on the map are screen-to-screen edges from `navigation[]` only. The map does not expand main navigation into edges from every screen. When `globalNavigation` is recognized, matching screen nodes show a **Main nav** marker for destinations available through persistent application navigation. Screens with no incoming or outgoing valid navigation edges appear under **No discovered connections**. The map does not infer links. When both keys are absent, no Product map is shown. For very large snapshots (many screens or connections), the map is replaced by a short text summary; the Main navigation section and Screens list remain the detailed view. A textual **Connections (discovered)** list accompanies the map for accessibility.

`globalNavigation` is optional. When present, it must be an array. A valid entry has string `to` (matching a valid screen route) and object `source` with string `source.file`. The product summary shows a count of valid main navigation destinations when the key is present (`0 main navigation destinations` when the array is empty). When `globalNavigation` is absent, no main navigation summary or section is shown. A **Main navigation** section lists destination routes in Product IR order; shared `source.file` values may appear once at section level. Main navigation is not repeated on every screen card or as connections from every screen.

Malformed `globalNavigation` data is labeled **Main navigation (invalid)** and stays inspectable. Valid entries beside invalid ones still render in the main section and on the Product map. Extra fields on an entry or its `source` are unrecognized data.

`designSystem` is optional. When present, it must be an object with a `themes` array. A valid theme has a string `name` and a `colors` array. A valid color token has string `name`, string `value`, and string `source.file`. The compiler may attach optional canonical `hex` (`#RRGGBB` or `#RRGGBBAA`). The Viewer uses that hex for swatches and does not convert or recalculate colors. Tokens without `hex` are valid but unresolved (for example `var(--token)` in a theme the compiler could not statically resolve).

When `designSystem` is recognized, a **Design system** section appears after Screens. The **Colors** subsection shows a responsive palette for one product theme at a time. Use the theme control to switch between themes such as `default` and `dark`. That control inspects product design tokens; it does not change the Viewer application theme. Each color shows a swatch (with a transparency checkerboard when alpha hex is present), semantic name, and hex or **Unresolved**. The summary line reports valid token count and distinct resolved colors (exact hex equality) for the selected theme. Color similarity and design drift across versions are not analyzed yet.

Malformed `designSystem` data is labeled invalid and stays inspectable. Valid themes and colors beside invalid entries still render. Extra fields on `designSystem`, themes, colors, or `source` are preserved as unrecognized data.

`actions` is optional. When present, it must be an array. A valid action has string `route`, `kind` of `"invoke"` or `"submit"`, and string `source.file`. Optional string `label` is shown when provided (including unusual compiler output). The route must exactly match a valid screen route. Valid actions appear under that screen in Product IR order as compact rows: primary label (or neutral fallbacks **Unlabeled action** / **Submit form** when `label` is absent or empty) and secondary **Invoke** or **Submit**. The Viewer does not know what happens after an action—no effects, API calls, mutations, destinations, or flows are inferred. When the `actions` key is present, the product summary shows a count of valid actions (`0 Actions` when the array is empty). When `actions` is absent, no action count or per-screen actions UI is shown. Duplicate actions are preserved. Extra fields on an action or its `source` are unrecognized data.

Malformed `actions` data is labeled invalid and stays inspectable. Valid actions beside invalid entries still render under screens.

`entities` is optional. When present, it must be an array. A valid entity has string `name`, array `fields`, and object `source` with string `source.file`. A valid field has string `name`. Optional boolean `optional` is shown as **Optional** only when `optional` is `true`; when `optional` is absent or `false`, no marker is shown. The Viewer does not infer types for fields. When the `entities` key is present, the product summary shows a count of valid entities (`0 Entities` when the array is empty). When `entities` is absent, no entity count or Entities section is shown. Valid entities appear in an **Entities** section between Main navigation and Screens: entity name, valid field count, `source.file`, and a compact field list. Document order is preserved.

Malformed `entities` container data is labeled **Entities (invalid)** and stays inspectable; no entity summary count or normal Entities section is shown. Malformed entity entries appear in **Entities (invalid)**; valid sibling entities still render. Malformed field entries on an otherwise valid entity appear under that entity as **Fields (invalid)** and are not duplicated in the global invalid section. Extra fields on an entity, its `source`, or a field are unrecognized data.

A file is accepted for its JSON and Product IR content. The `.json` extension is only a file-picker hint.

`examples/abbox.json` is a sample snapshot with screens, navigation, global navigation, entities, a trimmed design system, and sample actions.

## Development

Node.js `>=22.12` is required.

```bash
npm ci
npm run typecheck
npm test
npm run lint
npm run build
```

`npm run build` writes a static site to `dist/`. There is no server in this repository.

## License

Apache License 2.0. See [LICENSE](LICENSE).

Copyright © 2026 Kamran Elchuzade.
