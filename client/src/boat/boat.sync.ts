import { CoreContext } from "@/core/appContext";
import { BoatSyncDataSchema, TBoatSyncData } from "@shared/domain/boat/schemas";
import { err, ok } from "neverthrow";

export const BoatSyncErrors = {
  NOT_VEHICLE: "NOT_VEHICLE",
  NOT_VALID_ENTITY: "NOT_VALID_ENTITY",
  NOT_VALID_DATA: "NOT_VALID_DATA",
  NOT_VALID_PED: "NOT_VALID_PED",
};

export class BoatSyncModule {
  private streamedBoats: Map<
    number,
    { vehicle: VehicleMp; data: TBoatSyncData }
  > = new Map();
  private activeColshape: ColshapeMp | null = null;
  private currentDeadline: number = 0;
  private _renderCallback: Function | null = null;
  private _renderBoatCallback: Function | null = null;
  // private _renderCallbackTest: Function | null = null;

  constructor(private ctx: CoreContext) {
    mp.events.addDataHandler("boatSyncData", this.validateBoat.bind(this));
    mp.events.add("entityStreamIn", (entity: EntityMp) => {
      const initialData = entity.getVariable("boatSyncData");
      if (initialData) {
        this.ctx.logger.log("Boat initialData finded. Start validate");
        this.validateBoat(entity, initialData);
      }
    });
    mp.events.add("entityStreamOut", (entity: EntityMp) => {
      this.deleteStreamedBoat(entity.remoteId);
    });
    mp.events.add("playerEnterColshape", (shape) => this.colshapeIn(shape));
    mp.events.add("playerExitColshape", (shape) => this.colshapeOut(shape));
    // mp.keys.bind(KeyCode.Z, false, () => this.testWritePoints());
    this.ctx.logger.log("BoatSyncModule started");
  }

  private addStreamedBoat(vehicle: VehicleMp, data: TBoatSyncData) {
    this.streamedBoats.set(vehicle.remoteId, { vehicle, data });
    if (this.streamedBoats.size > 0 && !this._renderBoatCallback) {
      const interval = setInterval(() => this.boatRender(), 16);
      this._renderBoatCallback = () => {
        clearInterval(interval);
      };
    }
  }

  private deleteStreamedBoat(remoteId: number) {
    this.streamedBoats.delete(remoteId);
    if (this.streamedBoats.size === 0) this.stopBoatRender();
  }

  private stopBoatRender() {
    if (this._renderBoatCallback) {
      this._renderBoatCallback();
      this._renderBoatCallback = null;
    }
  }

