/**
 * Dev-only logging helpers. No-ops in production builds so internal error
 * objects, route paths, or Supabase error codes never surface in end-user
 * DevTools consoles. Prefer these over raw `console.*` in app code.
 */
const isDev = import.meta.env.DEV;

export const devLog = (...args: unknown[]): void => {
  if (isDev) console.log(...args);
};

export const devError = (...args: unknown[]): void => {
  if (isDev) console.error(...args);
};

export const devWarn = (...args: unknown[]): void => {
  if (isDev) console.warn(...args);
};
