import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/user/update-password")({
  beforeLoad: () => {
    throw redirect({ to: "/profile" });
  },
  component: () => null,
});
