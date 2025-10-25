import { TypstTsNodeBackend } from './typst-ts-node.mjs';
import { TypstCliBackend } from './typst-cli.mjs';

/**
 * Factory function to create appropriate Typst backend
 *
 * @param {Object} options - Backend configuration options
 * @param {string} options.backend - Backend type: "typst-ts-node", "typst-cli-system", or "typst-cli-custom"
 * @param {string} [options.typstPath] - Path to typst executable (for CLI backends)
 * @param {string} [options.workspace] - Typst workspace directory
 * @param {string[]} [options.fontPaths] - Font directories
 * @param {string} [options.buildDate] - Build date JSON string
 * @returns {TypstBackend} Configured backend instance
 */
export function createTypstBackend(options = {}) {
  const {
    backend = "typst-ts-node",
    typstPath,
    workspace = ".",
    fontPaths = ["fonts"],
    buildDate,
  } = options;

  const backendOptions = {
    workspace,
    fontPaths,
    buildDate,
  };

  switch (backend) {
    case "typst-ts-node":
      console.log("Using Typst backend: typst-ts-node-compiler");
      return new TypstTsNodeBackend(backendOptions);

    case "typst-cli-system":
      console.log("Using Typst backend: system typst CLI");
      return new TypstCliBackend({
        ...backendOptions,
        typstPath: "typst",
      });

    case "typst-cli-custom":
      if (!typstPath) {
        throw new Error("typstPath must be specified for typst-cli-custom backend");
      }
      console.log(`Using Typst backend: custom typst CLI at ${typstPath}`);
      return new TypstCliBackend({
        ...backendOptions,
        typstPath,
      });

    default:
      throw new Error(`Unknown backend type: ${backend}. Valid options are: "typst-ts-node", "typst-cli-system", "typst-cli-custom"`);
  }
}
