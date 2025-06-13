const Nano = require('nano');

let cloudant;
let dbName;

/**
 * Initializes the Cloudant connection and ensures the specified database exists.
 * Reads Cloudant configuration from the `CLOUDANT_CREDENTIALS` environment variable.
 * This variable should be a JSON string containing `url` (Cloudant URL) and `app_db` (database name).
 * @returns {Promise<void>} A promise that resolves when initialization is successful.
 * @throws {Error} Rejects if `CLOUDANT_CREDENTIALS` is not set, is malformed,
 *                 or if the Cloudant connection or database creation/verification fails.
 */
async function initCloudant() {
    const credsString = process.env.CLOUDANT_CREDENTIALS;
    if (!credsString) {
        const errMsg = "CLOUDANT_CREDENTIALS environment variable not set.";
        console.error(errMsg);
        return Promise.reject(new Error(errMsg));
    }

    let creds;
    try {
        creds = JSON.parse(credsString);
    } catch (e) {
        const errMsg = "Failed to parse CLOUDANT_CREDENTIALS JSON: " + e.message;
        console.error(errMsg);
        return Promise.reject(new Error(errMsg));
    }

    if (!creds.url || !creds.app_db) {
        const errMsg = "CLOUDANT_CREDENTIALS must contain 'url' and 'app_db'.";
        console.error(errMsg);
        return Promise.reject(new Error(errMsg));
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
        const errMsg = "Error initializing Cloudant connection or database: " + err.message;
        console.error(errMsg);
        return Promise.reject(new Error(errMsg));
    }
    return Promise.resolve();
}

/**
 * Fetches a specific part of a document from Cloudant.
 * If the document or the key within the document is not found, it returns a default value
 * (empty array `[]` if `dataKey` is 'flows', otherwise an empty object `{}`).
 * @param {string} docId - The ID of the Cloudant document (e.g., 'nodered_flows').
 * @param {string} dataKey - The key within the document that holds the desired data (e.g., 'flows').
 * @returns {Promise<any>} A promise that resolves with the requested data or a default value.
 * @throws {Error} Rejects if Cloudant is not initialized or if any other error occurs during the fetch.
 */
async function getDocument(docId, dataKey) {
    console.log(`CloudantStorage: getDocument for ${docId}`);
    if (!cloudant) return Promise.reject(new Error("Cloudant not initialized"));
    const appDb = cloudant.use(dbName);
    try {
        const doc = await appDb.get(docId);
        return doc[dataKey] || (dataKey === 'flows' ? [] : {});
    } catch (err) {
        if (err.statusCode === 404) {
            console.log(`CloudantStorage: No ${docId} document found, returning default value.`);
            return dataKey === 'flows' ? [] : {};
        }
        const errMsg = `CloudantStorage: Error getting ${docId}: ${err.message || err}`;
        console.error(errMsg);
        throw new Error(errMsg);
    }
}

/**
 * Saves data to a specific key within a Cloudant document.
 * If the document does not exist, it will be created.
 * @param {string} docId - The ID of the Cloudant document (e.g., 'nodered_flows').
 * @param {string} dataKey - The key within the document where the data should be stored (e.g., 'flows').
 * @param {any} data - The data to save.
 * @returns {Promise<void>} A promise that resolves when the data is successfully saved.
 * @throws {Error} Rejects if Cloudant is not initialized or if any error occurs during the save process.
 */
async function saveDocument(docId, dataKey, data) {
    console.log(`CloudantStorage: saveDocument for ${docId}`);
    if (!cloudant) return Promise.reject(new Error("Cloudant not initialized"));
    const appDb = cloudant.use(dbName);
    try {
        let doc;
        try {
            doc = await appDb.get(docId);
        } catch (err) {
            if (err.statusCode === 404) {
                doc = { _id: docId };
            } else {
                // Re-throw to be caught by the outer catch block
                throw err;
            }
        }
        doc[dataKey] = data;
        await appDb.insert(doc);
        console.log(`CloudantStorage: ${docId} saved successfully.`);
    } catch (err) {
        const errMsg = `CloudantStorage: Error saving ${docId}: ${err.message || err}`;
        console.error(errMsg);
        throw new Error(errMsg);
    }
}

module.exports = {
    /**
     * Initializes the Cloudant storage module for Node-RED.
     * This function is called by Node-RED when it starts up.
     * It triggers the Cloudant connection and database initialization.
     * @param {object} settings - Node-RED settings object. Not directly used by this init's core logic
     *                            but available as part of the Node-RED storage API.
     * @returns {Promise<void>} A promise that resolves when the storage module is initialized.
     * @throws {Error} Rejects if the underlying `initCloudant()` call fails.
     */
    init: function(settings) {
        console.log("CloudantStorage: Initializing...");
        return initCloudant()
            .then(() => {
                console.log("CloudantStorage: Initialized successfully.");
            })
            .catch(err => {
                const errMsg = "CloudantStorage: Initialization failed: " + (err.message || err);
                console.error(errMsg);
                return Promise.reject(new Error(errMsg));
            });
    },

    /**
     * Retrieves the flows from Cloudant.
     * @returns {Promise<Array>} A promise that resolves with the flows array.
     *                           Returns an empty array if no flows are found.
     * @throws {Error} Rejects if an error occurs while fetching flows.
     */
    getFlows: async function() {
        // console.log("CloudantStorage: getFlows"); // Covered by getDocument
        return getDocument('nodered_flows', 'flows');
    },

    /**
     * Saves the flows to Cloudant.
     * @param {Array} flows - The flows array to save.
     * @returns {Promise<void>} A promise that resolves when the flows are saved.
     * @throws {Error} Rejects if an error occurs while saving flows.
     */
    saveFlows: async function(flows) {
        // console.log("CloudantStorage: saveFlows"); // Covered by saveDocument
        return saveDocument('nodered_flows', 'flows', flows);
    },

    /**
     * Retrieves the credentials from Cloudant.
     * @returns {Promise<object>} A promise that resolves with the credentials object.
     *                            Returns an empty object if no credentials are found.
     * @throws {Error} Rejects if an error occurs while fetching credentials.
     */
    getCredentials: async function() {
        // console.log("CloudantStorage: getCredentials"); // Covered by getDocument
        return getDocument('nodered_credentials', 'credentials');
    },

    /**
     * Saves the credentials to Cloudant.
     * @param {object} credentials - The credentials object to save.
     * @returns {Promise<void>} A promise that resolves when the credentials are saved.
     * @throws {Error} Rejects if an error occurs while saving credentials.
     */
    saveCredentials: async function(credentials) {
        // console.log("CloudantStorage: saveCredentials"); // Covered by saveDocument
        return saveDocument('nodered_credentials', 'credentials', credentials);
    },

    /**
     * Retrieves the settings from Cloudant.
     * @returns {Promise<object>} A promise that resolves with the settings object.
     *                            Returns an empty object if no settings are found.
     * @throws {Error} Rejects if an error occurs while fetching settings.
     */
    getSettings: async function() {
        // console.log("CloudantStorage: getSettings"); // Covered by getDocument
        return getDocument('nodered_settings', 'settings');
    },

    /**
     * Saves the settings to Cloudant.
     * @param {object} settings - The settings object to save.
     * @returns {Promise<void>} A promise that resolves when the settings are saved.
     * @throws {Error} Rejects if an error occurs while saving settings.
     */
    saveSettings: async function(settings) {
        // console.log("CloudantStorage: saveSettings"); // Covered by saveDocument
        return saveDocument('nodered_settings', 'settings', settings);
    }
};
[end of node-red-cloudant-storage/cloudant-storage.js]
