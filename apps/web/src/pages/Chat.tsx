import {
  ArrowUp,
  BookOpen,
  Bot,
  Copy,
  FileText,
  Globe,
  GraduationCap,
  Layers,
  MessageSquare,
  NotebookPen,
  Paperclip,
  Plus,
  RefreshCw,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { truncate } from "@/lib/utils";

import { Markdown } from "@/components/markdown";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  Spinner,
  Switch,
  Textarea,
} from "@/components/ui";
import { RequestAbortedError, streamTutorReply, type ChatTurn } from "@/lib/ai";
import { chunkText, extractFile, humanFileSize, selectChunks } from "@/lib/files";
import { copyToClipboard } from "@/lib/utils";
import { useLearningProfile } from "@/store/auth";
import { useStudyStore } from "@/store/study";
import { toast } from "@/store/toast";
import { requestDeck, requestQuiz } from "@/lib/structured";
import type { Citation, Message, SourceCard } from "@/store/types";
import { formatRelative } from "@/components/bits";

const SUGGESTIONS = [
  "Explain photosynthesis as if I'm 12",
  "Make a 5-question quiz on quadratic equations",
  "Summarise the key ideas in my notes",
  "What should I revise today?",
];

function SourceCards({ sources }: { sources: SourceCard[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      {sources.map((source) => (
        <a
          key={source.url}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-2 rounded-xl border border-border/70 bg-background/50 p-2.5 transition hover:border-primary/40"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-semibold uppercase text-primary">
            {source.domain.charAt(0)}
          </span>
          <span className="min-w-0">
            <span className="line-clamp-2 block text-[11.5px] font-medium leading-snug">
              {source.title}
            </span>
            <span className="mt-0.5 block truncate text-[10.5px] text-muted-foreground">
              {source.domain}
            </span>
          </span>
        </a>
      ))}
    </div>
  );
}

function MessageBubble({
  message,
  onCitation,
  onSaveNote,
  onQuiz,
  onDeck,
  onRegenerate,
  busy,
}: {
  message: Message;
  onCitation: (citation: Citation) => void;
  onSaveNote: (message: Message) => void;
  onQuiz: (message: Message) => void;
  onDeck: (message: Message) => void;
  onRegenerate: (message: Message) => void;
  busy: boolean;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await copyToClipboard(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Copy failed in this browser.", "error");
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-up">
        <div className="max-w-[88%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[14px] leading-relaxed text-primary-foreground whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-fade-up">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
        <Bot className="h-4 w-4 text-white" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold">Aeva</span>
          {message.mode === "demo" ? <Badge variant="warning">Demo tutor</Badge> : null}
          {message.mode === "live" ? <Badge variant="primary">Live</Badge> : null}
        </div>
        <div className="rounded-2xl rounded-tl-md border border-border/60 bg-card px-4 py-3">
          <Markdown>{message.content}</Markdown>

          {message.citations.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/60 pt-2.5">
              <span className="text-[11px] font-medium text-muted-foreground">Citations:</span>
              {message.citations.map((citation) => (
                <button
                  key={`${citation.fileName}-${citation.page}`}
                  type="button"
                  onClick={() => onCitation(citation)}
                  className="chip border-primary/30 bg-primary/10 text-primary transition hover:bg-primary/20"
                  title={`${citation.fileName} — page ${citation.page}`}
                >
                  <FileText className="h-3 w-3" />
                  p. {citation.page}
                </button>
              ))}
            </div>
          ) : null}

          <SourceCards sources={message.sources} />
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" onClick={copy} aria-label="Copy answer">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          {copied ? <span className="mr-1 text-[10.5px] text-success">Copied</span> : null}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onSaveNote(message)}
            aria-label="Save answer as note"
            title="Save as note"
          >
            <NotebookPen className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onQuiz(message)}
            aria-label="Generate quiz from answer"
            title="Quiz from this answer"
          >
            <GraduationCap className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDeck(message)}
            aria-label="Generate flashcards from answer"
            title="Flashcards from this answer"
          >
            <Layers className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onRegenerate(message)}
            disabled={busy}
            aria-label="Regenerate answer"
            title="Regenerate"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { chatId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const profile = useLearningProfile();

  const chats = useStudyStore((state) => state.chats);
  const messages = useStudyStore((state) => state.messages);
  const spaces = useStudyStore((state) => state.spaces);
  const files = useStudyStore((state) => state.files);
  const createChat = useStudyStore((state) => state.createChat);
  const addMessage = useStudyStore((state) => state.addMessage);
  const updateMessage = useStudyStore((state) => state.updateMessage);
  const deleteChat = useStudyStore((state) => state.deleteChat);
  const addNote = useStudyStore((state) => state.addNote);
  const addQuiz = useStudyStore((state) => state.addQuiz);
  const addDeck = useStudyStore((state) => state.addDeck);
  const addFile = useStudyStore((state) => state.addFile);
  const addSession = useStudyStore((state) => state.addSession);

  const activeChat = chats.find((chat) => chat.id === chatId);
  const chatMessages = useMemo(
    () => messages.filter((message) => message.chatId === chatId),
    [messages, chatId],
  );

  const [draft, setDraft] = useState("");
  const [spaceId, setSpaceId] = useState<string | null>(searchParams.get("space"));
  const [webSearch, setWebSearch] = useState(false);
  const [sending, setSending] = useState(false);
  const [streamText, setStreamText] = useState<string | null>(null);
  const [citation, setCitation] = useState<Citation | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const partialRef = useRef("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeChat) setSpaceId(activeChat.spaceId);
  }, [activeChat]);

  useEffect(() => {
    setSelectedFileIds((current) => {
      if (current.length > 0) return current;
      return files.map((file) => file.id);
    });
  }, [files]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages.length, streamText]);

  const contextFiles = files.filter(
    (file) => selectedFileIds.includes(file.id) && file.text.length > 0,
  );

  const buildChunks = () =>
    contextFiles.flatMap((file) =>
      chunkText(file.text).map((page) => ({
        fileName: file.name,
        page: page.page,
        text: page.text,
      })),
    );

  const handleSend = async (override?: string) => {
    const text = (override ?? draft).trim();
    if (!text || sending) return;

    const targetChatId = activeChat?.id ?? createChat(spaceId, truncate(text, 60));
    if (!activeChat) navigate(`/app/chat/${targetChatId}`, { replace: true });

    addMessage({ chatId: targetChatId, role: "user", content: text });
    setDraft("");
    setSending(true);
    setStreamText("");
    partialRef.current = "";

    const controller = new AbortController();
    abortRef.current = controller;

    const history: ChatTurn[] = [
      ...chatMessages.map((message) => ({ role: message.role, content: message.content })),
      { role: "user" as const, content: text },
    ].slice(-14);

    try {
      const chunks = buildChunks();
      const relevant = selectChunks(
        chunks.map((chunk) => ({ page: chunk.page, text: chunk.text })),
        text,
        4,
      );
      const citations = relevant.map((page) => {
        const match = chunks.find((chunk) => chunk.page === page.page && chunk.text === page.text);
        return {
          fileName: match?.fileName ?? "Your file",
          page: page.page,
          text: page.text,
        };
      });

      const result = await streamTutorReply({
        messages: history,
        profile,
        webSearch,
        chunks: citations,
        topic: activeChat?.title,
        signal: controller.signal,
        onToken: (token) => {
          partialRef.current += token;
          setStreamText(partialRef.current);
        },
      });

      addMessage({
        chatId: targetChatId,
        role: "assistant",
        content: result.content,
        sources: result.sources,
        citations: result.citations,
        mode: result.mode,
      });
      addSession({ kind: "chat", durationMin: 2 });
      if (result.mode === "demo") {
        toast("Answered by the offline demo tutor.", "info");
      }
    } catch (error) {
      if (error instanceof RequestAbortedError) {
        if (partialRef.current.trim().length > 0) {
          addMessage({
            chatId: targetChatId,
            role: "assistant",
            content: `${partialRef.current}\n\n_Stopped._`,
            mode: "demo",
          });
        }
      } else {
        toast(error instanceof Error ? error.message : "Aeva could not answer.", "error");
      }
    } finally {
      setStreamText(null);
      setSending(false);
      abortRef.current = null;
      partialRef.current = "";
    }
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  const regenerate = async (message: Message) => {
    if (sending || !chatId) return;
    const index = chatMessages.findIndex((item) => item.id === message.id);
    const history = chatMessages
      .slice(0, index < 0 ? chatMessages.length : index)
      .map((item) => ({ role: item.role, content: item.content }));

    setSending(true);
    setStreamText("");
    partialRef.current = "";
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const chunks = buildChunks();
      const relevant = selectChunks(
        chunks.map((chunk) => ({ page: chunk.page, text: chunk.text })),
        message.content,
        4,
      );
      const citations = relevant.map((page) => ({
        fileName: chunks.find((chunk) => chunk.page === page.page)?.fileName ?? "Your file",
        page: page.page,
        text: page.text,
      }));

      const result = await streamTutorReply({
        messages: history.length > 0 ? history : [{ role: "user", content: "Try again" }],
        profile,
        webSearch,
        chunks: citations,
        signal: controller.signal,
        onToken: (token) => {
          partialRef.current += token;
          setStreamText(partialRef.current);
        },
      });

      updateMessage(message.id, {
        content: result.content,
        sources: result.sources,
        citations: result.citations,
        mode: result.mode,
      });
    } catch (error) {
      if (!(error instanceof RequestAbortedError)) {
        toast("Could not regenerate that answer.", "error");
      }
    } finally {
      setStreamText(null);
      setSending(false);
      abortRef.current = null;
    }
  };

  const saveNote = (message: Message) => {
    const title = truncate(
      message.content.replace(/[#*`>]/g, "").split("\n").find((line) => line.trim()) ??
        "Aeva answer",
      70,
    );
    addNote({
      spaceId: activeChat?.spaceId ?? null,
      title,
      markdown: message.content,
    });
    toast("Saved to notes.", "success");
  };

  const makeQuiz = async (message: Message) => {
    toast("Building a quiz from this answer…", "info");
    try {
      const { quiz } = await requestQuiz({
        topic: truncate(message.content.replace(/[#*`>]/g, ""), 60),
        difficulty: "medium",
        count: 5,
        types: ["single", "tf"],
        sourceText: message.content,
      });
      const id = addQuiz({ spaceId: activeChat?.spaceId ?? null, quiz });
      navigate(`/app/quiz/${id}`);
    } catch {
      toast("Quiz generation failed. Try again.", "error");
    }
  };

  const makeDeck = async (message: Message) => {
    toast("Building flashcards from this answer…", "info");
    try {
      const { deck } = await requestDeck({
        topic: truncate(message.content.replace(/[#*`>]/g, ""), 60),
        count: 8,
        sourceText: message.content,
      });
      const id = addDeck({
        spaceId: activeChat?.spaceId ?? null,
        name: `${deck.topic} deck`,
        topic: deck.topic,
        cards: deck.cards,
      });
      navigate(`/app/flashcards/${id}`);
    } catch {
      toast("Flashcard generation failed. Try again.", "error");
    }
  };

  const upload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    for (const file of Array.from(fileList).slice(0, 3)) {
      try {
        const extracted = await extractFile(file);
        addFile({
          spaceId: activeChat?.spaceId ?? spaceId,
          name: extracted.name,
          mime: extracted.mime,
          size: extracted.size,
          pages: extracted.pages,
          kind: extracted.kind,
          text: extracted.text,
        });
        if (extracted.warning) toast(extracted.warning, "info");
        else toast(`${extracted.name} added · ${extracted.pages} pages`, "success");
      } catch {
        toast(`Could not read ${file.name}.`, "error");
      }
    }
    setUploading(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void handleSend();
  };

  const spaceFiles = files.filter((file) => file.spaceId === spaceId || file.spaceId === null);

  return (
    <div className="grid gap-4 xl:grid-cols-[250px_1fr]">
      <aside className="hidden xl:block">
        <div className="sticky top-24 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              setDraft("");
              navigate("/app/chat");
            }}
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
          <div className="space-y-1">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Recent
            </p>
            {chats.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                Your conversations will appear here.
              </p>
            ) : (
              chats.slice(0, 14).map((chat) => (
                <div
                  key={chat.id}
                  className={`group flex items-center gap-1 rounded-lg pr-1 transition ${
                    chat.id === chatId ? "bg-primary/10" : "hover:bg-muted/60"
                  }`}
                >
                  <Link
                    to={`/app/chat/${chat.id}`}
                    className="min-w-0 flex-1 px-2.5 py-2"
                  >
                    <span className="block truncate text-[12.5px] font-medium">{chat.title}</span>
                    <span className="block text-[10.5px] text-muted-foreground">
                      {formatRelative(chat.updatedAt)}
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-label={`Delete chat ${chat.title}`}
                    onClick={() => {
                      deleteChat(chat.id);
                      if (chat.id === chatId) navigate("/app/chat");
                    }}
                    className="rounded-md p-1 text-muted-foreground opacity-0 transition hover:text-danger group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold">
                {activeChat?.title ?? "New conversation"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {activeChat?.spaceId
                  ? spaces.find((space) => space.id === activeChat.spaceId)?.name
                  : "General study"}
              </p>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {!activeChat ? (
              <select
                aria-label="Study space"
                className="h-9 rounded-lg border border-border bg-card px-2 text-[12px]"
                value={spaceId ?? ""}
                onChange={(event) => setSpaceId(event.target.value || null)}
              >
                <option value="">General</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            ) : null}
            <label className="flex items-center gap-2 rounded-lg border border-border/70 px-2.5 py-1.5 text-[12px] font-medium">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              Web
              <Switch checked={webSearch} onCheckedChange={setWebSearch} label="Web search" />
            </label>
          </div>
        </div>

        <Card className="flex min-h-[calc(100dvh-15rem)] flex-col overflow-hidden">
          <div className="flex-1 space-y-5 p-4 sm:p-5">
            {chatMessages.length === 0 && streamText === null ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-2 py-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lift">
                  <Bot className="h-6 w-6 text-white" />
                </span>
                <h2 className="mt-4 text-lg font-semibold tracking-tight">
                  What are we studying today?
                </h2>
                <p className="mt-1 max-w-md text-[13px] text-muted-foreground">
                  Ask a question, paste a problem, or attach your notes and ask Aeva to explain
                  them with page citations.
                </p>
                <div className="mt-5 grid w-full max-w-lg gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void handleSend(suggestion)}
                      className="rounded-xl border border-border/70 bg-background/50 px-3 py-2.5 text-left text-[12.5px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {chatMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                busy={sending}
                onCitation={setCitation}
                onSaveNote={saveNote}
                onQuiz={(item) => void makeQuiz(item)}
                onDeck={(item) => void makeDeck(item)}
                onRegenerate={(item) => void regenerate(item)}
              />
            ))}

            {streamText !== null ? (
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                  <Bot className="h-4 w-4 text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-[13px] font-semibold">Aeva</span>
                    <span className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
                      <Spinner className="h-3 w-3" /> thinking
                    </span>
                  </div>
                  <div className="rounded-2xl rounded-tl-md border border-border/60 bg-card px-4 py-3">
                    {streamText.length > 0 ? (
                      <Markdown>{`${streamText}▍`}</Markdown>
                    ) : (
                      <div className="space-y-2">
                        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-full animate-pulse rounded bg-muted" />
                        <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          <form onSubmit={onSubmit} className="border-t border-border/60 bg-card/80 p-3 sm:p-4">
            {contextFiles.length > 0 ? (
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">File context:</span>
                {contextFiles.slice(0, 3).map((file) => (
                  <span key={file.id} className="chip">
                    <FileText className="h-3 w-3" />
                    {truncate(file.name, 22)} · {file.pages}p
                  </span>
                ))}
                {contextFiles.length > 3 ? (
                  <span className="chip">+{contextFiles.length - 3}</span>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-2xl border border-border/70 bg-background/60 p-2 focus-within:border-primary/40">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask Aeva anything — Enter to send, Shift+Enter for a new line"
                rows={1}
                className="max-h-40 min-h-[44px] resize-none border-0 bg-transparent px-2 py-2 focus:ring-0"
                aria-label="Message Aeva"
              />
              <div className="flex items-center gap-1 px-1 pb-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setAttachOpen(true)}
                  aria-label="Attach study material"
                  title="Attach study material"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <span className="hidden text-[11px] text-muted-foreground sm:inline">
                  {webSearch ? "Web-grounded answers on" : "Answers from your study context"}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  {sending ? (
                    <Button type="button" variant="outline" size="sm" onClick={stop}>
                      <Square className="h-3 w-3 fill-current" />
                      Stop
                    </Button>
                  ) : null}
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-xl"
                    aria-label="Send message"
                    disabled={draft.trim().length === 0 || sending}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <p className="mt-1.5 px-1 text-[10.5px] text-muted-foreground">
              Aeva can be wrong. Check important facts and cited pages.
            </p>
          </form>
        </Card>
      </div>

      <Modal
        open={citation !== null}
        onClose={() => setCitation(null)}
        title={citation ? `${citation.fileName} · page ${citation.page}` : "Citation"}
        description="Excerpt used to ground this answer."
        size="md"
      >
        <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-border/60 bg-muted/40 p-4">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
            {citation?.text}
          </p>
        </div>
      </Modal>

      <Modal
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        title="Study material"
        description="Text and markdown files are read in your browser. PDFs need the backend parser."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAttachOpen(false)}>
              Done
            </Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} loading={uploading}>
              <Paperclip className="h-4 w-4" />
              Upload file
            </Button>
          </>
        }
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".txt,.md,.markdown,.csv,.json,.pdf,image/*"
          onChange={(event) => {
            void upload(event.target.files);
            event.target.value = "";
          }}
        />
        {spaceFiles.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-5 w-5" />}
            title="No files yet"
            description="Upload notes or a reading to get answers with page citations."
            action={
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                Choose a file
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {spaceFiles.map((file) => {
              const checked = selectedFileIds.includes(file.id);
              return (
                <label
                  key={file.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 p-3 transition hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      setSelectedFileIds((current) =>
                        event.target.checked
                          ? [...current, file.id]
                          : current.filter((id) => id !== file.id),
                      )
                    }
                    className="h-4 w-4 accent-indigo-500"
                  />
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{file.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {humanFileSize(file.size)} · {file.pages} page{file.pages === 1 ? "" : "s"}
                    </span>
                  </span>
                  {file.text.length === 0 ? <Badge variant="warning">Preview only</Badge> : null}
                </label>
              );
            })}
          </div>
        )}
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-[11.5px] leading-relaxed text-muted-foreground">
          <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Only upload material you have the right to use. Files stay in your workspace.
        </div>
      </Modal>
    </div>
  );
}
