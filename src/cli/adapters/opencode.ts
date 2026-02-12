import type { PlatformAdapter } from '../types.js';

export const opencodeAdapter: PlatformAdapter = {
  normalizeInput(raw) {
    const r = (raw ?? {}) as any;
    
    const sessionId = r.session_id ?? r.id ?? r.sessionId ?? '';
    const cwd = r.cwd ?? r.directory ?? process.cwd();
    
    const toolName = r.tool ?? r.tool_name ?? '';
    const toolInput = r.input ?? r.args ?? r.tool_input;
    const toolResponse = r.output ?? r.result ?? r.tool_response;
    
    const prompt = r.prompt ?? r.message ?? r.content ?? '';
    
    return {
      sessionId,
      cwd,
      prompt,
      toolName,
      toolInput,
      toolResponse,
      transcriptPath: r.transcript_path ?? r.transcriptPath,
      platform: 'opencode'
    };
  },
  formatOutput(result) {
    if (result.hookSpecificOutput) {
      return { 
        hookSpecificOutput: result.hookSpecificOutput,
        // OpenCode expects specific format
        content: result.hookSpecificOutput.additionalContext ?? '',
        suppress: result.suppressOutput ?? false
      };
    }
    return { 
      continue: result.continue ?? true, 
      suppressOutput: result.suppressOutput ?? true 
    };
  }
};
