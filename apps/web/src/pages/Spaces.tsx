import { ArrowRight, BookOpen, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button, Card, EmptyState, Field, Input, Modal, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useStudyStore, spaceColorClasses } from "@/store/study";
import { toast } from "@/store/toast";

const COLORS = Object.keys(spaceColorClasses);

export default function SpacesPage() {
  const spaces = useStudyStore((state) => state.spaces);
  const notes = useStudyStore((state) => state.notes);
  const quizzes = useStudyStore((state) => state.quizzes);
  const decks = useStudyStore((state) => state.decks);
  const chats = useStudyStore((state) => state.chats);
  const memories = useStudyStore((state) => state.memories);
  const addSpace = useStudyStore((state) => state.addSpace);
  const deleteSpace = useStudyStore((state) => state.deleteSpace);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [color, setColor] = useState(COLORS[0] ?? "indigo");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const memoryList = Object.values(memories);

  const create = () => {
    if (!name.trim()) return;
    const id = addSpace({ name, subject: subject || name, color });
    setOpen(false);
    setName("");
    setSubject("");
    toast("Study space created.", "success");
    navigate(`/app/spaces/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Study spaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One workspace per subject, with its own chats, notes, quizzes and revision.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New space
        </Button>
      </div>

      {spaces.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-5 w-5" />}
          title="No spaces yet"
          description="Create a space for each subject you are studying this term."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Create a space
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => {
            const palette = spaceColorClasses[space.color] ?? spaceColorClasses.indigo;
            const spaceMemories = memoryList.filter((memory) => memory.spaceId === space.id);
            const average = spaceMemories.length
              ? Math.round(
                  spaceMemories.reduce((sum, memory) => sum + memory.strength, 0) /
                    spaceMemories.length,
                )
              : 0;
            return (
              <Card key={space.id} className="group flex h-full flex-col p-5">
                <div className="flex items-start gap-3">
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", palette.soft)}>
                    <span className={cn("h-2.5 w-2.5 rounded-full", palette.dot)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/app/spaces/${space.id}`} className="block">
                      <p className="truncate text-[15px] font-semibold hover:text-primary">
                        {space.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{space.subject}</p>
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(space.id)}
                    aria-label={`Delete ${space.name}`}
                    className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition hover:bg-danger/10 hover:text-danger group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-1.5 text-[11.5px] text-muted-foreground">
                  <span>{chats.filter((chat) => chat.spaceId === space.id).length} chats</span>
                  <span>{notes.filter((note) => note.spaceId === space.id).length} notes</span>
                  <span>{quizzes.filter((quiz) => quiz.spaceId === space.id).length} quizzes</span>
                  <span>{decks.filter((deck) => deck.spaceId === space.id).length} decks</span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Average strength</span>
                    <span>{average}%</span>
                  </div>
                  <Progress
                    value={average}
                    className="mt-1.5 h-1.5"
                    tone={average >= 75 ? "success" : average >= 50 ? "primary" : "warning"}
                  />
                </div>

                <Link to={`/app/spaces/${space.id}`} className="mt-auto pt-4">
                  <Button variant="secondary" size="sm" className="w-full">
                    Open space
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New study space"
        description="You can rename it or change the colour later."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={!name.trim()}>
              Create space
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" hint="Required">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Organic chemistry"
              autoFocus
            />
          </Field>
          <Field label="Subject">
            <Input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Chemistry"
            />
          </Field>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Colour</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((option) => {
                const palette = spaceColorClasses[option];
                return (
                  <button
                    key={option}
                    type="button"
                    aria-label={option}
                    aria-pressed={color === option}
                    onClick={() => setColor(option)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl border transition",
                      color === option ? "border-primary ring-2 ring-primary/20" : "border-border",
                    )}
                  >
                    <span className={cn("h-3.5 w-3.5 rounded-full", palette?.dot)} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete this space?"
        description="Chats, notes, quizzes, decks and topic memories in this space will be removed."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) {
                  deleteSpace(confirmDelete);
                  toast("Space deleted.", "info");
                }
                setConfirmDelete(null);
              }}
            >
              Delete space
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This cannot be undone. Export any notes you want to keep first.
        </p>
      </Modal>
    </div>
  );
}
