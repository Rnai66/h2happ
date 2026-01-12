import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.h2h.surin',
    appName: 'H2H Surin',
    webDir: 'dist',
    server: {
        androidScheme: 'http',
        cleartext: true
    },
    plugins: {
        GoogleAuth: {
            scopes: ['profile', 'email'],
            // ⚠️ REPLACE THIS with your Web Client ID from Google Cloud Console
            serverClientId: 'REPLACE_ME_WITH_WEB_CLIENT_ID',
            forceCodeForRefreshToken: true
        }
    }
};

export default config;
