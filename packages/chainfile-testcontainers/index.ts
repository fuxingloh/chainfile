import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Chainfile } from 'chainfile/schema';
import { Synthesizer } from 'chainfile-docker/synthesizer';
import { DockerComposeEnvironment, StartedDockerComposeEnvironment as ComposeStarted, Wait } from 'testcontainers';

import { ChainfileAgent } from './chainfile-agent';
import { ChainfileContainer } from './chainfile-container';

export class ChainfileTestcontainers {
  protected cwd: string = join(process.cwd(), '.chainfile');

  protected chainfile: Chainfile;
  protected synthesizer: Synthesizer;
  protected environment: Record<string, string>;
  protected deploymentId: string;

  protected composeFile: string;
  protected composeStarted!: ComposeStarted;

  private constructor(chainfile: Chainfile | any) {
    this.chainfile = chainfile;
    this.synthesizer = new Synthesizer(chainfile);
    this.deploymentId = this.synthesizer.deploymentId;
    this.environment = this.synthesizer
      .synthEnv()
      .split('\n')
      .reduce(
        (acc, line) => {
          const [key, value] = line.split('=');
          acc[key] = value;
          return acc;
        },
        {} as Record<string, string>,
      );

    this.composeFile = `compose.${this.deploymentId}.yml`;
  }

  private async start(): Promise<void> {
    mkdirSync(this.cwd, { recursive: true });
    writeFileSync(join(this.cwd, this.composeFile), this.synthesizer.synthCompose());

    this.composeStarted = await new DockerComposeEnvironment(this.cwd, this.composeFile)
      .withEnvironment(this.environment)
      // The readiness probe of chainfile-agent is to determine if the deployment is ready to accept requests.
      .withWaitStrategy(`chainfile-agent-${this.deploymentId}`, Wait.forHttp('/probes/readiness', 1503))
      .up();
  }

  static async start(chainfile: Chainfile | any): Promise<ChainfileTestcontainers> {
    const testcontainers = new ChainfileTestcontainers(chainfile);
    await testcontainers.start();
    return testcontainers;
  }

  async stop(): Promise<void> {
    await this.composeStarted.down();
    rmSync(join(this.cwd, this.composeFile));
  }

  getDeploymentId(): string {
    return this.deploymentId;
  }

  getEnvironment(): Record<string, string> {
    return this.environment;
  }

  getContainer(name: string): ChainfileContainer {
    const containerDef = this.chainfile.containers[name];
    if (containerDef === undefined) {
      throw new Error(`Container ${name} not found`);
    }
    return new ChainfileContainer(
      this.composeStarted.getContainer(`${name}-${this.deploymentId}`),
      containerDef,
      this.environment,
    );
  }

  getChainfileAgent(): ChainfileAgent {
    return new ChainfileAgent(this.composeStarted.getContainer(`chainfile-agent-${this.deploymentId}`));
  }
}

export { ChainfileAgent, ChainfileContainer };
