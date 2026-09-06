import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../../features/chatbot/chatbot.api";

/*
 * Simple Markdown renderer.
 *
 * We render the common Markdown that the AI produces ourselves so we
 * don't need to add another npm dependency just for chatbot formatting.
 */

function renderInlineMarkdown(text) {
  const parts = [];
  let remaining = String(text ?? "");
  let key = 0;

  /*
   * Handles:
   * - **bold**
   * - *italic*
   * - `code`
   * - [text](url)
   */

  const tokenRegex =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;

  let match;
  let lastIndex = 0;

  while ((match = tokenRegex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${key++}`}>
          {remaining.slice(lastIndex, match.index)}
        </span>,
      );
    }

    const token = match[0];

    // Markdown link
    if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);

      if (linkMatch) {
        parts.push(
          <a
            key={`link-${key++}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            {linkMatch[1]}
          </a>,
        );
      }
    }

    // Bold
    else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={`bold-${key++}`} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>,
      );
    }

    // Italic
    else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={`italic-${key++}`} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    }

    // Inline code
    else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={`code-${key++}`}
          className="
            px-1.5 py-0.5
            rounded-md
            bg-slate-100
            border border-slate-200
            text-[0.9em]
            font-mono
            text-slate-800
          "
        >
          {token.slice(1, -1)}
        </code>,
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < remaining.length) {
    parts.push(<span key={`text-${key++}`}>{remaining.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : remaining;
}

function MarkdownMessage({ content }) {
  const text = String(content ?? "").replace(/\r\n/g, "\n");

  const lines = text.split("\n");

  const elements = [];

  let paragraphLines = [];
  let bulletItems = [];
  let numberedItems = [];
  let codeLines = [];
  let inCodeBlock = false;

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;

    const paragraphText = paragraphLines.join(" ");

    elements.push(
      <p key={`paragraph-${elements.length}`} className="mb-3 last:mb-0">
        {renderInlineMarkdown(paragraphText)}
      </p>,
    );

    paragraphLines = [];
  };

  const flushBullets = () => {
    if (bulletItems.length === 0) return;

    elements.push(
      <ul
        key={`bullets-${elements.length}`}
        className="list-disc pl-5 mb-3 space-y-1.5"
      >
        {bulletItems.map((item, index) => (
          <li key={`bullet-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>,
    );

    bulletItems = [];
  };

  const flushNumbered = () => {
    if (numberedItems.length === 0) return;

    elements.push(
      <ol
        key={`numbered-${elements.length}`}
        className="list-decimal pl-5 mb-3 space-y-1.5"
      >
        {numberedItems.map((item, index) => (
          <li key={`numbered-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ol>,
    );

    numberedItems = [];
  };

  const flushCode = () => {
    if (codeLines.length === 0) return;

    elements.push(
      <pre
        key={`codeblock-${elements.length}`}
        className="
          mb-3
          p-3
          rounded-xl
          bg-slate-900
          text-slate-100
          overflow-x-auto
          text-xs
          leading-relaxed
          font-mono
        "
      >
        <code>{codeLines.join("\n")}</code>
      </pre>,
    );

    codeLines = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushBullets();
    flushNumbered();
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    /*
     * Code blocks
     */
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        flushAll();
        inCodeBlock = true;
      }

      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    /*
     * Empty line = paragraph/list separation
     */
    if (!trimmed) {
      flushAll();
      return;
    }

    /*
     * Markdown headings
     *
     * # Heading
     * ## Heading
     * ### Heading
     */
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      flushAll();

      const level = headingMatch[1].length;

      const headingClasses = {
        1: "text-xl font-bold text-slate-900 mb-3 mt-4",
        2: "text-lg font-bold text-slate-900 mb-2 mt-4",
        3: "text-base font-semibold text-slate-900 mb-2 mt-3",
        4: "text-sm font-semibold text-slate-900 mb-2 mt-3",
        5: "text-sm font-semibold text-slate-800 mb-1 mt-2",
        6: "text-sm font-medium text-slate-800 mb-1 mt-2",
      };

      const className = headingClasses[level];

      const HeadingTag = `h${level}`;

      elements.push(
        <HeadingTag key={`heading-${index}`} className={className}>
          {renderInlineMarkdown(headingMatch[2])}
        </HeadingTag>,
      );

      return;
    }

    /*
     * Bullet lists
     *
     * - item
     * * item
     * + item
     */
    const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);

    if (bulletMatch) {
      flushParagraph();
      flushNumbered();

      bulletItems.push(bulletMatch[1]);

      return;
    }

    /*
     * Numbered lists
     *
     * 1. item
     * 2. item
     */
    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);

    if (numberedMatch) {
      flushParagraph();
      flushBullets();

      numberedItems.push(numberedMatch[1]);

      return;
    }

    /*
     * Blockquote
     */
    const quoteMatch = trimmed.match(/^>\s?(.*)$/);

    if (quoteMatch) {
      flushAll();

      elements.push(
        <blockquote
          key={`quote-${index}`}
          className="
            mb-3
            border-l-4
            border-slate-300
            pl-4
            py-1
            text-slate-600
            italic
          "
        >
          {renderInlineMarkdown(quoteMatch[1])}
        </blockquote>,
      );

      return;
    }

    /*
     * Horizontal rule
     */
    if (/^([-*_]){3,}$/.test(trimmed)) {
      flushAll();

      elements.push(
        <hr key={`hr-${index}`} className="my-4 border-slate-200" />,
      );

      return;
    }

    /*
     * Normal paragraph line.
     *
     * Multiple consecutive lines are combined into one paragraph.
     */
    paragraphLines.push(trimmed);
  });

  /*
   * Flush whatever is left at the end.
   */
  if (inCodeBlock) {
    flushCode();
  }

  flushAll();

  /*
   * Empty response fallback
   */
  if (elements.length === 0) {
    return <p className="text-slate-500">{text}</p>;
  }

  return <div className="break-words">{elements}</div>;
}

