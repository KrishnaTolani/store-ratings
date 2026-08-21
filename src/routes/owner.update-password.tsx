import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/owner/update-password")({
  beforeLoad: () => {
    throw redirect({ to: "/profile" });
  },
  component: () => null,
});
