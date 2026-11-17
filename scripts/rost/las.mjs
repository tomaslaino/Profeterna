#!/usr/bin/env node
// Hasse Backes röst är borttagen (Tomas 2026-11-17: "Hasse pratar inte längre. Du kan ta bort det").
// Det här är det enda som är kvar av jobbet på iMacen: launchd startar fortfarande den här filen var
// 15:e minut (se.matchfixarna.rost) i jobbets egen klon. Första gången stänger den av jobbet för gott:
// tar bort jobbets fil i ~/Library/LaunchAgents och sedan jobbet ur launchd, som avslutar den här
// körningen. Ljudbanken och klonen i ~/Library/Application Support/Matchfixarna/Rost/ och grenen rost på
// GitHub rörs inte. Filen kan tas bort när jobbet är borta på iMacen (README, Hasse Backe, Ljudet).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ETIKETT = 'se.matchfixarna.rost';
const LOGG = path.join(os.homedir(), 'Library', 'Logs', 'Matchfixarna', 'rost.log');

function logg(rad) {
  const text = `${new Date().toISOString()} ${rad}`;
  console.log(text);
  try {
    fs.mkdirSync(path.dirname(LOGG), { recursive: true });
    fs.appendFileSync(LOGG, `${text}\n`);
  } catch { /* då syns det bara här */ }
}

logg('Hasse Backes röst är borttagen från sajten. Jobbet stänger av sig självt.');
if (process.platform === 'darwin') {
  const plist = path.join(os.homedir(), 'Library', 'LaunchAgents', `${ETIKETT}.plist`);
  try {
    fs.rmSync(plist, { force: true });
  } catch (err) {
    logg(`Kunde inte ta bort ${plist}: ${err.message}`);
  }
  // (sist: launchd avslutar den här körningen när jobbet tas bort)
  try {
    execFileSync('launchctl', ['bootout', `gui/${process.getuid()}/${ETIKETT}`], { stdio: 'ignore' });
  } catch { /* jobbet var inte inläst */ }
}
