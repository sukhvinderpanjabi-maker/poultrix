import Time "mo:core/Time";
import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Int "mo:core/Int";

actor {
  type FarmId = Nat;
  type ShedId = Nat;
  type BatchId = Nat;

  type Farm = {
    id : FarmId;
    name : Text;
    location : Text;
    totalCapacity : Nat;
  };

  type Shed = {
    id : ShedId;
    farmId : FarmId;
    name : Text;
    capacity : Nat;
  };

  type Batch = {
    id : BatchId;
    batchNumber : Text;
    placementDate : Int;
    hatcheryName : Text;
    breedType : Text;
    chicksQty : Nat;
    chicksRate : Nat;
    transportCost : Nat;
    totalPlacementCost : Nat;
    farmId : FarmId;
    shedId : ShedId;
    birdsAlive : Nat;
    status : Text; // "active", "sold", "closed"
  };

  type FeedPurchase = {
    id : Nat;
    supplierName : Text;
    feedType : Text;
    quantityBags : Nat;
    ratePerBag : Nat;
    discountAmount : Nat;
    totalAmount : Nat;
    purchaseDate : Int;
  };

  type FeedStock = {
    id : Nat;
    farmId : FarmId;
    feedType : Text;
    currentStockBags : Nat;
    alertThresholdBags : Nat;
  };

  type FeedIssue = {
    id : Nat;
    farmId : FarmId;
    shedId : ShedId;
    feedType : Text;
    quantityBags : Nat;
    issueDate : Int;
    batchId : ?BatchId;
  };

  type DailyEntry = {
    id : Nat;
    batchId : BatchId;
    entryDate : Int;
    birdsAlive : Nat;
    mortalityCount : Nat;
    cullBirds : Nat;
    feedIntakeGrams : Nat;
    bodyWeightGrams : Nat;
    waterConsumptionLiters : Nat;
    fcr : Float;
    avgWeight : Float;
    mortalityPct : Float;
    cumulativeFeed : Nat;
  };

  type BirdSale = {
    id : Nat;
    farmId : FarmId;
    batchId : BatchId;
    birdsQty : Nat;
    avgWeightKg : Float;
    ratePerKg : Nat;
    totalWeightKg : Float;
    totalAmount : Nat;
    traderName : Text;
    vehicleNumber : Text;
    dispatchDate : Int;
  };

  var nextFarmId = 1;
  var nextShedId = 1;
  var nextBatchId = 1;
  var timestamp = 0;

  let farmsMap = Map.empty<FarmId, Farm>();
  let shedsMap = Map.empty<ShedId, Shed>();
  let batchesMap = Map.empty<BatchId, Batch>();

  // CRUD Operations
  public shared ({ caller }) func createFarm(name : Text, location : Text, totalCapacity : Nat) : async FarmId {
    let id = nextFarmId;
    nextFarmId += 1;
    let farm : Farm = {
      id;
      name;
      location;
      totalCapacity;
    };
    farmsMap.add(id, farm);
    id;
  };

  public query ({ caller }) func getFarm(id : FarmId) : async ?Farm {
    farmsMap.get(id);
  };

  public shared ({ caller }) func createShed(farmId : FarmId, name : Text, capacity : Nat) : async ShedId {
    let id = nextShedId;
    nextShedId += 1;
    let shed : Shed = {
      id;
      farmId;
      name;
      capacity;
    };
    shedsMap.add(id, shed);
    id;
  };

  public query ({ caller }) func getShed(id : ShedId) : async ?Shed {
    shedsMap.get(id);
  };

  public shared ({ caller }) func createBatch(placementDate : Int, hatcheryName : Text, breedType : Text, chicksQty : Nat, chicksRate : Nat, transportCost : Nat, totalPlacementCost : Nat, farmId : FarmId, shedId : ShedId) : async BatchId {
    let id = nextBatchId;
    nextBatchId += 1;
    let batchNumber = "BATCH-" # timestamp.toText();
    let batch : Batch = {
      id;
      batchNumber;
      placementDate;
      hatcheryName;
      breedType;
      chicksQty;
      chicksRate;
      transportCost;
      totalPlacementCost;
      farmId;
      shedId;
      birdsAlive = chicksQty;
      status = "active";
    };
    batchesMap.add(id, batch);
    id;
  };

  public query ({ caller }) func getBatch(id : BatchId) : async ?Batch {
    batchesMap.get(id);
  };

  public shared ({ caller }) func updateBirdsAlive(batchId : BatchId, birdsAlive : Nat) : async () {
    switch (batchesMap.get(batchId)) {
      case (null) {};
      case (?batch) {
        let updatedBatch = { batch with birdsAlive };
        batchesMap.add(batchId, updatedBatch);
      };
    };
  };
};
