import { randomBytes } from 'node:crypto';

import { Environment } from './index';

// Dotenv Expansion Implementation
//
// Copyright (c) 2016, Scott Motte
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// * Redistributions of source code must retain the above copyright notice, this
//   list of conditions and the following disclaimer.
//
// * Redistributions in binary form must reproduce the above copyright notice,
//   this list of conditions and the following disclaimer in the documentation
//   and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
// FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
// DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
// CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
// OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
const dotenv = {
  INTERPOLATE_SUBSTITUTION_REGEX:
    /(\\)?(\$)(?!\()(\{?)([\w.]+)(?::?-((?:\$\{(?:\$\{(?:\$\{[^}]*\}|[^}])*}|[^}])*}|[^}])+))?(\}?)/gi,
  resolveEscapeSequences: (value: string): string => {
    return value.replace(/\\\$/g, '$');
  },
  interpolate: (value: string, parsed: Record<string, string>): string => {
    return value.replace(
      dotenv.INTERPOLATE_SUBSTITUTION_REGEX,
      (match, escaped, dollarSign, openBrace, key, defaultValue) => {
        if (escaped === '\\') return match.slice(1);

        if (parsed[key]) {
          // avoid recursion from EXPAND_SELF=$EXPAND_SELF
          if (parsed[key] === value) {
            return parsed[key];
          } else {
            return dotenv.interpolate(parsed[key], parsed);
          }
        }

        if (defaultValue) {
          if (defaultValue.startsWith('$')) {
            return dotenv.interpolate(defaultValue, parsed);
          } else {
            return defaultValue;
          }
        }

        return '';
      },
    );
  },
  expand: (env: Record<string, string>): Record<string, string> => {
    const copied = { ...env };

    for (const key in copied) {
      const value = dotenv.interpolate(copied[key], copied);
      copied[key] = dotenv.resolveEscapeSequences(value);
    }

    return copied;
  },
};

export function synthEnv(environment: Environment): Record<string, string> {
  return dotenv.expand(
    Object.entries(environment).reduce(
      (env, [key, factory]) => {
        if (factory.type === 'RandomBytes') {
          env[key] = randomBytes(factory.length).toString(factory.encoding);
          return env;
        }
        if (factory.type === 'Value') {
          env[key] = factory.value;
          return env;
        }

        // if (factory.type === 'Injection') {
        // TODO: Prompt if CLI, inject if constructs.
        //  To allow for simple configuration, e.g. Masternode Keys.

        // @ts-expect-error so that we error out if we forget to handle a new factory type
        throw new Error(`Unsupported Environment Factory: ${factory.type}`);
      },
      {} as Record<string, string>,
    ),
  );
}
