/** Public assets need the same build-time prefix as Next.js page links. */
export function publicPath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (
    basePath &&
    !/^\/(?:[A-Za-z0-9_~-]+(?:\.[A-Za-z0-9_~-]+)*)(?:\/(?:[A-Za-z0-9_~-]+(?:\.[A-Za-z0-9_~-]+)*))*$/.test(
      basePath,
    )
  ) {
    throw new Error(
      "NEXT_PUBLIC_BASE_PATH must be an absolute URL path without a trailing slash, query or fragment.",
    );
  }
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Public asset paths must start with a single slash.");
  }
  return `${basePath}${path}`;
}
