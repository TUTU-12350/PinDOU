/*
 * 构建：把 perler-src/ 拼装成单文件 perler-bead-studio.html（离线交付版）
 * 用法：node perler-src/build.js
 * CSS/JS 文件清单从 index.html 的 <!-- CSS -->/<!-- JS --> 标记区读取，
 * 拼接顺序即加载顺序，改文件清单只需改 index.html。
 */
const fs = require('fs');
const path = require('path');
const SRC = __dirname;
const OUT = path.join(SRC, '..', 'perler-bead-studio.html');

const s = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
const head = s.split('<!-- CSS -->\n')[0];
const afterCss = s.split('<!-- /CSS -->\n')[1];
const mid = afterCss.split('<!-- JS -->\n')[0];
const tail = afterCss.split('<!-- /JS -->\n')[1];
const cssBlock = s.split('<!-- CSS -->\n')[1].split('<!-- /CSS -->')[0];
const jsBlock = afterCss.split('<!-- JS -->\n')[1].split('<!-- /JS -->')[0];
const cssFiles = [...cssBlock.matchAll(/href="css\/([^"]+)"/g)].map(m => 'css/' + m[1]);
const jsFiles = [...jsBlock.matchAll(/src="js\/([^"]+)"/g)].map(m => 'js/' + m[1]);
const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');

const out = head
  + '<style>\n' + cssFiles.map(read).join('') + '</style>\n'
  + mid
  + '<script>\n' + jsFiles.map(read).join('') + '</script>\n'
  + tail;

fs.writeFileSync(OUT, out);
console.log('构建完成 → ' + OUT);
console.log('  ' + out.length + ' 字节   CSS ' + cssFiles.length + ' 个 + JS ' + jsFiles.length + ' 个');
if (!out.includes('</html>')) { console.error('  [异常] 输出缺少 </html>，检查标记区！'); process.exit(1); }
