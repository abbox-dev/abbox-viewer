import type { DragEvent } from "react";

type FilePickerProps = {
  onFiles: (files: File[]) => void | Promise<void>;
};

export function FilePicker({ onFiles }: FilePickerProps) {
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    return onFiles([...event.dataTransfer.files]);
  }

  return (
    // The labeled file input is the keyboard control. This region only receives dropped files.
    // biome-ignore lint/a11y/noStaticElementInteractions: pointer drop target beside the file input
    <div
      className="dropzone"
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        void handleDrop(event);
      }}
    >
      <label className="file-label">
        Select file
        <input
          accept=".json,application/json"
          onChange={(event) => {
            const { files } = event.currentTarget;
            event.currentTarget.value = "";
            if (!files || files.length === 0) {
              return;
            }
            void onFiles([...files]);
          }}
          type="file"
        />
      </label>
      <p className="drop-hint">Drop a file here.</p>
    </div>
  );
}
