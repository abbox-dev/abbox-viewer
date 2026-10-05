import { afterEach, describe, expect, it } from "vitest";
import {
  readClosedSections,
  writeClosedSections,
} from "../src/sections/collapsedSections";

describe("collapsed sections", () => {
  afterEach(() => {
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("stores closed sections in a stable url order and drops unknown ids", () => {
    window.history.replaceState(null, "", "?closed=nope,screens,design");
    const closed = readClosedSections(window.location.search);
    expect([...closed]).toEqual(["screens", "design"]);

    closed.add("map");
    writeClosedSections(closed);
    expect(window.location.search).toBe("?closed=map,screens,design");

    closed.clear();
    writeClosedSections(closed);
    expect(window.location.search).toBe("");
  });

  it("keeps unrelated query parameters", () => {
    window.history.replaceState(null, "", "?foo=1");
    writeClosedSections(new Set(["screens"]));
    expect(window.location.search).toBe("?foo=1&closed=screens");
  });
});
