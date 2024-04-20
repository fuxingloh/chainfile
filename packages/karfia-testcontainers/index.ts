import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { KarfiaDefinition } from 'karfia-definition';
import { Synthesizer } from 'karfia-docker-compose/synthesizer';
import { DockerComposeEnvironment, StartedDockerComposeEnvironment as ComposeStarted, Wait } from 'testcontainers';

import { KarfiaAgentContainer } from './karfia-agent';
import { KarfiaContainer } from './karfia-container';

export class KarfiaTestcontainers {
  protected cwd: string = join(process.cwd(), '.karfia');

  protected definition: KarfiaDefinition;
  protected synthesizer: Synthesizer;
  protected environment: Record<string, string>;
  protected deploymentId: string;

  protected composeFile: string;
  protected composeStarted!: ComposeStarted;

  private constructor(definition: KarfiaDefinition | any) {
    this.definition = definition;
    this.synthesizer = new Synthesizer(definition);
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
      // We use the readiness probe of the karfia-agent container to determine if the deployment is ready
      // to accept requests.
      .withWaitStrategy(`karfia-agent-${this.deploymentId}`, Wait.forHttp('/probes/readiness', 1194))
      .up();
  }

  static async start(definition: KarfiaDefinition | any): Promise<KarfiaTestcontainers> {
    const testcontainers = new KarfiaTestcontainers(definition);
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

  getContainer(name: string): KarfiaContainer {
    const containerDef = this.definition.containers[name];
    if (containerDef === undefined) {
      throw new Error(`Container ${name} not found`);
    }
    return new KarfiaContainer(
      this.composeStarted.getContainer(`${name}-${this.deploymentId}`),
      containerDef,
      this.environment,
    );
  }

  getKarfiaAgent(): KarfiaAgentContainer {
    return new KarfiaAgentContainer(this.composeStarted.getContainer(`karfia-agent-${this.deploymentId}`));
  }
}

export { KarfiaAgentContainer, KarfiaContainer };
