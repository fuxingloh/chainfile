import { randomBytes } from 'node:crypto';

import schema, { Chainfile, Container, ValueOptions, ValueReference } from '@chainfile/schema';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import mapValues from 'lodash/mapValues';

import { version } from '../package.json';

/**
 * Synthesize a Chainfile into `docker.*.yml` & `.env` files.
 */
export class Compose {
  public readonly chainfile: Chainfile;
  public readonly values: Record<string, string>;
  public readonly suffix: string;

  /**
   * @param chainfile definition to synthesize.
   * @param overrideValues to override the chainfile values.
   * @param suffix for the container names to prevent conflicts.
   */
  constructor(
    chainfile: Chainfile,
    overrideValues: Record<string, string>,
    suffix: string = randomBytes(4).toString('hex'),
  ) {
    validate(chainfile);
    this.chainfile = chainfile;
    this.values = initValues(chainfile, overrideValues);
    this.suffix = suffix;
  }

  public synthDotEnv(): string {
    return Object.entries({
      // TODO(?): this.values should filter out values that are not used in the compose file
      ...this.values,
      CHAINFILE_VALUES: JSON.stringify(this.values),
    })
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
  }

  public synthCompose(): string {
    return [
      `# Generated by @chainfile/docker:${version}, do not edit manually.`,
      `# Version: ${version}`,
      `# Chainfile Name: ${this.chainfile.name}`,
      `# Chainfile CAIP-2: ${this.chainfile.caip2}`,
      '',
      yaml.dump(
        {
          name: this.chainfile.name.toLowerCase().replaceAll(/[^a-z0-9_-]/g, '_'),
          services: {
            ...this.createAgent(),
            ...this.createServices(),
          },
          networks: {
            chainfile: {},
          },
          volumes: {
            chainfile: {},
          },
        },
        {
          lineWidth: 120,
        },
      ),
    ].join('\n');
  }

  private createAgent(): Record<'agent', object> {
    return {
      agent: {
        container_name: `agent-${this.suffix}`,
        image: `ghcr.io/vetumorg/chainfile-agent:${version}`,
        ports: ['0:1569'],
        environment: {
          // Docker compose automatically evaluate environment literals here
          CHAINFILE_JSON: JSON.stringify(this.chainfile).replaceAll('$', '$$$'),
          CHAINFILE_VALUES: '${CHAINFILE_VALUES}',
          DEBUG: process.env.DEBUG ?? 'false',
        },
        volumes: [
          {
            type: 'volume',
            source: 'chainfile',
            target: '/var/chainfile',
          },
        ],
        networks: {
          chainfile: {},
        },
      },
    };
  }

  private createServices(): Record<string, object> {
    // TODO: resources (cpu, memory) is not supported for this runtime:
    //  https://docs.docker.com/compose/compose-file/compose-file-v3/#resources
    //  I'm not sure if we should since docker-compose typically runs on a single machine
    //  and utilizes the host's resources.
    //  Which limits its usefulness in orchestration when placement is not a concern.
    //  Adding them would make the compose hard limit the resources of the host even if the host
    //  has more resources available.

    function createPorts(container: Container): string[] {
      return Object.values(container.endpoints ?? {}).map((endpoint) => {
        // TODO: Support Binding P2P Port Statically
        return `0:${endpoint.port}`;
      });
    }

    interface Volume {
      type: 'volume';
      source?: string;
      target: string;
    }

    function createVolumes(container: Container): Volume[] {
      const volumes: Volume[] = [
        {
          type: 'volume',
          source: 'chainfile',
          target: '/var/chainfile',
        },
      ];

      container.volumes?.persistent?.paths.forEach((path) => {
        volumes.push({
          type: 'volume',
          target: path,
        });
      });

      container.volumes?.ephemeral?.paths.forEach((path) => {
        volumes.push({
          type: 'volume',
          target: path,
        });
      });

      return volumes;
    }

    return mapValues(this.chainfile.containers, (container, name) => {
      return {
        container_name: `${name}-${this.suffix}`,
        image: container.image + ':' + this.resolveValue(container.tag),
        command: container.command,
        environment: mapValues(container.environment ?? {}, (value: string | ValueReference) => {
          return this.resolveValue(value);
        }),
        ports: createPorts(container),
        volumes: createVolumes(container),
        networks: {
          chainfile: {},
        },
      };
    });
  }

  private resolveValue(value: string | ValueReference): string {
    if (typeof value === 'string') {
      return value;
    }
    return `$\{${value.$value}}`;
  }
}

function validate(chainfile: Chainfile) {
  const ajv = new Ajv();
  addFormats(ajv);
  const validateFunction = ajv.compile(schema);

  if (!validateFunction(chainfile)) {
    throw new Error(ajv.errorsText(validateFunction.errors));
  }
}

function initValues(chainfile: Chainfile, overrideValues: Record<string, string>) {
  const values = mapValues(chainfile.values ?? {}, (options: string | ValueOptions, name) => {
    if (overrideValues[name] !== undefined) {
      return overrideValues[name];
    }

    if (typeof options === 'string') {
      return options;
    }

    if (options.default !== undefined) {
      return options.default;
    }

    if (options.random !== undefined && options.random.type === 'bytes') {
      return randomBytes(options.random.length).toString(options.random.encoding);
    }

    if (options.required === true) {
      throw new Error(`Missing Value: ${name}`);
    }

    throw new Error(`Unsupported Value: ${JSON.stringify(options)}`);
  });

  let updated: boolean;
  do {
    updated = false;
    for (const [name, value] of Object.entries(values)) {
      values[name] = value.replace(/\$\{([a-z]+(_[a-z0-9]+)*)}/g, (_, key) => {
        updated = true;
        return values[key];
      });
    }
  } while (updated);
  return values;
}