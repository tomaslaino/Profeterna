// Claude Code i icke-interaktivt läge (claude -p) på användarens Claude-konto.
// Allt AI-skrivande i projektet går härigenom (scripts/analyser/skriv.mjs).
//
// Så att det verkligen går via abonnemanget och inte debiteras som API:
//   - betalvagar() hittar miljövariabler som skulle styra om anropet, och då
//     körs inget alls,
//   - Claude Code startas med en egen, liten miljö, så att inget ärvs,
//   - inloggningen kontrolleras först (inloggning()), och om körningen ändå
//     rapporterar en API-nyckel avbryts den direkt.
//
// --bare, som dokumentationen rekommenderar för skript, får inte användas: det
// läget läser aldrig abonnemangets inloggning.
//
// Claude Code får bara verktygen i tools (inga alls om listan är tom), inga
// inställningar, tillägg eller MCP-servrar, och körs i en tom tillfällig mapp.

import { spawn, execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const CLAUDE = process.env.ANALYSER_CLAUDE || path.join(os.homedir(), '.local', 'bin', 'claude');

// Kastas när det inte är någon idé att fortsätta körningen. slag: 'grans'
// (abonnemangets gräns), 'inloggning' eller 'betalning'.
export class Stopp extends Error {
  constructor(slag, message) {
    super(message);
    this.slag = slag;
  }
}

const BETALDA = ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX', 'CLAUDE_CODE_USE_FOUNDRY'];
export const betalvagar = (env = process.env) => BETALDA.filter((k) => env[k]);

function renMiljo() {
  const out = { PATH: '/usr/bin:/bin:/usr/sbin:/sbin' };
  for (const k of ['HOME', 'USER', 'LOGNAME', 'TMPDIR', 'LANG']) if (process.env[k]) out[k] = process.env[k];
  return out;
}

// → {loggedIn, authMethod, apiProvider, subscriptionType, …} eller kastar.
export function inloggning() {
  return new Promise((ok, nej) => {
    execFile(CLAUDE, ['auth', 'status', '--json'], { env: renMiljo(), timeout: 30000 }, (err, stdout) => {
      try {
        ok(JSON.parse(stdout));
      } catch {
        nej(new Stopp('inloggning', `claude auth status gick inte att läsa (${(err && err.message) || 'inget svar'})`));
      }
    });
  });
}

const URL_RE = /https?:\/\/[^\s"'<>()\]\\]+/g;
const TRAFF_RE = /\{"title":"((?:[^"\\]|\\.)*)","url":"((?:[^"\\]|\\.)*)"\}/g;

function strangar(v, ut) {
  if (typeof v === 'string') ut.push(v);
  else if (Array.isArray(v)) for (const x of v) strangar(x, ut);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!/^(type|id|tool_use_id|media_type)$/.test(k)) strangar(x, ut);
}

// Sidorna och texten i verktygens svar. found: adresser med rubrik där den finns,
// read: det Claude fick läsa, för sifferkontrollen.
function samla(block, found, read) {
  const texter = [];
  strangar(block.content, texter);
  for (const s of texter) {
    read.push(s);
    for (const m of s.matchAll(TRAFF_RE)) found.push({ url: m[2].replace(/\\(.)/g, '$1'), title: m[1].replace(/\\(.)/g, '$1'), date: null });
    for (const u of s.match(URL_RE) || []) found.push({ url: u, title: null, date: null });
  }
}

function fel(text) {
  const t = String(text || '');
  if (/usage limit|limit reached|rate.?limit|hit your .*limit|out of .*(usage|credits)|overloaded/i.test(t)) return new Stopp('grans', t.slice(0, 200));
  if (/not logged in|please run \/login|invalid api key|authentication|unauthorized|oauth/i.test(t)) return new Stopp('inloggning', t.slice(0, 200));
  return new Error(t.slice(0, 300) || 'Claude Code gav inget svar.');
}

// Ett anrop. tools: verktygen Claude får ([] = inga), blocked: adresser
// WebFetch inte får öppna. → {content, model, refused, found, read, searches,
// fetches, seconds, dollars (Claude Codes egen uppskattning, inget som betalas
// på abonnemanget), init}.
export function claudeSvar({ system, prompt, tools = [], blocked = [], model, effort, timeoutMs = 420000 }) {
  return new Promise((resolve, reject) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'matchfixarna-'));
    const args = ['-p', '--output-format', 'stream-json', '--verbose',
      '--model', model, '--effort', effort, '--system-prompt', system,
      '--tools', tools.join(','), '--setting-sources', 'project', '--strict-mcp-config',
      '--no-session-persistence', '--permission-mode', 'dontAsk'];
    if (tools.length) args.push('--allowedTools', tools.join(','));
    if (blocked.length && tools.includes('WebFetch')) args.push('--disallowedTools', blocked.map((d) => `WebFetch(domain:${d})`).join(','));

    const child = spawn(CLAUDE, args, { cwd: dir, env: renMiljo(), stdio: ['pipe', 'pipe', 'pipe'] });
    const t0 = Date.now();
    const found = [];
    const read = [];
    const ut = { content: '', model, refused: false, found, read, searches: 0, fetches: 0, seconds: 0, dollars: null, init: null };
    let rest = '';
    let stderr = '';
    let klart = false;
    const avsluta = (err) => {
      if (klart) return;
      klart = true;
      clearTimeout(timer);
      fs.rmSync(dir, { recursive: true, force: true });
      ut.seconds = Math.round((Date.now() - t0) / 1000);
      if (err) reject(err);
      else resolve(ut);
    };
    const timer = setTimeout(() => {
      child.kill('SIGINT');
      setTimeout(() => child.kill('SIGKILL'), 5000).unref();
      avsluta(new Error(`Claude Code svarade inte inom ${Math.round(timeoutMs / 60000)} minuter.`));
    }, timeoutMs);

    const rad = (line) => {
      let m;
      try { m = JSON.parse(line); } catch { return; }
      if (m.type === 'system' && m.subtype === 'init') {
        ut.init = m;
        // Allt utom inloggningen är fel väg. Då stoppas körningen innan något skrivs.
        if (m.apiKeySource && !['none', 'oauth'].includes(m.apiKeySource)) {
          child.kill('SIGKILL');
          avsluta(new Stopp('betalning', `Claude Code använder en API-nyckel (${m.apiKeySource}) i stället för abonnemanget.`));
        }
      } else if (m.type === 'assistant' && m.message) {
        if (m.message.model) ut.model = m.message.model;
        if (m.message.stop_reason === 'refusal') ut.refused = true;
        for (const b of m.message.content || []) {
          if (b.type !== 'tool_use') continue;
          if (b.name === 'WebSearch') ut.searches++;
          if (b.name === 'WebFetch') {
            ut.fetches++;
            if (b.input && b.input.url) found.push({ url: b.input.url, title: null, date: null });
          }
        }
      } else if (m.type === 'user' && m.message) {
        for (const b of m.message.content || []) if (b.type === 'tool_result') samla(b, found, read);
      } else if (m.type === 'result') {
        ut.dollars = m.total_cost_usd == null ? null : m.total_cost_usd;
        if (m.is_error || m.subtype !== 'success') ut.fel = fel(m.result || (m.errors || []).join(' ') || m.subtype);
        else ut.content = m.result || '';
      }
    };
    // Tecken som delas mellan två bitar ska inte gå sönder.
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (b) => {
      rest += b;
      let i;
      while ((i = rest.indexOf('\n')) >= 0) {
        rad(rest.slice(0, i));
        rest = rest.slice(i + 1);
      }
    });
    child.stderr.on('data', (b) => { stderr = (stderr + b).slice(-2000); });
    child.on('error', (err) => avsluta(err.code === 'ENOENT' ? new Stopp('inloggning', `Hittar inte Claude Code (${CLAUDE}).`) : err));
    child.on('close', (code) => {
      if (rest.trim()) rad(rest);
      if (ut.fel) avsluta(ut.fel);
      else if (ut.content || ut.refused) avsluta(null);
      else avsluta(fel(stderr || `Claude Code avslutades med kod ${code}.`));
    });
    child.stdin.on('error', () => {});
    child.stdin.end(prompt);
  });
}
