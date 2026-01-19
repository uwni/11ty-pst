import { createTypstBackend } from './backends/factory.mjs';

let date = new Date();
let buildDate = JSON.stringify({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
  hour: date.getUTCHours(),
  minute: date.getUTCMinutes(),
  second: date.getUTCSeconds()
});

class InputArgs {
  eleventyData;
  environment;

  constructor(obj) {
    this.eleventyData = JSON.stringify(obj);
    this.environment = process.env.NODE_ENV || null;
  }
}

/**
 * Eleventy Plugin for Typst Integration
 * Provides dual HTML/PDF output from .typ files with automatic pagination
 */
export default function eleventyPluginTypst(eleventyConfig, options = {}) {
  const {
    workspace = ".",
    targets = ["html", "pdf"],
    collection = "posts",
    fontPaths = ["fonts"],
    htmlOutputRange = "body",
    backend = "typst-ts-node",  // Backend type: "typst-ts-node", "typst-cli-system", or "typst-cli-custom"
    pdfOptions = null,
    typstPath,  // Path to typst executable (for CLI backends)
  } = options;

  // Create backend instance
  const backendInstance = createTypstBackend({
    backend,
    typstPath,
    workspace,
    fontPaths,
    buildDate,
    pdfOptions
  });

  console.log(`Eleventy Typst Plugin initialized with backend: ${backendInstance.getName()}`);

  // Register the .typ extension
  eleventyConfig.addExtension("typ", {
    compile: function (_contents, inputPath) {
      return async (data) => {
        let dataObj = {
          metadata: data.metadata,
          page: data.page,
          target: data.target,
          links: data.pagination.pageLinks,
          outputFileExtension: data.outputFileExtension
        };
        let inputArgs = new InputArgs(dataObj);

        const result = data.target === "pdf"
          ? await backendInstance.compilePdf(inputPath, inputArgs)
          : await backendInstance.compileHtml(inputPath, inputArgs, htmlOutputRange);

        const deps = result.dependencies;
        if (deps && Array.isArray(deps)) {
          this.addDependencies(inputPath, deps);
          console.debug(`Typst dependencies for ${inputPath}:`, deps);
        }

        return result.content;
      }
    },
    // inject data for only typst file, which may produce html
    getData: async function (inputPath) {
      let inputArgs = new InputArgs({ target: "query" });
      let frontmatter = await backendInstance.queryFrontmatter(
        inputPath,
        inputArgs,
        "<11typst:frontmatter>"
      );

      // Auto-configure collection data for dual HTML/PDF output
      // here pagination is abused until an official solution is supported for
      // multiple generation
      // see: https://github.com/11ty/eleventy/issues/2205
      return {
        targets: targets,
        // the targets from <frontmatter> should override the defaults
        ...frontmatter,
        pagination: {
          data: "targets",
          alias: "target",
          size: 1,
        },
        permalink: function (data) {
          switch (data.target) {
            case "pdf":
              return `archives/${data.page.fileSlug}.pdf`;
            case "html":
              return;
          }
          return;
        },
        eleventyComputed: {
          layout: ({ target, layout }) => {
            return target === "pdf" ? false : layout;
          },
          outputFileExtension: ({ target }) => {
            return target === "pdf" ? "pdf" : "html";
          }
        }
      };
    },
    read: false,
    outputFileExtension: null
  });


}