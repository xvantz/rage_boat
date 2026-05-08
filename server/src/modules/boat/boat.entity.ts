import { CoreContext } from "@/src/core/appContext";
import {
  boatCapitanModelName,
  boatModelName,
  boatRoutes,
  TBoatRoute,
} from "@shared/domain/boat/data";
import {
  TBoatSyncData,
  TBoatSyncDataStatus,
} from "@shared/domain/boat/schemas";
import { TBoatServerId } from "@shared/types/boat/boat";
import { nanoid } from "nanoid";

export class BoatEntity {
  private _id: TBoatServerId;
  private _entity: VehicleMp;
  private _ped: PedMp;
  private _syncData: TBoatSyncData | null = null;
  private _status: TBoatSyncDataStatus = "IDLE";
  private _currentNodeIndex = 0;
  private _attempts = 0;
  private _departureTimestamp: number = 0;

  constructor(
    private ctx: CoreContext,
    private _currentRoute: TBoatRoute,
  ) {
    this._id = nanoid(10);
    const spawnPos = new mp.Vector3(this._currentRoute.spawnData.pos);
    const heading = this._currentRoute.spawnData.heading;
    this._entity = mp.vehicles.new(boatModelName, spawnPos, {
      numberPlate: "boat",
      color: [
        [0, 255, 0],
        [0, 255, 0],
      ],
      engine: true,
      heading,
    });
    this._ped = mp.peds.new(mp.joaat(boatCapitanModelName), spawnPos, {
      invincible: true,
      frozen: true,
      dynamic: false,
    });
    this.setNewDepartureTime();
    this.updateSyncData();
    this.onSyncData();
  }

  get id() {
    return this._id;
  }

  get entity() {
    return this._entity;
  }

  get ped() {
    return this._ped;
  }

  get data() {
    return this._syncData;
  }

  get status() {
    return this._status;
  }

  get route() {
    return this._currentRoute;
  }

  get currentNodeIndex() {
    return this._currentNodeIndex;
  }

  get attempts() {
    return this._attempts;
  }

  setStatus(status: TBoatSyncDataStatus) {
    this._status = status;
  }

  onSetNextNode() {
    this._currentNodeIndex += 1;
    this.updateSyncData();
  }

  resetRouteProgress() {
    this._currentNodeIndex = 0;
  }

  setNewDepartureTime(ms: number = 1 * 60 * 1000) {
    this._departureTimestamp = Date.now() + ms;
    this.updateSyncData();
  }

  onNextRoute() {
    const nextRoute = boatRoutes.find(
      (r) => r.id === this._currentRoute.nextRouteId,
    );
    if (!nextRoute)
      return this.ctx.logger.error(`error next route for boat ${this._id}`);
    this._currentRoute = nextRoute;
    this.updateSyncData();
  }

  private updateSyncData() {
    const nextTargetPosition = this.route.nodes[this._currentNodeIndex + 1];
    this._syncData = {
      serverId: this._id,
      freezed: this._status === "IDLE",
      pedRemoteId: this._ped.id,
      status: this._status,
      departureTimestamp: this._departureTimestamp,
      nextTargetRoute: nextTargetPosition
        ? nextTargetPosition
        : this.route.nodes[this._currentNodeIndex],
      heading: this.route.spawnData.heading,
    };
  }

  onSyncData() {
    if (!this._entity) return console.warn("Boat entity not inited");
    this._entity.setVariable("boatSyncData", this._syncData);
  }

  addAttempts() {
    this._attempts += 1;
  }

  resetAttempts() {
    this._attempts = 0;
  }

  destroy() {
    if (this._ped && mp.peds.exists(this._ped)) this._ped.destroy();
    if (this._entity && mp.vehicles.exists(this._entity))
      this._entity.destroy();
  }
}
