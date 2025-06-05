import { RouteService } from '../../../infra/services/route.service';
import { Location } from '@shared/types/run';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RouteService', () => {
  let service: RouteService;
  const mockPickup: Location = {
    latitude: 51.5074,
    longitude: -0.1278,
    address: 'London, UK'
  };
  const mockDropoff: Location = {
    latitude: 51.4545,
    longitude: -2.5879,
    address: 'Bristol, UK'
  };

  beforeEach(() => {
    process.env.MAPS_API_KEY = 'test-key';
    service = new RouteService();
  });

  describe('optimizeRoute', () => {
    it('should optimize route and return route details', async () => {
      const mockResponse = {
        data: {
          routes: [{
            legs: [{
              distance: { value: 200000 }, // 200km
              duration_in_traffic: { value: 7200 }, // 2 hours
              steps: [{
                distance: { value: 1000 },
                duration: { value: 60 },
                html_instructions: 'Head north',
                polyline: { points: 'test' }
              }],
              traffic_speed_entry: 'MODERATE',
              traffic_confidence: 0.8
            }],
            overview_polyline: { points: 'test' }
          }]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.optimizeRoute(mockPickup, mockDropoff);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/directions/json',
        expect.objectContaining({
          params: expect.objectContaining({
            origin: '51.5074,-0.1278',
            destination: '51.4545,-2.5879',
            key: 'test-key'
          })
        })
      );

      expect(result).toEqual({
        distance: 200,
        duration: 120,
        route: {
          coordinates: 'test',
          steps: [{
            distance: 1000,
            duration: 60,
            instruction: 'Head north',
            coordinates: 'test'
          }]
        },
        traffic: {
          congestion: 'MODERATE',
          confidence: 0.8
        }
      });
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(service.optimizeRoute(mockPickup, mockDropoff))
        .rejects
        .toThrow('Failed to optimize route');
    });
  });

  describe('getTrafficConditions', () => {
    it('should get traffic conditions for a location', async () => {
      const mockResponse = {
        data: {
          traffic: 'MODERATE',
          confidence: 0.8
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.getTrafficConditions(mockPickup);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/traffic/json',
        expect.objectContaining({
          params: expect.objectContaining({
            location: '51.5074,-0.1278',
            key: 'test-key'
          })
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(service.getTrafficConditions(mockPickup))
        .rejects
        .toThrow('Failed to get traffic conditions');
    });
  });
}); 