import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Owlert",
    short_name: "Owlert",
    description:
      "Owlert helps you track weather updates, advisories, and class suspension announcements from trusted sources.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f1b33",
    theme_color: "#0f1b33",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
