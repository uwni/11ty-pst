#let frontmatter(
  ..args,
) = {
  [#metadata(
    args.named(),
  )<frontmatter>]
}

#let get-compile-data(..args) = sys.inputs.at(..args)
#let compilation-mode = get-compile-data("target", default: "pdf")
#let commitSha = get-compile-data("commitSha", default: none)

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
  gen-html: true,
  gen-pdf: true,
  date: none,
  title: "untitled post",
  renderer: default-renderer,
  language: "en",
  ..args,
  body,
) = {
  if compilation-mode == "query" {
    let date = if date != none {
      date
    } else {
      "git Last Modified"
    }
    let targets = ("html",) * int(gen-html) + ("pdf",) * int(gen-pdf)

    return frontmatter(
      title: title,
      date: date,
      targets: targets,
      language: language,
      ..args.named(),
    )
  }

  let tags = args.named().at("tags", default: ())

  assert("date" in sys.inputs, message: "date is required in inputs")

  let metadata = (
    title: title,
    tags: tags,
    date: sys.inputs.date,
    gen-pdf: gen-pdf,
    gen-html: gen-html,
    commitSha: commitSha,
    language: language,
  )

  if compilation-mode == "html" or compilation-mode == "pdf" {
    renderer(metadata, body)
  } else {
    panic("Unknown target: " + target)
  }
}
