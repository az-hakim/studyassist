import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  FileText,
  GraduationCap,
  Layers,
  MessageSquare,
  NotebookPen,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { formatDate, reasonFor } from "@studybuddy/shared";

import { formatRelative } from "@/components/bits";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Progress,
  SectionHeading,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { spaceColorClasses, useStudyStore } from "@/store/study";
import { toast } from "@/store/toast";

export default function SpaceDetailPage() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const spaces = useStudyStore((state) => state.spaces);
  const deleteSpace = useStudyStore((state) => state.deleteSpace);
  const updateSpace = useStudyStore((state) => state.updateSpace);
  const chats = useStudyStore((state) => state.chats);
  const deleteChat = useStudyStore((state) => state.deleteChat);
  const notes = useStudyStore((state) => state.notes);
  const quizzes = useStudyStore((state) => state.quizzes);
  const decks = useStudyStore((state) => state.decks);
  const memories = useStudyStore((state) => state.memories);
  const attempts = useStudyStore((state) => state.attempts);

  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const space = spaces.find((item) => item.id === spaceId);

  const spaceChats = useMemo(() => chats.filter((chat) => chat.spaceId === spaceId), [chats, spaceId]);
  const spaceNotes = useMemo(() => notes.filter((note) => note.spaceId === spaceId), [notes, spaceId]);
  const spaceQuizzes = useMemo(
    () => quizzes.filter((quiz) => quiz.spaceId === spaceId),
    [quizzes, spaceId],
  );
  const spaceDecks = useMemo(() => decks.filter((deck) => deck.spaceId === spaceId), [decks, spaceId]);
  const spaceMemories = useMemo(
    () => Object.values(memories).filter((memory) => memory.spaceId === spaceId),
    [memories, spaceId],
  );

  if (!space) {
    return (
      <EmptyState
        icon={<BookOpen className="h-5 w-5" />}
        title="Space not found"
        description="It may have been deleted. Open another space from the list."
        action={
          <Link to="/app/spaces">
            <Button variant="secondary">All spaces</Button>
          </Link>
        }
      />
    );
  }

  const palette = spaceColorClasses[space.color] ?? spaceColorClasses.indigo;
  const average = spaceMemories.length
    ? Math.round(
        spaceMemories.reduce((sum, memory) => sum + memory.strength, 0) / spaceMemories.length,
      )
    : 0;

  const weak = [...spaceMemories].sort((a, b) => a.strength - b.strength).slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/app/spaces"
          className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All spaces
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", palette.soft)}>
              <span className={cn("h-3 w-3 rounded-full", palette.dot)} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{space.name}</h1>
              <p className="text-sm text-muted-foreground">
                {space.subject} · {spaceMemories.length} topics tracked
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setName(space.name);
                setSubject(space.subject);
                setEditOpen(true);
              }}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="gradient"
              onClick={() => navigate(`/app/chat?space=${space.id}`)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ask Nova
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Memory strength</p>
          <p className="mt-1 text-2xl font-semibold">{average}%</p>
          <Progress
            value={average}
            className="mt-2 h-1.5"
            tone={average >= 75 ? "success" : average >= 50 ? "primary" : "warning"}
          />
        </Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Conversations</p>
          <p className="mt-1 text-2xl font-semibold">{spaceChats.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Last {spaceChats[0] ? formatRelative(spaceChats[0].updatedAt) : "—"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Notes</p>
          <p className="mt-1 text-2xl font-semibold">{spaceNotes.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {spaceNotes.filter((note) => note.shareToken).length} shared
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Practice</p>
          <p className="mt-1 text-2xl font-semibold">
            {spaceQuizzes.length + spaceDecks.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {spaceQuizzes.length} quizzes · {spaceDecks.length} decks
          </p>
        </Card>
      </div>

      <Tabs value={tab} onChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview" icon={<Brain className="h-3.5 w-3.5" />}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="chats" icon={<MessageSquare className="h-3.5 w-3.5" />}>
            Chats ({spaceChats.length})
          </TabsTrigger>
          <TabsTrigger value="notes" icon={<NotebookPen className="h-3.5 w-3.5" />}>
            Notes ({spaceNotes.length})
          </TabsTrigger>
          <TabsTrigger value="quizzes" icon={<GraduationCap className="h-3.5 w-3.5" />}>
            Quizzes ({spaceQuizzes.length})
          </TabsTrigger>
          <TabsTrigger value="decks" icon={<Layers className="h-3.5 w-3.5" />}>
            Decks ({spaceDecks.length})
          </TabsTrigger>
        </TabsList>

        {tab === "overview" ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-5">
              <SectionHeading
                title="Weak topics"
                description="Sorted by memory strength within this space."
              />
              <div className="mt-3 space-y-3">
                {weak.length === 0 ? (
                  <EmptyState
                    title="No topics tracked yet"
                    description="Take a quiz or rate a card and Nova will start tracking what needs revision."
                    action={
                      <Link to={`/app/quiz?space=${space.id}`}>
                        <Button size="sm" variant="secondary">
                          Make a quiz
                        </Button>
                      </Link>
                    }
                  />
                ) : (
                  weak.map((memory) => (
                    <div key={memory.topicId} className="rounded-xl border border-border/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13.5px] font-medium">{memory.topicName}</p>
                        <Badge
                          variant={
                            memory.strength < 50
                              ? "danger"
                              : memory.strength >= 80
                                ? "success"
                                : "warning"
                          }
                        >
                          {memory.strength}/100
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{reasonFor(memory)}</p>
                      <Progress
                        value={memory.strength}
                        tone={memory.strength < 50 ? "danger" : memory.strength < 80 ? "warning" : "success"}
                        className="mt-2 h-1.5"
                      />
                    </div>
                  ))
                )}
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <p className="text-sm font-semibold">Quick actions</p>
                <div className="mt-3 grid gap-2">
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/app/chat?space=${space.id}`)}>
                    <MessageSquare className="h-3.5 w-3.5" />
                    Start a chat in this space
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate("/app/notes")}>
                    <Plus className="h-3.5 w-3.5" />
                    New note
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/app/quiz?space=${space.id}`)}>
                    <GraduationCap className="h-3.5 w-3.5" />
                    Generate a quiz
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/app/flashcards?space=${space.id}`)}>
                    <Layers className="h-3.5 w-3.5" />
                    Build a flashcard deck
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <p className="text-sm font-semibold">Recent activity</p>
                <div className="mt-3 space-y-2">
                  {[...spaceNotes.slice(0, 2), ...spaceChats.slice(0, 2)].length === 0 ? (
                    <p className="text-xs text-muted-foreground">No activity yet.</p>
                  ) : (
                    <>
                      {spaceNotes.slice(0, 2).map((note) => (
                        <Link
                          key={note.id}
                          to={`/app/notes/${note.id}`}
                          className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-[12.5px] hover:bg-muted/60"
                        >
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{note.title}</span>
                          <span className="text-[10.5px] text-muted-foreground">
                            {formatRelative(note.updatedAt)}
                          </span>
                        </Link>
                      ))}
                      {spaceChats.slice(0, 2).map((chat) => (
                        <Link
                          key={chat.id}
                          to={`/app/chat/${chat.id}`}
                          className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-[12.5px] hover:bg-muted/60"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{chat.title}</span>
                          <span className="text-[10.5px] text-muted-foreground">
                            {formatRelative(chat.updatedAt)}
                          </span>
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : null}

        {tab === "chats" ? (
          <div className="mt-4 space-y-2">
            {spaceChats.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-5 w-5" />}
                title="No conversations yet"
                description="Ask Nova a question to start the first one."
                action={
                  <Button size="sm" onClick={() => navigate(`/app/chat?space=${space.id}`)}>
                    Start chatting
                  </Button>
                }
              />
            ) : (
              spaceChats.map((chat) => (
                <Card key={chat.id} className="group flex items-center gap-3 p-3.5">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <Link to={`/app/chat/${chat.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{chat.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Updated {formatRelative(chat.updatedAt)}
                    </p>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      deleteChat(chat.id);
                      toast("Chat deleted.", "info");
                    }}
                    className="rounded-md p-1.5 text-muted-foreground opacity-0 hover:text-danger group-hover:opacity-100"
                    aria-label={`Delete ${chat.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              ))
            )}
          </div>
        ) : null}

        {tab === "notes" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {spaceNotes.length === 0 ? (
              <EmptyState
                className="sm:col-span-2"
                icon={<NotebookPen className="h-5 w-5" />}
                title="No notes in this space"
                description="Save a Nova answer as a note, or write one from scratch."
                action={
                  <Button size="sm" onClick={() => navigate("/app/notes")}>
                    Open notes
                  </Button>
                }
              />
            ) : (
              spaceNotes.map((note) => (
                <Link key={note.id} to={`/app/notes/${note.id}`}>
                  <Card className="h-full p-4 transition hover:border-primary/30">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-[13.5px] font-medium">{note.title}</p>
                      {note.shareToken ? <Badge variant="primary">Shared</Badge> : null}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {note.markdown.replace(/[#>*_`]/g, "").slice(0, 120)}
                    </p>
                    <p className="mt-2 text-[10.5px] text-muted-foreground">
                      Edited {formatRelative(note.updatedAt)}
                    </p>
                  </Card>
                </Link>
              ))
            )}
          </div>
        ) : null}

        {tab === "quizzes" ? (
          <div className="mt-4 space-y-2">
            {spaceQuizzes.length === 0 ? (
              <EmptyState
                icon={<GraduationCap className="h-5 w-5" />}
                title="No quizzes yet"
                description="Generate one from a topic or from your notes."
                action={
                  <Button size="sm" onClick={() => navigate(`/app/quiz?space=${space.id}`)}>
                    Generate quiz
                  </Button>
                }
              />
            ) : (
              spaceQuizzes.map((quiz) => {
                const quizAttempts = attempts.filter((attempt) => attempt.quizId === quiz.id);
                const best = quizAttempts.reduce((max, attempt) => Math.max(max, attempt.scorePct), 0);
                return (
                  <Card key={quiz.id} className="flex items-center gap-3 p-3.5">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <Link to={`/app/quiz/${quiz.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{quiz.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {quiz.questions.length} questions · {quiz.difficulty} ·{" "}
                        {formatDate(quiz.createdAt)}
                      </p>
                    </Link>
                    {quizAttempts.length > 0 ? <Badge variant="primary">Best {best}%</Badge> : null}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Card>
                );
              })
            )}
          </div>
        ) : null}

        {tab === "decks" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {spaceDecks.length === 0 ? (
              <EmptyState
                className="sm:col-span-2"
                icon={<Layers className="h-5 w-5" />}
                title="No flashcard decks yet"
                description="Turn a topic or an answer into a deck in seconds."
                action={
                  <Button size="sm" onClick={() => navigate(`/app/flashcards?space=${space.id}`)}>
                    Build a deck
                  </Button>
                }
              />
            ) : (
              spaceDecks.map((deck) => (
                <Link key={deck.id} to={`/app/flashcards/${deck.id}`}>
                  <Card className="h-full p-4 transition hover:border-primary/30">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-[13.5px] font-medium">{deck.name}</p>
                      <Badge>{deck.cards.length} cards</Badge>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{deck.topic}</p>
                    <p className="mt-2 text-[10.5px] text-muted-foreground">
                      {deck.cards.filter((card) => card.rating).length} rated · created{" "}
                      {formatDate(deck.createdAt)}
                    </p>
                  </Card>
                </Link>
              ))
            )}
          </div>
        ) : null}
      </Tabs>

      <Card className="flex flex-wrap items-center justify-between gap-3 border-danger/20 p-4">
        <div>
          <p className="text-sm font-medium">Danger zone</p>
          <p className="text-xs text-muted-foreground">
            Deleting this space removes its chats, notes, quizzes, decks and topic memories.
          </p>
        </div>
        <Button variant="outline" size="sm" className="border-danger/30 text-danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-3.5 w-3.5" />
          Delete space
        </Button>
      </Card>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit space"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                updateSpace(space.id, { name: name.trim() || space.name, subject: subject.trim() || space.subject });
                setEditOpen(false);
                toast("Space updated.", "success");
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Subject">
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete “${space.name}”?`}
        description="This removes the space and everything inside it. It cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteSpace(space.id);
                navigate("/app/spaces");
                toast("Space deleted.", "info");
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
