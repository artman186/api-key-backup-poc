const fs = require('fs');
const util = require('./util');

(async () => {
    try {
        const promises = [util.getApis(), util.getUsagePlans(), util.getApiKeys()];
        const results = await Promise.all(promises);
        const [ apis, usagePlans, apiKeys ] = results;
        console.log(`${apis.length} APIs`);
        console.log(`${usagePlans.length} usage plans`);
        console.log(`${apiKeys.length} API keys`);
        const usagePlanKeys = [];
        const usagePlanKeyPromises = [];
        usagePlans.forEach(up => {
            const pr = util.getUsagePlanKeys(up.id).then(keys => {
                usagePlanKeys.push({
                    id: up.id,
                    keys
                });
            });
            usagePlanKeyPromises.push(pr);
        });
        await Promise.all(usagePlanKeyPromises);
        console.log(`${usagePlanKeys.length} usage plan keys`);
        const backupPayload = {
            apis, usagePlans, apiKeys, usagePlanKeys
        };
        fs.writeFileSync('backup.json', JSON.stringify(backupPayload));
    } catch (err) {
        console.error(err);
    }
})();