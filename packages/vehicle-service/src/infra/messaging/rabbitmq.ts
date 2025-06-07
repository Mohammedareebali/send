import { VehicleEvent } from '../../types/vehicle.types';
import { RabbitMQService as BaseRabbitMQService, RabbitMQConfig } from '@shared/messaging';
import { logger } from '@shared/logger';
import { getServiceConfig } from '../../config';

export class RabbitMQService extends BaseRabbitMQService {
  constructor(url: string = getServiceConfig().rabbitMQUrl) {
    const config: RabbitMQConfig = {
      url,
      exchange: 'vehicle-events',
      queue: 'vehicle-notifications'
    };
    super(config, logger);
  }

  async publishVehicleEvent(event: VehicleEvent): Promise<void> {
    await this.publishMessage(`vehicle.${event.type.toLowerCase()}`, event);
  }

  async subscribeToVehicleEvents(callback: (event: VehicleEvent) => Promise<void>): Promise<void> {
    await this.consumeMessages(callback);
  }
}
