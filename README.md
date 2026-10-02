# Abbox Viewer

Abbox Viewer is the open-source reference visualizer for `abbox.json`.

It answers one question: what does this `abbox.json` describe?

Open a Product IR file in the browser. The file is parsed locally. It is not uploaded, stored, or sent to a server. No account is required.

The official site will be [viewer.abbox.com](https://viewer.abbox.com).

Abbox Viewer shows one Product IR snapshot. It is not the [Abbox compiler](https://github.com/abbox-dev/abbox), and it does not include Abbox Cloud.

## What v0 recognizes

`screens` is required. A valid screen has a string `route` and a string `source.file`. Those values are shown as written. Routes are not sorted, deduplicated, or turned into a hierarchy.

An empty `screens` array is a valid snapshot with zero screens. A JSON object without `screens`, including `{}`, is not a valid current Product IR.

Additional fields are preserved and shown as unrecognized data. That includes extra top-level fields and extra fields on a valid screen or its `source` object. `schemaVersion` is not part of the current Product IR. If it appears, it is shown like any other unknown field.

Malformed `screens` data is labeled invalid and is not rewritten into a valid shape. Valid screens beside an invalid entry still render. The raw invalid value stays inspectable.

A file is accepted for its JSON and Product IR content. The `.json` extension is only a file-picker hint.

`examples/abbox.json` is a sample snapshot.

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
