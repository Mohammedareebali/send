import { ConfigService } from '../../services/config.service';

describe('ConfigService', () => {
  it('retrieves and updates configuration', async () => {
    const service = new ConfigService();

    expect(await service.getConfig()).toEqual({});

    await service.updateConfig({ a: 1 });
    expect(await service.getConfig()).toEqual({ a: 1 });

    await service.updateConfig({ b: 2 });
    expect(await service.getConfig()).toEqual({ a: 1, b: 2 });
  });
});
