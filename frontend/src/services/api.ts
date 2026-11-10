
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === "object" && data !== null) {
      if ("message" in data && typeof data.message === "string") {
        return data.message;
      }

      if ("title" in data && typeof data.title === "string") {
        return data.title;
      }

      if ("errors" in data && typeof data.errors === "object" && data.errors !== null) {
        const messages = Object.values(data.errors)
          .flatMap((value) => Array.isArray(value) ? value : [])
          .filter((value): value is string => typeof value === "string");
        if (messages.length > 0) {
          return messages.join(" ");
        }
      }
    }

    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }

    if (!error.response) {
      return "Cannot connect to the server. Please check your API connection.";
    }

    return `Request failed with status ${error.response.status}.`;
  }

  return "An unexpected error occurred.";
}

export default api;
