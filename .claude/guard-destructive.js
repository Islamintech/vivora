#!/usr/bin/env node
/**
 * Destructive-command guard (PreToolUse on Bash/PowerShell).
 *
 * The permission allowlist is deliberately broad so routine work - builds,
 * tests, servers, git reads, curl - never stops to ask. This script is the
 * counterweight: it inspects the whole command string and forces a prompt for
 * anything that destroys data.
 *
 * Why a hook rather than `ask` permission rules alone: those match a command
 * by its prefix, so `cd backend && rm -rf dist` or a Mongo `deleteMany` buried
 * inside `node -e "..."` slips straight past them. Substring matching over the
 * full command is the only thing that catches those, and deleting the wrong
 * collection is exactly the mistake worth a two-second confirmation.
 *
 * Exit code is always 0: a crash here must not block ordinary work. Failing
 * open is the right trade because the permission rules still apply underneath.
 */

const PATTERNS = [
  // --- Deleting files -----------------------------------------------------
  { re: /(^|[;&|]\s*)rm\s+(-\S+\s+)*\S/, why: 'deletes files (rm)' },
  { re: /(^|[;&|]\s*)rmdir\s/, why: 'removes a directory (rmdir)' },
  { re: /\bRemove-Item\b/i, why: 'deletes files (Remove-Item)' },
  { re: /(^|[;&|]\s*)del\s+\/|(^|[;&|]\s*)rd\s+\/s/i, why: 'deletes files (del/rd)' },

  // --- Deleting database data --------------------------------------------
  { re: /\bdeleteMany\b/, why: 'deletes MongoDB documents (deleteMany)' },
  { re: /\bdeleteOne\b/, why: 'deletes a MongoDB document (deleteOne)' },
  { re: /\bfindOneAndDelete\b/, why: 'deletes a MongoDB document (findOneAndDelete)' },
  { re: /\bremove\s*\(\s*\{/, why: 'removes MongoDB documents (remove)' },
  { re: /\bdropDatabase\b/, why: 'DROPS THE DATABASE' },
  { re: /\bdropCollection\b|\.drop\s*\(/, why: 'drops a MongoDB collection' },
  { re: /\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i, why: 'drops a SQL table/database' },
  { re: /\bTRUNCATE\b/i, why: 'truncates a table' },

  // --- Losing committed or working-tree work ------------------------------
  { re: /git\s+push\b[^|;&]*(--force|--delete|\s-f\b)/, why: 'force-pushes or deletes a remote branch' },
  { re: /git\s+reset\b[^|;&]*--hard/, why: 'discards local changes (git reset --hard)' },
  { re: /git\s+clean\b[^|;&]*-[a-z]*f/, why: 'deletes untracked files (git clean -f)' },
  { re: /git\s+branch\b[^|;&]*\s-D\b/, why: 'force-deletes a branch' },
  { re: /git\s+checkout\b[^|;&]*\s--\s/, why: 'discards changes to specific files' },
  { re: /git\s+stash\s+(drop|clear)\b/, why: 'discards stashed work' },
];

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw || '{}');
    const command = String(input?.tool_input?.command ?? '');
    if (!command) return;

    const hit = PATTERNS.find((p) => p.re.test(command));
    if (!hit) return; // Silence = let the normal permission rules decide.

    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'ask',
          permissionDecisionReason: `This command ${hit.why}. Confirm before it runs.`,
        },
      }),
    );
  } catch {
    // Malformed payload: say nothing and let the permission rules stand.
  }
});
