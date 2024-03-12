import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Command, Option, runExit } from 'clipanion';
import { KarfiaDefinition } from 'karfia-definition';

import { Synthesizer } from './synthesizer';

export class SynthCommand extends Command {
  static override paths = [[`synth`]];

  uri = Option.String({
    required: true,
    name: 'Karfia Definition URI',
  });

  dir = Option.String<string, 1>('--dir', {
    description: 'Directory to synthesize definition to, defaults to the ID of the definition.',
  });

  async execute(): Promise<void> {
    const definition = await this.loadDefinition();
    const synthesizer = new Synthesizer(definition);

    const dir = this.dir ?? definition.id.replaceAll('/', '_').replaceAll(':', '-');

    if (existsSync(dir)) {
      this.context.stdout.write(`Directory: ${dir} already exists, aborting.`);
      return;
    }

    this.context.stdout.write(`Synthesizing definition: ${definition.id} to directory: ${dir}`);
    writeFileSync(join(dir, 'compose.yml'), synthesizer.synthCompose());
    writeFileSync(join(dir, '.env'), synthesizer.synthEnv());
  }

  private loadDefinition(): Promise<KarfiaDefinition> {
    if (existsSync(this.uri)) {
      return JSON.parse(readFileSync(this.uri, 'utf-8'));
    }

    throw new Error(`Unsupported URI: ${this.uri}`);
  }
}

// noinspection JSIgnoredPromiseFromCall
void runExit([SynthCommand]);
