import eleventyPluginTypst from "../index.mjs";

export default function (eleventyConfig) {
  // Add the Typst plugin with CLI backend for dependency tracking
  eleventyConfig.addPlugin(eleventyPluginTypst, {
    backend: "typst-cli-system",  // Use CLI backend to test dependency tracking
    workspace: ".",  // Current directory
    targets: ["html", "pdf"],
    collection: "posts",
    htmlOutputRange: "body",
  });

  // Copy assets
  eleventyConfig.addPassthroughCopy("assets");


  return {
    dir: {
      input: "content",
      output: "_site",
      includes: "../_includes",
    },
    templateFormats: ["typ", "html", "md"],
  };
}
