import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, MessageSquare, Star } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { RatingStars } from "@/components/RatingStars";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { ownerService } from "@/services/ownerService";
import type { OwnerDashboard } from "@/types";
import { cn } from "@/lib/utils";

type Rater = OwnerDashboard["raters"][number];
type SortKey = "name" | "email" | "value" | "createdAt";
type SortDir = "asc" | "desc";

export const Route = createFileRoute("/owner/dashboard")({
  head: () => ({
    meta: [
      { title: "Owner dashboard — Store Ratings" },
      { name: "description", content: "See your store average rating and who rated you." },
      { property: "og:title", content: "Owner dashboard — Store Ratings" },
      { property: "og:description", content: "Track ratings submitted for your store." },
    ],
  }),
  component: () => (
    <ProtectedRoute role="OWNER">
      <OwnerDashboardPage />
    </ProtectedRoute>
  ),
});

function OwnerDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["owner", "dashboard", user?.id],
    queryFn: () => ownerService.getDashboard(user!.id),
    enabled: Boolean(user?.id),
  });

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "createdAt", dir: "desc" });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );

  const sorted = [...(data?.raters ?? [])].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    const res =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });
    return sort.dir === "asc" ? res : -res;
  });

  return (
    <>
      <PageHeader
        title="Store dashboard"
        description={data?.store ? `Ratings for ${data.store.name}.` : "Overview of ratings submitted for your store."}
      />

      {/* Average rating card */}
      <div className="surface-card mb-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Average rating</p>
            {isLoading ? (
              <Skeleton className="mt-3 h-10 w-24" />
            ) : (
              <p className="mt-2 text-4xl font-extrabold tracking-tight">
                {(data?.averageRating ?? 0).toFixed(1)}
              </p>
            )}
            {!isLoading && data?.store && (
              <p className="mt-1 text-sm text-muted-foreground">
                {data.raters.length} rating{data.raters.length === 1 ? "" : "s"} received
              </p>
            )}
            {!isLoading && !data?.store && (
              <p className="mt-2 text-sm text-muted-foreground">No store is linked to this account yet.</p>
            )}
          </div>
          <span className="rounded-xl bg-star/15 p-2 text-star">
            <Star className="h-5 w-5" />
          </span>
        </div>
        {!isLoading && (data?.averageRating ?? 0) > 0 && (
          <div className="mt-4">
            <RatingStars value={data!.averageRating} size="lg" />
          </div>
        )}
      </div>

      {/* Raters table */}
      <PageHeader
        title="People who rated your store"
        description="Click a row to see the user's comment. Sort by any column."
      />

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-secondary/60">
                <SortTh label="User name" sortKey="name" sort={sort} onSort={toggleSort} />
                <SortTh label="Email" sortKey="email" sort={sort} onSort={toggleSort} />
                <SortTh label="Rating" sortKey="value" sort={sort} onSort={toggleSort} />
                <SortTh label="Submitted at" sortKey="createdAt" sort={sort} onSort={toggleSort} />
                {/* expand indicator column */}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10" />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-4">
                          <Skeleton className="h-4 w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                : sorted.map((rater) => {
                    const id = rater.userId;
                    const expanded = expandedId === id;
                    const hasComment = Boolean(rater.comment);

                    return (
                      <>
                        <tr
                          key={id}
                          onClick={() => setExpandedId(expanded ? null : id)}
                          className={cn(
                            "border-t border-border transition-colors",
                            hasComment
                              ? "cursor-pointer hover:bg-secondary/40"
                              : "cursor-default opacity-90",
                            expanded && "bg-secondary/30",
                          )}
                        >
                          <td className="px-4 py-3.5 align-middle font-medium">
                            <div className="flex items-center gap-2">
                              {rater.emoji && <span>{rater.emoji}</span>}
                              {rater.name}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 align-middle text-muted-foreground">
                            {rater.email}
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <div className="flex items-center gap-2">
                              <RatingStars value={rater.value} size="sm" />
                              <span className="font-semibold">{rater.value}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 align-middle text-muted-foreground">
                            {new Date(rater.createdAt).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-center">
                            {hasComment ? (
                              expanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground/40">—</span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded comment row */}
                        {expanded && hasComment && (
                          <tr key={`${id}-comment`} className="border-t border-border bg-secondary/20">
                            <td colSpan={5} className="px-6 py-4">
                              <div className="flex items-start gap-3">
                                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div>
                                  <div className="mb-1 flex items-center gap-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                      Comment from {rater.name}
                                    </p>
                                    {rater.emoji && (
                                      <Badge variant="secondary" className="h-5 px-1.5 text-sm">
                                        {rater.emoji}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm leading-relaxed">{rater.comment}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {!isLoading && sorted.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <div className="rounded-full bg-secondary p-3">
              <Star className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-medium">No ratings yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              When customers rate your store, they will appear here.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Sort header cell ─────────────────────────────────────────────────────────

function SortTh({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: SortDir };
  onSort: (key: SortKey) => void;
}) {
  const active = sort.key === sortKey;
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1.5 rounded transition-colors hover:text-foreground"
      >
        {label}
        <span className="text-[10px] leading-none opacity-60">
          {active ? (sort.dir === "asc" ? "▲" : "▼") : "⇅"}
        </span>
      </button>
    </th>
  );
}
