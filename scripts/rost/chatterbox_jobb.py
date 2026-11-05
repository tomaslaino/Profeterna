"""Läser upp Hasse Backes meningar med Tomas klonade röst (Chatterbox Multilingual).

Startas av scripts/rost/las.mjs med Chatterbox-miljöns Python (config/hasse.js,
rost.egen.python) och en jobbfil:

    {"installningar": {...rost.egen...},
     "resultat": "<fil.jsonl>",
     "jobb": [{"avtryck": "...", "text": "<det som läses upp>", "ut": "<fil.mp3>"}]}

Modellen laddas en gång. Varje mening läses upp med nytt slumpfrö tills talet
(tystnaden borträknad) har en rimlig längd för texten och Chatterbox inte har
avbrutit med "forcing EOS token" av någon annan orsak än token_repetition (se
avbruten()), högst `forsok` gånger. Den godkända uppläsningen blir mp3 med ffmpeg.
En rad per mening skrivs till resultatfilen:

    {"avtryck", "ok", "sek", "vantat", "forsok", "fel"}

    python chatterbox_jobb.py jobb.json            som jobbet
    python chatterbox_jobb.py jobb.json --latsas   utan modell: tonstötar (för prov)

Skriptet får inte heta chatterbox.py. Dess mapp står först i sys.path, och då importerar
"from chatterbox.mtl_tts import ..." skriptet självt i stället för paketet. --latsas
importerar inte paketet, så det provet visar inte ett sådant fel.
"""

import contextlib
import io
import json
import logging
import math
import os
import random
import re
import subprocess
import sys
import tempfile
import time
import wave

import numpy as np


# ---------- modellen ----------

def ladda_modell():
    import torch

    enhet = "mps" if torch.backends.mps.is_available() else "cpu"
    original_load = torch.load

    def load_pa_ratt_enhet(*a, **k):
        k.setdefault("map_location", torch.device(enhet))
        return original_load(*a, **k)

    torch.load = load_pa_ratt_enhet
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS

    modell = ChatterboxMultilingualTTS.from_pretrained(device=enhet)

    def frö(n):
        random.seed(n)
        np.random.seed(n % (2**32))
        torch.manual_seed(n)

    return modell, frö


class Latsas:
    """Låtsad modell: en tonstöt per ord. Texter med KORT blir för korta, och med
    EOS säger den "forcing EOS token" första gången."""

    sr = 24000

    def __init__(self):
        self.sett = set()

    def generate(self, text, **_):
        if "EOS" in text and text not in self.sett:
            self.sett.add(text)
            logging.getLogger("chatterbox.models.t3").warning("forcing EOS token, long_tail=True")
        ord_ = text.split()
        sek = 0.1 if "KORT" in text else max(0.4, len(text) / 14)
        n = int(sek * self.sr)
        t = np.arange(n) / self.sr
        per = n // max(1, len(ord_))
        hölje = np.zeros(n)
        for i in range(len(ord_)):
            hölje[i * per: i * per + int(per * 0.7)] = 1
        tyst = np.zeros(int(0.3 * self.sr))
        return np.concatenate([tyst, 0.4 * np.sin(2 * math.pi * 180 * t) * hölje, tyst])[None, :]


# ---------- ljudet ----------

def till_numpy(wav):
    if hasattr(wav, "detach"):
        wav = wav.detach().cpu().float().numpy()
    return np.asarray(wav, dtype=np.float32).reshape(-1)


def talets_langd(d, sr, steg=0.01, tystnad=0.03):
    """Sekunder från första till sista ljudet, som sidan räknar (klipp i rum-hasse.js)."""
    w = max(1, round(sr * steg))
    n = len(d) // w
    if not n:
        return 0.0
    env = np.sqrt(np.mean(d[: n * w].reshape(n, w) ** 2, axis=1))
    m = env.max()
    if not m:
        return 0.0
    ljud = np.nonzero(env / m >= tystnad)[0]
    return float((ljud[-1] + 1 - ljud[0]) * steg) if len(ljud) else 0.0


