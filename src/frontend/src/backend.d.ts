import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type FarmId = bigint;
export interface Farm {
    id: FarmId;
    name: string;
    location: string;
    totalCapacity: bigint;
}
export interface Batch {
    id: BatchId;
    status: string;
    shedId: ShedId;
    hatcheryName: string;
    chicksQty: bigint;
    placementDate: bigint;
    birdsAlive: bigint;
    totalPlacementCost: bigint;
    batchNumber: string;
    transportCost: bigint;
    breedType: string;
    chicksRate: bigint;
    farmId: FarmId;
}
export interface Shed {
    id: ShedId;
    name: string;
    capacity: bigint;
    farmId: FarmId;
}
export type ShedId = bigint;
export type BatchId = bigint;
export interface backendInterface {
    createBatch(placementDate: bigint, hatcheryName: string, breedType: string, chicksQty: bigint, chicksRate: bigint, transportCost: bigint, totalPlacementCost: bigint, farmId: FarmId, shedId: ShedId): Promise<BatchId>;
    createFarm(name: string, location: string, totalCapacity: bigint): Promise<FarmId>;
    createShed(farmId: FarmId, name: string, capacity: bigint): Promise<ShedId>;
    getBatch(id: BatchId): Promise<Batch | null>;
    getFarm(id: FarmId): Promise<Farm | null>;
    getShed(id: ShedId): Promise<Shed | null>;
    updateBirdsAlive(batchId: BatchId, birdsAlive: bigint): Promise<void>;
}
