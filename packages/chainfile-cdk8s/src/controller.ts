import { Chainfile, Container as ChainfileContainer } from '@chainfile/schema';
import {
  Container,
  ContainerPort,
  EnvVar,
  KubeDeployment,
  KubeStatefulSet,
  Quantity,
  VolumeMount,
} from 'cdk8s-plus-25/lib/imports/k8s';
import { Construct } from 'constructs';
import { createHash } from 'crypto';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { version } from '../package.json';
import { ValuesSource } from './values';

export class ChainfileDeployment extends KubeDeployment {
  constructor(
    scope: Construct,
    id: string,
    props: {
      chainfile: Chainfile;
      values: ValuesSource;
      spec: {
        selector: Record<string, string>;
        replicas: number;
      };
    },
  ) {
    const controller = new Controller(props.chainfile, props.values);
    super(scope, id, {
      spec: {
        replicas: props.spec.replicas,
        selector: {
          matchLabels: props.spec.selector,
        },
        template: {
          spec: {
            hostAliases: [
              {
                ip: '127.0.0.1',
                hostnames: Object.keys(props.chainfile.containers),
              },
            ],
            containers: controller.containers(),
            volumes: controller.volumes(),
          },
          metadata: {
            labels: props.spec.selector,
          },
        },
      },
    });
  }
}

export class ChainfileStatefulSet extends KubeStatefulSet {
  constructor(
    scope: Construct,
    id: string,
    props: {
      chainfile: Chainfile;
      values: ValuesSource;
      spec: {
        selector: Record<string, string>;
        serviceName: string;
        replicas: number;
      };
    },
  ) {
    const controller = new Controller(props.chainfile, props.values);
    super(scope, id, {
      spec: {
        serviceName: props.spec.serviceName,
        replicas: props.spec.replicas,
        selector: {
          matchLabels: props.spec.selector,
        },
        template: {
          spec: {
            containers: controller.containers(),
            volumes: controller.volumes(),
          },
        },
      },
    });
  }
}

class Controller {
  constructor(
    private readonly chainfile: Chainfile,
    private readonly values: ValuesSource,
  ) {}

  volumes(): VolumeMount[] {
    return [
      {
        name: 'chainfile',
        mountPath: '/var/chainfile',
      },
    ];
  }

  containers(): Container[] {
    return [
      this.createAgent(),
      ...Object.entries(this.chainfile.containers).map(([name, container]) => {
        return this.createContainer(name, container);
      }),
    ];
  }

  private createAgent(): Container {
    return {
      name: 'agent',
      image: `ghcr.io/vetumorg/chainfile-agent:${version}`,
      ports: [
        {
          name: 'agent',
          containerPort: 1569,
        },
      ],
      // TODO(?): Probes (Liveness, Readiness, Startup)
      volumeMounts: [
        {
          name: 'chainfile',
          mountPath: '/var/chainfile',
        },
      ],
      env: [
        {
          name: 'CHAINFILE_JSON',
          value: JSON.stringify(this.chainfile),
        },
        {
          name: 'CHAINFILE_VALUES',
          valueFrom: this.values.valueFrom({
            $value: 'CHAINFILE_VALUES',
          }),
        },
      ],
    };
  }

  private createContainer(name: string, container: ChainfileContainer): Container {
    return {
      name: name,
      image: container.image + ':' + this.values.unwrap(container.tag),
      command: container.command,
      env: this.createContainerEnv(container),
      ports: this.createContainerPorts(name, container),
      volumeMounts: this.createContainerVolumeMounts(name, container),
      resources: {
        limits: {
          cpu: Quantity.fromNumber(container.resources.cpu),
          memory: Quantity.fromString(`${container.resources.memory}Mi`),
        },
      },
    };
  }

  private createContainerEnv(container: ChainfileContainer): EnvVar[] {
    if (container.environment === undefined) {
      return [];
    }

    return Object.entries(container.environment).map(([key, valueOrRef]): EnvVar => {
      if (typeof valueOrRef === 'string') {
        return {
          name: key,
          value: valueOrRef,
        };
      }

      return {
        name: key,
        valueFrom: this.values.valueFrom(valueOrRef),
      };
    });
  }

  private createContainerPorts(containerName: string, container: ChainfileContainer): ContainerPort[] {
    if (container.endpoints === undefined) {
      return [];
    }

    return Object.entries(container.endpoints).map(([endpointName, endpoint]): ContainerPort => {
      // TODO(?): Support Binding P2P Port Statically
      return {
        name: getPortName(containerName, endpointName),
        containerPort: endpoint.port,
      };
    });
  }

  // @ts-expect-error TODO implement volumes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private createContainerVolumeMounts(containerName: string, container: ChainfileContainer): VolumeMount[] {
    const volumes: VolumeMount[] = [
      {
        name: 'chainfile',
        mountPath: '/var/chainfile',
      },
    ];

    // TODO(?): PV and PVC, also ephemeral, snapshot and restore.
    // container.volumes?.persistent?.paths.forEach((path) => {
    //   volumes.push({
    //     name: getVolumeName(containerName, 'persistent', path),
    //     mountPath: path,
    //   });
    // });
    //
    // container.volumes?.ephemeral?.paths.forEach((path) => {
    //   volumes.push({
    //     name: getVolumeName(containerName, 'ephemeral', path),
    //     mountPath: path,
    //   });
    // });

    return volumes;
  }
}

export function getPortName(container: string, endpoint: string): string {
  return createHash('sha256')
    .update(container + '-' + endpoint)
    .digest('hex')
    .substring(0, 15);
}

export function getVolumeName(container: string, type: 'persistent' | 'ephemeral', mountPath: string): string {
  return createHash('sha256')
    .update(container + '-' + type + '-' + mountPath)
    .digest('hex')
    .substring(0, 32);
}
