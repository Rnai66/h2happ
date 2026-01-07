import express from "express";
import { OAuth2Client } from "google-auth-library";
import appleSignin from "apple-signin-auth";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
    return jwt.sign(
        { userId: user._id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// ------------------------------------------------------------------
// POST /auth/social/google
// Body: { idToken }
// ------------------------------------------------------------------
router.post("/google", async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ message: "Missing idToken" });

        // Verify Google Token
        // NOTE: In production, providing CLIENT_ID is recommended
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, sub: googleId, picture } = payload;

        const User = UserModel(req.conn); // Use factory

        // Find or Create User
        let user = await User.findOne({ email });

        if (user) {
            // Link googleId if not present
            if (!user.googleId) {
                user.googleId = googleId;
                if (!user.avatar) user.avatar = picture;
                await user.save();
            }
        } else {
            // Create new user (Auto Register)
            // Generate a random password for social users
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            user = await User.create({
                name: name || "Google User",
                email,
                googleId,
                avatar: picture,
                password: randomPassword, // Required field
                tokenBalance: 10, // Sign up bonus
            });

            // Bonus logical (optional): Add transaction record if needed
        }

        const token = generateToken(user);
        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                tokenBalance: user.tokenBalance
            },
            tokenBalance: user.tokenBalance
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(401).json({ message: "Invalid Google Token" });
    }
});

// ------------------------------------------------------------------
// POST /auth/social/apple
// Body: { identityToken, user } (user object contains name for first sign in)
// ------------------------------------------------------------------
router.post("/apple", async (req, res) => {
    try {
        const { identityToken, fullName } = req.body;
        if (!identityToken) return res.status(400).json({ message: "Missing identityToken" });

        // Verify Apple Token
        const appleIdToken = await appleSignin.verifyIdToken(identityToken, {
            audience: process.env.APPLE_CLIENT_ID,
            ignoreExpiration: true, // Optional
        });

        const { email, sub: appleId } = appleIdToken;

        // Apple only sends name on first login, frontend should send it if available
        const name = fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : "Apple User";

        const User = UserModel(req.conn);

        let user = await User.findOne({ $or: [{ appleId }, { email }] });

        if (user) {
            if (!user.appleId) {
                user.appleId = appleId;
                await user.save();
            }
        } else {
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            user = await User.create({
                name: name || "Apple User",
                email: email, // Private relay emails are like xxx@privaterelay.appleid.com
                appleId,
                password: randomPassword,
                tokenBalance: 10,
            });
        }

        const token = generateToken(user);
        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                tokenBalance: user.tokenBalance
            },
            tokenBalance: user.tokenBalance
        });

    } catch (error) {
        console.error("Apple Auth Error:", error);
        res.status(401).json({ message: "Invalid Apple Token" });
    }
});

export default router;
