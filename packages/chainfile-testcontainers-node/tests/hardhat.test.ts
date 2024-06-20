import { afterAll, beforeAll, expect, it } from '@workspace/jest/globals';

import { CFTestcontainers } from '../src';
import localhost from './hardhat.json';

const testcontainers = new CFTestcontainers(localhost);

beforeAll(async () => {
  await testcontainers.start();
});

afterAll(async () => {
  await testcontainers.stop();
});

it('should rpc(eth_blockNumber)', async () => {
  const response = await testcontainers.get('hardhat').rpc({
    method: 'eth_blockNumber',
  });

  expect(response.status).toStrictEqual(200);

  expect(await response.json()).toMatchObject({
    result: '0x0',
  });
});
