const util = require('./util');
const fs = require('fs');

let currentApis = [];
let currentKeys = [];
let currentPlans = [];
const apiMap = {};
const keyMap = {};
const usagePlanMap = {};

const verifyApis = async apis => {
    currentApis = await util.getApis();

    apis.forEach(a => {
        const foundById = currentApis.find(f => f.id === a.id);
        if (!foundById) {
            console.log(`API ${a.id} was not found in AWS, searching for another API named ${a.name}`);
            const foundByName = currentApis.find(f => f.name === a.name);
            if (foundByName) {
                console.log(`Found matching API ${foundByName.id} for previous API ${a.id} with name ${foundByName.name}`);
                apiMap[a.id] = foundByName.id;
            } else {
                throw new Error(`No API was found for id ${a.id} with name ${a.name}`);
            }
        } else {
            apiMap[a.id] = a.id;
        }
    });
    console.log('All REST APIs verified');
};

const verifyKeys = async keys => {
    currentKeys = await util.getApiKeys();
    keys.forEach(async k => {
        const foundById = currentKeys.find(ck => ck.id === k.id);
        if (!foundById) {
            console.log(`API key ${k.id} was not found by id, looking by value`);
            const foundByValue = currentKeys.find(mk => mk.value === k.value);
            if (foundByValue) {
                console.log(`Found matching API key ${foundByValue.id} for previous key ID ${k.id}`);
                keyMap[k.id] = foundByValue.id;
            } else {
                console.log(`No matching API key for key named ${k.name}, creating one now...`);
                const newKey = await util.createApiKey(k.name, k.value);
                keyMap[k.id] = newKey.id;
                console.log(`Created new key ${newKey.id} with key name ${k.name}`);
            }
        } else {
            keyMap[k.id] = k.id;
        }
    });
    console.log('All API keys verified');
};

const verifyUsagePlans = async plans => {
    currentPlans = await util.getUsagePlans();
    plans.forEach(async p => {
        const foundById = currentPlans.find(cp => cp.id === p.id);
        if (!foundById) {
            console.log(`Usage Plan ${p.id} was not found by id, looking by name`);
            const foundByName = currentPlans.find(mp => mp.name === p.name);
            if (foundByName) {
                console.log(`Found usage plan ${foundByName.id} with matching name ${foundByName.name}`);
                usagePlanMap[p.id] = foundByName.id;
            } else {
                console.log(`No matching usage plan found named ${p.name}, creating one now...`);
                const clonedP = JSON.parse(JSON.stringify(p));
                clonedP.apiStages.forEach(a => {
                    console.log(`Adding API ${apiMap[a.apiId]} (formerly ${a.apiId}) to the usage plan.`);
                    a.apiId = apiMap[a.apiId];
                });
                const newPlan = await util.createUsagePlan(clonedP);
                console.log(`Created new usage plan ${newPlan.id} and name ${newPlan.name}`);
                usagePlanMap[p.id] = newPlan.id;
            }
        } else {
            usagePlanMap[p.id] = p.id;
        }
    });
    console.log('All usage plans verified');
};

const verifyUsagePlanKeys = async (usagePlans, usagePlanKeys) => {
    for (const usagePlan of usagePlans) {
        const newId = usagePlanMap[usagePlan.id];
        if (newId !== usagePlan.id) {
            console.log(`Found new usage plan ${newId} for previous plan id ${usagePlan.id}`);
        }
        const newUsagePlanKeySet = await util.getUsagePlanKeys(newId);
        const originalUsagePlanKeySet = usagePlanKeys.find(u => u.id === usagePlan.id);
        await originalUsagePlanKeySet.keys.forEach(async k => {
            const newKeyId = keyMap[k.id];
            if (newKeyId !== k.id) {
                console.log(`Found new API key ${newKeyId} for previous key id ${k.id}`);
            }
            const keyCurrentlyAttached = newUsagePlanKeySet.find(n => n.id === newKeyId);
            if (!keyCurrentlyAttached) {
                console.log(`Key ${newKeyId} is not attached to usage plan ${newId}`);
                await util.createUsagePlanKey(newKeyId, k.type, newId);
                console.log(`Attached key ${newKeyId} to usage plan ${newId}`);
            }
        });
        console.log(`All keys present for usage plan ${newId}`);
    }
    console.log('All usage plan keys verified');
    return Promise.resolve();
};

(async() => {
    try {
        const backupPayloadRaw = fs.readFileSync('backup.json');
        const backupPayload = JSON.parse(backupPayloadRaw);
        const { apis, usagePlans, apiKeys, usagePlanKeys } = backupPayload;
        console.log(`${apis.length} APIs`);
        console.log(`${usagePlans.length} usage plans`);
        console.log(`${apiKeys.length} API keys`);
        console.log(`${usagePlanKeys.length} usage plan keys`);
        await verifyApis(apis);
        await verifyKeys(apiKeys);
        await verifyUsagePlans(usagePlans);
        await verifyUsagePlanKeys(usagePlans, usagePlanKeys);
    } catch (err) {
        if (err.name === 'NotFoundException' && err.message.startsWith('Invalid API identifier')) {
            console.error(err, '(This error is likely caused by a missing rest API)');
        } else {
            console.error(err);
        }
        
    }
})();