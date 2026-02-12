import type { PlatformAdapter } from '../types.js';
import { claudeCodeAdapter } from './claude-code.js';
import { cursorAdapter } from './cursor.js';
import { rawAdapter } from './raw.js';
import { opencodeAdapter } from './opencode.js';

export function getPlatformAdapter(platform: string): PlatformAdapter {
  switch (platform) {
    case 'claude-code': return claudeCodeAdapter;
    case 'cursor': return cursorAdapter;
    case 'raw': return rawAdapter;
    case 'opencode': return opencodeAdapter;
    default: throw new Error(`Unknown platform: ${platform}`);
  }
}

export { claudeCodeAdapter, cursorAdapter, rawAdapter, opencodeAdapter };
