import { NodeCompiler } from '@myriaddreamin/typst-ts-node-compiler';

let date = new Date();
let buildDate = JSON.stringify({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
  hour: date.getUTCHours(),
  minute: date.getUTCMinutes(),
  second: date.getUTCSeconds()
});

async function htmlRender(compiler, inputArgs, inputPath) {
  let output = compiler.tryHtml({
    mainFilePath: inputPath,
    inputs: inputArgs
  });

  output.printDiagnostics();
  if (!output.result) {
    console.error("Typst compilation failed, no HTML generated.");
    if (process.env.ELEVENTY_RUN_MOD === "build") {
      process.exit(1);
    }
    return;
  }
  return output.result.body();
}

async function pdfRender(compiler, inputArgs, inputPath) {
  let compileResult = compiler.compile({
    mainFilePath: inputPath,
    inputs: inputArgs
  });

  const result = compileResult.result;
  if (!result) {
    console.error("Typst compilation failed, no PDF generated.");
    compileResult.printDiagnostics();
    if (process.env.ELEVENTY_RUN_MOD === "build") {
      process.exit(1);
    }
    return;
  }
  return compiler.pdf(result);
}

async function getFrontmatter(compiler, inputPath) {
  let frontmatter = null;
  try {
    let result = compiler.query({
      mainFilePath: inputPath,
      inputs: {
        target: "query",
      }
    }, {
      selector: "<frontmatter>"
    });
    if (result?.length > 0) {
      frontmatter = result[0].value;
    }
  } catch (e) {
    console.warn("Typst frontmatter query failed:", e);
  }
  return frontmatter;
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
    fontPath = "fonts"
  } = options;

  const compiler = NodeCompiler.create({
    workspace: workspace,
    fontArgs: [{
      fontPaths: [fontPath],
    }],
    inputs: {
      buildDate: buildDate,
    }
  });

  // Register the .typ extension
  eleventyConfig.addExtension("typ", {
    compile: function (contents, inputPath) {
      return async (data) => {

        let inputArgs = {};

        if (data?.metadata?.url) inputArgs.url = data.metadata.url;
        if (data?.target) inputArgs.target = data.target;
        if (data?.page?.date) inputArgs.date = data.page.date.toISOString();
        if (data?.page?.inputPath) inputArgs.source = data.page.inputPath;
        if (data?.page?.outputPath) inputArgs.source = data.page.outputPath;
        if (data?.page?.fileSlug) inputArgs.fileSlug = data.page.fileSlug;
        if (data?.metadata?.commitSha) inputArgs.commitSha = data.metadata.commitSha;

        return data.target === "pdf" ? pdfRender(compiler, inputArgs, inputPath)
          : htmlRender(compiler, inputArgs, inputPath);
      }
    },
    // inject data for only typst file, which may produce html
    getData: async function (inputPath) {
      let frontmatter = await getFrontmatter(compiler, inputPath);
      // console.log(frontmatter)
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
              return `/archives/${data.page.fileSlug}.pdf`;
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