def spara_mp3(d, sr, ut, kbps):
    pcm = (np.clip(d, -1, 1) * 32767).astype("<i2")
    with tempfile.TemporaryDirectory() as mapp:
        wavfil = os.path.join(mapp, "ljud.wav")
        with wave.open(wavfil, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sr)
            w.writeframes(pcm.tobytes())
        tmp = f"{ut}.tmp"
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", wavfil, "-ac", "1", "-b:a", f"{kbps}k", "-f", "mp3", tmp],
            check=True,
        )
        os.replace(tmp, ut)


# ---------- uppläsningen ----------

class Fangare(logging.Handler):
    def __init__(self):
        super().__init__(logging.WARNING)
        self.rader = []

    def emit(self, post):
        self.rader.append(post.getMessage())


def avbruten(rad):
    """Säger raden att Chatterbox avbröt talet på ett sätt som gör uppläsningen oduglig?

    token_repetition räknas inte: den slår till i de flesta uppläsningar redan när samma
    ljudtoken kommer två gånger, och klippen där den slog till har lyssnats på och var hela
    (README, Hasse Backe, Ljudet). Längdkontrollen i las() står kvar. long_tail,
    alignment_repetition och en rad som inte går att tyda räknas som förut.
    """
    if "forcing EOS" not in rad:
        return False
    if re.search(r"(long_tail|alignment_repetition)=(tensor\()?True", rad):
        return True
    return not re.search(r"token_repetition=(tensor\()?True", rad)


def las(modell, frö, jobb, s, fangare):
    text = jobb["text"]
    vantat = max(s["minstaSek"], len(text) / s["tecknenPerSekund"])
    bast = None
    for forsok in range(1, s["forsok"] + 1):
        frö(random.SystemRandom().randrange(2**31))
        fangare.rader.clear()
        utskrift = io.StringIO()
        # Chatterbox skriver ibland själv; det får inte blandas med resultatet.
        with contextlib.redirect_stdout(utskrift), contextlib.redirect_stderr(utskrift):
            wav = modell.generate(
                text,
                language_id=s["sprak"],
                audio_prompt_path=s["referens"],
                exaggeration=s["exaggeration"],
                cfg_weight=s["cfgWeight"],
                temperature=s["temperature"],
            )
        sys.stderr.write(utskrift.getvalue())
        d = till_numpy(wav)
        sek = talets_langd(d, modell.sr)
        eos = any(avbruten(r) for r in [*fangare.rader, *utskrift.getvalue().splitlines()])
        kvot = sek / vantat
        ok = not eos and s["kortast"] <= kvot <= s["langst"] and sek >= s["minstaSek"]
        print(f"  försök {forsok}: {sek:.1f} s mot väntat {vantat:.1f} s{' (forcing EOS)' if eos else ''}{'' if ok else ' – om'}", file=sys.stderr, flush=True)
        if ok:
            spara_mp3(d, modell.sr, jobb["ut"], s["kbps"])
            return {"ok": True, "sek": round(sek, 2), "vantat": round(vantat, 2), "forsok": forsok}
        bast = f"{sek:.1f} s mot väntat {vantat:.1f} s{', forcing EOS' if eos else ''}"
    return {"ok": False, "vantat": round(vantat, 2), "forsok": s["forsok"], "fel": f"klarade inte längden ({bast})"}


def main():
    argv = sys.argv[1:]
    with open(argv[0], encoding="utf-8") as f:
        uppdrag = json.load(f)
    s = uppdrag["installningar"]
    fangare = Fangare()
    logging.getLogger().addHandler(fangare)

    t0 = time.time()
    if "--latsas" in argv:
        modell, frö = Latsas(), lambda n: random.seed(n)
    else:
        modell, frö = ladda_modell()
    print(f"modellen laddad på {time.time() - t0:.0f} s", file=sys.stderr, flush=True)

    with open(uppdrag["resultat"], "a", encoding="utf-8") as res:
        for jobb in uppdrag["jobb"]:
            t1 = time.time()
            print(f"{jobb['avtryck']}: {jobb['text']}", file=sys.stderr, flush=True)
            try:
                r = las(modell, frö, jobb, s, fangare)
            except Exception as err:  # en mening som inte går får inte stoppa resten
                r = {"ok": False, "fel": f"{type(err).__name__}: {err}"}
            r["avtryck"] = jobb["avtryck"]
            r["rakna"] = round(time.time() - t1, 1)
            res.write(json.dumps(r, ensure_ascii=False) + "\n")
            res.flush()


if __name__ == "__main__":
    main()
