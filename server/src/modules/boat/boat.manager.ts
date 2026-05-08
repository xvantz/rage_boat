import { TBoatServerId } from "@shared/types/boat/boat";
import { BoatEntity } from "./boat.entity";
import { CoreContext } from "@/src/core/appContext";

export class BoatManager {
  private _interval: NodeJS.Timeout | null = null;

  constructor(
    private ctx: CoreContext,
    private boats: Map<TBoatServerId, BoatEntity>,
  ) {}

  start() {
    this.heartbeat();
  }

  private heartbeat() {
    const start = Date.now();

    this.boats.forEach((boat) => {
      this.updateBoatLogic(boat);
    });

    const workTime = Date.now() - start;
    this._interval = setTimeout(
      () => this.heartbeat(),
      Math.max(0, 1000 - workTime),
    );
  }

  private updateBoatLogic(boat: BoatEntity) {
    const data = boat.data;
    if (!data) return;

    if (boat.status === "IDLE" && data.departureTimestamp > 0) {
      if (Date.now() >= data.departureTimestamp) {
        boat.setStatus("TRANSIT");
        this.checkParkingState(boat);
        boat.onSyncData();
      }
      return;
    }

    if (boat.status === "TRANSIT" || boat.status === "PARKING") {
      this.moveBoatToRoute(boat);
    }
  }

  private moveBoatToRoute(boat: BoatEntity) {
    const vehicle = boat.entity;
    const streamedPlayers = vehicle.streamedPlayers;
    const nodes = boat.route.nodes;
    const target = boat.route.nodes[boat.currentNodeIndex];
    const distSq = vehicle.distSquared(new mp.Vector3(target));

    if (boat.currentNodeIndex >= nodes.length - 1) {
      this.finishJourney(boat);
      return;
    }

    this.checkParkingState(boat);

    if (distSq > 100 ** 2) {
      this.ctx.logger.warn(
        `Boat ${boat.id} too far. Teleporting to node ${boat.currentNodeIndex}`,
      );
      const safePos = new mp.Vector3(target);
      vehicle.position = safePos;
      boat.ped.position = safePos;
    }

    if (streamedPlayers.length === 0) {
      const nextNode = boat.route.nodes[boat.currentNodeIndex + 1];
      const pos = new mp.Vector3(nextNode);
      vehicle.position = pos;
      boat.ped.position = pos;

      boat.onSetNextNode();
      this.checkParkingState(boat);
      boat.onSyncData();
    } else {
      if (this.checkArrival(boat)) {
        boat.onSetNextNode();
        this.checkParkingState(boat);
        boat.onSyncData();
      }
    }
  }

  private checkParkingState(boat: BoatEntity) {
    const nodesLeft = boat.route.nodes.length - boat.currentNodeIndex;
    if (nodesLeft <= 3 && boat.status === "TRANSIT") {
      boat.setStatus("PARKING");
      this.ctx.logger.log(`Boat ${boat.id} switched to PARKING mode`);
    }
  }

  private finishJourney(boat: BoatEntity) {
    this.ctx.logger.log(`Boat ${boat.id} finished route. Parking...`);

    boat.setStatus("IDLE");
    boat.resetRouteProgress();
    boat.onNextRoute();
    boat.setNewDepartureTime();
    boat.onSyncData();
  }

  private checkArrival(boat: BoatEntity): boolean {
    const target = boat.route.nodes[boat.currentNodeIndex + 1];
    const isArrival = boat.entity.distSquared(new mp.Vector3(target)) < 7 ** 2;
    this.ctx.logger.log(`boat arrival status for ${boat.id} - ${isArrival}`);
    return isArrival;
  }

  stop() {
    if (this._interval) clearTimeout(this._interval);
  }

  destroy() {
    this.stop();
  }
}
