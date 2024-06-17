import { Values } from '@chainfile/docker';
import { Chainfile, ValueOptions, ValueReference } from '@chainfile/schema';
import { Names } from 'cdk8s';
import { EnvVarSource, KubeSecret } from 'cdk8s-plus-25/lib/imports/k8s';
import { Construct } from 'constructs';

/**
 * ValuesSource is a source of values for Chainfile for unwrapping and resolving references.
 * This interface serves as a way to resolve values from different sources of implementations.
 */
export interface ValuesSource {
  unwrap(value: string | ValueReference): string;

  valueFrom(reference: ValueReference): EnvVarSource;
}

export interface ValuesProps {
  chainfile: Chainfile;
  /**
   * Override values from Chainfile.
   */
  values?: Record<string, string>;
}

export class ChainfileValues extends Construct implements ValuesSource {
  private readonly values: Record<string, string>;
  private readonly name: string;

  constructor(scope: Construct, id: string, props: ValuesProps) {
    super(scope, id);
    this.values = new Cdk8sValues(props.chainfile).init(props.values);
    this.name = Names.toDnsLabel(this, { extra: ['secret'] });

    new KubeSecret(this, 'secret', {
      stringData: {
        CHAINFILE_VALUES: JSON.stringify(this.values),
        ...this.values,
      },
      type: 'Opaque',
      metadata: {
        name: this.name,
      },
    });
  }

  unwrap(value: string | ValueReference): string {
    return typeof value === 'string' ? value : this.values[value.$value];
  }

  valueFrom(reference: ValueReference): EnvVarSource {
    return {
      secretKeyRef: {
        name: this.name,
        key: reference.$value,
        optional: false,
      },
    };
  }
}

/**
 * Based on Docker Compose's Values implementation.
 */
class Cdk8sValues extends Values {
  protected default(name: string, options: NonNullable<ValueOptions['default']>): [string, string] {
    if (typeof options === 'object') {
      if (options.random !== undefined) {
        throw new Error(
          `@chainfile/cdk8s does not support random values generation for '${name}' to ensure reproducibility and prevent irrecoverable lost of data.`,
        );
      }
    }

    return super.default(name, options);
  }
}
