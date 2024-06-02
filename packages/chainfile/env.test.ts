import { expect, it } from '@jest/globals';

import { synthEnv } from './env';
import { Env } from './type';

it('should expand environment', async () => {
  const env: Env = {
    USER: {
      type: 'RandomBytes',
      length: 8,
      encoding: 'hex',
    },
    PASS: {
      type: 'RandomBytes',
      length: 16,
      encoding: 'hex',
    },
    URL: {
      type: 'Value',
      value: `http://$USER:$PASS@localhost:3000000`,
    },
    DEBUG: {
      type: 'Value',
      value: 'chainfile:*',
    },
  };

  expect(synthEnv(env)).toStrictEqual({
    USER: expect.stringMatching(/[0-9a-f]{16}/),
    PASS: expect.stringMatching(/[0-9a-f]{32}/),
    URL: expect.stringMatching(/http:\/\/[0-9a-f]{16}:[0-9a-f]{32}@localhost:3000000/),
    DEBUG: 'chainfile:*',
  });
});
