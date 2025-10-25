import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { TypstBackend } from './base.mjs';

const execFileAsync = promisify(execFile);

/**
 * Backend using Typst CLI (system or custom path)
 */
export class TypstCliBackend extends TypstBackend {
  constructor(options = {}) {
    super(options);

    const {
      typstPath = "typst",  // Default to system typst
      workspace = ".",
      fontPaths = [],
      buildDate,
    } = options;

    this.typstPath = typstPath;
    this.workspace = workspace;
    this.fontPaths = fontPaths;
    this.buildDate = buildDate;
  }

  /**
   * Execute typst CLI command
   */
  async execTypst(args, options = {}) {
    try {
      const { stdout, stderr } = await execFileAsync(this.typstPath, args, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        ...options
      });
      if (stderr) {
        console.warn("Typst CLI warnings:", stderr);
      }
      return { stdout, stderr };
    } catch (error) {
      console.error("Typst CLI execution failed:", error.message);
      if (error.stderr) {
        console.error("Typst CLI error output:", error.stderr);
      }
      if (process.env.ELEVENTY_RUN_MOD === "build") {
        process.exit(1);
      }
      throw error;
    }
  }

  /**
   * Build common CLI arguments including input parameters
   */
  buildCommonArgs(inputArgs = null) {
    const args = [];

    // Add font paths
    for (const fontPath of this.fontPaths) {
      args.push('--font-path', fontPath);
    }

    // Set root directory
    if (this.workspace && this.workspace !== '.') {
      args.push('--root', this.workspace);
    }

    // Add input arguments using --input flag
    if (inputArgs) {
      if (inputArgs.eleventyData) {
        args.push('--input', `eleventyData=${inputArgs.eleventyData}`);
      }
      if (inputArgs.environment) {
        args.push('--input', `environment=${inputArgs.environment}`);
      }
    }

    // Add build date if available
    if (this.buildDate) {
      args.push('--input', `buildDate=${this.buildDate}`);
    }

    return args;
  }

  async compileHtml(inputPath, inputArgs, outputRange = "body") {
    console.warn("Warning: Typst CLI HTML output requires building with --features html.");
    console.warn("If you encounter errors, ensure your Typst installation supports HTML output.");

    const args = [
      'compile',
      ...this.buildCommonArgs(inputArgs),
      inputPath,
      '-'  // Output to stdout
    ];

    const { stdout } = await this.execTypst(args);

    // Extract body content if requested
    if (outputRange === "body") {
      const bodyMatch = stdout.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        return bodyMatch[1];
      }
    }

    return stdout;
  }

  async compilePdf(inputPath, inputArgs) {
    const args = [
      'compile',
      ...this.buildCommonArgs(inputArgs),
      inputPath,
      '-'  // Output to stdout
    ];

    const { stdout } = await this.execTypst(args, {
      encoding: null,  // Return Buffer instead of string
      maxBuffer: 50 * 1024 * 1024  // 50MB for large PDFs
    });

    return stdout;
  }

  async queryFrontmatter(inputPath, inputArgs, selector) {
    console.warn("Warning: Frontmatter query is limited with Typst CLI backend.");
    console.warn("Advanced queries may not work as expected.");

    try {
      const args = [
        'query',
        ...this.buildCommonArgs(inputArgs),
        inputPath,
        selector
      ];

      const { stdout } = await this.execTypst(args);

      if (stdout) {
        try {
          const result = JSON.parse(stdout);
          if (Array.isArray(result) && result.length > 0) {
            return result[0].value || result[0];
          }
        } catch (e) {
          console.warn("Failed to parse query result:", e);
        }
      }

      return null;
    } catch (error) {
      console.warn("Typst frontmatter query failed:", error.message);
      return null;
    }
  }

  getName() {
    return this.typstPath === "typst" ? "typst-cli (system)" : `typst-cli (${this.typstPath})`;
  }
}
