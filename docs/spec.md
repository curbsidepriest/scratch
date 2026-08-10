# Product Spec — Working title: **Scratch**
### A writing tool that helps you think, and never writes for you

---

## 0. Read this first (philosophy — do not skip)

This is not an AI writing assistant. The single hardest constraint in the entire
product is: **the system NEVER generates prose the user could paste into their
work.** It does not draft, suggest copy, rewrite sentences, or autocomplete. It
organizes, reflects, diagnoses, and points, always leaving the actual writing to
the human.

If you (the implementer) are ever unsure whether a feature crosses this line, it
crosses the line. Build it to fall on the "help the human think" side.

The product's job is to move a person from *blank-page dread* to *finished prose*
by scaffolding the process, while nudging them back toward doing their own
thinking. Every design decision serves that.

---

## 1. The core mental model

There is **one permanent writing surface: the Scratchpad.** It is the home screen
and the default action. Opening the app means opening the Scratchpad. The user
writes freely into it forever; it is low-stakes, singular, and never asks the user
to name or commit to anything.

Everything the user ever writes is saved verbatim as a **Scratch** — a dated raw
writing session that is never lost and is always browsable. A **Snippet** is
something narrower: a *gem* extracted from a scratch — a sharp line, a novel
framing, a clean inversion, a real compression. Snippets are the curated library;
scratches are the full archive. Most of what you write stays in the scratch and
never becomes a snippet, and that is correct: the snippet library must be a
genuine collection of good atomic ideas, not a comprehensive catalogue of every
thought. Extraction is deliberately **conservative** — when in doubt, leave it
out. Nothing is lost either way, because the whole session remains in its scratch.

A background process (the **Ranker**, a.k.a. the "spark") quietly reads the
accumulating snippets (the gems, not the raw scratches) and, *rarely*, surfaces a
**Through-line**: a candidate idea worth developing. It is deliberately quiet —
see §5.

When the user adopts a through-line (or defines their own), it spawns a
**Project**. The project pulls in relevant snippets (shared, never moved — see
§6) and gives the user structured modes to develop the piece.

Snippets are a shared substrate. Projects are *lenses* onto that substrate.
Nothing is ever consumed or destroyed.

```
                 ┌─────────────────────────────────────────┐
                 │             SCRATCHPAD                    │
                 │   (permanent home, all snippets live here)│
                 │                                           │
                 │   snippet · snippet · snippet · snippet   │
                 └───────────────┬───────────────────────────┘
                                 │  Ranker reads continuously,
                                 │  surfaces a through-line RARELY
                                 ▼
                       ┌───────────────────┐
                       │   THROUGH-LINE     │  ← the "spark"
                       │  (candidate idea)  │     user adopts, or writes own
                       └─────────┬─────────┘
                                 │  PROMOTE  (the key moment in v1)
                                 ▼
                 ┌─────────────────────────────────────────┐
                 │              PROJECT                      │
                 │  pulls in relevant snippets (shared refs) │
                 │  modes: Filter · Architect · Editor       │
                 └───────────────────────────────────────────┘
```

---

## 2. Scope of v1 (what we are building now)

**Goal of v1: nail the flows, not the intelligence.** All LLM parts are stubbed
behind a clean interface so a real API key can be dropped in later without
touching UI or flow code.

### The moment that MUST feel great in v1
1. **The Ranker/spark surfacing a through-line**, and
2. **The promotion of that through-line into a Project** (pulling in snippets).

Everything else can be rough but must exist and be navigable.

### In scope for v1
- Scratchpad (persistent, the home surface)
- Free writing into snippets
- **Timed Dump mode** (20-min sprint, no-backspace) — see §4
- The Ranker as a **stubbed** service that returns through-lines with *evidence*
- The **promotion flow**: through-line → Project, with snippet pull-in
- Project shell with the three modes present (Filter / Architect / Editor),
  Filter and Architect functional at a basic level, Editor's linter stubbed
- Persistent snippet bank accessible from anywhere
- Proper backend + database (see §7)

