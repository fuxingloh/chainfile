import * as schema from '@chainfile/schema';
import {
  DeploymentSpec,
  KubeDeployment,
  ObjectMeta,
  PodSpec,
  PodTemplateSpec,
  Quantity,
} from 'cdk8s-plus-25/lib/imports/k8s';
import { Construct } from 'constructs';

import { CFAgent, CFContainer } from './container';
import { CFParamsSource } from './params';

export interface CFDeploymentProps {
  readonly chainfile: schema.Chainfile;
  readonly params: CFParamsSource;
  readonly metadata?: ObjectMeta;
  readonly spec: Omit<DeploymentSpec, 'template'> & {
    readonly template?: Omit<PodTemplateSpec, 'spec'> & {
      readonly spec?: Omit<PodSpec, 'hostAliases' | 'volumes' | 'containers'>;
    };
  };
  getPersistentVolumeClaimName: (mount: schema.VolumeMount) => string;
}

/**
 * Implements schema.Chainfile as a Kubernetes Deployment.
 * For CFDeployment, persistent volumes are not automatically created.
 * You need to create PersistentVolumeClaims separately and pass the volume name via props.getVolumeName.
 */
export class CFDeployment extends KubeDeployment {
  constructor(scope: Construct, id: string, props: CFDeploymentProps) {
    const volumes = props.chainfile.volumes ?? {};
    super(scope, id, {
      metadata: props.metadata,
      spec: {
        ...props.spec,
        template: {
          metadata: props.spec.template?.metadata,
          spec: {
            ...props.spec.template?.spec,
            hostAliases: [
              {
                ip: '127.0.0.1',
                hostnames: Object.keys(props.chainfile.containers),
              },
            ],
            volumes: Object.entries(volumes)
              .filter(([, volume]) => volume.type === 'ephemeral')
              .map(([volumeName, volume]) => {
                return {
                  name: volumeName,
                  emptyDir: {
                    sizeLimit: Quantity.fromString(volume.size),
                  },
                };
              }),
            containers: [
              CFAgent({ params: props.params, chainfile: props.chainfile }),
              ...Object.entries(props.chainfile.containers).map(([containerName, container]) => {
                return CFContainer({
                  params: props.params,
                  name: containerName,
                  container,
                  getVolumeName: (mount) => {
                    if (volumes[mount.volume].type === 'ephemeral') {
                      return mount.volume;
                    }

                    return props.getPersistentVolumeClaimName(mount);
                  },
                });
              }),
            ],
          },
        },
      },
    });
  }
}
