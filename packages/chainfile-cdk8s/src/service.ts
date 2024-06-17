import { IntOrString, KubeService, ServiceSpec } from 'cdk8s-plus-25/lib/imports/k8s';
import { Construct } from 'constructs';

import { getPortName } from './controller';

export interface ChainfileServiceProps {
  spec: {
    type: ServiceSpec['type'];
    selector: Record<string, string>;
    ports: {
      port: number;
      name: string;
      target: {
        container: string;
        endpoint: string;
      };
    }[];
  };
}

export class ChainfileService extends KubeService {
  constructor(scope: Construct, id: string, props: ChainfileServiceProps) {
    super(scope, id, {
      spec: {
        type: props.spec.type,
        selector: props.spec.selector,
        ports: props.spec.ports.map((port) => {
          return {
            port: port.port,
            name: port.name,
            targetPort: IntOrString.fromString(getPortName(port.target.container, port.target.endpoint)),
          };
        }),
      },
    });
  }
}
