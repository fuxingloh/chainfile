import { Chainfile, validate } from '@chainfile/schema';
import { Chart } from 'cdk8s';
import { Construct } from 'constructs';

import { CFSecret } from './params';
import { CFService, CFServiceProps } from './service';
import { CFStatefulSet } from './sts';

export interface CFChartProps {
  chainfile: object;
  /**
   * Namespace to deploy the chart into.
   */
  namespace?: string;

  /**
   * Override params in Chainfile.
   * For parameters that use `default.random`
   * the value must be injected as CFChart does not support generating random values to ensure reproducibility.
   */
  params?: Record<string, string>;

  labels?: Record<string, string>;

  spec: {
    replicas?: number;
    storageClassName?: string;

    /**
     * Ports to expose on the service.
     * Each port must have a unique name.
     */
    exposes: CFServiceProps['spec']['ports'];
  };
}

export class CFChart extends Chart {
  private readonly service: CFService;

  constructor(scope: Construct, id: string, props: CFChartProps) {
    validate(props.chainfile);
    const chainfile = props.chainfile as Chainfile;
    const labels = props.labels ?? CFChart.getLabels(chainfile);

    super(scope, id, {
      namespace: props.namespace,
      labels: labels,
    });

    const secret = new CFSecret(this, 'secret', {
      chainfile: chainfile,
      params: props.params,
    });

    this.service = new CFService(this, 'service', {
      chainfile,
      metadata: {
        labels: labels,
      },
      spec: {
        type: 'LoadBalancer',
        selector: labels,
        ports: props.spec.exposes,
      },
    });

    new CFStatefulSet(this, 'stateful-set', {
      chainfile: chainfile,
      params: secret,
      metadata: {
        labels: labels,
      },
      spec: {
        template: {
          metadata: {
            labels: labels,
          },
        },
        // TODO(?): https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/
        serviceName: this.serviceName,
        replicas: props.spec.replicas,
        selector: {
          matchLabels: labels,
        },
        volumeClaimTemplates: {
          spec: {
            storageClassName: props.spec.storageClassName,
          },
        },
      },
    });
  }

  /**
   * Get the service name used in the chart.
   */
  public get serviceName(): string {
    return this.service.name;
  }

  /**
   * Get default labels from chainfile.
   * Which includes the name of chainfile, caip2, and available containers.
   *
   * More specificity can be implemented by using the container version, environment, etc.
   * But that is beyond the scope of a default selector.
   */
  public static getLabels(chainfile: Chainfile): Record<string, string> {
    // Regex: (([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?
    return {
      caip2: chainfile.caip2.replace(/[^A-Za-z0-9]/g, '.'),
      ...Object.fromEntries(Object.keys(chainfile.containers).map((name) => [name, 'true'])),
    };
  }
}
