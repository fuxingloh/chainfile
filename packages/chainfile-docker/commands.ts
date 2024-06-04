import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Chainfile } from 'chainfile/schema';
import { Command, Option, runExit } from 'clipanion';

import { Synthesizer } from './synthesizer';

export class SynthCommand extends Command {
  static override paths = [[`synth`]];

  uri = Option.String({
    required: true,
    name: 'Chainfile URI',
  });

  dir = Option.String<string, 1>('--dir', {
    description: 'Directory to synthesize chainfile to, defaults to the ID of the chainfile.',
  });

  async execute(): Promise<void> {
    const chainfile = await this.loadChainfile();
    const synthesizer = new Synthesizer(chainfile);

    const dir = this.dir ?? chainfile.name.replaceAll('/', '_').replaceAll(':', '-');

    if (existsSync(dir)) {
      this.context.stdout.write(`Directory: ${dir} already exists, aborting.`);
      return;
    }

    this.context.stdout.write(`Synthesizing chainfile to directory: ${dir}`);
    writeFileSync(join(dir, 'compose.yml'), synthesizer.synthCompose());
    writeFileSync(join(dir, '.env'), synthesizer.synthEnv());
  }

  private loadChainfile(): Promise<Chainfile> {
    if (existsSync(this.uri)) {
      return JSON.parse(readFileSync(this.uri, 'utf-8'));
    }

    throw new Error(`Unsupported URI: ${this.uri}`);
  }
}

// noinspection JSIgnoredPromiseFromCall
void runExit([SynthCommand]);
