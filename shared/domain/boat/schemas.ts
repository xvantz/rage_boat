import z from "zod";

export const BoatSyncDataSchema = z.object({
  serverId: z.string(),
  freezed: z.boolean(),
  pedRemoteId: z.number(),
  status: z.enum(["IDLE", "TRANSIT", "PARKING"]),
  departureTimestamp: z.number(),
  nextTargetRoute: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  heading: z.number(),
});

export type TBoatSyncData = z.infer<typeof BoatSyncDataSchema>;

export type TBoatSyncDataStatus = TBoatSyncData["status"];
