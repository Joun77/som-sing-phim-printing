import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateAndDownloadImposedPdf } from './impositionPdfGenerator';

describe('impositionPdfGenerator Unit Tests', () => {
  it('throws error if empty items array is provided', async () => {
    await assert.rejects(
      async () => {
        await generateAndDownloadImposedPdf([], {
          orderNo: 'ORD-001',
          jobName: 'Test Photos',
          itemWidthMM: 102,
          itemHeightMM: 152,
        });
      },
      {
        message: 'No items provided for imposition PDF',
      }
    );
  });
});