### Explicitly OUT of scope for v1
- Real LLM calls (stub everything; interface must be ready)
- Auth / multi-user / accounts (single user (me) is fine for now)
- Book/long-form nesting (design data model so it's *not foreclosed* — see §9)
- Collaboration, sharing, export polish, mobile
- Gamification beyond the timer (NO points/streaks — see §4)

---

## 3. The Scratchpad (home surface)

- Default screen on app open. The primary action is simply **write**. There is no
  prominent "New Document" button; the cursor is ready in the writing surface.
- Text is captured as a **Scratch** — the raw session, saved verbatim (see §7
  schema). Scratches are always preserved and browsable, dated, in reverse-
  chronological order. This is the archive of everything you have written.
- **Snippets are gems extracted from a scratch**, not a partition of it. After a
  session, the Segmenter proposes 0..N gems — verbatim slices worth keeping on
  their own (a sharp line, a framing, an inversion, a compression). Returning
  **zero is expected and common**; a rambling warm-up may yield nothing, a dense
  session may yield a few. Extraction is conservative on purpose so the snippet
  library stays a real library of good ideas rather than noise to navigate.
- The user always **reviews** the proposed gems before they land: reject an over-
  eager pick, rescue a passage the segmenter missed, fix a label. It will not be
  perfect, and it does not have to be — nothing is ever lost, because the full
  session stays in its scratch.
- **Two surfaces, kept separate:** the raw sessions (dated scratches) are
  browsable on their own, and the gems (snippets) have their own library view.
  Only the gems feed the spark.
- **Quick-capture from anywhere:** from any mode or project, the user can drop a
  new thought that lands in the Scratchpad. The *generative* act (dumping) is
  always available everywhere; the *organizing* acts (filter/architect/edit) are
  deliberate mode switches. Let generation leak freely; gate organization.
- No naming, no topic, no commitment is ever required to write.

---

## 4. Timed Dump mode

The ritual that fills the Scratchpad. A focused sprint.

- User starts a dump; default **20 minutes** (configurable duration).
- **Backspace/delete is disabled** during the sprint. No editing. Forward only.
- Minimal, distraction-free surface: just the text and an unobtrusive countdown.
- When the timer ends, the session's text is committed to the Scratchpad as
  snippet(s).
- **The timer and the disabled backspace ARE the whole game.** Do NOT add points,
  streaks, badges, XP, confetti, or any other gamification. That would cheapen it.
  Restraint is the aesthetic.
- Optional: a soft word-count tick is fine; keep it quiet.

---

## 5. The Ranker (the "spark") — heart of the product

A background process that reads accumulated snippets — the curated gems, never the
raw scratches — and *occasionally* surfaces a **through-line**: something worth
writing about, defined loosely enough that the user still owns the thesis. Feeding
it gems rather than every paragraph is what keeps the spark signal high.

### Behavioral requirements (these define the feel — get them right)
- **It is quiet by default.** Most of the time there is no spark, and that is
  correct and fine. Sometimes it's just a pile of notes. The spark is **rare and
  meaningful** — scarcity is what gives it weight and creates urgency to act.
- **It names territory, not a destination.** Good: "There's something here about
  how you keep contrasting speed and depth." Forbidden: producing a headline,
  title, thesis statement, or anything resembling finished framing. If output
  looks like a Substack title, it is WRONG.
- **It points at the user's own words as evidence, never editorializes on
  quality.** Good: "You came back to this three times and it got sharper each
  time." / "This contradicts something you wrote Tuesday." Forbidden: "This is a
  profound insight," flattery, or imposing the model's taste.
- **Ranking axes are *aliveness* and *originality*** (recurrence, charge, return,
  contrast, non-platitude), NOT topic-frequency. The stub should model this shape.
- **Always show WHY** a through-line surfaced (the evidence/observable facts about
  the user's own writing) — never a bare score. Reflect evidence; let the user
  draw the conclusion.
- The user can **always promote their own through-line manually** regardless of
  what the Ranker says.

### v1 stub behavior
Implement `RankerService` behind an interface. The stub:
- Accepts a set of snippets, returns 0..1 through-line candidate(s) most of the
  time returning **0** (to honor the quietness).
- Each returned through-line has: a short territory-naming phrase (NOT a title),
  and 1–3 **evidence items** referencing specific snippet IDs with an
  observation string (e.g. "returned to this 3×", "contrasts with snippet X").
- Deterministic/simple heuristics are fine for the stub (e.g. keyword recurrence
  across snippets → fake "aliveness"), as long as the *output shape* and the
  *rarity* match the real intended behavior. The point is to build the flow and
  the feel of scarcity.
- Interface must be trivially swappable for a real Anthropic API call later.
  Isolate all prompt/response logic in one module. (When wired for real, the
  system prompt is where the "friend, not author" voice gets calibrated — leave a
  clear TODO and a `SYSTEM_PROMPT` placeholder constant.)

---

## 6. Promotion → Project (the second must-feel-great moment)

A through-line can arrive three ways, all landing in the same promotion flow: a
**Ranker spark** (§5), a **blank-slate phrase** the writer types, or a
**gem-seeded** start — the writer picks one gem from the library and the Ranker
derives the territory from it, anchoring the new through-line's evidence on that
gem so the pull-in gathers the gems that belong with it. The gem-seeded path is a
deliberate, writer-initiated way to turn a single good line into a piece.

When a through-line is adopted:
1. Create a **Project** carrying the through-line phrase.
2. **Pull in relevant snippets** from the Scratchpad. In v1 the relevance ranking
   is stubbed (RankerService returns snippet IDs ranked by fake relevance); the
   user curates the final set (keep / drop from the suggested pull-in).
3. **Snippets are SHARED, not moved.** A snippet pulled into a project still lives
   in the Scratchpad and can feed a second project later. Model this as references
   (join table), never as a move/delete. This is the generalization of
   "demote-to-bank instead of delete": nothing is ever destroyed, which keeps the
   emotional cost of every action near zero.
4. Land the user in the Project with its snippets available in a persistent
   **bank** sidebar.

The promotion animation/transition should feel meaningful — this is the moment
scattered thought becomes a piece. Make it a deliberate, satisfying transition,
not an instant page-swap.

---

## 7. Persistence & backend

Do it properly even though it's single-user for now.

- **Backend:** pick a clean, conventional stack (implementer's choice; suggest
  something simple and well-supported, e.g. a Node/TypeScript API + SQLite/Postgres,
  or Python + SQLite — optimize for "correct and simple to run locally").
- **DB, not localStorage.** Real schema, real migrations.
- All LLM interaction goes through a service layer with a stub implementation and
  an interface ready for a real key.

### Data model (minimum)
- **Snippet**: `id`, `content`, `created_at`, `source_mode` (dump | freewrite |
  quick_capture), `word_count`. Lives globally in the Scratchpad.
- **Throughline**: `id`, `phrase` (territory, NOT a title), `origin` (ranker |
  user), `created_at`, `status` (surfaced | dismissed | promoted), and a set of
  **evidence** items (each: referenced `snippet_id` + `observation` text).
- **Project**: `id`, `throughline_id`, `title` (user-set, optional, deferred),
  `created_at`.
- **ProjectSnippet** (join, shared reference): `project_id`, `snippet_id`,
  `included` (bool, user-curated). NEVER move/delete the underlying snippet.
- **Block** (Architect, see §8): `id`, `project_id`, `label`, `body` (nullable),
  `order`, `parent_block_id` (nullable — for future nesting), `kind`
  (placeholder | filled). Blocks may reference snippets that fill them.
- **LintFlag** (Editor, stubbed): `id`, `project_id`, `block_id` (nullable),
  `range`, `reason`, `status` (open | acknowledged | resolved).

---

## 8. The Project modes (present in v1; depth varies)

These are **modes (postures), not stages.** They are non-linear: the user enters
any of them from anywhere and leaves freely. Do not force sequence or completion.
The snippet bank, the block skeleton, and the full text are ALL always available;
the user chooses where to work.

### 8a. Filter (functional in v1)
- Show the project's snippets.
- Show candidate through-lines (from stub) and let the user pick/override with
  their own.
- **Color-code snippets** by how they relate to the chosen through-line
  (relates / doesn't / unsure).
- Killing darlings without pain: a snippet that doesn't serve the through-line is
  **demoted to the bank (benched), NOT deleted.** Framing in UI must be "move to
  bank / not now," never "delete." It may start the next essay.
- User can override any suggestion and force-keep a snippet.

### 8b. Architect (functional in v1)
- The "shape and flow, not words" view. The user is an architect here.
- **Blocks** the user can create, label, reorder (drag & drop).
- A block is a **placeholder** like "intro with anecdote from university" or
  "core thesis, short paragraph" or "Argument 1: xyz". Double-click / click to
  expand and fill.
- Blocks can be **prefilled by dragging in snippets** from the bank.
- The LLM (stubbed) may flag **gaps** ("no example here", "claim needs support")
  — surface only, never fills them.
- Keep the **block abstraction recursive from day one** (`parent_block_id`) so a
  block can later contain sub-blocks (chapters/parts for books). Don't build the
  book UI; just don't foreclose it in the model.

### 8c. Editor (linter stubbed in v1)
- Where the user crafts actual sentences: connecting, cleaning, sharpening.
- Works like a **semantic linter, NOT a chatbot.** Inline flags such as "this
  paragraph is unclear because X", "you postulate this without support", "this
  connective doesn't follow."
- The ONLY actions on a flag are: **fix it yourself** or **acknowledge & dismiss**
  (it disappears). The tool never nags, never insists, never supplies the fix.
- It must **stay quiet until there's enough text to react to** — no flagging
  half-sentences. A linter firing on a fragment is demoralizing.
- Re-run behavior: re-evaluate on edit, but do NOT re-raise a flag the user
  explicitly acknowledged unless the underlying text materially changed.
- v1: stub the flags (interface ready), but build the inline-flag UI and the
  two-action interaction for real, since the interaction *is* the product here.

---

## 9. Non-negotiable invariants (restate for the implementer)

1. **Never generate prose the user could paste.** No drafting, no copy
   suggestions, no autocomplete, no rewrites — in any mode, ever.
2. **Nothing is destroyed.** Snippets are shared references; "removing" is always
   "move to bank." No hard deletes of user writing in v1.
3. **The spark is rare.** The Ranker returns nothing most of the time, on purpose.
4. **Surface, don't decide.** Ranker and linter both show *evidence/observations*
   about the user's own text and let the user draw conclusions. No scores-as-verdicts,
   no quality praise, no imposed taste.
5. **Modes are porous.** Generation (dump/quick-capture) is available everywhere;
   organization is a deliberate mode switch. Never a straitjacket.
6. **All LLM logic behind one swappable service interface**, stubbed now, real key
   later, with a `SYSTEM_PROMPT` placeholder for the friend-not-author voice.

---

## 10. Suggested build order for Claude Code

1. Backend + DB schema + migrations (§7). Seed with a handful of fake snippets.
2. Scratchpad home surface: write, list snippets, persist (§3).
3. Timed Dump mode: timer + disabled backspace + commit to Scratchpad (§4).
4. `RankerService` stub with the right output shape and built-in rarity (§5).
5. **The spark UI**: quietly surface a through-line with evidence when one exists.
   Make it feel special and rare. *(must-feel-great #1)*
6. **Promotion flow**: through-line → Project, stubbed snippet pull-in, user
   curation, shared-reference model, satisfying transition. *(must-feel-great #2)*
7. Project shell with the three modes as tabs/layers, bank sidebar always present.
8. Filter mode functional (color-coding, demote-to-bank).
9. Architect mode functional (blocks, drag/drop, fill-from-snippet, recursive model).
10. Editor mode: real inline-flag UI + two-action interaction, flags stubbed.

Get 1–6 genuinely good before polishing 7–10.

---

## 11. A note on voice (for when the LLM is wired for real, later)

The Ranker's voice target: a good writing-group peer or a friend who says "bro,
this is interesting — and here's what *it* might be" **without** pre-deciding your
title or removing your sense of authorship. Visibly interested, points at what's
alive, asks a question rather than delivering a verdict, assumes the writing is
*yours* to figure out. Withholds judgment on quality while conveying genuine
interest. Has the confidence to be quiet. This calibration is the highest-leverage,
highest-risk work in the whole product and should be prototyped against real
freewriting before trusting it — but that's a later phase. For v1, just leave the
seam clean.
