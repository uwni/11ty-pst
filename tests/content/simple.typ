#import "../utils/helpers.typ": info-box

#metadata((
  title: "Simple Test",
  description: "A simple test with minimal dependencies"
)) <11typst:frontmatter>

= Simple Document

This document only imports the info-box helper.

#info-box[
  This is a simple test to verify basic dependency tracking.
]

== Content

Just some plain text content here.
