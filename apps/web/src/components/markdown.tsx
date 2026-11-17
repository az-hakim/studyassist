import { Check, Copy } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { cn } from "@/lib/utils";

/**
 * Markdown is rendered without raw HTML and additionally sanitised. KaTeX needs
 * class/style attributes on its spans, which the extended schema allows; no
 * script, iframe or event-handler attribute can pass through.
 */
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: ["className", "style"],
    div: ["className", "style"],
    code: [["className", /^language-/]],
  },
} as unknown as typeof defaultSchema;

function CodeBlock({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = ref.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className="absolute right-2 top-2 z-10 rounded-lg border border-white/10 bg-white/10 p-1.5 text-white/70 opacity-0 transition hover:bg-white/20 hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre ref={ref}>{children}</pre>
    </div>
  );
}

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("md", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeSanitize, schema]]}
        components={{
          pre: ({ children: preChildren }) => <CodeBlock>{preChildren}</CodeBlock>,
          a: ({ href, children: linkChildren }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {linkChildren}
            </a>
          ),
          table: ({ children: tableChildren }) => (
            <div className="overflow-x-auto">
              <table>{tableChildren}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
