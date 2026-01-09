// Create Admin User Script
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/h2h";

// Admin credentials
const ADMIN_EMAIL = "admin@h2h.com";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "Admin H2H";

async function createAdmin() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected!");

        const User = mongoose.model("User", new mongoose.Schema({
            name: String,
            email: { type: String, unique: true },
            passwordHash: String,
            role: { type: String, default: "user" },
            tokenBalance: { type: Number, default: 0 },
        }));

        // Check if admin exists
        const existing = await User.findOne({ email: ADMIN_EMAIL });
        if (existing) {
            console.log("Admin already exists! Updating role to admin...");
            existing.role = "admin";
            await existing.save();
            console.log("✅ Updated existing user to admin");
        } else {
            // Create new admin
            const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
            await User.create({
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                passwordHash,
                role: "admin",
                tokenBalance: 1000,
            });
            console.log("✅ Created new admin user!");
        }

        console.log("\n=================================");
        console.log("Admin Login Credentials:");
        console.log(`  Email: ${ADMIN_EMAIL}`);
        console.log(`  Password: ${ADMIN_PASSWORD}`);
        console.log("=================================\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

createAdmin();
