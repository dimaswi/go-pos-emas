const fs = require('fs');
const path = require('path');

function findFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findFiles(filePath, files);
    } else if (file === 'create.tsx' || file === 'edit.tsx' || file === '[id].tsx' || file === 'show.tsx') {
      files.push(filePath);
    }
  }
  return files;
}

const files = findFiles('src/pages');

let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix show.tsx / view.tsx header layout
  // <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
  content = content.replace(/<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">/g, '<div className="flex items-center justify-between gap-4">');
  // <div className="flex gap-1.5 sm:gap-2"> -> <div className="flex items-center gap-2">
  content = content.replace(/<div className="flex gap-1\.5 sm:gap-2">/g, '<div className="flex items-center gap-2">');

  // Fix title section to truncate
  content = content.replace(/(<CardTitle className="[^"]*)(">\s*[\s\S]*?<\/CardTitle>)/g, (m, p1, p2) => {
    if (!p1.includes('truncate')) return p1 + ' truncate' + p2;
    return m;
  });
  content = content.replace(/(<CardDescription className="[^"]*)(">\s*[\s\S]*?<\/CardDescription>)/g, (m, p1, p2) => {
    if (!p1.includes('truncate')) return p1 + ' truncate' + p2;
    return m;
  });

  // Buttons replacement
  // Replace the text wrapping in Buttons that contain an Icon and text like "Kembali", "Edit", "Hapus", "Cetak"
  // Match buttons in the header
  const buttonRegex = /<Button\s+([^>]*)>([\s\S]*?)<\/Button>/g;
  content = content.replace(buttonRegex, (match, props, innerHTML) => {
    // Only target buttons that have text "Kembali", "Edit", "Hapus", "Cetak", "Batal"
    if (!innerHTML.match(/Kembali|Edit|Hapus|Cetak|Batal/)) return match;
    
    // Ignore submit buttons at the bottom of the form
    if (props.includes('type="submit"')) return match;

    // Convert Batal without icon to ArrowLeft icon
    if (!innerHTML.includes('<ArrowLeft') && !innerHTML.includes('<Edit') && !innerHTML.includes('<Trash2') && !innerHTML.includes('<Printer')) {
        // If it's a "Batal" button and no icon, we give it an ArrowLeft
        if (innerHTML.includes('Batal')) {
            innerHTML = `\n                <ArrowLeft className="h-4 w-4 sm:mr-2" />\n                <span className="hidden sm:inline">Batal</span>\n              `;
        }
    } else {
        // Wrap the text in hidden sm:inline
        innerHTML = innerHTML.replace(/\b(Kembali|Edit|Hapus|Cetak|Batal)\b/g, '<span className="hidden sm:inline">$1</span>');
        
        // Fix icon classes (remove sm:mr-2 and h-3 w-3 mr-1 etc, standardize)
        innerHTML = innerHTML.replace(/className="[^"]*"/g, (m2) => {
             if (m2.includes('h-3') || m2.includes('h-4')) {
                 return 'className="h-4 w-4 sm:mr-2"';
             }
             return m2;
        });
    }

    // Fix button props (className)
    let newProps = props;
    if (newProps.includes('className="')) {
        newProps = newProps.replace(/className="([^"]*)"/, (m2, p1) => {
            // Remove full-width or flex-1 classes, add icon-only classes
            let cls = p1.replace(/flex-1|sm:flex-none|w-full|sm:w-auto|w-8|sm:w-9|h-8|sm:h-9|mr-1\.5|mr-2|text-xs|sm:text-sm/g, '').trim();
            // deduplicate spaces
            cls = cls.replace(/\s+/g, ' ');
            cls = `h-9 shrink-0 rounded-lg p-0 w-9 sm:w-auto sm:px-3 ${cls}`.trim();
            return `className="${cls}"`;
        });
    } else {
        newProps += ` className="h-9 shrink-0 rounded-lg p-0 w-9 sm:w-auto sm:px-3"`;
    }

    return `<Button ${newProps}>${innerHTML}</Button>`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Done. Changed ${changedCount} files.`);
