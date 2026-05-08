import fs from "fs";
import path from "node:path";
import { CoreContext } from "@/src/core/appContext";

export class HotReloadModule {
  private _directoryPath = path.resolve("client_packages");
  private _isReloading = false;
  private _debounceTimer: NodeJS.Timeout | null = null;

  constructor(private ctx: CoreContext) {
    this.watchToBuildComplete();
  }

  private watchToBuildComplete() {
    const buildCompleteFile = "index.js";

    fs.watch(this._directoryPath, (_, filename) => {
      if (filename === buildCompleteFile) {
        if (this._debounceTimer) clearTimeout(this._debounceTimer);

        this._debounceTimer = setTimeout(() => {
          this.executeReload();
        }, 300);
      }
    });
  }

  private executeReload() {
    if (this._isReloading) return;
    this._isReloading = true;

    try {
      this.ctx.logger.log("Клиентский билд обновлен. Перезагружаю ресурсы...");

      // @ts-expect-error
      mp.players.reloadResources();

      this.ctx.logger.log("Ресурсы успешно отправлены на перезагрузку.");
    } catch (e) {
      this.ctx.logger.error(`Ошибка при перезагрузке`);
    } finally {
      setTimeout(() => {
        this._isReloading = false;
      }, 1000);
    }
  }
}
