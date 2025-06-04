import axios from 'axios';
import { Location } from '@shared/types/run';

export class RouteService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.MAPS_API_KEY || '';
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  async optimizeRoute(pickup: Location, dropoff: Location, waypoints?: Location[]): Promise<{
    distance: number;
    duration: number;
    route: any;
    traffic: any;
  }> {
    try {
      // Get route details from Google Maps API
      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: {
          origin: `${pickup.latitude},${pickup.longitude}`,
          destination: `${dropoff.latitude},${dropoff.longitude}`,
          waypoints: waypoints?.map(wp => `${wp.latitude},${wp.longitude}`).join('|'),
          key: this.apiKey,
          departure_time: 'now',
          traffic_model: 'best_guess',
          alternatives: false
        }
      });

      const route = response.data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance.value / 1000, // Convert to kilometers
        duration: leg.duration_in_traffic.value / 60, // Convert to minutes
        route: {
          coordinates: route.overview_polyline.points,
          steps: leg.steps.map((step: any) => ({
            distance: step.distance.value,
            duration: step.duration.value,
            instruction: step.html_instructions,
            coordinates: step.polyline.points
          }))
        },
        traffic: {
          congestion: leg.traffic_speed_entry,
          confidence: leg.traffic_confidence
        }
      };
    } catch (error) {
      console.error('Route optimization failed:', error);
      throw new Error('Failed to optimize route');
    }
  }

  async getTrafficConditions(location: Location): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/traffic/json`, {
        params: {
          location: `${location.latitude},${location.longitude}`,
          key: this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get traffic conditions:', error);
      throw new Error('Failed to get traffic conditions');
    }
  }
} 