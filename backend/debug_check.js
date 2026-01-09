import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/h2h_surin";

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to", MONGO_URI);

        // Dynamic models approach matching the project structure
        const userSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.model("User", userSchema, "users");

        const orderSchema = new mongoose.Schema({}, { strict: false });
        const Order = mongoose.model("Order", orderSchema, "orders");

        const users = await User.find({}).limit(5).lean();
        console.log("--- USERS (First 5) ---");
        users.forEach(u => {
            console.log(`ID: ${u._id} (Type: ${typeof u._id}), Email: ${u.email}, Name: ${u.name}`);
        });

        const orders = await Order.find({}).limit(10).lean();
        console.log("\n--- ORDERS (First 10) ---");
        orders.forEach(o => {
            console.log(`ID: ${o._id}, BuyerId: ${o.buyerId} (Type: ${typeof o.buyerId}), SellerId: ${o.sellerId}, Status: ${o.status}, Deleted: ${o.isDeleted}`);
        });

        if (users.length > 0 && orders.length > 0) {
            const u = users[0];
            const myOrders = await Order.find({ buyerId: u._id.toString() });
            console.log(`\nCheck Orders for User[0] (${u.email}, ID: ${u._id}) -> Found match via toString(): ${myOrders.length}`);

            const myOrdersRaw = await Order.find({ buyerId: u._id });
            console.log(`Check Orders for User[0] (${u.email}, ID: ${u._id}) -> Found match via ObjectId: ${myOrdersRaw.length}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
