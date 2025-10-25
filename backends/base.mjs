/**
 * Abstract base class for Typst backend implementations
 */
export class TypstBackend {
  /**
   * Initialize the backend
   * @param {Object} options - Backend-specific options
   */
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Compile Typst to HTML
   * @param {string} inputPath - Path to the .typ file
   * @param {Object} inputArgs - Input arguments for compilation
   * @param {string} outputRange - Output range ("body" or "all")
   * @returns {Promise<string>} HTML content
   */
  async compileHtml(inputPath, inputArgs, outputRange = "body") {
    throw new Error("compileHtml must be implemented by subclass");
  }

  /**
   * Compile Typst to PDF
   * @param {string} inputPath - Path to the .typ file
   * @param {Object} inputArgs - Input arguments for compilation
   * @returns {Promise<Buffer>} PDF binary data
   */
  async compilePdf(inputPath, inputArgs) {
    throw new Error("compilePdf must be implemented by subclass");
  }

  /**
   * Query frontmatter from Typst file
   * @param {string} inputPath - Path to the .typ file
   * @param {Object} inputArgs - Input arguments for compilation
   * @param {string} selector - Query selector
   * @returns {Promise<Object|null>} Frontmatter data
   */
  async queryFrontmatter(inputPath, inputArgs, selector) {
    throw new Error("queryFrontmatter must be implemented by subclass");
  }

  /**
   * Get the name of the backend
   * @returns {string}
   */
  getName() {
    return this.constructor.name;
  }
}
