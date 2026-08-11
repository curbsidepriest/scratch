import type {
  RankerCandidate,
  RankerEvidence,
  RankerRelevance,
  RankerService,
  RankerSnippet,
} from "./types";

// Deterministic heuristic stub (spec §5). It models the SHAPE and the RARITY of
// the real thing, not real intelligence:
//   - "aliveness" is recurrence + charge + contrast + sharpening, NOT raw
//     topic-frequency (a word appearing a lot in one grocery list scores ~0);
//   - a HIGH threshold means most piles of notes surface nothing, on purpose.
// Swap it for AnthropicRankerService later without touching callers.

const STOPWORDS = new Set([
  "about", "after", "again", "against", "their", "there", "these", "thing",
  "things", "think", "this", "that", "with", "would", "could", "should",
  "from", "have", "here", "just", "keep", "keeps", "like", "more", "much",
  "into", "over", "then", "them", "they", "were", "what", "when", "which",
  "while", "your", "youre", "been", "being", "because", "back", "still",
  "some", "something", "someone", "very", "also", "even", "only", "than",
  "know", "dont", "cant", "wont", "isnt", "time", "times", "come", "coming",
  "came", "goes", "going", "gets", "getting", "make", "made", "want", "need",
  "needs", "work", "works", "each", "other", "others", "down", "onto", "upon",
  // filler / hedge / vague adverbs — not "territory", so keep them out of the
  // salient terms (otherwise realistic prose surfaces "actually" over "depth").
  "actually", "really", "maybe", "perhaps", "probably", "usually", "honestly",
  "genuinely", "obviously", "clearly", "pretty", "quite", "kind", "sort",
  "guess", "mean", "means", "meant", "every", "always", "never", "feels",
  "feel", "felt", "look", "looks", "first", "second", "third", "single",
  "whole", "entire", "versus", "supposed", "possibly", "least", "most",
  "usually", "myself", "again", "around", "along", "sitting", "gets",
]);

// Markers of tension/charge — a thread that pulls against itself is "alive".
const CONTRAST_MARKERS = [
  "but", "vs", "versus", "against", "pulling", "pull", "tension", "contrast",
  "contradict", "isnt", "not because", "instead", "opposite", "false",
];

// Markers of a thought turning / sharpening as it recurs.
const TURN_MARKERS = [
  "actually", "isnt", "tension", "real", "really", "different", "reframe",
  "the point", "turns out", "hide", "avoidance",
];

