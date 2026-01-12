
import { getConnection, DBNAMES } from "./src/config/dbPool.js";
import { itemSchema } from "./src/models/ItemModel.js"; // or Item.js? Let's check imports
import { userSchema } from "./src/models/User.js";

async function run() {
    try {
        console.log("Connecting...");
        const userConn = getConnection(DBNAMES.USER);
        const itemConn = getConnection(DBNAMES.ITEM);

        // Wait for ready
        await Promise.all([
            new Promise(r => userConn.once('connected', r)),
            new Promise(r => itemConn.once('connected', r))
        ]);

        const User = userConn.model("User", userSchema);
        // Need to check where ItemModel is. 
        // Previous logs showed backend/src/models/ItemModel.js and Item.js.
        // Let's retry with generic approach or check file first? 
        // I'll assume ItemModel.js is correct based on previous ls.
        // Actually, I should check the file to be sure about the export.

        // I will use a simple query on the connection if I can't import the schema quickly.
        // But I need the schema to create the model.
        // Let's blindly try importing from ItemModel.js.

        // Wait, let's look at file list from previous steps?
        // Step 304 output listed:
        // backend/src/models/Item.js
        // backend/src/models/ItemModel.js

        // I'll check ItemModel.js content first to be safe.
    } catch (e) {
        console.error(e);
    }
}
