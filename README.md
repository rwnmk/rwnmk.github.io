# rwnmk

Personal site built with [Hugo](https://gohugo.io), Claude Design and a bunch of tweaking.

Serves as a place to highlight some projects of mine, to talk about what I'm learning, and to put my thoughts down somewhere re: various hobbies.

I use Obsidian to edit, with the git plugin to publish the site. The terminal is a fun little feature, as well as the GitHub activity chart underlaid below the title, which queries the GitHub API and generates the image on-build. The theme is inspired by a certain show I love. The rings/buttons were pulled out of an ideas note I made years ago - cool to see it in action.

I updated the site from the old Hugo template as I wanted to see what Claude Design etc was capable of. I've never enjoyed using any Static Site Generator particularly, it always felt a little awkward, and like the time wasn't spent learning anything particularly interesting or useful. So it's nice to be able to put something like this together in a morning on a weekend.

I've given it a quick test on desktop and mobile, of course, but please feel free to raise bugs :)

## Editing in Obsidian

The **`content/`** folder is opened as a vault. I had Claude edit `content/.obsidian/app.json` for working with Hugo:
markdown links instead of wikilinks, relative link paths, and pasted images saved next to the note.

The plugins used are:

- **Templater**: set the template folder to `templates`. `templates/new-post.md` asks for a title, then creates
  `posts/<slug>/index.md` and fills in the front matter.
- **Obsidian Git**: enables committing and pushing posts from Obsidian; each push to `main` deploys the site.
- **Dataview**: `dashboards/drafts.md` lists drafts and posts missing a summary or tags.
- **Linter**: keeps front matter tidy on save.
- **Paste image rename**: names pasted images properly.

`templates/` and `dashboards/` are excluded from the site (see `[[module.mounts]]` in `hugo.toml`),
as is `.obsidian/`. Hugo doesn't understand `[[wikilinks]]` and `![[embeds]]` so I just don't put them in.

If you do decide to try this yourself, note that editing front matter through Obsidian's Properties panel can drop template YAML.

## Tree / terminal names

The tree menu and the terminal are both generated from `content/`, so they always match.

- `treeName: now.txt` changes the name a file shows as.
- `treeHidden: true` keeps a page out of the tree and the terminal.
- `treeAsDir: true` shows a page as `<folder>/README.md` (set for all projects via `cascade` in `content/projects/_index.md`).

### How it fits together

```
layouts/
  baseof.html               page shell: tree menu, rings, terminal, footer
  home.html                 home page
  single.html               stack / testing / reading
  posts/single.html         a post
  projects/single.html      a project
  list.html                 /posts/
  projects/list.html        /projects/
  taxonomy.html, term.html  /tags/ and /tags/<tag>/
  home.fs.json              → /fs.json, the terminal's file system
  _partials/
    tree.html, tree-dir.html, tree-items.html   the tree menu
    fs-node.html                                 fs.json builder (reuses tree-items)
    rings.html, terminal.html, footer.html, tags.html, post-row.html, project-card.html, cmdhead.html
assets/css/main.css         all styles; colours are CSS variables at the top
assets/js/site.js           scroll ring, menu toggle, terminal (bundled by Hugo's js.Build)
static/fonts/               Roboto Mono + Font Awesome (cut down to 3 icons), with licences
```

Everything in `site.js` is progressive enhancement: without JavaScript the rings and
terminal button hide themselves, and tag chips are plain links to `/tags/<tag>/`.

## Terminal

Reads `/fs.json` on first open. Commands: `ls [-alrR]`, `ll`, `cd`, `pwd`, `cat`, `tree [-a]`,
`open`, `tags [post | #tag]` (alias `list-tags`), `history`, `clear`, `whoami`, `echo`, `exit`.
Tab completion works like zsh: options appear under the prompt, Tab / Shift+Tab / arrows move
the highlight, Enter picks it. History, the current directory and open/closed state are kept
in `sessionStorage`, so the terminal survives navigating between pages.

To add a command, I just add a `case` to the `switch` in `run()` in `assets/js/site.js` and its name to `COMMANDS`.

## GitHub activity behind the name

The home page draws my last year of GitHub contributions faintly behind my name
(`layouts/_partials/activity.html`, styled in `assets/css/activity.css`; change `--activity-opacity` there).

The deploy workflow fetches the data with `scripts/fetch_contributions.py` into `data/contributions.json`
(not committed), and rebuilds daily at 04:17 UTC so it stays current.

## Code highlighting

`assets/css/syntax.css` is a Claude-made Chroma theme ("Unit-01") built from the site palette/Design theme I gave it:
purple keywords, green types, orange numbers and constants, light-green strings, grey italic comments.

## Fonts and licences

- Roboto Mono: Apache 2.0 (`static/fonts/LICENSE-roboto-mono.txt`)
- Font Awesome Free: icons CC BY 4.0, font files SIL OFL 1.1 (`static/fonts/LICENSE-fontawesome.txt`).
  The subset contains only `github`, `at` and `rss`. To add icons, re-subset from the full
  Font Awesome Free webfonts with `pyftsubset --unicodes=... --flavor=woff2`.
