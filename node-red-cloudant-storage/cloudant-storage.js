const Nano = require('nano');

let cloudant;
let dbName;

async function initCloudant() {
    const credsString = process.env.CLOUDANT_CREDENTIALS;
    if (!credsString) {
        console.error("CLOUDANT_CREDENTIALS environment variable not set.");
        return Promise.reject("CLOUDANT_CREDENTIALS environment variable not set.");
    }

    let creds;
    try {
        creds = JSON.parse(credsString);
    } catch (e) {
        console.error("Failed to parse CLOUDANT_CREDENTIALS JSON:", e);
        return Promise.reject("Failed to parse CLOUDANT_CREDENTIALS JSON.");
    }

    if (!creds.url || !creds.app_db) {
        console.error("CLOUDANT_CREDENTIALS must contain 'url' and 'app_db'.");
        return Promise.reject("CLOUDANT_CREDENTIALS must contain 'url' and 'app_db'.");
    }

    try {
        cloudant = Nano(creds.url);
        dbName = creds.app_db;

        const dbList = await cloudant.db.list();
        if (!dbList.includes(dbName)) {
            await cloudant.db.create(dbName);
            console.log(`Database '${dbName}' created successfully.`);
        }
        console.log(`Using database '${dbName}'.`);
    } catch (err) {
        console.error("Error initializing Cloudant connection or database:", err);
        return Promise.reject(err);
    }
    return Promise.resolve();
}

module.exports = {
    init: function(settings) {
        console.log("CloudantStorage: Initializing...");
        return initCloudant()
            .then(() => {
                console.log("CloudantStorage: Initialized successfully.");
            })
            .catch(err => {
                console.error("CloudantStorage: Initialization failed:", err);
                return Promise.reject(err); // Propagate rejection
            });
    },

    getFlows: async function() {
        console.log("CloudantStorage: getFlows");
        if (!cloudant) return Promise.reject("Cloudant not initialized");
        const appDb = cloudant.use(dbName);
        try {
            const doc = await appDb.get('nodered_flows');
            return doc.flows || [];
        } catch (err) {
            if (err.statusCode === 404) {
                console.log("CloudantStorage: No flows document found, returning empty array.");
                return [];
            }
            console.error("CloudantStorage: Error getting flows:", err);
            throw err;
        }
    },

    saveFlows: async function(flows) {
        console.log("CloudantStorage: saveFlows");
        if (!cloudant) return Promise.reject("Cloudant not initialized");
        const appDb = cloudant.use(dbName);
        try {
            let doc;
            try {
                doc = await appDb.get('nodered_flows');
            } catch (err) {
                if (err.statusCode === 404) {
                    doc = { _id: 'nodered_flows' }; 
                } else {
                    throw err;
                }
            }
            doc.flows = flows;
            await appDb.insert(doc);
            console.log("CloudantStorage: Flows saved successfully.");
        } catch (err) {
            console.error("CloudantStorage: Error saving flows:", err);
            throw err;
        }
    },

    getCredentials: async function() {
        console.log("CloudantStorage: getCredentials");
        if (!cloudant) return Promise.reject("Cloudant not initialized");
        const appDb = cloudant.use(dbName);
        try {
            const doc = await appDb.get('nodered_credentials');
            return doc.credentials || {};
        } catch (err) {
            if (err.statusCode === 404) {
                console.log("CloudantStorage: No credentials document found, returning empty object.");
                return {};
            }
            console.error("CloudantStorage: Error getting credentials:", err);
            throw err;
        }
    },

    saveCredentials: async function(credentials) {
        console.log("CloudantStorage: saveCredentials");
        if (!cloudant) return Promise.reject("Cloudant not initialized");
        const appDb = cloudant.use(dbName);
        try {
            let doc;
            try {
                doc = await appDb.get('nodered_credentials');
            } catch (err) {
                if (err.statusCode === 404) {
                    doc = { _id: 'nodered_credentials' };
                } else {
                    throw err;
                }
            }
            doc.credentials = credentials;
            await appDb.insert(doc);
            console.log("CloudantStorage: Credentials saved successfully.");
        } catch (err) {
            console.error("CloudantStorage: Error saving credentials:", err);
            throw err;
        }
    },

    getSettings: async function() {
        console.log("CloudantStorage: getSettings");
        if (!cloudant) return Promise.reject("Cloudant not initialized");
        const appDb = cloudant.use(dbName);
        try {
            const doc = await appDb.get('nodered_settings');
            return doc.settings || {};
        } catch (err) {
            if (err.statusCode === 404) {
                console.log("CloudantStorage: No settings document found, returning empty object.");
                return {};
            }
            console.error("CloudantStorage: Error getting settings:", err);
            throw err;
        }
    },

    saveSettings: async function(settings) {
        console.log("CloudantStorage: saveSettings");
        if (!cloudant) return Promise.reject("Cloudant not initialized");
        const appDb = cloudant.use(dbName);
        try {
            let doc;
            try {
                doc = await appDb.get('nodered_settings');
            } catch (err) {
                if (err.statusCode === 404) {
                    doc = { _id: 'nodered_settings' };
                } else {
                    throw err;
                }
            }
            doc.settings = settings;
            await appDb.insert(doc);
            console.log("CloudantStorage: Settings saved successfully.");
        } catch (err) {
            console.error("CloudantStorage: Error saving settings:", err);
            throw err;
        }
    }
};
