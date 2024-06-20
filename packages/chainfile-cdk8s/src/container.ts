import * as schema from '@chainfile/schema';
import { Container, EnvVar, IntOrString, Quantity, VolumeMount } from 'cdk8s-plus-25/lib/imports/k8s';

import { CFParamsSource } from './params';
import version from './version';

interface CFAgentProps {
  chainfile: schema.Chainfile;
  params: CFParamsSource;
}

export function CFAgent(props: CFAgentProps): Container {
  return {
    name: 'agent',
    image: `ghcr.io/vetumorg/chainfile-agent:${version}`,
    ports: [
      {
        name: 'agent',
        containerPort: 1569,
      },
    ],
    startupProbe: {
      httpGet: {
        path: '/probes/startup',
        port: IntOrString.fromString('agent'),
      },
    },
    livenessProbe: {
      httpGet: {
        path: '/probes/liveness',
        port: IntOrString.fromString('agent'),
      },
    },
    readinessProbe: {
      httpGet: {
        path: '/probes/readiness',
        port: IntOrString.fromString('agent'),
      },
    },
    env: [
      {
        name: 'CHAINFILE_JSON',
        value: JSON.stringify(props.chainfile),
      },
      {
        name: 'CHAINFILE_PARAMS',
        valueFrom: props.params.valueFrom({
          $param: 'CHAINFILE_PARAMS',
        }),
      },
    ],
  };
}

interface CFContainerProps {
  params: CFParamsSource;
  name: string;
  container: schema.Container;
  getVolumeName: (mount: schema.VolumeMount) => string;
}

export function CFContainer(props: CFContainerProps): Container {
  return {
    name: props.name,
    image: props.container.image + ':' + props.params.unwrap(props.container.tag),
    command: props.container.command,
    env: Object.entries(props.container.environment ?? {}).map(([key, valueOrRef]): EnvVar => {
      if (typeof valueOrRef === 'string') {
        return {
          name: key,
          value: valueOrRef,
        };
      }

      return {
        name: key,
        valueFrom: props.params.valueFrom(valueOrRef),
      };
    }),
    ports: Object.entries(props.container.endpoints ?? {}).map(([, endpoint]) => {
      return {
        containerPort: endpoint.port,
      };
    }),
    volumeMounts: (props.container.mounts ?? []).map((mount): VolumeMount => {
      return {
        name: props.getVolumeName(mount),
        mountPath: mount.mountPath,
        subPath: mount.subPath,
      };
    }),
    resources: {
      limits: {
        cpu: Quantity.fromNumber(props.container.resources.cpu),
        memory: Quantity.fromString(`${props.container.resources.memory}Mi`),
      },
    },
  };
}
