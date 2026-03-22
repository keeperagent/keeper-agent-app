// Browser stub for fs/promises — used so cron-parser bundles without errors in the renderer.
// CronFileParser (cron-parser internals) imports fs/promises; we never call it, so an empty export is safe.
export default {};
export const readFile = undefined;
export const writeFile = undefined;
export const readdir = undefined;
