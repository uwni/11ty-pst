# 11ty-pst (eleventy-plugin-typst)

An Eleventy plugin that enables you to write content in [Typst](https://typst.app/) format with automatic dual HTML/PDF output generation.

## Installation

```bash
npm install eleventy-plugin-typst
# or
bun add eleventy-plugin-typst
```

## Usage

### Basic Setup

Add the plugin to your `.eleventy.js` or `eleventy.config.mjs`:

```javascript
import eleventyPluginTypst from "eleventy-plugin-typst";

export default function(eleventyConfig) {
  eleventyConfig.addPlugin(eleventyPluginTypst);
}
```

### Configuration Options

```javascript
eleventyConfig.addPlugin(eleventyPluginTypst, {
  workspace: ".",           // Typst workspace directory
  targets: ["html", "pdf"], // Output formats
  collection: "posts",      // Collection name for generated pages
  fontPath: "fonts"         // Path to custom fonts
});
```

### Template Formats

Add `"typ"` to your template formats in your Eleventy config:

```javascript
export const config = {
  templateFormats: [
    "html",
    "njk",
    "typ"  // Add this line
  ]
};
```

### Writing Typst Files

Create `.typ` files in your content directory. The plugin supports frontmatter through Typst templates:

```typst
#import "/node_modules/eleventy-plugin-typst/typst/template.typ": template-base

#show: template-base.with(
  title: "My Blog Post",
  tags: ("typst", "eleventy", "blog"),
  description: "A blog post written in Typst"
)

= My Blog Post

This is my blog post written in Typst!

== Features

- Automatic HTML generation for web display
- PDF generation for downloads/archives
- Template-based frontmatter configuration
- Custom font loading
- Date and metadata injection
```

### Customize Your Own Template
You very likely want to use different template for different compilation target like html or pdf, do this

```typst
#import "/node_modules/eleventy-plugin-typst/typst/template.typ": template-base, compilation-mode

#let my-template = template-base.with(
  renderer: if compilation-mode == "html" {
    import "html-output.typ": as-html-output
    as-html-output
  } else {
    import "pdf-output.typ": as-pdf-output
    as-pdf-output
  }
)
```

then you can use your own `my-template` function rather than the default one.

### Automatic Dual Output

The plugin automatically generates both HTML and PDF versions of each `.typ` file:

- **HTML**: For web display (uses your layout templates)
- **PDF**: Available at `/archives/{filename}.pdf`

On your frontmatter, use `gen-html: bool` and `gen-pdf: bool` to control these behaviour, like

```typ
#show: post-template.with(
  title: "About",
  layout: "layouts/post.webc",
  gen-pdf: false,
)
```

### Available Variables

Your Typst files have access to these variables:

- `url`: Page URL from Eleventy metadata
- `date`: Page date in ISO format
- `source`: Input file path
- `fileSlug`: File slug
- `buildDate`: Build timestamp
- `commitSha`: Git commit SHA (if available)

## Credits
- 11ty: https://www.11ty.dev
- Typst: https://typst.app
- typst.ts: https://github.com/Myriad-Dreamin/typst.ts
