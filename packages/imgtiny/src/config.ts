import { homedir } from 'node:os';
import { join } from 'node:path';

export const DEFAULT_DIR = join(homedir(), 'Desktop', 'Imgtiny');
