import { NodeCompiler } from '@myriaddreamin/typst-ts-node-compiler';
import { TypstBackend } from './base.mjs';

/**
 * Backend using @myriaddreamin/typst-ts-node-compiler
 */
export class TypstTsNodeBackend extends TypstBackend {
  constructor(options = {}) {
    super(options);

    const {
      workspace = ".",
      fontPaths = ["fonts"],
      buildDate,
      typstArgs,  // Not supported by this backend
      pdfOptions,
    } = options;

    // Validate that unsupported options are not provided
    if (typstArgs && typstArgs.length > 0) {
      throw new Error(
        'typstArgs is not supported by typst-ts-node backend. ' +
        'Custom Typst CLI arguments are only available with typst-cli-system or typst-cli-custom backends.'
      );
    }

    this.compiler = NodeCompiler.create({
      workspace: workspace,
      fontArgs: [{
        fontPaths: fontPaths,
      }],
      inputs: {
        buildDate: buildDate,
      }
    });
  }

  async compileHtml(inputPath, inputArgs, outputRange = "body") {
    let output = this.compiler.tryHtml({
      mainFilePath: inputPath,
      inputs: inputArgs
    });

    output.printDiagnostics();
    if (!output.result) {
      console.error("Typst compilation failed, no HTML generated for", inputPath);
      if (process.env.ELEVENTY_RUN_MOD === "build") {
        process.exit(1);
      }
      return { content: undefined, dependencies: null };
    }

    const content = outputRange === "body" ? output.result.body() : output.result.html();

    // typst-ts-node doesn't support dependency tracking yet
    return { content, dependencies: null };
  }

  async compilePdf(inputPath, inputArgs) {
    let compileResult = this.compiler.compile({
      mainFilePath: inputPath,
      inputs: inputArgs
    });

    const result = compileResult.result;
    compileResult.printDiagnostics();
    if (!result) {
      console.error("Typst compilation failed, no PDF generated for ", inputPath);
      if (process.env.ELEVENTY_RUN_MOD === "build") {
        process.exit(1);
      }
      return { content: undefined, dependencies: null };
    }

    const content = this.compiler.pdf(result, this.options.pdfOptions);

    // typst-ts-node doesn't support dependency tracking yet
    return { content, dependencies: null };
  }

  async queryFrontmatter(inputPath, inputArgs, selector) {
    let frontmatter = null;
    try {
      let result = this.compiler.query({
        mainFilePath: inputPath,
        inputs: inputArgs,
      }, {
        selector: selector
      });
      if (result?.length > 0) {
        frontmatter = result[0].value;
      }
    } catch (e) {
      console.warn("Typst frontmatter query failed:", e);
    }
    return frontmatter;
  }

  getName() {
    return "typst-ts-node-compiler";
  }
}
