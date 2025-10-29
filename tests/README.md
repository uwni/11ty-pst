# Test Project for eleventy-plugin-typst

This is a test Eleventy project to verify the dependency tracking feature.

## Structure

```
tests/
├── content/          # Typst content files
│   ├── main.typ      # Main test with multiple imports
│   └── simple.typ    # Simple test with minimal imports
├── utils/            # Typst utility modules
│   ├── helpers.typ   # Helper functions
│   └── metadata.typ  # Metadata utilities
├── _includes/        # Layout templates
│   └── layout.html
└── assets/           # Static assets (if any)
```

## Testing Dependency Tracking

### Setup

1. Install dependencies:
   ```bash
   cd tests
   bun install
   ```

2. Make sure you have Typst CLI installed:
   ```bash
   typst --version
   ```

### Test Build

Build the site once:
```bash
bun test
```

This will generate HTML and PDF files in `_site/`.

### Test Watch Mode (Dependency Tracking)

Start watch mode (without --incremental):
```bash
bun run test:watch
```

**IMPORTANT**: Do NOT use `--incremental` mode as it disables dependency tracking in Eleventy 3.x.

Now try modifying any of these files:
- `utils/helpers.typ` - All .typ files should rebuild
- `utils/metadata.typ` - Files importing it should rebuild
- `content/main.typ` - Only main.typ should rebuild

## Expected Behavior

When you edit `utils/helpers.typ`:
- Eleventy detects the change
- All .typ files that import helpers.typ recompile
- Changes appear in the output immediately

This verifies that the dependency tracking is working correctly!

## Known Limitations

- **Incremental mode** (`--incremental`) is incompatible with dependency tracking in Eleventy 3.x
- The plugin sets `cache: false` to ensure dependencies trigger recompilation
