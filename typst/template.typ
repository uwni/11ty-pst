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
  panic("fncall is not implemented yet")
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

#let _environment = if "environment" in sys.inputs { sys.inputs.environment }

// you can pass a modified renderer function to the `template-base`
// to customize rendering for different modes, note that the `compilation-mode` is exported
// so you can use it in the custom renderer function for conditional rendering
#let default-renderer(eleventy-data: none) = {
  if compilation-mode == "html" {
    [this is for html output]
  } else if compilation-mode == "pdf" {
    [this is for pdf output]
  } else {
    panic("Unknown renderer mode: " + compilation-mode)
  }
}

#let template-base(
  renderer: default-renderer,
  targets: ("html", "pdf"),
  date: none,
  title: "untitled post",
  language: "en",
  tags: (),
  ..args,
) = {
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

  renderer(environment: _environment, eleventy-data: _eleventy-data)
}
