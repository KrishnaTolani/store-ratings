import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { RatingStars } from "@/components/RatingStars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/userService";

const EMOJIS = ["😊", "😍", "👍", "🔥", "❤️", "😮", "😢", "👎"];

export const Route = createFileRoute("/user/stores_/$storeId")({
  head: () => ({
    meta: [{ title: "Store — Store Ratings" }],
  }),
  component: () => (
    <ProtectedRoute role="USER">
      <StoreDetailPage />
    </ProtectedRoute>
  ),
});

function StoreDetailPage() {
  const { storeId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["user", "store", storeId],
    queryFn: () => userService.getStoreById(storeId),
  });

  const [value, setValue] = useState(0);
  const [comment, setComment] = useState("");
  const [emoji, setEmoji] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!data || hydrated) return;
    if (data.myReview) {
      setValue(data.myReview.value);
      setComment(data.myReview.comment);
      setEmoji(data.myReview.emoji);
    }
    setHydrated(true);
  }, [data, hydrated]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in.");
      const extra = { comment, emoji };
      return data?.myReview
        ? userService.updateRating(user.id, storeId, value, extra)
        : userService.submitRating(user.id, storeId, value, extra);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user", "store", storeId] });
      await queryClient.invalidateQueries({ queryKey: ["user", "stores"] });
      toast.success(data?.myReview ? "Review updated." : "Review submitted.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Unable to save review."),
  });

  if (isLoading || !data) {
    return (
      <>
        <Skeleton className="mb-4 h-8 w-40" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </>
    );
  }

  const { store, photos, reviews } = data;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/user/stores">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to stores
        </Link>
      </Button>

      <PageHeader
        title={store.name}
        description={store.address}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <RatingStars value={store.averageRating} size="lg" />
        <span className="text-3xl font-extrabold tracking-tight">{store.averageRating.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">
          {store.ratingCount ?? reviews.length} review{(store.ratingCount ?? reviews.length) === 1 ? "" : "s"}
        </span>
      </div>

      {photos.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          {photos.map((url) => (
            <img
              key={url}
              src={url}
              alt={store.name}
              className="h-40 w-full rounded-2xl object-cover md:h-52"
            />
          ))}
        </div>
      )}

      <div className="surface-card mb-8 p-6">
        <h2 className="text-lg font-semibold">{data.myReview ? "Update your rating" : "Add your rating"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Rate this store, pick an emoji, and leave a short comment.
        </p>
        <div className="mt-4">
          <RatingStars value={value} onChange={setValue} size="lg" disabled={save.isPending} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji((cur) => (cur === e ? "" : e))}
              className={`rounded-xl px-3 py-2 text-xl transition-colors ${
                emoji === e ? "bg-secondary ring-2 ring-ring" : "hover:bg-secondary/70"
              }`}
              aria-label={`Emoji ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
        <Textarea
          className="mt-4"
          placeholder="Share what you liked or what could be better…"
          value={comment}
          maxLength={400}
          onChange={(e) => setComment(e.target.value)}
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">{comment.length}/400</p>
        <Button className="mt-4" disabled={save.isPending || value < 1} onClick={() => save.mutate()}>
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {data.myReview ? "Update review" : "Submit review"}
        </Button>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Reviews from other visitors</h2>
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet. Be the first to rate this store.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="surface-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {review.emoji ? `${review.emoji} ` : ""}
                  {review.name}
                </p>
                <RatingStars value={review.value} size="sm" />
              </div>
              {review.comment && <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
