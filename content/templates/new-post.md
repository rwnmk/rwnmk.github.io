<%*
/* Templater: asks for a title, then moves this note to posts/<slug>/index.md */
const title = await tp.system.prompt("Post title");
if (!title) return;
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const dir = "posts/" + slug;
if (!app.vault.getAbstractFileByPath(dir)) await app.vault.createFolder(dir);
await tp.file.move(dir + "/index");
-%>
---
title: "<% title %>"
date: <% tp.date.now("YYYY-MM-DD") %>
draft: true
tags: []
summary: ""
# image: cover.png
---

<% tp.file.cursor() %>
