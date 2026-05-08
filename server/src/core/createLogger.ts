export type Logger = {
  log: (...messages: unknown[]) => void;
  warn: (...messages: unknown[]) => void;
  error: (...messages: unknown[]) => void;
};

export const createLogger = (scope = "app"): Logger => {
  const log = (...messages: any[]) => {
    console.log(...messages);
  };

  const warn = (...messages: any[]) => {
    console.warn(...messages);
  };

  const error = (...messages: any[]) => {
    console.error(...messages);
  };

  return {
    log,
    warn,
    error,
  };
};
