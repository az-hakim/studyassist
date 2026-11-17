import type { Rating } from "@studybuddy/shared";
import { Check, ChevronLeft, ChevronRight, Layers, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Markdown } from "@/components/markdown";
import { Badge, Button, Card, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";

const RATINGS: Array<{ id: Rating; label: string; hint: string; className: string }> = [
  {
    id: "needs_revision",
    label: "Needs revision",
    hint: "1",
    className: "border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
  },
  {
    id: "hard",
    label: "Hard",
    hint: "2",
    className: "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20",
  },
  {
    id: "medium",
    label: "Medium",
    hint: "3",
    className: "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
  },
  {
    id: "easy",
    label: "Easy",
    hint: "4",
    className: "border-success/40 bg-success/10 text-success hover:bg-success/20",
  },
];

function shuffleCards<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    const other = copy[swap];
    if (current !== undefined && other !== undefined) {
      copy[index] = other;
      copy[swap] = current;
    }
  }
  return copy;
}

export function FlashcardRunner({
  cards,
  onRate,
  deckName,
}: {
  cards: Array<{ id: string; front: string; back: string }>;
  onRate?: (cardId: string, rating: Rating) => void;
  deckName?: string;
}) {
  const [order, setOrder] = useState(() => shuffleCards(cards));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});

  useEffect(() => {
    setOrder(shuffleCards(cards));
    setIndex(0);
    setFlipped(false);
    setRatings({});
  }, [cards]);

  const current = order[index];
  const done = index >= order.length;

  const rate = useCallback(
    (rating: Rating) => {
      if (!current) return;
      setRatings((existing) => ({ ...existing, [current.id]: rating }));
      onRate?.(current.id, rating);
      setFlipped(false);
      setIndex((value) => value + 1);
    },
    [current, onRate],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (done) return;
      if (event.code === "Space" || event.key === "ArrowRight") {
        event.preventDefault();
        setFlipped((value) => !value);
      }
      if (event.key === "ArrowLeft") {
        setIndex((value) => Math.max(0, value - 1));
        setFlipped(false);
      }
      if (["1", "2", "3", "4"].includes(event.key)) {
        const rating = RATINGS[Number(event.key) - 1]?.id;
        if (rating) rate(rating);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [done, rate]);

  const summary = useMemo(() => {
    const counts = { easy: 0, medium: 0, hard: 0, needs_revision: 0 };
    Object.values(ratings).forEach((rating) => {
      counts[rating] += 1;
    });
    return counts;
  }, [ratings]);

  if (cards.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-8 text-center">
        <Layers className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-semibold">This deck has no cards</p>
        <p className="text-xs text-muted-foreground">Generate a new deck to start reviewing.</p>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15 text-success">
          <Check className="h-6 w-6" />
        </div>
        <h2 className="mt-3 text-lg font-semibold">Deck complete</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You reviewed {order.length} cards{deckName ? ` in ${deckName}` : ""}. Ratings update the
          revision scheduler.
        </p>
        <div className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-2 sm:grid-cols-4">
          {RATINGS.map((rating) => (
            <div key={rating.id} className="rounded-xl border border-border/60 p-2.5">
              <p className="text-lg font-semibold">{summary[rating.id]}</p>
              <p className="text-[10.5px] text-muted-foreground">{rating.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              setOrder(shuffleCards(cards));
              setIndex(0);
              setFlipped(false);
              setRatings({});
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Review again
          </Button>
          <Button
            variant="secondary"
            onClick={() => setOrder(shuffleCards(cards))}
          >
            <Shuffle className="h-4 w-4" />
            Reshuffle only
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
            <span>
              Card {index + 1} of {order.length}
            </span>
            <span>{Object.keys(ratings).length} rated</span>
          </div>
          <Progress value={(index / order.length) * 100} className="mt-1.5" />
        </div>
        <Badge variant={flipped ? "primary" : "neutral"}>{flipped ? "Answer" : "Prompt"}</Badge>
      </div>

      <div className="relative [perspective:1600px]">
        <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          aria-label={flipped ? "Show prompt" : "Show answer"}
          className="relative block h-[300px] w-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:h-[340px]"
        >
          <div
            className={cn(
              "relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]",
              flipped && "[transform:rotateY(180deg)]",
            )}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-card p-6 text-center shadow-soft [backface-visibility:hidden]">
              <Sparkles className="mb-4 h-5 w-5 text-primary" />
              <p className="max-w-xl text-[17px] font-medium leading-relaxed sm:text-[19px]">
                {current?.front}
              </p>
              <p className="mt-6 text-[11px] uppercase tracking-wide text-muted-foreground">
                Tap or press Space to reveal
              </p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center shadow-soft [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="mb-3 text-[11px] uppercase tracking-wide text-primary">Answer</p>
              <div className="max-w-xl text-left">
                <Markdown>{current?.back ?? ""}</Markdown>
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {RATINGS.map((rating) => (
          <button
            key={rating.id}
            type="button"
            onClick={() => rate(rating.id)}
            className={cn(
              "flex min-h-[48px] flex-col items-center justify-center rounded-xl border px-2 py-2 text-[12px] font-medium transition",
              rating.className,
            )}
          >
            {rating.label}
            <span className="mt-0.5 text-[10px] font-normal opacity-70">key {rating.hint}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIndex((value) => Math.max(0, value - 1));
            setFlipped(false);
          }}
          disabled={index === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setFlipped(false);
            setIndex((value) => Math.min(order.length, value + 1));
          }}
        >
          Skip
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
