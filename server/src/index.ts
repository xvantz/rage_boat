import { initCoreCtx } from "./core/appContext";
import { createLogger } from "./core/createLogger";
import { BoatModule } from "./modules/boat/boat";
import { HotReloadModule } from "./modules/hotReload/hotReload";

let bootstrapped: boolean = false;

async function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;

  const logger = createLogger("server");

  const coreCtx = initCoreCtx({
    logger,
  });

  try {
    new HotReloadModule(coreCtx);
    new BoatModule(coreCtx);
    logger.log("[bootstrap] done");
  } catch (e) {
    logger.error("[bootstrap] failed", e);
    throw e;
  }
}

bootstrap();
