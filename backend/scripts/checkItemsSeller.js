
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function checkItemsSeller() {
    try {
        const MONGO_USER = process.env.MONGO_USER;
        const MONGO_PASS = process.env.MONGO_PASS;
        const MONGO_CLUSTER = process.env.MONGO_CLUSTER;

        if (!MONGO_USER || !MONGO_PASS || !MONGO_CLUSTER) {
            throw new Error("Missing Mongo ENV");
        }

        const BASE = `mongodb+srv://${MONGO_USER}:${MONGO_PASS}@${MONGO_CLUSTER}`;

        const ITEM_DB = process.env.DB_ITEM || "item_db";
        const USER_DB = process.env.DB_USER || "user_db";

        console.log(`Connecting to ITEM_DB: ${ITEM_DB}`);
        const connItem = mongoose.createConnection(`${BASE}/${ITEM_DB}?retryWrites=true&w=majority`);

        console.log(`Connecting to USER_DB: ${USER_DB}`);
        const connUser = mongoose.createConnection(`${BASE}/${USER_DB}?retryWrites=true&w=majority`);

        // Wait for open
        await new Promise(r => setTimeout(r, 2000));

        // Define Schemas
        const itemSchema = new mongoose.Schema({ title: String, price: Number, sellerId: mongoose.Schema.Types.ObjectId });
        const Item = connItem.model("Item", itemSchema);

        // Import User Schema logic (simplified)
        const userSchema = new mongoose.Schema({ name: String, email: String, role: String });
        const User = connUser.model("User", userSchema);

        // Fetch Items
        const items = await Item.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(10).lean();
        console.log(`Found ${items.length} items`);

        const sellerIds = [...new Set(items.map(i => i.sellerId))];
        console.log("Seller IDs found:", sellerIds);

        // Fetch Users
        const users = await User.find({ _id: { $in: sellerIds } }).lean();
        console.log(`Found ${users.length} users matching seller IDs`);

        users.forEach(u => console.log(`- Found User: ${u.name} (${u.email}) ID: ${u._id}`));

        // Map Check
        items.forEach(i => {
            const seller = users.find(u => String(u._id) === String(i.sellerId));
            const uId = String(i.sellerId);
            console.log(`Item: ${i.title} (${i.price}) | SellerID: ${uId} | Found: ${seller ? "YES: " + seller.name : "NO"}`);
        });

        process.exit(0);

    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

checkItemsSeller();
