# 0.2.0

## Major Features

### Selectable Backend System
- **Added support for multiple Typst compilation backends**
  - `typst-ts-node` (default): Uses `@myriaddreamin/typst-ts-node-compiler` for full HTML/PDF support
  - `typst-cli-system`: Uses system-installed Typst CLI (supports HTML and PDF)
  - `typst-cli-custom`: Uses custom Typst CLI path (supports HTML and PDF)

### Architecture Changes
- **Refactored compilation system** into modular backend architecture
  - New `backends/` directory with pluggable backend implementations
  - Abstract base class `TypstBackend` for consistent interface
  - Factory function `createTypstBackend()` for easy backend selection

### New Configuration Options
- `backend`: Choose compilation backend (`"typst-ts-node"`, `"typst-cli-system"`, or `"typst-cli-custom"`)
- `typstPath`: Specify custom path to Typst executable (for CLI backends)

### Backend Features

#### typst-ts-node Backend (Default)
- Full HTML and PDF compilation support
- Advanced query capabilities for frontmatter
- Fast native compilation
- No external dependencies required

#### CLI Backends (System & Custom)
- PDF compilation support
- Uses native Typst CLI (`--input` for passing data)
- Lightweight - uses existing Typst installation
- **Note**: HTML output not supported (Typst CLI limitation)

## Breaking Changes
- None - Default behavior remains unchanged
- Existing configurations continue to work without modification

## Migration Guide
To use CLI backends instead of the default:

```javascript
// Use system Typst
eleventyConfig.addPlugin(eleventyPluginTypst, {
  backend: "typst-cli-system",
  targets: ["pdf"]  // HTML not available
});

// Use custom Typst path
eleventyConfig.addPlugin(eleventyPluginTypst, {
  backend: "typst-cli-custom",
  typstPath: "/path/to/typst",
  targets: ["pdf"]
});
```

## Package Changes
- Updated version to 0.2.0
- Updated description to reflect selectable backends
- Updated `files` in package.json to include `backends/**/*.mjs`

# 0.1.1
- Update fontPaths option in eleventyPluginTypst and bump version

# 0.1.0
- Update htmlRender function to support output range
- Add environment property to InputArgs

# 0.0.9
- Add environment handling to template

# 0.0.8
- Various improvements

# 0.0.2
- Add readme