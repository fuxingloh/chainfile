import * as schema from '@chainfile/schema';
import { PersistentVolumeClaimSpec, Quantity, Volume } from 'cdk8s-plus-25/lib/imports/k8s';

export function CFEphemeralVolume(props: { name: string; volume: schema.Volume }): Volume {
  return {
    name: props.name,
    emptyDir: {
      sizeLimit: calculateStorage(props.volume, {
        min: 3,
        max: 6,
      }),
    },
  };
}

export function CFPersistentVolumeClaimSpec(props: { volume: schema.Volume }): PersistentVolumeClaimSpec {
  return {
    accessModes: ['ReadWriteOnce'],
    resources: {
      requests: {
        storage: calculateStorage(props.volume, {
          min: 3,
          max: 6,
        }),
      },
    },
  };
}

type SizeUnit = 'M' | 'G' | 'T';

/**
 * Determines the storage size for a volume based on its configuration.
 *
 * If the volume has an expansion policy, the size is calculated based on the monthly rate.
 * The `options.min` and `options.max` parameter defines the boundary of the volume in monthly intervals.
 * To reduce drift, the volume size is rounded up to the next interval (interval=max-min).
 * This means that the volume size will be at least `options.min` and at most `options.max` after the first month.
 *
 * Although the volume can technically shrink when the schema changes.
 * Volume shrinking is not supported by most storage providers which will result in "kubectl apply" error.
 */
export function calculateStorage(
  volume: schema.Volume,
  options: {
    min: number;
    max: number;
    today?: Date;
  },
): Quantity {
  const sizeMi = parseSizeAsMi(volume.size);

  if (volume.expansion) {
    const today = options.today ?? new Date(Date.now());
    const startFrom = new Date(volume.expansion.startFrom);
    if (today >= startFrom) {
      const monthsSince =
        (today.getFullYear() - startFrom.getFullYear()) * 12 + (today.getMonth() - startFrom.getMonth());
      const interval = options.max - options.min;
      const monthsSinceRounded = Math.ceil((monthsSince + options.max) / interval) * interval;
      const growthRateMi = parseSizeAsMi(volume.expansion.monthlyRate);

      const finalMi = sizeMi + growthRateMi * Math.max(0, monthsSinceRounded);
      return Quantity.fromString(`${finalMi}Mi`);
    }
  }

  return Quantity.fromString(`${sizeMi}Mi`);
}

function parseSizeAsMi(size: string): number {
  const match = size.match(/^(\d+)([MGT])i$/);
  if (!match) {
    throw new Error(`Invalid size format: ${size}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2] as SizeUnit;

  return convertToMi(value, unit);
}

function convertToMi(value: number, unit: SizeUnit): number {
  switch (unit) {
    case 'M':
      return value;
    case 'G':
      return value * 1024;
    case 'T':
      return value * 1024 * 1024;
    default:
      throw new Error(`Invalid unit: ${unit}`);
  }
}
