/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * This interface was referenced by `Env`'s JSON-Schema definition
 * via the `patternProperty` "^[a-zA-Z_]+[a-zA-Z0-9_]*$".
 */
export type EnvFactory =
  | {
      type: 'RandomBytes';
      length: number;
      encoding: 'hex' | 'base64' | 'base64url';
    }
  | {
      type: 'Value';
      value: string;
    };
/**
 * Extension to ports, endpoints are used to expose the container to the outside world with a specific protocol for interfacing.
 *
 * This interface was referenced by `undefined`'s JSON-Schema definition
 * via the `patternProperty` "^(?!chainfile)[a-z0-9][a-z0-9-]{0,28}[a-z0-9]$".
 */
export type ContainerEndpoint = ContainerEndpointPort | ContainerEndpointHttpRest | ContainerEndpointHttpJsonRpc;
export type ContainerEndpointHttpAuthorization =
  | {
      type: 'HttpBasic';
      username: string | EnvReference;
      password: string | EnvReference;
    }
  | {
      type: 'HttpBearer';
      token: string | EnvReference;
    };
export type CoreSchemaMetaSchema = CoreSchemaMetaSchema1 & CoreSchemaMetaSchema2;
export type CoreSchemaMetaSchema2 =
  | {
      $id?: string;
      $schema?: string;
      $ref?: string;
      $comment?: string;
      title?: string;
      description?: string;
      default?: unknown;
      readOnly?: boolean;
      writeOnly?: boolean;
      examples?: unknown[];
      multipleOf?: number;
      maximum?: number;
      exclusiveMaximum?: number;
      minimum?: number;
      exclusiveMinimum?: number;
      maxLength?: number;
      minLength?: number;
      pattern?: string;
      additionalItems?: CoreSchemaMetaSchema2;
      items?: CoreSchemaMetaSchema2 | SchemaArray;
      maxItems?: number;
      minItems?: number;
      uniqueItems?: boolean;
      contains?: CoreSchemaMetaSchema2;
      maxProperties?: number;
      minProperties?: number;
      required?: StringArray;
      additionalProperties?: CoreSchemaMetaSchema2;
      definitions?: {
        [k: string]: CoreSchemaMetaSchema2;
      };
      properties?: {
        [k: string]: CoreSchemaMetaSchema2;
      };
      patternProperties?: {
        [k: string]: CoreSchemaMetaSchema2;
      };
      dependencies?: {
        [k: string]: CoreSchemaMetaSchema2 | StringArray;
      };
      propertyNames?: CoreSchemaMetaSchema2;
      const?: unknown;
      /**
       * @minItems 1
       */
      enum?: [unknown, ...unknown[]];
      type?:
        | ('array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string')
        | [
            'array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string',
            ...('array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string')[],
          ];
      format?: string;
      contentMediaType?: string;
      contentEncoding?: string;
      if?: CoreSchemaMetaSchema2;
      then?: CoreSchemaMetaSchema2;
      else?: CoreSchemaMetaSchema2;
      allOf?: SchemaArray;
      anyOf?: SchemaArray;
      oneOf?: SchemaArray;
      not?: CoreSchemaMetaSchema2;
      [k: string]: unknown;
    }
  | boolean;
/**
 * @minItems 1
 */
export type SchemaArray = [CoreSchemaMetaSchema2, ...CoreSchemaMetaSchema2[]];
export type StringArray = string[];

/**
 * Chainfile defines the instructions on how to package complex blockchain nodes into a Container that can be easily deployed and managed on Container-capable platforms such as Kubernetes, Compose, and ECS.
 */
export interface Chainfile {
  $schema?: string;
  /**
   * CAIP-2 Extended ID that uniquely identifies this chainfile.
   */
  id: string;
  /**
   * CAIP-2 Chain ID of the blockchain network this chainfile is for.
   */
  caip2: string;
  /**
   * Describes this chainfile.
   */
  name: string;
  env?: Env;
  containers: {
    [k: string]: Container;
  };
}
export interface Env {
  [k: string]: EnvFactory;
}
/**
 * This interface was referenced by `undefined`'s JSON-Schema definition
 * via the `patternProperty` "^(?!chainfile)[a-z0-9][a-z0-9-]{0,28}[a-z0-9]$".
 */
export interface Container {
  image: string;
  /**
   * Source of the container image.
   */
  source: string;
  endpoints: {
    [k: string]: ContainerEndpoint;
  };
  /**
   * For placement of the node in a container cluster.
   */
  resources: {
    /**
     * CPU in vCPU (Virtual CPU Core, Relative). In multiples of 0.25, where 0.25 is 1/4 of a core.
     */
    cpu: number;
    /**
     * Memory in MiB (Mebibyte, Absolute). You are guaranteed to have this much memory available to your container.
     */
    memory: number;
  };
  environment?: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^[a-zA-Z_]+[a-zA-Z0-9_]*$".
     */
    [k: string]: string | EnvReference;
  };
  command?: string[];
  volumes?: {
    persistent?: ContainerVolume;
    ephemeral?: ContainerVolume;
  };
}
export interface ContainerEndpointPort {
  port: number;
}
export interface ContainerEndpointHttpRest {
  port: number;
  protocol: 'HTTP REST' | 'HTTPS REST';
  authorization?: ContainerEndpointHttpAuthorization;
  probes?: {
    readiness?: ContainerEndpointHttpRestProbe;
    liveness?: ContainerEndpointHttpRestProbe1;
    startup?: ContainerEndpointHttpRestProbe2;
  };
}
export interface EnvReference {
  key: string;
}
/**
 * Probe to determine if the container is ready to receive traffic.
 */
