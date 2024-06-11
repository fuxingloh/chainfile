import { randomBytes } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Compose } from '@chainfile/docker';
import { Chainfile } from '@chainfile/schema';
import { DockerComposeEnvironment, StartedDockerComposeEnvironment as ComposeInstance, Wait } from 'testcontainers';
import { StartedGenericContainer } from 'testcontainers/build/generic-container/started-generic-container';

import { AgentContainer } from './agent';
import { ChainfileContainer } from './container';

export class ChainfileTestcontainers {
  protected readonly cwd: string = join(process.cwd(), '.chainfile', 'testcontainers');
  protected readonly suffix = randomBytes(4).toString('hex');
  protected readonly filename = `compose.${this.suffix}.yml`;
  protected readonly chainfile: Chainfile;

  protected composeSynth: Compose;
  protected composeInstance?: ComposeInstance;

  public constructor(chainfile: Chainfile | object, values: Record<string, string> = {}) {
    mkdirSync(this.cwd, { recursive: true });
    this.composeSynth = new Compose(chainfile as any, values, this.suffix);
    this.chainfile = chainfile as Chainfile;
  }

  public async start(): Promise<void> {
    writeFileSync(join(this.cwd, this.filename), this.composeSynth.synthCompose());

    const environment = this.composeSynth
      .synthDotEnv()
      .split('\n')
      .reduce<Record<string, string>>((acc, line) => {
        const [key, value] = line.split('=');
        acc[key] = value;
        return acc;
      }, {});
    this.composeInstance = await new DockerComposeEnvironment(this.cwd, this.filename)
      .withEnvironment(environment)
      // The readiness probe of @chainfile/agent is to determine if the deployment is ready to accept requests.
      .withWaitStrategy(`agent-${this.suffix}`, Wait.forHttp('/probes/readiness', 1569))
      .up();
  }

  async stop(): Promise<void> {
    await this.composeInstance?.down();
    rmSync(join(this.cwd, this.filename));
  }

  get(name: string): ChainfileContainer {
    const containerDef = this.chainfile.containers[name];
    if (containerDef === undefined) {
      throw new Error(`Container ${name} not found`);
    }
    return new ChainfileContainer(this.getContainer(name), containerDef, this.composeSynth.values);
  }

  getAgent(): AgentContainer {
    return new AgentContainer(this.getContainer(`agent`));
  }

  private getContainer(name: string): StartedGenericContainer {
    if (this.composeInstance === undefined) {
      throw new Error('Testcontainers not started');
    }
    return this.composeInstance.getContainer(`${name}-${this.suffix}`);
  }
}
