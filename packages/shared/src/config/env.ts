import { config as dotenvConfig, DotenvConfigOptions } from 'dotenv';

/**
 * Loads environment variables from a .env file. This should be called once at application startup.
 */
export class EnvLoader {
  private static loaded = false;

  /**
   * Load environment variables using dotenv. Subsequent calls are ignored.
   * @param options Optional dotenv configuration.
   */
  static load(options?: DotenvConfigOptions): void {
    if (!EnvLoader.loaded) {
      dotenvConfig(options);
      EnvLoader.loaded = true;
    }
  }
}
