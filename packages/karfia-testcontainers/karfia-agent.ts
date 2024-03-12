import { KarfiaDefinition } from 'karfia-definition';
import { AbstractStartedContainer, StartedTestContainer } from 'testcontainers';

export class KarfiaAgentContainer extends AbstractStartedContainer {
  constructor(started: StartedTestContainer) {
    super(started);
  }

  private get endpoint(): string {
    return `http://${this.getHost()}:${this.getMappedPort(1194)}`;
  }

  public async getDeployment(): Promise<{
    deploymentId: string;
    id: string;
    caip2: string;
    name: string;
  }> {
    const response = await fetch(`${this.endpoint}/deployment`);
    return (await response.json()) as any;
  }

  public async getDefinition(): Promise<KarfiaDefinition> {
    const response = await fetch(`${this.endpoint}/definition`);
    return (await response.json()) as KarfiaDefinition;
  }

  public async probe(type: 'startup' | 'liveness' | 'readiness'): Promise<Response> {
    return await fetch(`${this.endpoint}/probes/${type}`);
  }
}
