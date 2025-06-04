declare module 'opossum' {
  export interface CircuitBreaker {
    constructor(fn: Function, options?: CircuitBreakerOptions): CircuitBreaker;
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

import { CircuitBreaker as OpossumCircuitBreaker, CircuitBreakerOptions } from 'opossum';
import { prometheus } from './prometheus';

export class CircuitBreakerService {
  private breaker: OpossumCircuitBreaker;

  constructor(
    private serviceName: string,
    options: CircuitBreakerOptions = {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000
    }
  ) {
    this.breaker = new OpossumCircuitBreaker(async (fn: () => Promise<any>) => {
      const start = Date.now();
      try {
        const result = await fn();
        const duration = Date.now() - start;
        prometheus.serviceRequestDuration.observe(
          { service: this.serviceName },
          duration / 1000
        );
        prometheus.serviceRequestsTotal.inc({
          service: this.serviceName,
          status: 'success'
        });
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        prometheus.serviceRequestDuration.observe(
          { service: this.serviceName },
          duration / 1000
        );
        prometheus.serviceRequestsTotal.inc({
          service: this.serviceName,
          status: 'error'
        });
        prometheus.circuitBreakerFailures.inc({
          service: this.serviceName
        });
        throw error;
      }
    }, options);

    this.breaker.on('open', () => {
      prometheus.circuitBreakerState.set(
        { service: this.serviceName },
        1 // OPEN
      );
    });

    this.breaker.on('halfOpen', () => {
      prometheus.circuitBreakerState.set(
        { service: this.serviceName },
        2 // HALF_OPEN
      );
    });

    this.breaker.on('close', () => {
      prometheus.circuitBreakerState.set(
        { service: this.serviceName },
        0 // CLOSED
      );
    });
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return this.breaker.fire(fn);
  }

  getState(): 'OPEN' | 'CLOSED' | 'HALF_OPEN' {
    return this.breaker.state;
  }
} 