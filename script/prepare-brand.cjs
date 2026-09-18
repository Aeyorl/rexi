// Embed the supplied artwork with a tight SVG viewport; original pixels stay intact.
const fs = require('node:fs');
const wrap = (input, output, viewBox) => {
  const data = fs.readFileSync(input).toString('base64');
  fs.writeFileSync(output, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><image width="6000" height="4050" href="data:image/png;base64,${data}"/></svg>`);
};
wrap('public/brand/bool-lockup-source.png', 'public/brand/bool-logo.svg', '1680 1650 2370 750');
wrap('public/brand/bool-symbol-source.png', 'public/brand/favicon.svg', '1900 975 2200 2200');
