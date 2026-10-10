# Drafts and loose ends

Needs the Dataview plugin. This folder is excluded from the site build.

## Drafts

```dataview
TABLE date, tags
FROM "posts"
WHERE draft = true
SORT date DESC
```

## Missing a summary or tags

```dataview
TABLE summary, tags
FROM "posts"
WHERE !summary OR length(tags) = 0
```

## Placeholders still to fill

Dataview can't search note text, so use Obsidian's search with a regex instead:
`/\[[A-Z][A-Z ]+\]/`
