# rowan-site

Personal site built with [Hugo](https://gohugo.io) (tested with v0.167.0). No theme, no npm, no build step beyond `hugo`.

## Run it locally

```sh
hugo server          # http://localhost:1313, rebuilds on save
hugo --gc --minify   # production build into ./public
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo (branch `main`).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` runs `.github/workflows/hugo.yml`, which builds and publishes the site.

The workflow passes the real Pages URL as `baseURL`, so it works for both
`<user>.github.io` and `<user>.github.io/<repo>/`. Bump `HUGO_VERSION` in the workflow when you upgrade Hugo locally.

## Before you publish

- `hugo.toml`: set `baseURL`, and fill `params.social.github` / `params.social.email` (empty values hide those footer links).
- Replace every `[BRACKETED PLACEHOLDER]` in `content/`.
- Set real `date`s on the posts (marked `# TODO`).

## Writing

Each post is a folder: `content/posts/<slug>/index.md`, with its images beside it.

```sh
hugo new content posts/my-new-post/index.md   # starts as draft: true
```

Post front matter:

| key       | what it does                                        |
|-----------|-----------------------------------------------------|
| `title`   | post title                                          |
| `date`    | sort order, `ls -l` dates                            |
| `tags`    | tag chips, `/tags/<tag>/` pages, the `tags` command |
| `summary` | the line under the title in lists                   |
| `image`   | square image beside the post: a file in the post's folder (`cover.png`) or a site path (`/images/x.png`) |
| `draft`   | `true` keeps it off the live site (`hugo server -D` shows drafts) |

Links and images can be ordinary relative markdown, e.g. `[other post](../other-post/index.md)` or
`![](diagram.png)`; Hugo turns them into the right URLs when it builds.

Projects live in `content/projects/<name>/index.md` with `status` (`WIP` / `LIVE`), `link`, `linkLabel`, `summary` and `weight` (order).

`content/about.md`, `now.md` and `contact.md` aren't pages of their own: they're shown on the home page (`anchor:` says where).
`about.md` also holds the three home-page cards.

## Editing in Obsidian

Open **`content/`** (not the repo root) as a vault. It ships with `content/.obsidian/app.json` set up for Hugo:
markdown links instead of wikilinks, relative link paths, and pasted images saved next to the note.

Suggested plugins:

- **Templater**: set its template folder to `templates`. `templates/new-post.md` asks for a title, creates
  `posts/<slug>/index.md` and fills in the front matter. (Create any note, then run *Templater: Replace templates in the active file*,
  or set it as the folder template for `posts/`.)
- **Obsidian Git**: commit and push from Obsidian; each push to `main` deploys the site.
- **Dataview**: `dashboards/drafts.md` lists drafts and posts missing a summary or tags.
- **Linter**: keeps front matter tidy on save.
- **Paste image rename**: names pasted images properly.

`templates/` and `dashboards/` are excluded from the site (see `[[module.mounts]]` in `hugo.toml`),
as is `.obsidian/`. Avoid `[[wikilinks]]` and `![[embeds]]`: Hugo doesn't understand them.
Editing front matter through Obsidian's Properties panel can drop YAML `# comments`.

### Tree / terminal names

The tree menu and the terminal are both generated from `content/`, so they always match.

- `treeName: now.txt` changes the name a file shows as.
- `treeHidden: true` keeps a page out of the tree and the terminal.
- `treeAsDir: true` shows a page as `<folder>/README.md` (set for all projects via `cascade` in `content/projects/_index.md`).

## How it fits together

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

### Terminal

Reads `/fs.json` on first open. Commands: `ls [-alrR]`, `ll`, `cd`, `pwd`, `cat`, `tree [-a]`,
`open`, `tags [post | #tag]` (alias `list-tags`), `history`, `clear`, `whoami`, `echo`, `exit`.
Tab completion works like zsh: options appear under the prompt, Tab / Shift+Tab / arrows move
the highlight, Enter picks it. History, the current directory and open/closed state are kept
in `sessionStorage`, so the terminal survives navigating between pages.

To add a command, add a `case` to the `switch` in `run()` in `assets/js/site.js` and its name to `COMMANDS`.

## GitHub activity behind the name

The home page draws your last year of GitHub contributions faintly behind your name
(`layouts/_partials/activity.html`, styled in `assets/css/activity.css`; change `--activity-opacity` there).

The deploy workflow fetches the data with `scripts/fetch_contributions.py` into `data/contributions.json`
(not committed), and rebuilds daily at 04:17 UTC so it stays current.

One-time setup:

1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate.
   Public repositories (read-only) is enough; no extra permissions needed.
2. In this repo: Settings → Secrets and variables → Actions → New repository secret,
   name **`CONTRIB_TOKEN`**, value = the token.
3. Optional: to count private work too, turn on *Include private contributions on my profile*
   in your GitHub profile settings.

Without the secret the build still works; the grid just doesn't appear.

To preview it locally: `GH_TOKEN=<token> python3 scripts/fetch_contributions.py rwnmk data/contributions.json`, then `hugo server`.

## Code highlighting

`assets/css/syntax.css` is a hand-made Chroma theme ("Unit-01") built from the site palette:
purple keywords, green types, orange numbers and constants, light-green strings, grey italic comments.
To use a stock theme instead, regenerate the file, e.g.:

```sh
hugo gen chromastyles --style=dracula > assets/css/syntax.css
```

(`main.css` keeps the code background on the site's dark grey whichever theme you use.)

## Fonts and licences

- Roboto Mono: Apache 2.0 (`static/fonts/LICENSE-roboto-mono.txt`)
- Font Awesome Free: icons CC BY 4.0, font files SIL OFL 1.1 (`static/fonts/LICENSE-fontawesome.txt`).
  The subset contains only `github`, `at` and `rss`. To add icons, re-subset from the full
  Font Awesome Free webfonts with `pyftsubset --unicodes=... --flavor=woff2`.
