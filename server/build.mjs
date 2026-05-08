import { context, build } from "esbuild";
import alias from "esbuild-plugin-alias";
import path from "node:path";

const isWatchMode = process.argv.includes("--watch");

const config = {
  entryPoints: ["entry.ts"],
  bundle: true,
  platform: "node",
  outfile: "../packages/build/index.js",
  sourcemap: true,
  target: "node14",
  plugins: [
    alias({
      "@": path.resolve("./"),
      "@shared": path.resolve("../shared"),
    }),
  ],
};

async function run() {
  if (isWatchMode) {
    const ctx = await context(config);
    await ctx.watch();
    console.log("🚀 [esbuild] Watch mode active... Waiting for changes.");
  } else {
    console.log("📦 [esbuild] Building for production...");
    await build(config);
    console.log("✅ [esbuild] Build complete.");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