const PLATITUDES = new Set([
  "good", "better", "best", "nice", "great", "people", "stuff", "everything",
  "nothing", "always", "never", "life", "world",
]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

function hasAny(text: string, markers: string[]): boolean {
  const n = normalize(text);
  return markers.some((m) => n.includes(m));
}

interface Thread {
  term: string;
  snippetIdxs: number[]; // distinct snippets the term recurs in, chronological
  score: number;
}

export class StubRankerService implements RankerService {
  // Tuned so a genuinely recurring, charged thread clears the bar while
  // mundane notes (lists, weather, meeting notes) do not.
  private readonly SURFACE_THRESHOLD = 6;

  // Seed a piece from ONE gem the writer chose (spec §6). Names territory from
  // the seed's own salient language and anchors the evidence on the seed, so the
  // promotion pull-in gathers the gems that share that language. Deterministic
  // stand-in for the real model's read.
  async seedFrom(seed: RankerSnippet): Promise<RankerCandidate> {
    const terms = [...new Set(tokens(seed.content))].filter(
      (t) => !PLATITUDES.has(t),
    );
    const [a, b] = terms;
    let phrase: string;
    let title: string;
    if (a && b) {
      phrase = `You're starting from ${a}, and there's something in how it meets ${b} — follow that.`;
      title = `${a} and ${b}`;
    } else if (a) {
      phrase = `You're starting from ${a}. See where it wants to go.`;
      title = a;
    } else {
      phrase = "You're starting from this line. See what it opens up.";
      title = "a new thread";
    }
    return {
      phrase,
      title,
      evidence: [
        { snippetId: seed.id, observation: "the gem you're building this piece around" },
      ],
    };
  }

  async evaluate(snippets: RankerSnippet[]): Promise<RankerCandidate | null> {
    if (snippets.length < 3) return null;

    // Chronological, so "return" and "sharpening" have a direction.
    const ordered = [...snippets].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    );

    // term -> distinct snippet indices it appears in
    const termToIdxs = new Map<string, Set<number>>();
    ordered.forEach((s, idx) => {
      for (const term of new Set(tokens(s.content))) {
        if (!termToIdxs.has(term)) termToIdxs.set(term, new Set());
        termToIdxs.get(term)!.add(idx);
      }
    });

    const threads: Thread[] = [];
    for (const [term, idxSet] of termToIdxs) {
      if (PLATITUDES.has(term)) continue;
      const idxs = [...idxSet].sort((a, b) => a - b);
      if (idxs.length < 2) continue; // recurrence is the price of entry

      const threadSnippets = idxs.map((i) => ordered[i]);
      const contrastCount = threadSnippets.filter((s) =>
        hasAny(s.content, CONTRAST_MARKERS),
      ).length;
      const latest = threadSnippets[threadSnippets.length - 1];
      const sharpens = hasAny(latest.content, TURN_MARKERS);

      // Aliveness composite — recurrence (return) is necessary but not
      // sufficient; charge/contrast/sharpening are what lift a thread over the
      // bar. A merely frequent-but-flat term stays well below threshold.
      const returnScore = idxs.length; // 2, 3, ...
      const chargeScore = contrastCount * 2;
      const sharpenScore = sharpens ? 2 : 0;
      const score = returnScore + chargeScore + sharpenScore;

      threads.push({ term, snippetIdxs: idxs, score });
    }

    if (threads.length === 0) return null;
    threads.sort((a, b) => b.score - a.score);

    const top = threads[0];
    if (top.score < this.SURFACE_THRESHOLD) return null; // stay quiet

    return this.buildCandidate(top, threads, ordered);
  }

  private buildCandidate(
    top: Thread,
    threads: Thread[],
    ordered: RankerSnippet[],
  ): RankerCandidate {
    // A second recurring term that shares snippets with the top one lets us
    // name a *tension between two things* rather than a single topic.
    const partner = threads
      .slice(1)
      .find((t) => t.snippetIdxs.some((i) => top.snippetIdxs.includes(i)));

    const threadSnips = top.snippetIdxs.map((i) => ordered[i]);
    const contrasts = threadSnips.some((s) =>
      hasAny(s.content, CONTRAST_MARKERS),
    );

    // Territory phrase — always an observation about what the writer keeps
    // doing, never a title. (Every branch contains "you".) The title is the
    // same territory as a tiny folder label, so the Sparks shelf is scannable.
    let phrase: string;
    let title: string;
    if (partner && contrasts) {
      phrase = `There's something here about how you keep setting ${top.term} against ${partner.term}.`;
      title = `${top.term} vs ${partner.term}`;
    } else if (partner) {
      phrase = `You keep circling ${top.term} and ${partner.term} together.`;
      title = `${top.term} and ${partner.term}`;
    } else if (contrasts) {
      phrase = `You keep pulling at ${top.term} from opposite sides.`;
      title = top.term;
    } else {
      phrase = `You keep coming back to ${top.term}, and it keeps shifting.`;
      title = top.term;
    }

    // Evidence — 1..3 observations, each pointing at a specific snippet, no
    // quality judgements.
    const evidence: RankerEvidence[] = [];
    const used = new Set<string>();
    const push = (snippetId: string, observation: string) => {
      if (evidence.length >= 3 || used.has(snippetId)) return;
      used.add(snippetId);
      evidence.push({ snippetId, observation });
    };

    // Return: latest occurrence, note how many times it recurred.
    const latest = threadSnips[threadSnips.length - 1];
    push(
      latest.id,
      `You've come back to this ${threadSnips.length} times — it keeps resurfacing.`,
    );

    // Contrast: a snippet that pulls against the others.
    const contrastSnip = threadSnips.find((s) =>
      hasAny(s.content, CONTRAST_MARKERS),
    );
    if (contrastSnip) {
      push(contrastSnip.id, "This one pulls against the others.");
    }

    // Origin: where the thread starts.
    const first = threadSnips[0];
    push(first.id, "This is where the thread first shows up.");

    return { phrase, title, evidence };
  }

  // Relevance for the promotion pull-in (spec §6). Anchored on the snippets the
  // spark pointed at: a snippet is suggested if it shares enough salient
  // language with that anchor. Stubbed and deliberately simple — the user
  // curates the final set, so over/under-inclusion is cheap.
  async rankRelevance(
    anchorSnippetIds: string[],
    snippets: RankerSnippet[],
  ): Promise<RankerRelevance[]> {
    const anchors = new Set(anchorSnippetIds);
    const anchorTerms = new Set<string>();
    for (const s of snippets) {
      if (anchors.has(s.id)) {
        for (const t of tokens(s.content)) anchorTerms.add(t);
      }
    }

    return snippets.map((s) => {
      if (anchors.has(s.id)) {
        return {
          snippetId: s.id,
          suggested: true,
          reason: "the spark pointed here",
        };
      }
      const shared = new Set(
        tokens(s.content).filter((t) => anchorTerms.has(t)),
      );
      // Two shared salient terms is a meaningful echo; one is likely noise.
      const suggested = shared.size >= 2;
      return {
        snippetId: s.id,
        suggested,
        reason: suggested
          ? `shares language with the thread (${[...shared].slice(0, 3).join(", ")})`
          : "doesn't obviously relate",
      };
    });
  }
}
