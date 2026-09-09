import { execSync } from "child_process";

const edge = '"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"';
const outDir = 'C:\\Users\\Kriri\\.gemini\\antigravity\\brain\\081f0b5a-84ef-4f05-8612-fa357640a212';

console.log("Capturing desktop home...");
execSync(`${edge} --headless --disable-gpu --window-size=1280,1000 --screenshot="${outDir}\\home_desktop.png" https://promofact.ru`);

console.log("Capturing mobile home...");
execSync(`${edge} --headless --disable-gpu --window-size=390,844 --screenshot="${outDir}\\home_mobile.png" https://promofact.ru`);

console.log("Capturing store desktop...");
execSync(`${edge} --headless --disable-gpu --window-size=1280,1100 --screenshot="${outDir}\\store_pyaterochka.png" https://promofact.ru/store/pyaterochka`);

console.log("Capturing store mobile...");
console.log("Capturing store samokat...");
execSync(`${edge} --headless --disable-gpu --window-size=1280,1100 --screenshot="${outDir}\\store_samokat.png" https://promofact.ru/store/samokat`);

console.log("All screenshots captured!");
