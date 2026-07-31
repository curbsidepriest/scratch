import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// "/" is public: signed-out visitors see the Landing page, signed-in users get
// the Scratchpad (the page itself branches on auth).
const isPublic = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);
const isApi = createRouteMatcher(["/api(.*)"]);

// Pages redirect to sign-in when logged out. API routes self-guard with
// currentUserId() so they return clean 401 JSON instead of a redirect.
export default clerkMiddleware(async (auth, req) => {
  if (isApi(req)) return;
  if (!isPublic(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next internals and static files, run on everything else.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|woff2?|ttf|map)).*)",
    "/(api|trpc)(.*)",
  ],
};
