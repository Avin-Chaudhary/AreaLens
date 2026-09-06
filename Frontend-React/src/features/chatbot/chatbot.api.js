const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL;

/**
 * Send a question and the current AreaLens chatbot data
 * to the FastAPI chatbot backend.
 *
 * React sends the data.
 * FastAPI is responsible for constructing the actual LLM prompt.
 */
export const sendChatMessage = async (question, chatbotData) => {
  if (!question || !question.trim()) {
    throw new Error("Question cannot be empty");
  }

  if (!chatbotData) {
    throw new Error("No AreaLens chatbot data available");
  }

  const res = await fetch(`${FASTAPI_URL}/chat`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      question: question.trim(),
      chatbotdata: chatbotData,
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
    } catch {
      // Keep default error message.
    }

    throw new Error(message);
  }

  return res.json();
};
