import { CoreContext } from "@/core/appContext";
import { KeyCode } from "@shared/types/keyCodeTypes";

const controlsIds = {
  F11: 0x7a,
  W: 32,
  S: 33,
  A: 34,
  D: 35,
  Space: 321,
  LCtrl: 326,
  LMB: 24,
  RMB: 25,
};

const fly = {
  flying: false,
  f: 2.0,
  w: 2.0,
  h: 2.0,
  l: 2.0,
  point_distance: 1000,
  time: Date.now(),
};

export class NoclipModule {
  constructor(private ctx: CoreContext) {
    mp.events.add("render", this.render.bind(this));
    this.ctx.key.onUp(this.keyUpListener.bind(this));
    this.ctx.logger.log("noclip module started");
  }

  private keyUpListener(keyCode: KeyCode) {
    if (keyCode === KeyCode.F8) {
      const state = fly.flying;
      fly.flying = !state;
      if (state) {
        this.ctx.logger.log("noclip disabled");
        this.setPlayerToGround();
      } else {
        this.ctx.logger.log("noclip enabled");
      }
    }
  }

  private render() {
    if (fly.flying && Date.now() - fly.time > 150) {
      const controls = mp.game.controls;
      const direction = mp.cameras.gameplay.getDirection();
      const position = mp.players.local.position;
      let speed;
      if (controls.isControlPressed(0, controlsIds.LMB)) speed = 1.0;
      else if (controls.isControlPressed(0, controlsIds.RMB)) speed = 0.02;
      else speed = 0.2;
      if (controls.isControlPressed(0, controlsIds.W)) {
        if (fly.f < 8.0) fly.f *= 1.025;
        position.x += direction.x * fly.f * speed;
        position.y += direction.y * fly.f * speed;
        position.z += direction.z * fly.f * speed;
      } else if (controls.isControlPressed(0, controlsIds.S)) {
        if (fly.f < 8.0) fly.f *= 1.025;
        position.x -= direction.x * fly.f * speed;
        position.y -= direction.y * fly.f * speed;
        position.z -= direction.z * fly.f * speed;
      } else fly.f = 2.0;
      if (controls.isControlPressed(0, controlsIds.A)) {
        if (fly.l < 8.0) fly.l *= 1.025;
        position.x += -direction.y * fly.l * speed;
        position.y += direction.x * fly.l * speed;
      } else if (controls.isControlPressed(0, controlsIds.D)) {
        if (fly.l < 8.0) fly.l *= 1.05;
        position.x -= -direction.y * fly.l * speed;
        position.y -= direction.x * fly.l * speed;
      } else fly.l = 2.0;

      if (controls.isControlPressed(0, controlsIds.Space)) {
        if (fly.h < 8.0) fly.h *= 1.025;
        position.z += fly.h * speed;
      } else if (controls.isControlPressed(0, controlsIds.LCtrl)) {
        if (fly.h < 8.0) fly.h *= 1.05;
        position.z -= fly.h * speed;
      } else fly.h = 2.0;

      mp.players.local.setCoordsNoOffset(
        position.x,
        position.y,
        position.z,
        false,
        false,
        false,
      );
    }
  }

  private setPlayerToGround = () => {
    const player = mp.players.local;
    const position = player.position;
    position.z = mp.game.gameplay.getGroundZFor3dCoord(
      position.x,
      position.y,
      position.z,
      false,
      false,
    );
    player.setCoordsNoOffset(
      position.x,
      position.y,
      position.z,
      false,
      false,
      false,
    );
  };
}
