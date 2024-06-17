import { Chainfile, validate } from '@chainfile/schema';
import { Chart } from 'cdk8s';
import { Construct } from 'constructs';

import { ChainfileDeployment } from './controller';
import { ChainfileService, ChainfileServiceProps } from './service';
import { ChainfileValues } from './values';

interface ChainfileChartProps {
  namespace?: string;
  metadata?: {
    labels?: Record<string, string>;
  };

  chainfile: object;
  values?: Record<string, string>;
  spec: {
    selector?: Record<string, string>;
    deployment: {
      replicas: number;
    };
    service: {
      /**
       * Ports to expose on the service.
       */
      ports: ChainfileServiceProps['spec']['ports'];
    };
  };
}

export class ChainfileChart extends Chart {
  private readonly service: ChainfileService;

  constructor(scope: Construct, id: string, props: ChainfileChartProps) {
    validate(props.chainfile);
    const chainfile = props.chainfile as Chainfile;
    const selector = props.spec.selector ?? getSelector(chainfile);
    super(scope, id, {
      namespace: props.namespace,
      labels: {
        ...selector,
        ...(props.metadata?.labels ?? {}),
      },
    });

    const values = new ChainfileValues(this, 'values', {
      chainfile: chainfile,
      values: props.values,
    });

    new ChainfileDeployment(this, 'deployment', {
      chainfile: chainfile,
      values: values,
      spec: {
        replicas: props.spec.deployment.replicas,
        selector: selector,
      },
    });

    this.service = new ChainfileService(this, 'service', {
      spec: {
        type: 'LoadBalancer',
        selector: selector,
        ports: props.spec.service.ports,
      },
    });
  }

  public getServiceName(): string {
    return this.service.name;
  }
}

/**
 * Get default labels from chainfile.
 * Which includes the name of chainfile, caip2, and available containers.
 *
 * More specificity can be implemented by using the container version, environment, etc.
 * But that is beyond the scope of a default selector.
 */
export function getSelector(chainfile: Chainfile): Record<string, string> {
  // Regex: (([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?
  return {
    // name: chainfile.name,
    caip2: chainfile.caip2.replace(/[^A-Za-z0-9]/g, '.'),
    ...Object.fromEntries(Object.keys(chainfile.containers).map((name) => [name, 'true'])),
  };
}
