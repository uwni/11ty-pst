// Helper functions for Typst
#let format-date(datetime) = {
  [#str(datetime.year)-#str(datetime.month)-#str(datetime.day)]
}

#let make-heading(title) = {
  align(center)[
    #text(size: 20pt, weight: "bold")[#title]
  ]
}

#let info-box(content) = {
  rect(
    fill: rgb("#e3f2fd"),
    stroke: rgb("#2196f3"),
    radius: 4pt,
    inset: 10pt,
    width: 100%,
  )[#content]
}
