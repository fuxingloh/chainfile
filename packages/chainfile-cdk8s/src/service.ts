import * as schema from '@chainfile/schema';
import { IntOrString, KubeService, ObjectMeta, ServicePort, ServiceSpec } from 'cdk8s-plus-25/lib/imports/k8s';
import { Construct } from 'constructs';

export interface CFServiceProps {
  readonly chainfile: schema.Chainfile;
  readonly metadata?: ObjectMeta;
  readonly spec: Omit<ServiceSpec, 'ports'> & {
    readonly ports: Array<
      Omit<ServicePort, 'targetPort'> & {
        target: {
          container: string;
          endpoint: string;
        };
      }
    >;
  };
}

export class CFService extends KubeService {
  constructor(scope: Construct, id: string, props: CFServiceProps) {
    super(scope, id, {
      spec: {
        type: props.spec.type,
        selector: props.spec.selector,
        ports: props.spec.ports.map((port) => {
          return {
            ...port,
            targetPort: findTargetPort(props.chainfile, port.target.container, port.target.endpoint),
          };
        }),
      },
    });
  }
}

function findTargetPort(chainfile: schema.Chainfile, container: string, endpoint: string): IntOrString {
  const port = chainfile.containers[container]?.endpoints?.[endpoint]?.port;
  if (port === undefined) {
    throw new Error(`Port not found for container ${container} endpoint ${endpoint}`);
  }

  return IntOrString.fromNumber(port);
}
