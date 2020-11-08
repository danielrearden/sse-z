import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";

export default {
  input: "lib/index.ts",
  output: [
    {
      format: "esm",
      file: "dist/index.mjs",
      sourcemap: false,
    },
    {
      format: "cjs",
      file: "dist/index.js",
      sourcemap: false,
    },
    {
      name: "SSEZ",
      format: "umd",
      file: "dist/sse-z.js",
      sourcemap: false,
    },
    {
      name: "SSEZ",
      format: "umd",
      file: "dist/sse-z.min.js",
      sourcemap: false,
      plugins: [terser()],
    },
  ],
  plugins: [
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          module: "ESNext",
        },
      },
    }),
  ],
};
