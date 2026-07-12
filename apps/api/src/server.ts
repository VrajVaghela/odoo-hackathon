import app from './app.js';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';

dotenv.config();
const parentEnv = path.resolve(process.cwd(), '../../.env');
if (fs.existsSync(parentEnv)) {
  dotenv.config({ path: parentEnv });
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
