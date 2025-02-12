// src/lib/types/api.ts
export type ResourceType = 'table' | 'view' | 'function';

export interface APIResource {
    schema: string;
    name: string;
    type: ResourceType;
}

export type APIOperation = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface APIOperationConfig {
    operation: APIOperation;
    color: string;
    description: string;
}

export const API_OPERATIONS: Record<APIOperation, APIOperationConfig> = {
    GET: {
        operation: 'GET',
        color: 'bg-blue-500 hover:bg-blue-600',
        description: 'Get resources'
    },
    POST: {
        operation: 'POST',
        color: 'bg-green-500 hover:bg-green-600',
        description: 'Create resource'
    },
    PUT: {
        operation: 'PUT',
        color: 'bg-orange-500 hover:bg-orange-600',
        description: 'Update resource'
    },
    DELETE: {
        operation: 'DELETE',
        color: 'bg-red-500 hover:bg-red-600',
        description: 'Delete resource'
    }
};


// Mapping of resource types to their allowed API operations
const allowedOperations: Record<ResourceType, APIOperation[]> = {
    table: ['GET', 'POST', 'PUT', 'DELETE'],
    view: ['GET'],
    function: ['POST'],
};

export function getAllowedOperations(type: ResourceType): APIOperation[] {
    return allowedOperations[type] ?? [];
}
