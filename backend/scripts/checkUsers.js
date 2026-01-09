
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { User } from "../src/models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function checkUsers() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const users = await User.find({}, "name email role avatar");
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- [${u.role}] ${u.name} (${u.email})`);
            console.log(`  Avatar: ${u.avatar || "NONE"}`);
        });

        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

checkUsers();