export interface ContainerEndpointHttpRestProbe {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE';
  path: string;
  body?: {
    [k: string]: unknown;
  };
  match: {
    status: number | number[];
    body?: CoreSchemaMetaSchema;
    [k: string]: unknown;
  };
}
export interface CoreSchemaMetaSchema1 {
  $id?: string;
  $schema?: string;
  $ref?: string;
  $comment?: string;
  title?: string;
  description?: string;
  default?: unknown;
  readOnly?: boolean;
  writeOnly?: boolean;
  examples?: unknown[];
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  minimum?: number;
  exclusiveMinimum?: number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  additionalItems?: CoreSchemaMetaSchema2;
  items?: CoreSchemaMetaSchema2 | SchemaArray;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  contains?: CoreSchemaMetaSchema2;
  maxProperties?: number;
  minProperties?: number;
  required?: StringArray;
  additionalProperties?: CoreSchemaMetaSchema2;
  definitions?: {
    [k: string]: CoreSchemaMetaSchema2;
  };
  properties?: {
    [k: string]: CoreSchemaMetaSchema2;
  };
  patternProperties?: {
    [k: string]: CoreSchemaMetaSchema2;
  };
  dependencies?: {
    [k: string]: CoreSchemaMetaSchema2 | StringArray;
  };
  propertyNames?: CoreSchemaMetaSchema2;
  const?: unknown;
  /**
   * @minItems 1
   */
  enum?: [unknown, ...unknown[]];
  type?:
    | ('array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string')
    | [
        'array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string',
        ...('array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string')[],
      ];
  format?: string;
  contentMediaType?: string;
  contentEncoding?: string;
  if?: CoreSchemaMetaSchema2;
  then?: CoreSchemaMetaSchema2;
  else?: CoreSchemaMetaSchema2;
  allOf?: SchemaArray;
  anyOf?: SchemaArray;
  oneOf?: SchemaArray;
  not?: CoreSchemaMetaSchema2;
  [k: string]: unknown;
}
/**
 * Probe to determine if the container is alive. Where an application is running, but unable to make progress this is useful to determine if the container should be restarted.
 */
export interface ContainerEndpointHttpRestProbe1 {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE';
  path: string;
  body?: {
    [k: string]: unknown;
  };
  match: {
    status: number | number[];
    body?: CoreSchemaMetaSchema;
    [k: string]: unknown;
  };
}
/**
 * Probe to determine if the container has started. This is useful for containers that take a long time to start up as it will prevent containers from being prematurely marked as unhealthy.
 */
export interface ContainerEndpointHttpRestProbe2 {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE';
  path: string;
  body?: {
    [k: string]: unknown;
  };
  match: {
    status: number | number[];
    body?: CoreSchemaMetaSchema;
    [k: string]: unknown;
  };
}
export interface ContainerEndpointHttpJsonRpc {
  port: number;
  protocol: 'HTTP JSON-RPC 1.0' | 'HTTPS JSON-RPC 1.0' | 'HTTP JSON-RPC 2.0' | 'HTTPS JSON-RPC 2.0';
  path?: string;
  authorization?: ContainerEndpointHttpAuthorization;
  probes?: {
    readiness?: ContainerEndpointHttpJsonRpcProbe;
    liveness?: ContainerEndpointHttpJsonRpcProbe1;
    startup?: ContainerEndpointHttpJsonRpcProbe2;
  };
}
/**
 * Probe to determine if the container is ready to receive traffic.
 */
export interface ContainerEndpointHttpJsonRpcProbe {
  method: string;
  params:
    | unknown[]
    | {
        [k: string]: unknown;
      };
  match: {
    result: CoreSchemaMetaSchema2;
    [k: string]: unknown;
  };
}
/**
 * Probe to determine if the container is alive. Where an application is running, but unable to make progress this is useful to determine if the container should be restarted.
 */
export interface ContainerEndpointHttpJsonRpcProbe1 {
  method: string;
  params:
    | unknown[]
    | {
        [k: string]: unknown;
      };
  match: {
    result: CoreSchemaMetaSchema2;
    [k: string]: unknown;
  };
}
/**
 * Probe to determine if the container has started. This is useful for containers that take a long time to start up as it will prevent containers from being prematurely marked as unhealthy.
 */
export interface ContainerEndpointHttpJsonRpcProbe2 {
  method: string;
  params:
    | unknown[]
    | {
        [k: string]: unknown;
      };
  match: {
    result: CoreSchemaMetaSchema2;
    [k: string]: unknown;
  };
}
export interface ContainerVolume {
  paths: string[];
  size:
    | string
    | {
        initial: string;
        /**
         * YYYY-MM-DD
         */
        from: string;
        growth: string;
        rate: 'daily' | 'weekly' | 'monthly' | 'yearly';
      };
}