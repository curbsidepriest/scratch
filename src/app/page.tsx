import { Scratchpad } from "@/components/Scratchpad";

// The Scratchpad is the home screen and the default action (spec §3):
// opening the app means opening the Scratchpad, cursor ready.
export default function Home() {
  return <Scratchpad />;
}
