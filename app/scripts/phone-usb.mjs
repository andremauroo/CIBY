import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
const adb =
  process.env.ADB_PATH ||
  [
    homedir() + "/Library/Android/sdk/platform-tools/adb",
    homedir() + "/Android/Sdk/platform-tools/adb",
  ].find(existsSync) ||
  "adb";
try {
  const lines = execFileSync(adb, ["devices"], { encoding: "utf8" }).split(
    "\n",
  );
  const devices = lines
    .filter((l) => /\tdevice$/.test(l.trim()) && !l.startsWith("emulator-"))
    .map((l) => l.split("\t")[0]);
  if (devices.length !== 1) {
    console.error(
      "Collega un solo telefono Android tramite USB, attiva Debug USB nelle Opzioni sviluppatore e autorizza questo computer sul telefono.\nDispositivi autorizzati trovati:",
      devices.length,
    );
    process.exit(1);
  }
  execFileSync(adb, ["-s", devices[0], "reverse", "tcp:5173", "tcp:5173"], {
    stdio: "inherit",
  });
  console.log(
    "Collegamento USB pronto. Lascia attivo npm run dev sul computer e apri http://localhost:5173 in Chrome sul telefono.",
  );
} catch (e) {
  console.error(
    "Impossibile attivare il collegamento USB. Verifica Android Platform Tools e il cavo dati.",
  );
  process.exit(1);
}
