import createMDX from "@next/mdx";
const withMDX = createMDX({ extension: /\.mdx?$/ });
const staticExport = process.env.PUBLIC_SQUARE_STATIC_EXPORT === "1";
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
export default withMDX({
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  poweredByHeader: false,
  distDir: process.env.MORA_BUILD_DIR || ".next",
  allowedDevOrigins: ["127.0.0.1"],
  basePath,
  ...(staticExport ? { output: "export", trailingSlash: true } : {}),
});
