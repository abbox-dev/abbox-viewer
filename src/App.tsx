import { useState } from "react";
import { FilePicker } from "./components/FilePicker";
import { ProductView } from "./components/ProductView";
import { interpret } from "./ir/interpret";
import type { InterpretResult } from "./ir/types";

type InterpretedResult = Exclude<InterpretResult, { kind: "unreadable" }>;

type ViewerState =
  | { status: "idle" }
  | { status: "unreadable"; fileName: string; message: string }
  | { status: "result"; fileName: string; result: InterpretedResult };

export function App() {
  const [state, setState] = useState<ViewerState>({ status: "idle" });

  async function loadFile(file: File) {
    let text: string;
    try {
      text = await file.text();
    } catch {
      setState({
        status: "unreadable",
        fileName: file.name,
        message: "This file could not be read.",
      });
      return;
    }

    const result = interpret(text);
    if (!result.ok && result.kind === "unreadable") {
      setState({
        status: "unreadable",
        fileName: file.name,
        message: result.message,
      });
      return;
    }

    setState({ status: "result", fileName: file.name, result });
  }

  function handleFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }
    if (files.length > 1) {
      setState({
        status: "unreadable",
        fileName: "",
        message: "Select one abbox.json file.",
      });
      return;
    }
    const file = files[0];
    if (!file) {
      return;
    }
    return loadFile(file);
  }

  return (
    <main>
      <header>
        <h1>Abbox Viewer</h1>
        <p className="lede">
          Visualize one abbox.json snapshot. The file stays in this browser.
        </p>
      </header>
      <FilePicker onFiles={handleFiles} />
      {state.status !== "idle" ? (
        <div className="toolbar">
          <button onClick={() => setState({ status: "idle" })} type="button">
            Reset
          </button>
        </div>
      ) : null}
      {state.status === "unreadable" ? (
        <section className="product">
          {state.fileName ? (
            <p className="file-name">{state.fileName}</p>
          ) : null}
          <p className="status" role="alert">
            {state.message}
          </p>
        </section>
      ) : null}
      {state.status === "result" ? (
        <ProductView fileName={state.fileName} result={state.result} />
      ) : null}
    </main>
  );
}
