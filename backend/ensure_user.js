
import { getConnection, DBNAMES } from "./src/config/dbPool.js";
import { userSchema } from "./src/models/User.js";
import bcrypt from "bcryptjs";

async function run() {
    try {
        console.log("Connecting to DB...");
        const conn = getConnection(DBNAMES.USER);
        const User = conn.model("User", userSchema);

        // Wait for connection to be ready
        await new Promise((resolve) => {
            if (conn.readyState === 1) return resolve();
            conn.once("connected", resolve);
        });
        console.log("Connected.");

        const email = "naiguitarfolk@gmail.com";
        console.log("Checking user:", email);

        const user = await User.findOne({ email });

        if (user) {
            console.log(`User ${email} found.`);
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash("123456", salt);
            user.passwordHash = hash;
            await user.save();
            console.log("✅ Update Success: key '123456'");
        } else {
            console.log(`User ${email} not found. Creating...`);
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash("123456", salt);

            await User.create({
                name: "Nai Guitarfolk",
                email: email,
                passwordHash: hash,
                role: "user",
                phone: "0812345678"
            });
            console.log("✅ Create Success: key '123456'");
        }

        setTimeout(() => process.exit(0), 1000);
    } catch (e) {
        console.error("❌ Error:", e);
        process.exit(1);
    }
}

run();
