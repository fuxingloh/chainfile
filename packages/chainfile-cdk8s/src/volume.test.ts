import * as schema from '@chainfile/schema';
import { describe, expect, it } from '@workspace/jest/globals';

import { calculateStorage } from './volume';

it('should calculate volume without expansion', async () => {
  const volume: schema.Volume = {
    type: 'persistent',
    size: '100Gi',
  };

  expect(
    calculateStorage(volume, {
      min: 3,
      max: 6,
      today: new Date('2021-09-01'),
    }),
  ).toEqual({ value: '102400Mi' });
});

describe('expansion', () => {
  it.each([
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 1,
      max: 12,
      today: '2024-01-01',
      expected: '10220Mi',
    },
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 3,
      max: 9,
      today: '2024-06-01',
      expected: '10180Mi',
    },
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 3,
      max: 6,
      today: '2024-06-01',
      expected: '10120Mi',
    },
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 3,
      max: 6,
      today: '2024-07-01',
      expected: '10120Mi',
    },
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 3,
      max: 6,
      today: '2024-08-01',
      expected: '10150Mi',
    },
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 3,
      max: 6,
      today: '2024-09-01',
      expected: '10150Mi',
    },
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 3,
      max: 6,
      today: '2024-10-01',
      expected: '10150Mi',
    },
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 3,
      max: 6,
      today: '2024-11-01',
      expected: '10180Mi',
    },
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 4,
      max: 6,
      today: '2024-09-01',
      expected: '10140Mi',
    },
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 6,
      max: 9,
      today: '2024-08-01',
      expected: '10180Mi',
    },
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 6,
      max: 9,
      today: '2024-09-01',
      expected: '10180Mi',
    },
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 6,
      max: 9,
      today: '2024-10-01',
      expected: '10180Mi',
    },
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 6,
      max: 9,
      today: '2024-11-01',
      expected: '10210Mi',
    },
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 6,
      max: 9,
      today: '2024-12-01',
      expected: '10210Mi',
    },
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 6,
      max: 9,
      today: '2025-01-01',
      expected: '10210Mi',
    },
    {
      size: '10000Mi',
      rate: '10Mi',
      startFrom: '2024-01-01',
      min: 6,
      max: 9,
      today: '2025-02-01',
      expected: '10240Mi',
    },
  ])('should calculate volume with expansion %p', async ({ size, rate, startFrom, min, max, today, expected }) => {
    const volume: schema.Volume = {
      type: 'persistent',
      size: size,
      expansion: {
        startFrom: startFrom,
        monthlyRate: rate,
      },
    };

    expect(
      calculateStorage(volume, {
        min: min,
        max: max,
        today: new Date(today),
      }),
    ).toEqual({ value: expected });
  });
});
