import fs from 'fs';
import path from 'path';

const src = 'dist';
const dest = path.join('deps', 'gtaurus_server', 'public');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (!fs.existsSync(src)) {
    console.error(`Source directory ${src} does not exist. Run build:web first.`);
    process.exit(1);
}

console.log(`🚀 Automated Sync: Copying '${src}' to '${dest}'...`);
if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
}
copyRecursiveSync(src, dest);
console.log('✅ Sync Complete! The bridge server can now host the dashboard on port 8080.');
