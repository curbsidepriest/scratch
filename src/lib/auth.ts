import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/** The current Clerk user id, or null if not signed in. */
export async function currentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/** Standard 401 for API routes when there's no signed-in user. */
export function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
