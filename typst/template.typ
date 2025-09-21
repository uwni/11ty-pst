#let frontmatter(
  ..args,
) = {
  [#metadata(
    args.named(),
  )<11typst:frontmatter>]
}

#let fncall(
  code,
) = {
  [#metadata(
    (code: code.text),
  )<11typst:fncall>]
}

#let compilation-mode = "pdf"
#let _eleventy-data = none
#if "eleventyData" in sys.inputs {
  _eleventy-data = json(bytes(sys.inputs.eleventyData))
  assert("target" in _eleventy-data, message: "eleventyData must contain 'target' field")
  compilation-mode = _eleventy-data.target
}

// you can pass a modified renderer function to the `template-base`
// to customize rendering for different modes, note that the `compilation-mode` is exported
// so you can use it in the custom renderer function for conditional rendering
#let default-renderer(metadata, body) = {
  if compilation-mode == "html" {
    body
  } else if compilation-mode == "pdf" {
    body
  } else {
    panic("Unknown renderer mode: " + compilation-mode)
  }
}

#let template-base(
  renderer: default-renderer,
  gen-html: true,
  gen-pdf: true,
  date: none,
  title: "untitled post",
  language: "en",
  tags: (),
  ..args,
) = {
  let targets = ("html",) * int(gen-html) + ("pdf",) * int(gen-pdf)

  if compilation-mode == "query" {
    let date = if date != none {
      date
    } else {
      "git Last Modified"
    }

    return frontmatter(
      title: title,
      date: date,
      targets: targets,
      tags: tags,
      language: language,
      ..args.named(),
    )
  }

  renderer(eleventy-data: _eleventy-data)
}
