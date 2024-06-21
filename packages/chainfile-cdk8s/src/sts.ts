import * as schema from '@chainfile/schema';
import { Names } from 'cdk8s';
import { KubeStatefulSet, ObjectMeta, PodSpec, PodTemplateSpec, StatefulSetSpec } from 'cdk8s-plus-25/lib/imports/k8s';
import { Construct } from 'constructs';

import { CFAgent, CFContainer } from './container';
import { CFParamsSource } from './params';
import { CFEphemeralVolume, CFPersistentVolumeClaimSpec } from './volume';

export interface CFStatefulSetProps {
  readonly chainfile: schema.Chainfile;
  readonly params: CFParamsSource;
  readonly metadata?: ObjectMeta;
  readonly spec: Omit<StatefulSetSpec, 'template' | 'volumeClaimTemplates'> & {
    readonly template?: Omit<PodTemplateSpec, 'spec'> & {
      readonly spec?: Omit<PodSpec, 'hostAliases' | 'volumes' | 'containers'>;
    };
  };
}

/**
 * Implements schema.Chainfile as a Kubernetes StatefulSet.
 * Persistent volumes are automatically created for volumes of type 'persistent'.
 * Ephemeral volumes are created as emptyDir.
 */
export class CFStatefulSet extends KubeStatefulSet {
  constructor(scope: Construct, id: string, props: CFStatefulSetProps) {
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
                return CFEphemeralVolume({
                  name: volumeName,
                  volume: volume,
                });
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

                    return Names.toDnsLabel(scope, { extra: ['pvc', mount.volume] });
                  },
                });
              }),
            ],
          },
        },
        volumeClaimTemplates: Object.entries(volumes)
          .filter(([, volume]) => volume.type === 'persistent')
          .map(([volumeName, volume]) => {
            return {
              metadata: {
                name: Names.toDnsLabel(scope, { extra: ['pvc', volumeName] }),
              },
              spec: CFPersistentVolumeClaimSpec({
                volume: volume,
              }),
            };
          }),
      },
    });
  }
}
