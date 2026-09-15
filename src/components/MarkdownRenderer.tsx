import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Terminal } from "lucide-react";

interface CodeBlockProps {
  language?: string;
  children: string;
}

export function CodeBlock({ language = "code", children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  return (
    <div className="my-2.5 sm:my-3 rounded-lg border theme-border theme-bg-code overflow-hidden shadow-md text-sm font-mono max-w-full">
      <div className="flex items-center justify-between px-2.5 sm:px-3.5 py-1.5 theme-bg-code-header border-b theme-border text-xs text-slate-200">
        <div className="flex items-center gap-1.5 min-w-0">
          <Terminal className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="font-medium text-slate-200 tracking-wider uppercase truncate text-[11px] sm:text-xs">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 min-h-[28px] rounded hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors flex-shrink-0"
          title="Copy code"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-2.5 sm:p-4 overflow-x-auto text-slate-200 leading-relaxed font-mono text-[12px] sm:text-[13px] max-w-full">
        <pre className="overflow-x-auto">
          <code className="break-normal whitespace-pre">{children}</code>
        </pre>
      </div>
    </div>
  );
}

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-body space-y-2 theme-text-primary leading-relaxed text-[14px] sm:text-[15px] max-w-full break-words [overflow-wrap:anywhere] overflow-hidden">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");
            const isInline = !match && !codeString.includes("\n");

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded theme-bg-tag theme-text-accent font-mono text-[12px] sm:text-[13px] border theme-border-subtle break-words"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock language={match ? match[1] : "code"}>
                {codeString}
              </CodeBlock>
            );
          },
          h1: ({ children }) => (
            <h1 className="text-lg sm:text-xl font-bold theme-text-primary mt-3.5 mb-2 pb-1 border-b theme-border">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base sm:text-lg font-semibold theme-text-primary mt-3 mb-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm sm:text-base font-medium text-amber-600 dark:text-amber-300 mt-2.5 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-4 sm:pl-5 my-2 space-y-1 theme-text-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 sm:pl-5 my-2 space-y-1 theme-text-primary">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-amber-500 pl-3 sm:pl-3.5 py-0.5 my-2 theme-text-secondary italic bg-amber-500/5 rounded-r">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border theme-border max-w-full">
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-full">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="theme-bg-surface-hover theme-text-primary border-b theme-border">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y theme-border-subtle">{children}</tbody>
          ),
          th: ({ children }) => (
            <th className="px-2.5 sm:px-3.5 py-2 font-semibold text-[11px] sm:text-xs uppercase tracking-wider theme-text-secondary">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2.5 sm:px-3.5 py-2 theme-text-secondary text-[11px] sm:text-xs">{children}</td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-amber-600 dark:text-amber-400 hover:text-amber-500 underline underline-offset-2 transition-colors break-words [overflow-wrap:anywhere]"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg border theme-border my-2"
              loading="lazy"
            />
          ),
          hr: () => <hr className="border-b theme-border my-3.5" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
