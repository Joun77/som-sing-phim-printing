import { describe, it } from 'node:test';
import assert from 'node:assert';
import JSZip from 'jszip';

describe('zipDownloader Unit Tests', () => {
  it('correctly creates a zip package with multiple files', async () => {
    const zip = new JSZip();
    const folder = zip.folder('test_order_photos');
    
    // Add sample files
    folder?.file('photo_01.jpg', 'fake-image-data-1');
    folder?.file('photo_02.jpg', 'fake-image-data-2');
    folder?.file('photo_03.jpg', 'fake-image-data-3');

    const content = await zip.generateAsync({ type: 'uint8array' });
    assert.ok(content.length > 0, 'Zip file buffer should be generated');

    // Re-read generated zip to verify contents
    const unzipped = await JSZip.loadAsync(content);
    const files = Object.keys(unzipped.files);
    
    assert.ok(files.some(f => f.includes('photo_01.jpg')));
    assert.ok(files.some(f => f.includes('photo_02.jpg')));
    assert.ok(files.some(f => f.includes('photo_03.jpg')));
  });

  it('handles base64 data URLs correctly', async () => {
    const zip = new JSZip();
    // 1x1 transparent PNG base64
    const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    zip.file('pixel.png', base64Data, { base64: true });

    const content = await zip.generateAsync({ type: 'uint8array' });
    const loaded = await JSZip.loadAsync(content);
    assert.ok(loaded.file('pixel.png') !== null);
  });
});
