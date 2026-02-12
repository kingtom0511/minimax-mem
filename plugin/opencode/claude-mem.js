/**
 * Claude-Mem OpenCode Plugin
 * 
 * Provides persistent memory for OpenCode by integrating with Claude-Mem worker service.
 * Maps OpenCode events to Claude-Mem hooks.
 * 
 * Install: Add to ~/.config/opencode/opencode.json:
 *   { "plugin": ["claude-mem"] }
 * 
 * Or copy to ~/.config/opencode/plugins/claude-mem.js
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';

function getWorkerScript() {
  const possiblePaths = [
    join(homedir(), '.claude', 'plugins', 'marketplaces', 'thedotmack', 'scripts', 'worker-service.cjs'),
    join(homedir(), '.claude-mem', 'plugin', 'scripts', 'worker-service.cjs'),
    join(__dirname, '..', 'scripts', 'worker-service.cjs'),
  ];
  
  for (const p of possiblePaths) {
    if (existsSync(p)) return p;
  }
  
  return possiblePaths[0];
}

function getBunPath() {
  const bunPaths = [
    join(homedir(), '.bun', 'bin', 'bun'),
    '/opt/homebrew/bin/bun',
    '/usr/local/bin/bun',
  ];
  
  for (const p of bunPaths) {
    if (existsSync(p)) return p;
  }
  return 'bun';
}

async function fetchContext(directory) {
  const workerScript = getWorkerScript();
  return new Promise((resolve) => {
    const child = spawn(getBunPath(), [
      workerScript,
      'hook',
      'opencode',
      'context'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const eventData = JSON.stringify({
      session_id: globalThis.__CLAUDE_MEM_SESSION_ID__ || '',
      cwd: directory,
    });
    
    child.stdin.write(eventData);
    child.stdin.end();

    let stdout = '';
    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.on('close', () => {
      try {
        const result = JSON.parse(stdout);
        resolve(result.hookSpecificOutput?.additionalContext || null);
      } catch {
        resolve(null);
      }
    });
    child.on('error', () => resolve(null));
  });
}

export const ClaudeMemPlugin = async (ctx) => {
  const { directory, client } = ctx;

  async function ensureSession(sessionId, cwd) {
    if (!sessionId || !cwd) return;
    
    const port = 37777;
    const project = cwd.split('/').pop() || 'unknown';
    try {
      await fetch(`http://127.0.0.1:${port}/api/sessions/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSessionId: sessionId,
          project: project,
          prompt: 'OpenCode session'
        })
      });
    } catch (err) {
    }
  }

  async function addObservation(sessionId, cwd, toolName, toolInput, toolResponse) {
    const port = 37777;
    try {
      await fetch(`http://127.0.0.1:${port}/api/sessions/observations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSessionId: sessionId,
          cwd: cwd,
          tool_name: toolName,
          tool_input: toolInput,
          tool_response: toolResponse
        })
      });
    } catch (err) {
    }
  }

  return {
    'session.created': async (input) => {
      const sessionId = input.id || input.sessionID || '';
      const cwd = input.cwd || input.directory || directory;
      globalThis.__CLAUDE_MEM_SESSION_ID__ = sessionId;
      globalThis.__CLAUDE_MEM_CWD__ = cwd;
      await ensureSession(sessionId, cwd);
    },
    
    'session.idle': async (input) => {
    },
    
    'tool.execute.before': async (input, output) => {
      const sessionId = globalThis.__CLAUDE_MEM_SESSION_ID__ || input.sessionID || '';
      const cwd = globalThis.__CLAUDE_MEM_CWD__ || input.cwd || directory;
      const toolName = input.tool || 'unknown';
      
      await ensureSession(sessionId, cwd);
      await addObservation(sessionId, cwd, toolName, output?.args || {}, {});
    },

    'tool.execute.after': async (input, output) => {
      const sessionId = globalThis.__CLAUDE_MEM_SESSION_ID__ || input.sessionID || '';
      const cwd = globalThis.__CLAUDE_MEM_CWD__ || input.cwd || directory;
      const toolName = input.tool || 'unknown';
      
      await ensureSession(sessionId, cwd);
      
      const toolInput = { tool: toolName };
      const toolResponse = output?.output || output?.title || {};
      
      await addObservation(sessionId, cwd, toolName, toolInput, toolResponse);
    },
    
    'experimental.chat.system.transform': async (input, output) => {
      try {
        const context = await fetchContext(directory);
        if (context) {
          output.push({ type: 'text', content: context });
        }
      } catch (err) {
        console.error('Claude-Mem context injection error:', err);
      }
    },
    
    'experimental.session.compacting': async (input, output) => {
      output.context.push('## Claude-Mem Context\nClaude-Mem is tracking session memory.');
    }
  };
};
