import { randomBytes } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Compose } from '@chainfile/docker';
import { Chainfile } from '@chainfile/schema';
import { DockerComposeEnvironment, StartedDockerComposeEnvironment as ComposeStarted, Wait } from 'testcontainers';

import { AgentContainer } from './agent';
import { ChainfileContainer } from './container';

type Location = Chainfile | string | any;

export class ChainfileTestcontainers {
  protected readonly cwd: string = join(process.cwd(), '.chainfile', 'testcontainers');
  protected readonly suffix = randomBytes(4).toString('hex');
  protected readonly filename = `compose.${this.suffix}.yml`;

  protected chainfile!: Chainfile;
  protected compose!: Compose;
  protected composeStarted!: ComposeStarted;

  public constructor(
    protected readonly location: Location,
    protected readonly values: Record<string, string> = {},
  ) {
    mkdirSync(this.cwd, { recursive: true });
  }

  public async start(): Promise<void> {
    this.chainfile = typeof this.location === 'string' ? await fetchChainfile(this.location) : this.location;
    this.compose = new Compose(this.chainfile, this.values, this.suffix);
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
    if (this.composeStarted === undefined) {
      throw new Error('ChainfileTestcontainers not started');
    }
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
    if (this.composeStarted === undefined) {
      throw new Error('ChainfileTestcontainers not started');
    }
    return new AgentContainer(this.composeStarted.getContainer(`agent-${this.compose.suffix}`));
  }
}

async function fetchChainfile(location: string): Promise<Chainfile> {
  // Get latest package from npm using pacote
  throw new Error(`Not implemented: ${location}`);
}
