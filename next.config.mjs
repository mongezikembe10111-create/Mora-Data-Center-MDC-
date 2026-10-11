import createMDX from "@next/mdx";
const withMDX = createMDX({ extension: /\.mdx?$/ });
export default withMDX({
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  poweredByHeader: false,
  distDir: process.env.MORA_BUILD_DIR || ".next",
  allowedDevOrigins: ["127.0.0.1"],
});
