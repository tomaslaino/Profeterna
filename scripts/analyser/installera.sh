#!/bin/bash
# Gör i ordning analysernas launchd-jobb (se README, Analyserna): en egen klon av
# repot, som jobbet återställer till origin/main varje gång, och jobbets fil i
# ~/Library/LaunchAgents. Startar ingenting: det gör "launchctl bootstrap" nedan.
# Går att köra om för att uppdatera jobbets fil.
set -euo pipefail

STOD="$HOME/Library/Application Support/Matchfixarna"
KLON="$STOD/Profeterna"
LOGGAR="$HOME/Library/Logs/Matchfixarna"
JOBB="$HOME/Library/LaunchAgents/se.matchfixarna.analyser.plist"
MALL="$(cd "$(dirname "$0")" && pwd)/se.matchfixarna.analyser.plist"
NODE="$(command -v node)"

mkdir -p "$STOD" "$LOGGAR" "$HOME/Library/LaunchAgents"
if [ ! -d "$KLON/.git" ]; then
  git clone -q https://github.com/tomaslaino/Profeterna.git "$KLON"
fi
# Markören är det enda som låter skriptet återställa en mapp till origin/main.
touch "$KLON/.git/info/exclude"
grep -qx '.analyser-klon' "$KLON/.git/info/exclude" || echo '.analyser-klon' >> "$KLON/.git/info/exclude"
touch "$KLON/.analyser-klon"

sed -e "s|__NODE__|$NODE|g" -e "s|__KLON__|$KLON|g" -e "s|__HEM__|$HOME|g" "$MALL" > "$JOBB"
plutil -lint "$JOBB" >/dev/null

echo "Klonen: $KLON"
echo "Jobbet: $JOBB"
echo "Loggen: $LOGGAR/analyser.log"
echo
echo "Starta:    launchctl bootstrap gui/\$(id -u) \"$JOBB\""
echo "Stoppa:    launchctl bootout gui/\$(id -u)/se.matchfixarna.analyser"
echo "Testkör:   launchctl kickstart -k gui/\$(id -u)/se.matchfixarna.analyser"
