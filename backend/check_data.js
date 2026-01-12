
import { getConnection, DBNAMES } from "./src/config/dbPool.js";
import { ItemModel } from "./src/models/ItemModel.js";
import { userSchema } from "./src/models/User.js";

async function run() {
    try {
        console.log("Connecting...");
        const userConn = getConnection(DBNAMES.USER);
        const itemConn = getConnection(DBNAMES.ITEM);

        // Wait for ready
        await Promise.all([
            new Promise(r => { if (userConn.readyState === 1) r(); else userConn.once('connected', r) }),
            new Promise(r => { if (itemConn.readyState === 1) r(); else itemConn.once('connected', r) })
        ]);

        const User = userConn.model("User", userSchema);
        const Item = ItemModel(itemConn);

        const userCount = await User.countDocuments();
        const itemCount = await Item.countDocuments();

        console.log(`✅ Users: ${userCount}`);
        console.log(`✅ Items: ${itemCount}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
