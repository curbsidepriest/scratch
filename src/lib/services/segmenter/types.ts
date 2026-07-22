// The Segmenter — turns a raw Scratch into paragraph-sized snippets the user
// can work with (spec §3, and the dump ritual §4). Two operations, both on the
// safe side of §9.1:
//   - split: find natural paragraph boundaries in the user's OWN words
//     (extraction, never generation);
//   - label: a short DESCRIPTIVE, non-poetic handle for each paragraph so it's
//     skimmable — metadata to grab it by, never prose to paste.
// The user always reviews the suggested split before it becomes snippets.

export interface SegmentedSnippet {
  content: string; // verbatim slice of the scratch
  label: string; // few descriptive words: what's in this paragraph
}

export interface SegmentResult {
  scratchLabel: string; // a descriptive handle for the whole session
  snippets: SegmentedSnippet[];
}

export interface SegmenterService {
  segment(text: string): Promise<SegmentResult>;
}
