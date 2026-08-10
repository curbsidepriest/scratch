import type { MetadataRoute } from "next";

// Web app manifest — so "Install app" / "Create shortcut" (Chrome desktop app
// from a tab) picks up the high-resolution PNG icons instead of upscaling a
// small favicon, giving a crisp dock icon. Next auto-serves this at
// /manifest.webmanifest and links it in <head>.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Scratch",
    short_name: "Scratch",
    description: "A writing tool that helps you think, and never writes for you.",
    start_url: "/",
    display: "standalone",
    background_color: "#1c1917",
    theme_color: "#1c1917",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
