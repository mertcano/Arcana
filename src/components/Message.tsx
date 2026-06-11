import type { ChatMessage } from "@/types";
import { SourceList } from "./SourceList";

// Minimal, dependency-free renderer: handles ``` fenced code blocks and
// `inline code`. No raw HTML injection.
function renderContent(text: string) {
  const parts = text.split(/```/);
  return parts.map((part, i) => {
    const isCode = i % 2 === 1;
    if (isCode) {
      const body = part.replace(/^[a-zA-Z0-9]*\n/, "");
      return (
        <pre key={i}>
          <code>{body}</code>
        </pre>
      );
    }
    return part
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((para, j) => (
        <p key={`${i}-${j}`}>
          {para.split(/(`[^`]+`)/).map((seg, k) =>
            seg.startsWith("`") && seg.endsWith("`") ? (
              <code key={k}>{seg.slice(1, -1)}</code>
            ) : (
              <span key={k}>{seg}</span>
            ),
          )}
        </p>
      ));
  });
}

export function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-up">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-raised px-4 py-2.5 text-text">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xs font-medium text-arcane">Arcana</span>
        {message.deep && (
          <span className="rounded-full border border-seal/40 bg-seal/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-seal">
            Deep
          </span>
        )}
      </div>
      <div className="prose-answer max-w-none text-text">
        {message.pending ? (
          <p className="text-muted">Consulting the sources…</p>
        ) : (
          renderContent(message.content)
        )}
      </div>
      {message.sources && <SourceList sources={message.sources} />}
    </div>
  );
}
