import mongoose from "mongoose";
import "dotenv/config";
import { SystemSetting } from "../src/models/SystemSetting.js";
import { connectDB } from "../src/config/db.js";

// Usage: 
// node scripts/manageSmtp.js view
// node scripts/manageSmtp.js set <email> <password>

const args = process.argv.slice(2);
const command = args[0];

async function main() {
    await connectDB();

    if (command === "view") {
        const setting = await SystemSetting.findOne({ key: "SMTP_CONFIG" });
        if (setting) {
            console.log("✅ SMTP Configuration found:");
            console.log(JSON.stringify(setting.value, null, 2));
        } else {
            console.log("❌ No SMTP Configuration found in DB.");
        }
    } else if (command === "set") {
        const user = args[1];
        const pass = args[2];
        const host = args[3]; // Optional
        const port = args[4]; // Optional

        if (!user || !pass) {
            console.log("Usage: node scripts/manageSmtp.js set <email> <password> [host] [port]");
            process.exit(1);
        }

        const value = { user, pass };
        if (host) value.host = host;
        if (port) value.port = port;

        await SystemSetting.findOneAndUpdate(
            { key: "SMTP_CONFIG" },
            {
                value,
                description: "SMTP Credentials for sending emails"
            },
            { upsert: true, new: true }
        );
        console.log(`✅ SMTP Configuration updated for user: ${user}`);
        if (host) console.log(`   Host: ${host}:${port || 587}`);
    } else if (command === "set-pass") {
        const pass = args[1];
        if (!pass) {
            console.log("Usage: node scripts/manageSmtp.js set-pass <new_password>");
            process.exit(1);
        }

        const setting = await SystemSetting.findOne({ key: "SMTP_CONFIG" });
        if (!setting) {
            console.log("❌ No existing configuration found. Please use 'set' command first.");
            process.exit(1);
        }

        setting.value.pass = pass;
        // We need to mark 'value' as modified because it's a Mixed type in Mongoose
        setting.markModified('value');
        await setting.save();

        console.log(`✅ Password updated for user: ${setting.value.user}`);
    } else if (command === "clear") {
        await SystemSetting.findOneAndDelete({ key: "SMTP_CONFIG" });
        console.log("✅ SMTP Configuration cleared. System will now use Mock Mode (console logs).");
    } else {
        console.log("Usage:");
        console.log("  View config:   node scripts/manageSmtp.js view");
        console.log("  Set config:    node scripts/manageSmtp.js set <email> <password> [host] [port]");
        console.log("  Update pass:   node scripts/manageSmtp.js set-pass <new_password>");
        console.log("  Clear config:  node scripts/manageSmtp.js clear");
    }

    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
