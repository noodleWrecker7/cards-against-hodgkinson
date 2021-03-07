module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "node"],
  env: {
    node: true,
    mocha: true,
  },
  extends: ["plugin:@typescript-eslint/recommended", "prettier"],
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "standard/no-callback-literal": "off",
  },
};
