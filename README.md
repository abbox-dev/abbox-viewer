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

When the `navigation` key is present, a **Product map** section appears above the Screens list. It shows valid screen routes and discovered connections as a simple row-based map with directed edges. Screens with no incoming or outgoing valid navigation appear under **No discovered connections**. The map does not infer links. When `navigation` is absent, no Product map is shown. For very large snapshots (many screens or connections), the map is replaced by a short text summary; the Screens list remains the detailed view. A textual **Connections (discovered)** list accompanies the map for accessibility.

A file is accepted for its JSON and Product IR content. The `.json` extension is only a file-picker hint.

`examples/abbox.json` is a sample snapshot with screens and navigation.

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
