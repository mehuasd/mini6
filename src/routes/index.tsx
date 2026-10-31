import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Renewal Radar — Track every renewal" },
      { name: "description", content: "Manage subscriptions, policies, warranties and renewal dates in one place." },
      { property: "og:title", content: "Renewal Radar — Track every renewal" },
      { property: "og:description", content: "Manage subscriptions, policies, warranties and renewal dates in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/landing.html");
  }, []);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      <a href="/landing.html">Opening Renewal Radar…</a>
    </div>
  );
}
