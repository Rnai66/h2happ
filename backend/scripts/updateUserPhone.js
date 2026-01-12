import mongoose from "mongoose";
import "dotenv/config";
import { User } from "../src/models/User.js";
import { connectDB } from "../src/config/db.js";

// Usage: 
// node scripts/updateUserPhone.js <email> <phone>

const args = process.argv.slice(2);
const email = args[0];
const phone = args[1];

async function main() {
    if (!email || !phone) {
        console.log("Usage: node scripts/updateUserPhone.js <email> <phone>");
        process.exit(1);
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        console.error(`❌ User not found with email: ${email}`);
        process.exit(1);
    }

    user.phone = phone;
    await user.save();

    console.log(`✅ Updated user: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phone}`);

    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
