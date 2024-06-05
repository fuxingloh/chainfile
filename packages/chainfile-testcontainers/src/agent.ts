import { Chainfile } from '@chainfile/schema';
import { AbstractStartedContainer, StartedTestContainer } from 'testcontainers';

export class AgentContainer extends AbstractStartedContainer {
  constructor(started: StartedTestContainer) {
    super(started);
  }

  private get endpoint(): string {
    return `http://${this.getHost()}:${this.getMappedPort(1569)}`;
  }

  public async getChainfile(): Promise<Chainfile> {
    const response = await fetch(`${this.endpoint}/chainfile`);
    return (await response.json()) as Chainfile;
  }

  public async probe(type: 'startup' | 'liveness' | 'readiness'): Promise<Response> {
    return await fetch(`${this.endpoint}/probes/${type}`);
  }
}
