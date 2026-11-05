#!/bin/bash
# Gör i ordning röstjobbets launchd-jobb (se README, Hasse Backe, Ljudet): en egen klon av
# repot, som jobbet återställer till origin/main varje gång, och jobbets fil i
# ~/Library/LaunchAgents. Ljudbanken ligger i Rost/ljud, utanför klonen. Startar
# ingenting: det gör "launchctl bootstrap" nedan. Går att köra om för att uppdatera
# jobbets fil.
set -euo pipefail

STOD="$HOME/Library/Application Support/Matchfixarna/Rost"
KLON="$STOD/Profeterna"
LOGGAR="$HOME/Library/Logs/Matchfixarna"
JOBB="$HOME/Library/LaunchAgents/se.matchfixarna.rost.plist"
MALL="$(cd "$(dirname "$0")" && pwd)/se.matchfixarna.rost.plist"
NODE="$(command -v node)"

mkdir -p "$STOD/ljud" "$LOGGAR" "$HOME/Library/LaunchAgents"
if [ ! -d "$KLON/.git" ]; then
  git clone -q https://github.com/tomaslaino/Profeterna.git "$KLON"
fi
# Markören är det enda som låter skriptet återställa en mapp till origin/main.
touch "$KLON/.git/info/exclude"
grep -qx '.rost-klon' "$KLON/.git/info/exclude" || echo '.rost-klon' >> "$KLON/.git/info/exclude"
touch "$KLON/.rost-klon"

# Det som jobbet behöver: Chatterbox-miljön, referensen och ffmpeg.
PY="$HOME/Kod/chatterbox-rost/.venv/bin/python"
[ -x "$PY" ] || echo "OBS: $PY finns inte (rost.egen.python i config/hasse.js)."
[ -f "$HOME/Kod/chatterbox-rost/min_rost.wav" ] || echo "OBS: referensen ~/Kod/chatterbox-rost/min_rost.wav finns inte."
PATH="/usr/local/bin:/opt/homebrew/bin:$PATH" command -v ffmpeg >/dev/null || echo "OBS: ffmpeg saknas (brew install ffmpeg)."

sed -e "s|__NODE__|$NODE|g" -e "s|__KLON__|$KLON|g" -e "s|__HEM__|$HOME|g" "$MALL" > "$JOBB"
plutil -lint "$JOBB" >/dev/null

echo "Klonen:  $KLON"
echo "Ljudet:  $STOD/ljud"
echo "Jobbet:  $JOBB"
echo "Loggen:  $LOGGAR/rost.log (Chatterbox: $LOGGAR/rost-chatterbox.log)"
echo
echo "Starta:    launchctl bootstrap gui/\$(id -u) \"$JOBB\""
echo "Stoppa:    launchctl bootout gui/\$(id -u)/se.matchfixarna.rost"
echo "Testkör:   launchctl kickstart -k gui/\$(id -u)/se.matchfixarna.rost"
