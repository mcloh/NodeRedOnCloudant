module.exports = {
    uiPort: process.env.PORT || 1880,
    mqttReconnectTime: 15000,
    serialReconnectTime: 15000,
    debugMaxLength: 1000,
    flowFile: 'flows.json',
    flowFilePretty: true,
    userDir: '/data/',
    nodesDir: '/usr/src/node-red/node_modules',

    // Configure the Cloudant storage plugin
    storageModule: require("node-red-contrib-cloudant-storage"),

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

