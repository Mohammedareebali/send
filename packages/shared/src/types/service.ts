export interface ServiceConfig {
    name: string;
    url: string;
    healthCheckPath: string;
    timeout: number;
    retries: number;
}

export interface HealthStatus {
    status: 'UP' | 'DOWN';
    timestamp: string;
    details?: Record<string, any>;
}

export interface ServiceResponse<T> {
    data: T;
    status: number;
    message?: string;
}

export interface ErrorResponse {
    error: string;
    message: string;
    status: number;
} 