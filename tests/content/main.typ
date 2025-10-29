#import "../utils/helpers.typ": format-date, make-heading, info-box
#import "../utils/metadata.typ": version, render-metadata

#metadata((
  title: "Test Post with Dependencies",
  tags: ("test", "dependencies", "typst"),
  description: "A test post to verify dependency tracking",
  layout: "../_includes/layout.html"
)) <11typst:frontmatter>

#make-heading("Test Post with Dependencies")

= Introduction

This is a test document that imports multiple Typst modules to test the dependency tracking feature.

#info-box[
  This document uses helper functions from `utils/helpers.typ` and metadata from `utils/metadata.typ`.
]

= Metadata

#render-metadata()

= Current Features

- Automatic dependency tracking
- Module imports detection
- Watch mode integration
- Version: #version

= Date Example

Build date: #format-date((year: 2025, month: 10, day: 29))
// Updated
