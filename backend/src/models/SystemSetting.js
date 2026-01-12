import mongoose from "mongoose";

const systemSettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true, // e.g., "SMTP_CONFIG"
    },
    value: {
        type: mongoose.Schema.Types.Mixed, // Can be object, string, number, etc.
        required: true,
    },
    description: {
        type: String,
        default: "",
    },
}, { timestamps: true });

export const SystemSetting = mongoose.model("SystemSetting", systemSettingSchema);
export default SystemSetting;
