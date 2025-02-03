import typescript from "@rollup/plugin-typescript";

const modules = [
  "app",
  "fs",
  "emulator",
  "ui",
  "project",
  "resource",
  "extension",
];

export default {
  input: Object.fromEntries(modules.map((name) => [name, `src/${name}.ts`])),
  output: {
    dir: "dist",
    entryFileNames: "[name].js",
    sourcemap: true,
  },
  plugins: [typescript()],
};
