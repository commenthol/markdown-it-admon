const fs = require('fs')
const path = require('path')
const mdit = require('markdown-it')({ html: true }).use(require('../'))

const style = fs.readFileSync(path.resolve(__dirname, '../styles/admonition.css'), 'utf8')

const page = (style, html) => `<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body { font-family: sans-serif; }
blockquote {
  color: grey;
  border-left: 5px solid rgba(0,0,0,0.25);
  border-radius: 3px;
  margin: 0 auto;
  padding-left: 1em;
  font-style: italic;
}
pre {
  padding: 0.5em;
  background-color: rgba(0,0,0,0.1);
}
${style}
</style>
</head>
<body>
${html}
</body>
</html>
`

function render (filename) {
  const md = fs.readFileSync(path.resolve(process.cwd(), filename), 'utf8')
  const html = mdit.render(md)
  return page(style, html)
}

if (module === require.main) {
  const filename = process.argv[2] || path.resolve(__dirname, 'index.md')
  const content = render(filename)
  console.log(content)
}
