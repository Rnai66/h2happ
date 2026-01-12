import nodemailer from "nodemailer";
import { SystemSetting } from "../models/SystemSetting.js";

// Cached transporter to avoid re-creating on every email (optional optimization)
let cachedTransporter = null;

const createTransporter = async () => {
    // 1. Try ENV
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    // 2. Try DB
    try {
        const setting = await SystemSetting.findOne({ key: "SMTP_CONFIG" });
        if (setting && setting.value && setting.value.user && setting.value.pass) {
            console.log("📧 [Email] Using credentials from Database (SMTP_CONFIG)");

            const { user, pass, host, port, secure } = setting.value;

            // If user provided a specific host, use it. Otherwise default to "gmail" service.
            if (host) {
                return nodemailer.createTransport({
                    host,
                    port: Number(port) || 587,
                    secure: secure === true || secure === "true", // usually false for 587, true for 465
                    auth: { user, pass },
                });
            }

            // Default to Gmail if no host specified
            return nodemailer.createTransport({
                service: "gmail",
                auth: { user, pass },
            });
        }
    } catch (err) {
        console.error("❌ Error fetching SMTP_CONFIG:", err);
    }

    return null;
};

export const sendEmail = async ({ to, subject, html, text }) => {
    const transporter = await createTransporter();

    if (!transporter) {
        console.log("⚠️ [Mock Email] No EMAIL_USER/PASS in ENV or DB.");
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${text || html}`);
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"H2H Authorization" <no-reply@h2h.com>',
            to,
            subject,
            text,
            html,
        });
        console.log("✅ Email sent: %s", info.messageId);
        return info;
    } catch (error) {
        if (error.code === 'EAUTH') {
            console.error("❌ Email Auth Error: Invalid login or password. Please check your credentials in MongoDB (scripts/manageSmtp.js) or .env");
        } else {
            console.error("❌ Error sending email:", error);
        }
        throw error;
    }
};
