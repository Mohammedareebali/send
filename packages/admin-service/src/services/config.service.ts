export interface TenantConfig {
  [key: string]: any;
}

export class ConfigService {
  private config: TenantConfig = {};

  async getConfig(): Promise<TenantConfig> {
    return this.config;
  }

  async updateConfig(updates: TenantConfig): Promise<TenantConfig> {
    this.config = { ...this.config, ...updates };
    return this.config;
  }
}
