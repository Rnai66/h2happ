
import { getConnection, DBNAMES } from "./config/dbPool.js";
import { UserModel } from "./models/User.js";

async function run() {
    try {
        const conn = getConnection(DBNAMES.USER);
        // Wait for connection to be ready
        await new Promise(resolve => {
            if (conn.readyState === 1) resolve();
            conn.once('connected', resolve);
        });

        const User = UserModel(conn);

        // Case insensitive search for "TestA"
        const user = await User.findOne({ name: { $regex: /^TestA$/i } });

        if (!user) {
            console.log("❌ User 'TestA' not found!");
            console.log("Creating 'TestA' as new Admin...");

            const bcrypt = await import("bcryptjs");
            const hash = await bcrypt.default.hash("123456", 10);

            const newUser = await User.create({
                name: "TestA",
                email: "testa@example.com",
                password: hash,
                passwordHash: hash, // For compatibility
                role: "admin",
                permissions: ["manage_users", "manage_items", "view_dashboard"],
                tokenBalance: 9999
            });

            console.log(`✅ Created and promoted 'TestA' (testa@example.com / 123456) to ADMIN!`);
            process.exit(0);
        }

        user.role = "admin";
        // Granting all convenient permissions just in case
        user.permissions = ["manage_users", "manage_items", "view_dashboard"];

        await user.save();
        console.log(`✅ Successfully promoted '${user.name}' (${user.email}) to ADMIN!`);
        console.log("Role:", user.role);
        console.log("Permissions:", user.permissions);

        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

run();
