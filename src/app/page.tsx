import { auth } from "@clerk/nextjs/server";
import { Scratchpad } from "@/components/Scratchpad";
import { Landing } from "@/components/Landing";

// Home is public. Signed-out visitors see the Landing page (with sign-in /
// get-started right there); signed-in users get the Scratchpad — opening the
// app means opening the Scratchpad, cursor ready (spec §3).
export default async function Home() {
  const { userId } = await auth();
  if (!userId) return <Landing />;
  return <Scratchpad />;
}
