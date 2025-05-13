const fs = require("fs");

let adminAuthConfig = null;
const credsString = process.env.CLOUDANT_CREDENTIALS;

if (credsString) {
    try {
        const creds = JSON.parse(credsString);
        if (creds.nodered_users && Array.isArray(creds.nodered_users) && creds.nodered_users.length > 0) {
            adminAuthConfig = {
                type: "credentials",
                users: creds.nodered_users.map(user => {
                    let permissions = "read"; // Default permission
                    if (user.role === "admin") {
                        permissions = "*";
                    }
                    // Add other role to permission mappings here if needed
                    return {
                        username: user.username,
                        password: user.password, // Assuming password is pre-hashed (bcrypt)
                        permissions: permissions
                    };
                })
            };
            console.log("Node-RED Admin Auth configured with users from CLOUDANT_CREDENTIALS.");
        } else {
            console.log("No 'nodered_users' array found or array is empty in CLOUDANT_CREDENTIALS. Admin auth not configured from env var.");
        }
    } catch (e) {
        console.error("Failed to parse CLOUDANT_CREDENTIALS for adminAuth or nodered_users is malformed:", e);
    }
} else {
    console.log("CLOUDANT_CREDENTIALS environment variable not set. Admin auth not configured from env var.");
}

module.exports = {
    uiPort: process.env.PORT || 1880,
    mqttReconnectTime: 15000,
    serialReconnectTime: 15000,
    debugMaxLength: 1000,
    flowFile: 'flows.json', // This will be managed by the storageModule
    flowFilePretty: true,
    userDir: '/data/',      // Node-RED's data directory
    nodesDir: '/usr/src/node-red/node_modules',

    // Configure the Cloudant storage plugin
    storageModule: require("node-red-contrib-cloudant-storage"),

    // Secure the editor and admin API
    adminAuth: adminAuthConfig,

    // Logging
    logging: {
        console: {
            level: "info",
            metrics: false,
            audit: false
        }
    },

    // Editor Theme
    editorTheme: {
        projects: {
            enabled: false // Projects are not typically used with this kind of storage setup
        }
    },

    // Function Global Context
    functionGlobalContext: {},

    // Disable anonymous metrics
    diagnostics: {
        enabled: true,
        ui: true
    }
}

