#!/bin/bash
# Gör i ordning poddarnas launchd-jobb (se README, Supporterpoddarna): jobbets fil i
# ~/Library/LaunchAgents. Skriptet körs ur analysernas klon (scripts/analyser/installera.sh),
# så den ska finnas först. Startar ingenting: det gör "launchctl bootstrap" nedan.
set -euo pipefail

STOD="$HOME/Library/Application Support/Matchfixarna"
KLON="$STOD/Profeterna"
TIDNING="$STOD/Tidning"
LOGGAR="$HOME/Library/Logs/Matchfixarna"
JOBB="$HOME/Library/LaunchAgents/se.matchfixarna.poddar.plist"
MALL="$(cd "$(dirname "$0")" && pwd)/se.matchfixarna.poddar.plist"
NODE="$(command -v node)"

[ -d "$KLON/.git" ] || { echo "Analysernas klon saknas. Kör scripts/analyser/installera.sh först."; exit 1; }
command -v whisper-cli >/dev/null || [ -x /opt/homebrew/bin/whisper-cli ] || { echo "whisper-cli saknas. Kör: brew install whisper-cpp"; exit 1; }
[ -f "$TIDNING/ggml-large-v3-turbo-q5_0.bin" ] || { echo "Modellen saknas i $TIDNING (ggml-large-v3-turbo-q5_0.bin från huggingface.co/ggerganov/whisper.cpp)."; exit 1; }

mkdir -p "$TIDNING" "$LOGGAR" "$HOME/Library/LaunchAgents"
sed -e "s|__NODE__|$NODE|g" -e "s|__KLON__|$KLON|g" -e "s|__HEM__|$HOME|g" "$MALL" > "$JOBB"
plutil -lint "$JOBB" >/dev/null

echo "Jobbet: $JOBB"
echo "Loggen: $LOGGAR/poddar.log"
echo
echo "Starta:    launchctl bootstrap gui/\$(id -u) \"$JOBB\""
echo "Stoppa:    launchctl bootout gui/\$(id -u)/se.matchfixarna.poddar"
echo "Kör nu:    launchctl kickstart gui/\$(id -u)/se.matchfixarna.poddar"
