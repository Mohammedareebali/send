import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export class TracingService {
  private sdk: NodeSDK;

  constructor(serviceName: string) {
    const jaegerExporter = new JaegerExporter({
      endpoint: 'http://jaeger:14268/api/traces',
    });

    const prometheusExporter = new PrometheusExporter({
      port: 9464,
    });

    this.sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      }),
      
      metricReader: prometheusExporter,
      instrumentations: [getNodeAutoInstrumentations()],
    });
  }

  async start() {
    try {
      await this.sdk.start();
      console.log('Tracing initialized');
    } catch (error) {
      console.log('Error initializing tracing', error);
    }
  }

  async shutdown() {
    await this.sdk.shutdown();
  }
} 