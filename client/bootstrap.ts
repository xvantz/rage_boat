import { BoatModule } from "./src/boat/boat";
import { initCoreCtx } from "./core/appContext";
import { createLogger } from "./core/createLogger";
import { createKeyListener } from "./core/createKeyListener";
import { NoclipModule } from "./src/noclip/noclip";

let bootstrapped: boolean = false;

async function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;

  const logger = createLogger();
  const key = createKeyListener();

  const coreCtx = initCoreCtx({
    logger,
    key,
  });

  try {
    new NoclipModule(coreCtx);
    new BoatModule(coreCtx);
    logger.log("[bootstrap] done");
  } catch (e) {
    logger.error("[bootstrap] failed", e);
    throw e;
  }
}

bootstrap();
