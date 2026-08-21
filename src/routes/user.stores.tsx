import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Star, SlidersHorizontal, X, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { RatingStars } from "@/components/RatingStars";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userService } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";
import type { Store } from "@/types";

export const Route = createFileRoute("/user/stores")({
  head: () => ({
    meta: [
      { title: "Stores — Store Ratings" },
      { name: "description", content: "Browse registered stores and their overall ratings." },
    ],
  }),
  component: () => (
    <ProtectedRoute role="USER">
      <UserStores />
    </ProtectedRoute>
  ),
});

type RatingFilter = "all" | "rated" | "unrated";

function UserStores() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [minRating, setMinRating] = useState<string>("any");

  const { data = [], isLoading } = useQuery({
    queryKey: ["user", "stores"],
    queryFn: () => userService.getStores(),
  });

  const hasFilters =
    name.trim() !== "" ||
    address.trim() !== "" ||
    ratingFilter !== "all" ||
    minRating !== "any";

  const clearFilters = () => {
    setName("");
    setAddress("");
    setRatingFilter("all");
    setMinRating("any");
  };

  const rows = useMemo(
    () =>
      data.filter((s) => {
        if (!s.name.toLowerCase().includes(name.toLowerCase().trim())) return false;
        if (!s.address.toLowerCase().includes(address.toLowerCase().trim())) return false;
        if (ratingFilter === "rated" && (s.myRating == null)) return false;
        if (ratingFilter === "unrated" && s.myRating != null) return false;
        if (minRating !== "any" && s.averageRating < Number(minRating)) return false;
        return true;
      }),
    [data, name, address, ratingFilter, minRating],
  );

  return (
    <>
      <PageHeader title="Stores" description="Browse stores, see ratings, and share yours." />

      {/* Search + filter bar */}
      <div className="surface-card mb-6 space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Name search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {/* Address search */}
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by address…"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Rating status filter */}
          <Select value={ratingFilter} onValueChange={(v) => setRatingFilter(v as RatingFilter)}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="My ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stores</SelectItem>
              <SelectItem value="rated">Rated by me</SelectItem>
              <SelectItem value="unrated">Not rated yet</SelectItem>
            </SelectContent>
          </Select>

          {/* Min average rating filter */}
          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger className="h-8 w-[170px] text-xs">
              <SelectValue placeholder="Min. avg rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any avg rating</SelectItem>
              <SelectItem value="2">≥ 2 stars</SelectItem>
              <SelectItem value="3">≥ 3 stars</SelectItem>
              <SelectItem value="4">≥ 4 stars</SelectItem>
              <SelectItem value="5">5 stars only</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}

          <span className="ml-auto text-xs text-muted-foreground">
            {rows.length} store{rows.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="font-medium">No stores match your search.</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
          {hasFilters && (
            <Button variant="outline" size="sm" className="mt-2" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </>
  );
}

// ─── Inline quick-rating popover ─────────────────────────────────────────────

function QuickRatePopover({ store }: { store: Store }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<number>(store.myRating ?? 0);
  const isUpdate = store.myRating != null;

  const save = useMutation({
    mutationFn: async (value: number) => {
      if (!user) throw new Error("Not signed in.");
      return isUpdate
        ? userService.updateRating(user.id, store.id, value)
        : userService.submitRating(user.id, store.id, value);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user", "stores"] });
      await queryClient.invalidateQueries({ queryKey: ["user", "store", store.id] });
      toast.success(isUpdate ? "Rating updated." : "Rating submitted.");
      setOpen(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Unable to save rating."),
  });

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setPending(store.myRating ?? 0); }}>
      <PopoverTrigger asChild>
        {/* stop click propagation so the Link card doesn't navigate */}
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors
            ${isUpdate
              ? "bg-star/15 text-star hover:bg-star/25"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            }`}
          aria-label={isUpdate ? "Modify your rating" : "Rate this store"}
        >
          {isUpdate ? (
            <>
              <Pencil className="h-3 w-3" />
              Your rating: {store.myRating}★
            </>
          ) : (
            <>
              <Star className="h-3 w-3" />
              Rate this store
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" onClick={(e) => e.stopPropagation()}>
        <p className="mb-3 text-sm font-semibold">
          {isUpdate ? "Update your rating" : "Rate this store"}
        </p>
        <RatingStars
          value={pending}
          onChange={setPending}
          size="lg"
          disabled={save.isPending}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {pending > 0 ? `${pending} star${pending > 1 ? "s" : ""}` : "Pick a star to rate"}
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            disabled={pending < 1 || save.isPending}
            onClick={() => save.mutate(pending)}
          >
            {save.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {isUpdate ? "Update" : "Submit"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
        {isUpdate && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            For a full review,{" "}
            <Link
              to="/user/stores/$storeId"
              params={{ storeId: store.id }}
              className="underline hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              open the store page
            </Link>
            .
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── Store card ───────────────────────────────────────────────────────────────

function StoreCard({ store }: { store: Store }) {
  return (
    <Link
      to="/user/stores/$storeId"
      params={{ storeId: store.id }}
      className="surface-card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
    >
      {/* Cover image */}
      <div className="aspect-[16/10] overflow-hidden bg-secondary">
        {store.coverUrl ? (
          <img
            src={store.coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No photo
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4">
        <h2 className="font-semibold leading-snug group-hover:underline">{store.name}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{store.address}</p>

        {/* Overall average */}
        <div className="mt-3 flex items-center gap-2">
          <RatingStars value={store.averageRating} size="sm" />
          <span className="text-sm font-semibold">{store.averageRating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({store.ratingCount ?? 0})</span>
        </div>

        {/* Divider + user's rating row */}
        <div className="mt-auto pt-3">
          <div className="mb-3 border-t border-border" />
          <div className="flex items-center justify-between gap-2">
            {store.myRating != null ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Your rating:</span>
                <RatingStars value={store.myRating} size="sm" />
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {store.myRating}
                </Badge>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">You haven't rated this yet</span>
            )}
            <QuickRatePopover store={store} />
          </div>
        </div>
      </div>
    </Link>
  );
}
