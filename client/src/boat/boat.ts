import { CoreContext } from "core/appContext";
import { BoatSyncModule } from "./boat.sync";

export class BoatModule {
  private _syncModule: BoatSyncModule;
  private _renderCallback: Function;

  constructor(private ctx: CoreContext) {
    this.ctx.logger.log("BoatModule started");
    this.loadIpl();
    const cb = () => this.render();
    mp.events.add("render", cb);
    this._renderCallback = () => {
      mp.events.remove("render", cb);
    };
    this.spawn();
    this._syncModule = new BoatSyncModule(this.ctx);
  }

  private loadIpl() {
    mp.game.invoke("0x9A9D1BA639675CF1", "HeistIsland", true);
  }
  private spawn() {
    mp.players.local.position = new mp.Vector3(4840.571, -5174.425, 2.0);
  }

  private render() {
    mp.game.cam.invalidateIdle();
    const pos = mp.players.local.position;
    const heading = mp.players.local.getHeading();
    mp.game.graphics.drawText(
      `x: ${pos.x.toFixed(3)}, y: ${pos.y.toFixed(3)}, z: ${pos.z.toFixed(3)}, h: ${heading.toFixed(3)}`,
      [0.5, 0.02],
      { color: [255, 255, 255, 255] },
    );
  }

  destroy() {
    this._renderCallback();
    mp.game.invoke("0x9A9D1BA639675CF1", "HeistIsland", false);
    this._syncModule.destroy();
  }
}
