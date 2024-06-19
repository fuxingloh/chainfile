import { ComposeParams } from '@chainfile/docker';
import * as schema from '@chainfile/schema';
import { Names } from 'cdk8s';
import { EnvVarSource, KubeSecret, KubeSecretProps, ObjectMeta } from 'cdk8s-plus-25/lib/imports/k8s';
import { Construct } from 'constructs';

/**
 * ValuesSource is a source of params for Chainfile for unwrapping and resolving references.
 * This interface serves as a way to resolve params from different sources of implementations.
 */
export interface CFParamsSource {
  /**
   * For unwrapping and resolving references that can't be used as EnvVarSource.
   */
  unwrap(param: string | schema.ParamReference): string;

  /**
   * For resolving references that can be used as EnvVarSource.
   */
  valueFrom(reference: schema.ParamReference): EnvVarSource;
}

export interface CFSecretProps extends Omit<KubeSecretProps, 'metadata' | 'stringData'> {
  readonly chainfile: schema.Chainfile;
  /**
   * Override params in Chainfile.
   */
  readonly params?: Record<string, string>;
  readonly metadata?: ObjectMeta;
}

/**
 * CFSecret is a Kubernetes Secret implementation that provides params as secrets.
 */
export class CFSecret extends KubeSecret implements CFParamsSource {
  private readonly params: Record<string, string>;

  constructor(scope: Construct, id: string, { chainfile, params, ...props }: CFSecretProps) {
    const values = new Cdk8sParams(chainfile).init(params);
    super(scope, id, {
      ...props,
      type: props.type ?? 'Opaque',
      stringData: { ...params, CHAINFILE_PARAMS: JSON.stringify(params) },
      metadata: {
        name: Names.toDnsLabel(scope, { extra: [id] }),
        ...props.metadata,
      },
    });
    this.params = values;
  }

  unwrap(param: string | schema.ParamReference): string {
    return typeof param === 'string' ? param : this.params[param.$param];
  }

  valueFrom(reference: schema.ParamReference): EnvVarSource {
    return {
      secretKeyRef: {
        name: this.name,
        key: reference.$param,
        optional: false,
      },
    };
  }
}

/**
 * Based on Docker Compose's Values implementation.
 */
class Cdk8sParams extends ComposeParams {
  protected default(name: string, options: NonNullable<schema.ParamOptions['default']>): [string, string] {
    if (typeof options === 'object') {
      if (options.random !== undefined) {
        throw new Error(
          `@chainfile/cdk8s does not support random params generation for '${name}' to ensure reproducibility and prevent irrecoverable lost of data.`,
        );
      }
    }

    return super.default(name, options);
  }
}
