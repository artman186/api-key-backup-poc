const { APIGatewayClient, GetRestApisCommand, GetApiKeysCommand,
    CreateApiKeyCommand, GetUsagePlansCommand, CreateUsagePlanCommand,
    GetUsagePlanKeysCommand, CreateUsagePlanKeyCommand } = require('@aws-sdk/client-api-gateway');

const createUsagePlan = async (usagePlan) => {
    const client = new APIGatewayClient({});
    const params = {
        apiStages: usagePlan.apiStages,
        description: usagePlan.description,
        name: usagePlan.name,
        quota: usagePlan.quota,
        tags: usagePlan.tags,
        throttle: usagePlan.throttle
    };
    const command = new CreateUsagePlanCommand(params);
    return client.send(command);
}

const createApiKey = async (keyName, keyValue) => {
    const client = new APIGatewayClient({});
    const params = {
        name: keyName,
        value: keyValue,
        enabled: true
    }
    const command = new CreateApiKeyCommand(params);
    return client.send(command);
};

const getResources = async (getCommand) => {
    const client = new APIGatewayClient({});
    const command = getCommand();
    let position;
    let results = [];
    const response = await client.send(command);
    position = response.position;
    results = response.items;
    while (position) {
        const paginatedCommand = getCommand(position);
        const paginatedResponse = await client.send(paginatedCommand);
        results = results.concat(paginatedResponse.items);
        position = paginatedResponse.position;
    }
    return results;
};

const getUsagePlans = async () => {
    return getResources((position => {
        const params = {};
        if (position) {
            params.position = position;
        }
        return new GetUsagePlansCommand(params);
    }));
};

const getApis = async () => {
    return getResources((position => {
        const params = {};
        if (position) {
            params.position = position;
        }
        return new GetRestApisCommand(params);
    }));
};

const getApiKeys = async () => {
    return getResources((position) => {
        const params = {
            includeValues: true
        };
        if (position) {
            params.position = position;
        }
        return new GetApiKeysCommand(params);
    });
};

const getUsagePlanKeys = async usagePlanId => {
    return getResources((position) => {
        const params = {
            usagePlanId
        };
        if (position) {
            params.position = position;
        }
        return new GetUsagePlanKeysCommand(params);
    });
};

const createUsagePlanKey = async (keyId, keyType, usagePlanId) => {
    const client = new APIGatewayClient({});
    const params = {
        keyId,
        keyType,
        usagePlanId
    };
    const command = new CreateUsagePlanKeyCommand(params);
    return client.send(command);
};

module.exports = {
    getResources,
    getApis,
    getApiKeys,
    createApiKey,
    getUsagePlans,
    getUsagePlans,
    createUsagePlan,
    getUsagePlanKeys,
    createUsagePlanKey
};