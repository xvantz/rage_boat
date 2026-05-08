import { build, context } from "esbuild";
import path from "node:path";

const config = {
  entryPoints: ["bootstrap.ts"],
  bundle: true,
  platform: "node",
  outfile: "../client_packages/index.js",
  sourcemap: true,
  target: "node14",
  alias: {
    "@": path.resolve("./"),
    "@shared": path.resolve("../shared"),
  },
  external: ["mp"],
};

async function run() {
  const isWatch = process.argv.includes("--watch");
  if (isWatch) {
    const ctx = await context(config);
    await ctx.watch();
    console.log("client watch mode active");
  } else {
    await build(config);
  }
}

run();
