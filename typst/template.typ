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

  let date = if "date" in sys.inputs { sys.inputs.date }

  let metadata = (
    title: title,
    tags: tags,
    gen-pdf: gen-pdf,
    gen-html: gen-html,
    commitSha: commitSha,
    language: language,
    date: date,
  )

  renderer(metadata, body)
}
