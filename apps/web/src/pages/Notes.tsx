import {
  Check,
  Copy,
  Download,
  Eye,
  FileDown,
  Link2,
  NotebookPen,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Markdown } from "@/components/markdown";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@/components/ui";
import { formatRelative } from "@/components/bits";
import { downloadTextFile, printDocument } from "@/lib/export";
import { copyToClipboard } from "@/lib/utils";
import { useStudyStore } from "@/store/study";
import { toast } from "@/store/toast";

export default function NotesPage() {
  const { noteId } = useParams();
  const navigate = useNavigate();

  const notes = useStudyStore((state) => state.notes);
  const spaces = useStudyStore((state) => state.spaces);
  const addNote = useStudyStore((state) => state.addNote);
  const updateNote = useStudyStore((state) => state.updateNote);
  const deleteNote = useStudyStore((state) => state.deleteNote);
  const toggleNoteShare = useStudyStore((state) => state.toggleNoteShare);

  const note = notes.find((item) => item.id === noteId);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSpace, setNewSpace] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const loadedRef = useRef<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!note) return;
    if (loadedRef.current === note.id) return;
    loadedRef.current = note.id;
    setTitle(note.title);
    setBody(note.markdown);
    setMode("edit");
  }, [note]);

  const dirty = Boolean(note && (title !== note.title || body !== note.markdown));

  const save = () => {
    if (!note) return;
    updateNote(note.id, { title: title.trim() || "Untitled note", markdown: body });
    setSavedAt(new Date().toISOString());
    toast("Note saved.", "success");
  };

  useEffect(() => {
    if (!note || !dirty) return;
    const timer = window.setTimeout(() => {
      updateNote(note.id, { title: title.trim() || "Untitled note", markdown: body });
      setSavedAt(new Date().toISOString());
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [dirty, title, body, note, updateNote]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const create = () => {
    const id = addNote({
      spaceId: newSpace || null,
      title: newTitle.trim() || "Untitled note",
      markdown: `# ${newTitle.trim() || "Untitled note"}\n\nStart writing, or paste an answer from Aeva.\n`,
    });
    setCreateOpen(false);
    setNewTitle("");
    setNewSpace("");
    navigate(`/app/notes/${id}`);
  };

  const exportPdf = () => {
    if (!note) return;
    const finish = () => {
      const html = previewRef.current?.innerHTML;
      if (!html) {
        toast("Switch to preview and try again.", "error");
        setMode("preview");
        return;
      }
      if (!printDocument(title || note.title, html)) {
        toast("Allow pop-ups to export a PDF.", "error");
      }
    };
    if (mode === "preview") {
      finish();
    } else {
      setMode("preview");
      window.setTimeout(finish, 80);
    }
  };

  const share = async () => {
    if (!note) return;
    const token = toggleNoteShare(note.id);
    if (!token) {
      toast("Share link disabled.", "info");
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}#/share/${token}`;
    try {
      await copyToClipboard(url);
      toast("Public link copied to clipboard.", "success");
    } catch {
      toast(`Share link: ${url}`, "info");
    }
  };

  const shareUrl = note?.shareToken
    ? `${window.location.origin}${window.location.pathname}#/share/${note.shareToken}`
    : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Write in markdown, preview as you go, export to PDF or share a read-only link.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New note
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          {notes.length === 0 ? (
            <EmptyState
              icon={<NotebookPen className="h-5 w-5" />}
              title="No notes yet"
              description="Create one, or save a Aeva answer as a note."
            />
          ) : (
            [...notes]
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .map((item) => (
                <Link
                  key={item.id}
                  to={`/app/notes/${item.id}`}
                  className={`block rounded-xl border p-3 transition ${
                    item.id === noteId
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/60 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-[13px] font-medium">{item.title}</p>
                    {item.shareToken ? <Link2 className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                    {item.markdown.replace(/[#>*_`]/g, "").slice(0, 90)}
                  </p>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    {formatRelative(item.updatedAt)}
                  </p>
                </Link>
              ))
          )}
        </aside>

        {note ? (
          <Card className="min-w-0 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-label="Note title"
                className="min-w-0 flex-1 border-0 bg-transparent text-xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground focus-visible:ring-0"
                placeholder="Note title"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {dirty ? (
                  <Badge variant="warning">Unsaved</Badge>
                ) : savedAt ? (
                  <span className="flex items-center gap-1 text-[10.5px] text-success">
                    <Check className="h-3 w-3" /> Saved
                  </span>
                ) : null}
                <Button size="sm" variant="ghost" onClick={exportPdf} title="Export PDF">
                  <FileDown className="h-3.5 w-3.5" />
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    downloadTextFile(`${title || "note"}.md`, body);
                    toast("Markdown downloaded.", "success");
                  }}
                  title="Download markdown"
                >
                  <Download className="h-3.5 w-3.5" />
                  .md
                </Button>
                <Button
                  size="sm"
                  variant={note.shareToken ? "secondary" : "ghost"}
                  onClick={() => void share()}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  {note.shareToken ? "Shared" : "Share"}
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-danger"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Tabs value={mode} onChange={(value) => setMode(value as "edit" | "preview")}>
                <TabsList>
                  <TabsTrigger value="edit" icon={<Pencil className="h-3.5 w-3.5" />}>
                    Edit
                  </TabsTrigger>
                  <TabsTrigger value="preview" icon={<Eye className="h-3.5 w-3.5" />}>
                    Preview
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <span className="text-[10.5px] text-muted-foreground">
                Markdown · {body.length} characters
              </span>
              {dirty ? (
                <Button size="sm" className="ml-auto" onClick={save}>
                  Save now
                </Button>
              ) : null}
            </div>

            {note.shareToken && shareUrl ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-2.5">
                <Link2 className="h-3.5 w-3.5 text-primary" />
                <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                  {shareUrl}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await copyToClipboard(shareUrl);
                      toast("Copied.", "success");
                    } catch {
                      toast("Copy failed.", "error");
                    }
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
            ) : null}

            <div className="mt-3">
              {mode === "edit" ? (
                <Textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  aria-label="Note markdown"
                  rows={22}
                  className="min-h-[420px] font-mono text-[13px] leading-6"
                  placeholder="# Heading&#10;&#10;Write your notes in markdown…"
                />
              ) : null}
              <div className={mode === "preview" ? "block" : "hidden"}>
                <div ref={previewRef} className="min-h-[420px] rounded-xl border border-border/50 p-4">
                  <Markdown>{body}</Markdown>
                </div>
              </div>
            </div>

            <p className="mt-2 text-[10.5px] text-muted-foreground">
              Autosaves a moment after you stop typing. {note.spaceId
                ? `In ${spaces.find((space) => space.id === note.spaceId)?.name ?? "a space"}.`
                : "Not assigned to a space."}
            </p>
          </Card>
        ) : (
          <Card className="flex min-h-[420px] items-center justify-center p-6">
            <EmptyState
              icon={<NotebookPen className="h-5 w-5" />}
              title="Select a note"
              description="Pick a note from the list or start a new one."
              action={
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New note
                </Button>
              }
            />
          </Card>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New note"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create}>Create note</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title">
            <Input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Cell respiration cheat sheet"
              autoFocus
            />
          </Field>
          <Field label="Study space">
            <Select value={newSpace} onChange={(event) => setNewSpace(event.target.value)}>
              <option value="">No space</option>
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete “${note?.title ?? "note"}”?`}
        description="The note and its public share link will stop working."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (note) deleteNote(note.id);
                setConfirmDelete(false);
                loadedRef.current = null;
                navigate("/app/notes");
                toast("Note deleted.", "info");
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
