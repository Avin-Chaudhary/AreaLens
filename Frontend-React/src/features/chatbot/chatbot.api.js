const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL;

/**
 * Send a question to the FastAPI chatbot backend.
 *
 * React sends only:
 *
 * - question
 * - session_id
 *
 * The AreaLens data itself is already stored in the
 * session-specific RAG database on the FastAPI side.
 */
export const sendChatMessage = async (question, sessionId) => {
  if (!question || !question.trim()) {
    throw new Error("Question cannot be empty");
  }

  if (!sessionId) {
    throw new Error("No AreaLens session available");
  }

  const res = await fetch(`${FASTAPI_URL}/chat`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      question: question.trim(),
      session_id: sessionId,
    }),
  });

  if (!res.ok) {
    let message = "Failed to get chatbot response";

    try {
      const errorData = await res.json();

      if (errorData?.detail) {
        message =
          typeof errorData.detail === "string" ? errorData.detail : message;
      }

      if (errorData?.message) {
        message = errorData.message;
      }
    } catch {
      // Keep default error message.
    }

    throw new Error(message);
  }

  return res.json();
};
