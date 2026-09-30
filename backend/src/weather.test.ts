import { afterEach, describe, expect, it, vi } from 'vitest';
import { SingaporeWeatherClient } from './weather.js';

const stations = [
  { id: 'S1', location: { latitude: 1.35, longitude: 103.85 } },
  { id: 'S2', location: { latitude: 1.44, longitude: 103.7 } },
];

function readingPayload(values: Record<string, number>) {
  return {
    code: 0,
    data: {
      stations,
      readings: [
        {
          timestamp: '2026-09-30T10:00:00+08:00',
          data: Object.entries(values).map(([stationId, value]) => ({ stationId, value })),
        },
      ],
    },
  };
}

const forecastPayload = {
  code: 0,
  data: {
    area_metadata: [
      { name: 'Bishan', label_location: { latitude: 1.35, longitude: 103.84 } },
      { name: 'Lim Chu Kang', label_location: { latitude: 1.42, longitude: 103.71 } },
    ],
    items: [
      {
        update_timestamp: '2026-09-30T09:45:00+08:00',
        valid_period: { text: '10 to 12 PM' },
        forecasts: [
          { area: 'Bishan', forecast: 'Partly Cloudy (Day)' },
          { area: 'Lim Chu Kang', forecast: 'Showers' },
        ],
      },
    ],
  },
};

const uvPayload = {
  code: 0,
  data: {
    records: [
      {
        updatedTimestamp: '2026-09-30T10:05:00+08:00',
        index: [
          { hour: '2026-09-30T10:00:00+08:00', value: 3 },
          { hour: '2026-09-30T09:00:00+08:00', value: 1 },
        ],
      },
    ],
  },
};

function stubFetch(responses: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const endpoint = url.split('/').pop() as string;
      const body = responses[endpoint];
      if (!body) return new Response('{}', { status: 500 });
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
}

describe('SingaporeWeatherClient.getCurrentWeather', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('merges the 2-hour forecast with the nearest station readings', async () => {
    stubFetch({
      'two-hr-forecast': forecastPayload,
      'air-temperature': readingPayload({ S1: 30.4, S2: 27.1 }),
      'relative-humidity': readingPayload({ S1: 72, S2: 90 }),
      rainfall: readingPayload({ S1: 0, S2: 2.4 }),
      'wind-speed': readingPayload({ S1: 6.2, S2: 11 }),
      'wind-direction': readingPayload({ S1: 135, S2: 270 }),
      uv: uvPayload,
    });

    const snapshot = await new SingaporeWeatherClient().getCurrentWeather(1.351, 103.849);

    expect(snapshot).toMatchObject({
      condition: 'Partly Cloudy (Day)',
      area: 'Bishan',
      observed_at: '2026-09-30T09:45:00+08:00',
      temperature_c: 30.4,
      humidity_percent: 72,
      rainfall_mm: 0,
      wind_speed_knots: 6.2,
      wind_direction_degrees: 135,
      uv_index: 3,
    });
  });

  it('keeps the forecast condition when metric readings fail', async () => {
    stubFetch({
      'two-hr-forecast': forecastPayload,
      'air-temperature': readingPayload({ S1: 30.4 }),
    });

    const snapshot = await new SingaporeWeatherClient().getCurrentWeather(1.351, 103.849);

    expect(snapshot).toMatchObject({
      condition: 'Partly Cloudy (Day)',
      temperature_c: 30.4,
      humidity_percent: null,
      rainfall_mm: null,
      wind_speed_knots: null,
      wind_direction_degrees: null,
      uv_index: null,
    });
  });

  it('falls back to the reading timestamp when the forecast is unavailable', async () => {
    stubFetch({ rainfall: readingPayload({ S2: 2.4 }) });

    const snapshot = await new SingaporeWeatherClient().getCurrentWeather(1.44, 103.7);

    expect(snapshot).toMatchObject({
      condition: 'Unavailable',
      observed_at: '2026-09-30T10:00:00+08:00',
      rainfall_mm: 2.4,
      temperature_c: null,
    });
  });
});