export default function AreaChatbot({ chatbotData }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  /*
   * IMPORTANT:
   *
   * We use the actual messages container instead of scrollIntoView().
   *
   * scrollIntoView() can scroll the ENTIRE webpage.
   *
   * scrollTop/scrollHeight only scrolls the chatbot's own message box.
   */
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  /*
   * When chatbotData changes, it means the user selected
   * a different area.
   *
   * Therefore the previous conversation must disappear.
   */
  useEffect(() => {
    setMessages([]);
    setInput("");
    setLoading(false);
  }, [chatbotData]);

  /*
   * Automatically scroll ONLY the chatbot message container
   * to the newest message.
   */
  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    /*
     * requestAnimationFrame waits until the new message has
     * actually been rendered before calculating scrollHeight.
     */
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages, loading]);

  const handleSend = async () => {
    const question = input.trim();

    if (!question || loading || !chatbotData) {
      return;
    }

    /*
     * Immediately show user's message.
     */
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: question,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      /*
       * React sends:
       *
       * question
       * current area's chatbotData
       *
       * FastAPI constructs the final LLM prompt.
       */
      const response = await sendChatMessage(question, chatbotData);

      /*
       * Support a few common response shapes so the
       * frontend isn't unnecessarily fragile.
       */
      const answer =
        response?.answer ??
        response?.response ??
        response?.message ??
        response?.data?.answer ??
        response?.data?.response ??
        "I couldn't generate an answer.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: String(answer),
        },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error?.message ||
            "Sorry, something went wrong while answering your question.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);

      /*
       * Put cursor back in the input.
       */
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (event) => {
    /*
     * Enter sends the message.
     *
     * Shift + Enter creates a new line.
     */
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  if (!chatbotData) {
    return null;
  }

  return (
    <section className="max-w-6xl mx-auto px-6 pb-16">
      <div
        className="
          bg-white
          rounded-3xl
          border border-slate-200
          shadow-sm
          overflow-hidden
        "
      >
        {/* ───────────────── HEADER ───────────────── */}

        <div
          className="
            px-6 py-5
            border-b border-slate-200
            flex items-center justify-between
          "
        >
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              AreaLens AI
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Ask anything about this area
            </p>
          </div>

          <div
            className="
              h-10 w-10
              rounded-full
              bg-blue-50
              flex items-center justify-center
              text-blue-600
              font-semibold
            "
          >
            AI
          </div>
        </div>

        {/* ───────────────── MESSAGES ───────────────── */}

        <div
          ref={messagesContainerRef}
          className="
            h-[420px]
            overflow-y-auto
            px-5 py-6
            bg-slate-50
            scroll-smooth
          "
        >
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-md text-center">
                <div
                  className="
                    mx-auto mb-4
                    h-14 w-14
                    rounded-2xl
                    bg-blue-100
                    flex items-center justify-center
                    text-blue-600
                    font-bold
                  "
                >
                  AI
                </div>

                <h3 className="font-semibold text-slate-900 mb-2">
                  Explore this area
                </h3>

                <p className="text-sm text-slate-500 leading-relaxed">
                  Ask about nearby hospitals, restaurants, banks, transport,
                  parks, shopping and other information available for this area.
                </p>

                <div className="flex flex-wrap justify-center gap-2 mt-5">
                  {[
                    "What hospitals are nearby?",
                    "What restaurants are closest?",
                    "How is the public transport?",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="
                        px-3 py-2
                        rounded-full
                        border border-slate-200
                        bg-white
                        text-xs text-slate-600
                        hover:border-blue-300
                        hover:text-blue-600
                        transition
                      "
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`
                        max-w-[80%]
                        rounded-2xl
                        px-4 py-3
                        text-sm
                        leading-relaxed
                        ${
                          isUser
                            ? "bg-blue-600 text-white rounded-br-md"
                            : message.isError
                              ? "bg-red-50 text-red-700 border border-red-100 rounded-bl-md"
                              : "bg-white text-slate-700 border border-slate-200 rounded-bl-md"
                        }
                      `}
                    >
                      {isUser ? (
                        /*
                         * User messages remain normal text.
                         * We don't interpret user input as Markdown.
                         */
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      ) : (
                        /*
                         * AI messages get proper Markdown formatting.
                         */
                        <MarkdownMessage content={message.content} />
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div
                    className="
                      bg-white
                      border border-slate-200
                      rounded-2xl rounded-bl-md
                      px-4 py-3
                      text-sm text-slate-500
                    "
                  >
                    <div className="flex items-center gap-1">
                      <span className="animate-bounce">•</span>

                      <span
                        className="animate-bounce"
                        style={{ animationDelay: "100ms" }}
                      >
                        •
                      </span>

                      <span
                        className="animate-bounce"
                        style={{ animationDelay: "200ms" }}
                      >
                        •
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ───────────────── INPUT ───────────────── */}

        <div className="p-4 border-t border-slate-200 bg-white">
          <div
            className="
              flex items-end gap-3
              border border-slate-200
              rounded-2xl
              p-2
              focus-within:border-blue-400
              focus-within:ring-2
              focus-within:ring-blue-100
              transition
            "
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={1}
              placeholder="Ask about this area..."
              className="
                flex-1
                resize-none
                outline-none
                border-none
                px-3 py-2
                text-sm
                text-slate-700
                placeholder:text-slate-400
                bg-transparent
                max-h-32
              "
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="
                shrink-0
                h-10 w-10
                rounded-xl
                bg-blue-600
                text-white
                flex items-center justify-center
                disabled:opacity-40
                disabled:cursor-not-allowed
                hover:bg-blue-700
                transition
              "
              aria-label="Send message"
            >
              ↑
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 px-2">
            AreaLens AI answers using information available for the currently
            selected area.
          </p>
        </div>
      </div>
    </section>
  );
}
