export const SECTION_IDS = [
  "map",
  "screens",
  "design",
  "navigation",
  "actions",
  "unrecognized",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

const CLOSED_PARAM = "closed";

const knownSectionIds = new Set<string>(SECTION_IDS);

const listeners = new Set<() => void>();
let popstateBound = false;

export function readClosedSections(search: string): Set<SectionId> {
  const value = new URLSearchParams(search).get(CLOSED_PARAM);
  const closed = new Set<SectionId>();
  if (!value) {
    return closed;
  }
  for (const part of value.split(",")) {
    if (knownSectionIds.has(part)) {
      closed.add(part as SectionId);
    }
  }
  return closed;
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function bindPopstate() {
  if (popstateBound) {
    return;
  }
  popstateBound = true;
  window.addEventListener("popstate", notify);
}

export function subscribeToSectionSearch(listener: () => void) {
  bindPopstate();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSectionSearch() {
  return window.location.search;
}

export function writeClosedSections(closed: Set<SectionId>) {
  const url = new URL(window.location.href);
  const ordered = SECTION_IDS.filter((id) => closed.has(id));
  if (ordered.length === 0) {
    url.searchParams.delete(CLOSED_PARAM);
  } else {
    url.searchParams.set(CLOSED_PARAM, ordered.join(","));
  }
  const search = url.searchParams
    .toString()
    .replace(
      /(^|&)closed=([^&]*)/,
      (_match, prefix: string, value: string) =>
        `${prefix}closed=${value.replaceAll("%2C", ",")}`,
    );
  const next = `${url.pathname}${search.length > 0 ? `?${search}` : ""}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) {
    window.history.replaceState(null, "", next);
  }
  notify();
}

export function toggleClosedSection(id: SectionId) {
  const closed = readClosedSections(window.location.search);
  if (closed.has(id)) {
    closed.delete(id);
  } else {
    closed.add(id);
  }
  writeClosedSections(closed);
}
