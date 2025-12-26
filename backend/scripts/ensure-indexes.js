// backend/scripts/ensure-indexes.js
import { getConnection, DBNAMES } from "../src/config/dbPool.js";
import { ItemModel } from "../src/models/Item.js";

async function main() {
  const conn = getConnection(DBNAMES.ITEM);
  const Item = ItemModel(conn);
  const res = await Item.syncIndexes();
  console.log("Item indexes synced:", res);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
