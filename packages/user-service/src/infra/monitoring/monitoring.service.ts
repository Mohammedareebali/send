import { Registry } from 'prom-client';
import { logger } from '@send/shared';

export class MonitoringService {
    private static instance: MonitoringService;
    private registry: Registry;

    private constructor() {
        this.registry = new Registry();
        this.initializeMetrics();
    }

    public static getInstance(): MonitoringService {
        if (!MonitoringService.instance) {
            MonitoringService.instance = new MonitoringService();
        }
        return MonitoringService.instance;
    }

    private initializeMetrics() {
        try {
            // Add default metrics
            require('prom-client').collectDefaultMetrics({
                register: this.registry,
                prefix: 'user_service_',
            });

            logger.info('Monitoring service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize monitoring service:', error);
        }
    }

    public getRegistry(): Registry {
        return this.registry;
    }

    public async getMetrics(): Promise<string> {
        try {
            return await this.registry.metrics();
        } catch (error) {
            logger.error('Failed to get metrics:', error);
            return '';
        }
    }
} 