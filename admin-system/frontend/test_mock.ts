import { test, mock } from 'node:test';
import assert from 'node:assert';

mock.module('react', {
  namedExports: {
    useState: (init: any) => [init, () => {}],
    useEffect: () => {},
    useRef: (init: any) => ({ current: init }),
  },
});

test('mock react', async () => {
  const react = await import('react');
  const [val] = react.useState(42);
  assert.strictEqual(val, 42);
});
