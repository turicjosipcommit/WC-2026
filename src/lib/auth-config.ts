export function isAuthDisabled() {
  return process.env.DISABLE_AUTH === "true";
}
