
import { getConnection, DBNAMES } from "./src/config/dbPool.js";
import { ItemModel } from "./src/models/ItemModel.js";
import { userSchema } from "./src/models/User.js";

async function run() {
    try {
        console.log("Connecting...");
        const userConn = getConnection(DBNAMES.USER);
        const itemConn = getConnection(DBNAMES.ITEM);

        await Promise.all([
            new Promise(r => { if (userConn.readyState === 1) r(); else userConn.once('connected', r) }),
            new Promise(r => { if (itemConn.readyState === 1) r(); else itemConn.once('connected', r) })
        ]);

        const User = userConn.model("User", userSchema);
        const Item = ItemModel(itemConn);

        // Get a valid seller ID (use the first user found)
        const seller = await User.findOne();
        if (!seller) {
            console.error("No users found to assign items to!");
            process.exit(1);
        }

        const items = [
            {
                title: "Vintage Guitar (Test)",
                price: 15000,
                description: "A beautiful vintage guitar for testing. plays great!",
                images: ["https://picsum.photos/400/400?random=1"],
                sellerId: seller._id,
                status: "active"
            },
            {
                title: "Smartphone x200 (Test)",
                price: 8900,
                description: "Latest model, barely used. Good condition.",
                images: ["https://picsum.photos/400/400?random=2"],
                sellerId: seller._id,
                status: "active"
            },
            {
                title: "Handmade Scarf (Test)",
                price: 350,
                description: "100% Cotton, handmade with love.",
                images: ["https://picsum.photos/400/400?random=3"],
                sellerId: seller._id,
                status: "active"
            },
            {
                title: "Gaming Laptop (Test)",
                price: 45000,
                description: "High specs for gaming. RGB keyboard included.",
                images: ["https://picsum.photos/400/400?random=4"],
                sellerId: seller._id,
                status: "active"
            }
        ];

        console.log("Seeding items...");
        await Item.insertMany(items);
        console.log("✅ Seeded 4 items successfully!");

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
