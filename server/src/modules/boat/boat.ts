import { CoreContext } from "@/src/core/appContext";
import { boatRoutes } from "@shared/domain/boat/data";
import { TBoatServerId } from "@shared/types/boat/boat";
import { BoatEntity } from "./boat.entity";
import { BoatManager } from "./boat.manager";

export class BoatModule {
  private _boats: Map<TBoatServerId, BoatEntity> = new Map();
  private _manager: BoatManager;

  constructor(private ctx: CoreContext) {
    this.initBoats();
    this._manager = new BoatManager(this.ctx, this._boats);
    this._manager.start();
    this.ctx.logger.log("BoatModule inited");
  }

  private initBoats() {
    boatRoutes.forEach((route) => {
      const boat = new BoatEntity(this.ctx, route);
      this._boats.set(boat.id, boat);
    });
  }

  destroy() {
    this._manager.destroy();
    this._boats.forEach((boat) => boat.destroy());
  }
}
