// Runs the ONNX background-removal model in its own process (its bundled sharp conflicts with ours).
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { removeBackground } from '@imgly/background-removal-node';
const [src, dst, model = 'medium'] = process.argv.slice(2);
const blob = await removeBackground(pathToFileURL(src).href, { model, output: { format: 'image/png' } });
fs.writeFileSync(dst, Buffer.from(await blob.arrayBuffer()));
process.exit(0);
