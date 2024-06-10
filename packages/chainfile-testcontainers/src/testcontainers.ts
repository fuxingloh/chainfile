import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Compose } from '@chainfile/docker';
import { Chainfile } from '@chainfile/schema';
import { DockerComposeEnvironment, StartedDockerComposeEnvironment as ComposeStarted, Wait } from 'testcontainers';

import { AgentContainer } from './agent';
import { ChainfileContainer } from './container';

export class ChainfileTestcontainers {
  protected cwd: string = join(process.cwd(), '.chainfile');
  protected filename: string;
  protected compose: Compose;
  protected composeStarted!: ComposeStarted;

  public constructor(
    protected readonly chainfile: Chainfile | any,
    protected readonly values: Record<string, string> = {},
  ) {
    this.compose = new Compose(chainfile, values);
    this.filename = `compose.${this.compose.suffix}.yml`;
  }

  public async start(): Promise<void> {
    mkdirSync(this.cwd, { recursive: true });
    writeFileSync(join(this.cwd, this.filename), this.compose.synthCompose());

    const environment = this.compose
      .synthDotEnv()
      .split('\n')
      .reduce<Record<string, string>>((acc, line) => {
        const [key, value] = line.split('=');
        acc[key] = value;
        return acc;
      }, {});
    this.composeStarted = await new DockerComposeEnvironment(this.cwd, this.filename)
      .withEnvironment(environment)
      // The readiness probe of @chainfile/agent is to determine if the deployment is ready to accept requests.
      .withWaitStrategy(`agent-${this.compose.suffix}`, Wait.forHttp('/probes/readiness', 1569))
      .up();
  }

  async stop(): Promise<void> {
    await this.composeStarted.down();
    rmSync(join(this.cwd, this.filename));
  }

  get(name: string): ChainfileContainer {
    const containerDef = this.chainfile.containers[name];
    if (containerDef === undefined) {
      throw new Error(`Container ${name} not found`);
    }
    return new ChainfileContainer(
      this.composeStarted.getContainer(`${name}-${this.compose.suffix}`),
      containerDef,
      this.compose.values,
    );
  }

  getAgent(): AgentContainer {
    return new AgentContainer(this.composeStarted.getContainer(`agent-${this.compose.suffix}`));
  }
}
