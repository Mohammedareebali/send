declare module 'opossum' {
  export class CircuitBreaker {
    constructor(fn: Function, options?: CircuitBreakerOptions);
    fire(...args: any[]): Promise<any>;
    fallback(fn: Function): void;
    on(event: string, fn: Function): void;
    state: 'OPEN' | 'CLOSED' | 'HALF_OPEN';
  }

  export interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    rollingCountTimeout?: number;
    rollingCountBuckets?: number;
    name?: string;
    group?: string;
    rollingPercentilesEnabled?: boolean;
    capacity?: number;
    errorFilter?: (error: Error) => boolean;
    cache?: boolean;
    volumeThreshold?: number;
  }
} 