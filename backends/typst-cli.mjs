import { spawn } from 'node:child_process';
import { TypstBackend } from './base.mjs';

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
      typstArgs = [],  // Custom Typst CLI arguments
    } = options;

    this.typstPath = typstPath;
    this.workspace = workspace;
    this.fontPaths = fontPaths;
    this.buildDate = buildDate;
    this.typstArgs = typstArgs;
  }

  /**
   * Execute typst CLI command with streaming support for large outputs
   */
  async execTypstStream(args) {
    return new Promise((resolve, reject) => {
      const child = spawn(this.typstPath, args);
      const chunks = [];
      const stderrChunks = [];

      child.stdout.on('data', (chunk) => {
        chunks.push(chunk);
      });

      child.stderr.on('data', (chunk) => {
        stderrChunks.push(chunk);
      });

      child.on('error', (error) => {
        reject(error);
      });

      child.on('close', (code) => {
        if (code !== 0) {
          const stderr = Buffer.concat(stderrChunks).toString('utf-8');
          console.error("Typst CLI execution failed with code:", code);
          console.error("Typst CLI error output:", stderr);
          if (process.env.ELEVENTY_RUN_MOD === "build") {
            process.exit(1);
          }
          reject(new Error(`Typst CLI exited with code ${code}`));
        } else {
          resolve({
            stdout: Buffer.concat(chunks),
            stderr: Buffer.concat(stderrChunks)
          });
        }
      });
    });
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

    // Set root directory - always set it to ensure correct path resolution
    if (this.workspace) {
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

    // Add custom Typst arguments last (highest priority, can override defaults)
    if (this.typstArgs && this.typstArgs.length > 0) {
      args.push(...this.typstArgs);
    }

    return args;
  }

  async compileHtml(inputPath, inputArgs, outputRange = "body") {
    const args = [
      'compile',
      '--format', 'html',
      '--features', 'html',
      ...this.buildCommonArgs(inputArgs),
      inputPath,
      '-'  // Output to stdout
    ];

    const { stdout } = await this.execTypstStream(args);
    const html = stdout.toString('utf-8');

    // Extract body content if requested
    if (outputRange === "body") {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        return bodyMatch[1];
      }
    }

    return html;
  }

  async compilePdf(inputPath, inputArgs) {
    const args = [
      'compile',
      ...this.buildCommonArgs(inputArgs),
      inputPath,
      '-'  // Output to stdout
    ];

    // Use streaming for PDFs to avoid buffer size limits
    const { stdout } = await this.execTypstStream(args);
    return stdout;
  }

  async queryFrontmatter(inputPath, inputArgs, selector) {
    try {
      const args = [
        'query',
        '--features', 'html',
        ...this.buildCommonArgs(inputArgs),
        inputPath,
        selector
      ];

      const { stdout } = await this.execTypstStream(args);

      if (stdout) {
        try {
          const result = JSON.parse(stdout.toString('utf-8'));
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
