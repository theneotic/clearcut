export type ApiErrorPayload = {
  error?: string;
};

export async function parseApiResponse<T extends ApiErrorPayload>(response: Response): Promise<T> {
  const body = await response.text();
  try {
    return JSON.parse(body) as T;
  } catch {
    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    const looksLikeHtml = contentType.includes("text/html") || /^\s*<html[\s>]/i.test(body);
    if (looksLikeHtml) {
      throw new Error(
        response.status === 404
          ? "The Clearcut API route was not found. Redeploy the project with the container deployment enabled."
          : "The Clearcut API returned an HTML error page instead of JSON. Redeploy the project with the container deployment enabled.",
      );
    }
    throw new Error("The Clearcut API returned an invalid response. Please try again.");
  }
}
