# rwnmk.github.io

> Using a modified (https://github.com/CaiJimmy/hugo-theme-stack-starter)[https://github.com/CaiJimmy/hugo-theme-stack-starter] and ofc, inheriting the GPL license

Just a little corner of the www for me to release special interest energy: a little bit of aim, doing stuff with computers, cubes and so on

[Tesseract](https://icons8.com/icon/CY3buSpEhV0w/tesseract) favicon by [Icons8](https://icons8.com)


---

Misc bits from the template I want to remember

---

Example frontmatter:
```
---
title: Hello World
description: Welcome to Hugo Theme Stack
slug: hello-world
date: 2022-03-06 00:00:00+0000
image: cover.jpg
categories:
    - Example Category
tags:
    - Example Tag
weight: 1       # You can add weight to some posts to override the default sorting (date descending)
---
```

---

Hugo theme Stack supports the creation of interactive image galleries using Markdown. It's powered by [PhotoSwipe](https://photoswipe.com/) and its syntax was inspired by [Typlog](https://typlog.com/).

To use this feature, the image must be in the same directory as the Markdown file, as it uses Hugo's page bundle feature to read the dimensions of the image. **External images are not supported.**

## Syntax

```markdown
![Image 1](1.jpg) ![Image 2](2.jpg)
```

## Result

![Image 1](1.jpg) ![Image 2](2.jpg)

> Photo by [mymind](https://unsplash.com/@mymind) and [Luke Chesser](https://unsplash.com/@lukechesser) on [Unsplash](https://unsplash.com/)

---

### Blockquote with attribution

> Don't communicate by sharing memory, share memory by communicating.<br>
> — <cite>Rob Pike[^1]</cite>

---


### Diff code block

```diff
[dependencies.bevy]
git = "https://github.com/bevyengine/bevy"
rev = "11f52b8c72fc3a568e8bb4a4cd1f3eb025ac2e13"
- features = ["dynamic"]
+ features = ["jpeg", "dynamic"]
```

---

## Other Elements — abbr, sub, sup, kbd, mark

<abbr title="Graphics Interchange Format">GIF</abbr> is a bitmap image format.

H<sub>2</sub>O

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>

Press <kbd>CTRL</kbd> + <kbd>ALT</kbd> + <kbd>Delete</kbd> to end the session.

Most <mark>salamanders</mark> are nocturnal, and hunt for insects, worms, and other small creatures.


---

Stack has built-in support for math typesetting using [KaTeX](https://katex.org/).

**It's not enabled by default side-wide,** but you can enable it for individual posts by adding `math: true` to the front matter. Or you can enable it side-wide by adding `math = true` to the `params.article` section in `config.toml`.

## Inline math

This is an inline mathematical expression: $\varphi = \dfrac{1+\sqrt5}{2}= 1.6180339887…$

```markdown
$\varphi = \dfrac{1+\sqrt5}{2}= 1.6180339887…$
```

## Block math

$$
    \varphi = 1+\frac{1} {1+\frac{1} {1+\frac{1} {1+\cdots} } } 
$$

```markdown
$$
    \varphi = 1+\frac{1} {1+\frac{1} {1+\frac{1} {1+\cdots} } } 
$$
```

$$
    f(x) = \int_{-\infty}^\infty\hat f(\xi)\,e^{2 \pi i \xi x}\,d\xi
$$

```markdown
$$
    f(x) = \int_{-\infty}^\infty\hat f(\xi)\,e^{2 \pi i \xi x}\,d\xi
$$
```

---

## YouTube video

{{< youtube "0qwALOOvUik" >}}

## Generic video file

{{< video "https://www.w3schools.com/tags/movie.mp4" >}}

## GitLab

{{< gitlab 2589724 >}}

## Quote

{{< quote author="A famous person" source="The book they wrote" url="https://en.wikipedia.org/wiki/Book">}}
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
{{< /quote >}}

-----

> Photo by [Codioful](https://unsplash.com/@codioful) on [Unsplash](https://unsplash.com/photos/WDSN62Qdxuk)