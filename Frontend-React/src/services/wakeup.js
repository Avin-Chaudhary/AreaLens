export const wakeBackend = async () => {
  try {
    await fetch(`${import.meta.env.VITE_FASTAPI_URL}/health`);
  } catch {
    console.warn("FastAPI wakeup failed");
  }
};
