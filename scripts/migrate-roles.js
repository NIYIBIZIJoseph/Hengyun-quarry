const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      callback(fullPath);
    }
  });
}

const replacements = [
  ["'superadmin'", 'ROLES.SUPERADMIN'],
  ["'admin'", 'ROLES.ADMIN'],
  ["'manager'", 'ROLES.MANAGER'],
];

walk('./src', (file) => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  replacements.forEach(([oldVal, newVal]) => {
    if (content.includes(oldVal)) {
      content = content.replaceAll(oldVal, newVal);
      changed = true;
    }
  });

  if (changed) {
    console.log('Updated:', file);
    fs.writeFileSync(file, content);
  }
});