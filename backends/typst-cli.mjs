import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
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
      pdfOptions = {},
    } = options;

    this.typstPath = typstPath;
    this.workspace = path.resolve(workspace); // Convert to absolute path
    this.fontPaths = fontPaths;
    this.buildDate = buildDate;
    this.typstArgs = typstArgs;
    this.pdfOptions = pdfOptions;
  }

  /**
   * Execute typst CLI command with streaming support for large outputs
   * If depsPath is provided, reads and returns dependencies after compilation
   */
  async execTypstStream(args, depsPath = null) {
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

      child.on('close', async (code) => {
        if (code !== 0) {
          const stderr = Buffer.concat(stderrChunks).toString('utf-8');
          console.error("Typst CLI execution failed with code:", code);
          console.error("Typst CLI error output:", stderr);
          if (process.env.ELEVENTY_RUN_MOD === "build") {
            process.exit(1);
          }
          reject(new Error(`Typst CLI exited with code ${code}`));
        } else {
          const result = {
            stdout: Buffer.concat(chunks),
            stderr: Buffer.concat(stderrChunks),
            dependencies: null
          };

          // Read dependencies if path provided
          if (depsPath) {
            try {
              const depsContent = await readFile(depsPath, 'utf-8');
              const depsJson = JSON.parse(depsContent);
              // Typst --deps outputs {inputs: [...]} format
              const absoluteDeps = depsJson.inputs ? depsJson.inputs.map(dep => {
                return path.resolve(this.workspace, dep);
              }) : null;
              result.dependencies = absoluteDeps;
            } catch (error) {
              console.warn("Failed to read dependencies:", error);
              result.dependencies = [];
            }
          }

          resolve(result);
        }
      });
    });
  }

  /**
   * Build common CLI arguments including input parameters
   * If depsPath is provided, adds --deps argument
   */
  buildCommonArgs(inputArgs = null, depsPath = null) {
    const args = [];
    let pdfOpts = this.pdfOptions;

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

      if (inputArgs.pdfOptions) {
        pdfOpts = inputArgs.pdfOptions;
      }
    }

    if (pdfOpts?.pdfStandard) {
      args.push('--pdf-standard', pdfOpts.pdfStandard);
    }

    // Add build date if available
    if (this.buildDate) {
      args.push('--input', `buildDate=${this.buildDate}`);
    }

    // Add dependencies output path if specified (defaults to JSON format)
    if (depsPath) {
      args.push('--deps', depsPath);
    }

    // Add custom Typst arguments last (highest priority, can override defaults)
    if (this.typstArgs && this.typstArgs.length > 0) {
      args.push(...this.typstArgs);
    }

    return args;
  }

  async depsPath() {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'typst-deps-'));
    return path.join(tempDir, 'deps.json');
  }


  async compileHtml(inputPath, inputArgs, outputRange = "body") {
    const depsPath = await this.depsPath();
    const args = [
      'compile',
      '--format', 'html',
      '--features', 'html',
      ...this.buildCommonArgs(inputArgs, depsPath),
      inputPath,
      '-'  // Output to stdout
    ];

    const { stdout, dependencies } = await this.execTypstStream(args, depsPath);

    const html = stdout.toString('utf-8');

    // Extract body content if requested
    let result;
    if (outputRange === "body") {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      result = bodyMatch ? bodyMatch[1] : html;
    } else {
      result = html;
    }

    return { content: result, dependencies: dependencies };
  }

  async compilePdf(inputPath, inputArgs, pdfOpts = null) {
    const depsPath = await this.depsPath();

    const args = [
      'compile',
      ...this.buildCommonArgs(inputArgs, depsPath),
      inputPath,
      '-'  // Output to stdout
    ];

    // Use streaming for PDFs to avoid buffer size limits
    const { stdout, dependencies } = await this.execTypstStream(args, depsPath);

    return { content: stdout, dependencies: dependencies };
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
