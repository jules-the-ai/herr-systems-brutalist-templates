import { readFileSync, writeFileSync } from "node:fs";
import { renderPage } from "./brutalist-shell.mjs";
writeFileSync(
  "index.html",
  renderPage({
    title: "Technology should be fun.",
    bodyClass: "home-page",
    body: readFileSync("src/brutalist/home.html", "utf8"),
  }),
);
