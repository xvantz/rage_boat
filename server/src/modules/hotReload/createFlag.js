import fs from "fs";
import path from "path";

const buildDir = path.resolve("../client_packages");
const buildFlag = path.join(buildDir, "build-complete.flag");

if (!fs.existsSync(buildDir)) {
  console.error(`Ошибка: директория ${buildDir} не существует.`);
  process.exit(1);
}

fs.writeFileSync(buildFlag, "");
console.log(`Файл-флаг создан: ${buildFlag}`);
