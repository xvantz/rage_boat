export type Logger = {
  log: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

export const createLogger = (scope = "app"): Logger => {
  const logger = mp.console;

  return {
    log: logger.logInfo.bind(this),
    warn: logger.logWarning.bind(logger),
    error: logger.logError.bind(logger),
  };
};
