import type { Logger } from "./createLogger";

export type CoreContext = Readonly<{
  logger: Logger;
}>;

export type CoreLogger = Logger;

let ctx: CoreContext | null = null;

export function initCoreCtx(next: CoreContext): CoreContext {
  if (ctx) throw new Error("coreCtx already initialized");
  ctx = next;
  return ctx;
}

export const getCoreCtx = (): CoreContext | null => ctx;