  private boatRender() {
    this.streamedBoats.forEach((boat) => {
      const { vehicle, data } = boat;
      const isMoving = data.status === "TRANSIT" || data.status === "PARKING";
      if (!isMoving || data.freezed || !data.nextTargetRoute) return;

      const target = data.nextTargetRoute;
      const currentPos = vehicle.position;
      const dx = target.x - currentPos.x;
      const dy = target.y - currentPos.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.01) return;

      const nx = dx / dist;
      const ny = dy / dist;

      const maxSpeed = 10.0;
      const minSpeed = 1.5;
      const slowdownDist = 8.0;

      let speed =
        dist < slowdownDist ? (dist / slowdownDist) * maxSpeed : maxSpeed;
      speed = Math.max(speed, minSpeed);

      vehicle.setVelocity(nx * speed, ny * speed, vehicle.getVelocity().z);

      let targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) - 90;

      const currentAngle = vehicle.getHeading();
      let diff = targetAngle - currentAngle;
      while (diff < -180) diff += 360;
      while (diff > 180) diff -= 360;

      const turnFactor =
        dist < 3.0 ? 0.03 : data.status === "PARKING" ? 0.05 : 0.1;
      vehicle.setHeading(currentAngle + diff * turnFactor);
    });
  }

  // private testWritePoints() {
  //   if (this._renderCallbackTest) {
  //     this._renderCallbackTest();
  //     this._renderCallbackTest = null;
  //   } else {
  //     const interval = setInterval(() => {
  //       const player = mp.players.local;
  //       const vehicle = player.vehicle;
  //       if (!vehicle) return;
  //       mp.console.logInfo(JSON.stringify(vehicle.position), true, true);
  //     }, 1000);
  //     this._renderCallbackTest = () => {
  //       return () => clearInterval(interval);
  //     };
  //   }
  // }

  private validateBoat(entity: EntityMp, value: unknown) {
    ok({ entity, value })
      .andThen(({ entity, value }) => {
        if (!entity.doesExist()) return err(BoatSyncErrors.NOT_VALID_ENTITY);
        if (entity.type !== "vehicle") return err(BoatSyncErrors.NOT_VEHICLE);
        this.ctx.logger.log("Boat start validate");
        const parse = BoatSyncDataSchema.safeParse(value);
        if (parse.error) return err(BoatSyncErrors.NOT_VALID_DATA);
        const ped = mp.peds.atRemoteId(parse.data.pedRemoteId);
        if (!ped || !ped.doesExist()) return err(BoatSyncErrors.NOT_VALID_PED);
        return ok({ vehicle: entity as VehicleMp, ped, value: parse.data });
      })
      .andTee(({ vehicle, ped, value }) => {
        vehicle.freezePosition(value.freezed);
        ped.setIntoVehicle(vehicle.handle, -1);
        this.addStreamedBoat(vehicle, value);
        if (value.status === "IDLE") vehicle.setHeading(value.heading);
        if (value.status === "IDLE" && value.departureTimestamp > Date.now()) {
          this.currentDeadline = value.departureTimestamp;
          this.createColshape(vehicle.position);
        } else {
          this.clearUI();
        }
        this.ctx.logger.log("Boat freeze and velocity updated");
      })
      .match(
        () => {},
        (err) => {
          if (err === BoatSyncErrors.NOT_VALID_ENTITY) return;
          this.ctx.logger.warn(`${err} in BoatSyncModule`);
        },
      );
  }

  private colshapeIn(shape: ColshapeMp) {
    if (this.activeColshape !== shape) return;
    this.stopDrawRender();
    const cb = () => this.drawBoatUI();
    mp.events.add("render", cb);
    this._renderCallback = () => {
      mp.events.remove("render", cb);
    };
  }

  private colshapeOut(shape: ColshapeMp) {
    if (this.activeColshape !== shape) return;
    this.stopDrawRender();
  }

  private stopDrawRender() {
    if (this._renderCallback) {
      this._renderCallback();
      this._renderCallback = null;
    }
  }

  private createColshape(pos: Vector3) {
    if (this.activeColshape && mp.colshapes.exists(this.activeColshape))
      this.activeColshape.destroy();
    this.activeColshape = mp.colshapes.newTube(
      pos.x,
      pos.y,
      pos.z - 2,
      10,
      10,
      0,
    );
  }

  private drawBoatUI() {
    if (this.currentDeadline === 0) return;

    const remaining = Math.ceil((this.currentDeadline - Date.now()) / 1000);

    if (remaining <= 0) {
      this.clearUI();
      return;
    }

    this.renderText(remaining);
  }

  private renderText(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const timeStr =
      minutes > 0
        ? `${minutes}:${seconds.toString().padStart(2, "0")}`
        : `${seconds} сек.`;

    let message = `Прыгай в лодку, отплываем через ${timeStr}`;
    let color: [number, number, number, number] = [255, 255, 255, 255];

    if (totalSeconds <= 5) {
      message = "ПО КОНЯМ! Лодка уходит!";
      color = [255, 50, 50, 255];
    }

    mp.game.graphics.drawText(message, [0.5, 0.85], {
      font: 4,
      color: color,
      scale: [0.5, 0.5],
      outline: true,
      centre: true,
    });
  }

  private clearUI() {
    this.stopDrawRender();
    if (this.activeColshape && mp.colshapes.exists(this.activeColshape)) {
      this.activeColshape.destroy();
    }
    this.activeColshape = null;
    this.currentDeadline = 0;
  }

  destroy() {
    this.clearUI();
    this.stopBoatRender();
  }
}
