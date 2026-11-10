import { homedir } from 'node:os';
import { join } from 'node:path';

export const SMMS_TOKEN = process.env.SMMS_TOKEN ?? '';

export const DEFAULT_DIR = join(homedir(), 'Desktop', 'Imgtiny');
