import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const wc = (t: string) => (t.trim() === "" ? 0 : t.trim().split(/\s+/).length);

// Realistic seed: writing sessions (Scratches) with paragraph-sized snippets.
// The dump carries a live speed/depth → momentum/avoidance thread across its
// paragraphs so the Ranker has something to surface; the rest keep it rare.
// One scratch is left un-split to show the "break into snippets" affordance.
const SCRATCHES: {
  label: string;
  sourceMode: string;
  snippets: { content: string; label: string }[];
}[] = [
  {
    label: "the speed/depth thing, again",
    sourceMode: "dump",
    snippets: [
      {
        label: "everyone says ship faster",
        content:
          "Everyone keeps telling me to ship faster. Publish more often, build the audience, stop polishing, just get it out. And I get it, I really do — the work that sits on my drive isn't doing anything for anyone, least of all me. But every piece I'm actually proud of is one I sat with for weeks, kept circling back to, let get complicated before it ever got clear. So which is it supposed to be. Speed or depth. I keep writing that sentence like the two of them are enemies I have to pick between.",
      },
      {
        label: "maybe the contrast is false",
        content:
          "Rereading that, I don't think I actually believe fast is worse. Some of the only sentences I like came out in a single sitting when I wasn't being precious about them. Fast is usually how I find the thing that's even worth going deep on in the first place — I have to move before I can tell what matters. So maybe the whole speed versus depth framing is just a story I tell myself when I want an excuse, and a fairly lazy one at that.",
      },
      {
        label: "momentum vs avoidance",
        content:
          "Third time coming back to this in a week, so clearly something is here. The real tension isn't speed versus depth at all. It's momentum versus avoidance. There's a depth I choose because an idea genuinely needs the room, and there's a depth I hide inside because finishing means being seen and possibly being wrong in public. From the outside they look identical. But I always know which one I'm actually doing, and usually I know within about five minutes of sitting down.",
      },
    ],
  },
  {
    label: "craft as a hiding place",
    sourceMode: "freewrite",
    snippets: [
      {
        label: "craft as fear in a nice coat",
        content:
          "There's a version of craft that is really just fear wearing a nicer coat. Slowing down, adding one more pass, insisting on getting it right — sometimes that is genuine respect for the work, and sometimes it is plain terror of being seen, dressed up as diligence so it looks respectable. I'd like to be more honest with myself about which one is driving on any given afternoon.",
      },
      {
        label: "the tell is what you're avoiding",
        content:
          "The tell, I think, is whether I'm avoiding one specific hard thing or just fussing in general. Wrestling with the single paragraph that refuses to work is real. Re-kerning the whole thing for the fourth time so I don't have to face that paragraph is avoidance with better production values.",
      },
    ],
  },
  {
    label: "notes on an essay about attention",
    sourceMode: "freewrite",
    snippets: [
      {
        label: "attention as a moral act",
        content:
          "Read a piece arguing that attention is itself a moral act — that what you choose to look at is already an ethical decision, before you lift a finger to do anything about it. Been sitting with that all day and it keeps reframing small things.",
      },
      {
        label: "the weak version feels true",
        content:
          "Not sure I buy the strong version of the claim. But the weak version feels obviously true: the framing you walk in with quietly decides what you even notice is there, and everything after that is downstream of a choice you barely registered making.",
      },
    ],
  },
  {
    label: "friday logistics",
    sourceMode: "quick_capture",
    snippets: [
      {
        label: "dentist, permit, Dana",
        content:
          "Call the dentist about rescheduling, renew the parking permit before it lapses, and email Dana back about the Q3 timeline before Friday so it doesn't slip another week.",
      },
    ],
  },
  {
    label: "river, first cold morning",
    sourceMode: "quick_capture",
    snippets: [
      {
        label: "ran by the river",
        content:
          "Ran by the river this morning, the first genuinely cold day in a while. Didn't think about work the entire time, which honestly felt like the whole point of it. Nothing to report and that is completely fine.",
      },
    ],
  },
  // Left un-split on purpose: shows the "break into snippets" affordance.
  {
    label: "late-night ramble about audience",
    sourceMode: "dump",
    snippets: [],
  },
];

const UNSPLIT_CONTENT =
  "Who am I even writing for. When I picture a reader it's usually one specific person, and the sentences get sharper the second I do that, which probably means the vague 'audience' in my head is useless and I should just write the letter to the one person every time.\n\nBut then the fear creeps in that writing for one person is too small, that it won't travel, and I'm back to performing for a crowd that doesn't exist yet. The crowd makes everything worse. The one person makes everything better. I don't know why I keep forgetting that.";

async function main() {
  const existing = await prisma.scratch.count();
  if (existing > 0) {
    console.log(`Scratches already present (${existing}); skipping seed.`);
    return;
  }

  for (const sc of SCRATCHES) {
    const content =
      sc.snippets.length > 0
        ? sc.snippets.map((s) => s.content).join("\n\n")
        : UNSPLIT_CONTENT;
    const scratch = await prisma.scratch.create({
      data: {
        content,
        label: sc.snippets.length > 0 ? sc.label : null,
        sourceMode: sc.sourceMode,
        wordCount: wc(content),
      },
    });
    if (sc.snippets.length > 0) {
      await prisma.snippet.createMany({
        data: sc.snippets.map((s, i) => ({
          content: s.content,
          label: s.label,
          order: i,
          scratchId: scratch.id,
          sourceMode: sc.sourceMode,
          wordCount: wc(s.content),
        })),
      });
    }
  }
  console.log(`Seeded ${SCRATCHES.length} scratches.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
