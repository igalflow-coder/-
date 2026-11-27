import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [out, from, to, scale = "0.5", conc = "2"] = process.argv.slice(2);
const browserExecutable = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const chromiumOptions = { gl: process.env.GL || "angle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: process.env.COMP || "BuddhaPart1", browserExecutable, chromiumOptions });
const t0 = Date.now();
await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out, frameRange: [Number(from), Number(to)], scale: Number(scale), concurrency: Number(conc), browserExecutable, chromiumOptions, timeoutInMilliseconds: 300000,
  onProgress: ({ renderedFrames }) => { if (renderedFrames % 10 === 0) console.log("frames", renderedFrames, ((Date.now() - t0) / 1000).toFixed(0) + "s"); } });
console.log("done", ((Date.now() - t0) / 1000).toFixed(1) + "s");
