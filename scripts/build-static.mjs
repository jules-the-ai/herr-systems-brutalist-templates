import { cpSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });
cpSync("public", "dist", { recursive: true });
copyFileSync("index.html", "dist/index.html");
console.log("Static brutalist templates built into dist/; no deploy step.");
