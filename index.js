/*
const ADMONITION_TAGS = [
  'note',
  'summary', 'abstract', 'tldr',
  'info', 'todo',
  'tip', 'hint',
  'success', 'check', 'done',
  'question', 'help', 'faq',
  'warning', 'attention', 'caution',
  'failure', 'fail', 'missing',
  'danger', 'error', 'bug',
  'example', 'snippet',
  'quote', 'cite'
]
*/

const capitalize = ([first, ...rest], lowerRest = false) =>
  first.toUpperCase() + rest.join('')

function getTag (params) {
  const [tag = '', ..._title] = params.trim().split(' ')

  /* c8 ignore next 3 */
  if (!tag) {
    return {}
  }

  const joined = _title.join(' ')
  const title = !joined
    ? capitalize(tag)
    : joined === '""'
      ? ''
      : joined
  return { tag: tag.toLowerCase(), title }
}

function validate (params) {
  const [tag = ''] = params.trim().split(' ', 1)
  return !!tag
}

function renderDefault (tokens, idx, _options, env, slf) {
  return slf.renderToken(tokens, idx, _options, env, slf)
}

const minMarkers = 3
const markerStr = '!'
const markerChar = markerStr.charCodeAt(0)
const markerLen = markerStr.length

function admonition (state, startLine, endLine, silent) {
  let pos
  let nextLine
  let token
  const start = state.bMarks[startLine] + state.tShift[startLine]
  let max = state.eMarks[startLine]

  // Check out the first character quickly,
  // this should filter out most of non-containers
  if (markerChar !== state.src.charCodeAt(start)) { return false }

  // Check out the rest of the marker string
  for (pos = start + 1; pos <= max; pos++) {
    if (markerStr[(pos - start) % markerLen] !== state.src[pos]) {
      break
    }
  }

  const markerCount = Math.floor((pos - start) / markerLen)
  if (markerCount < minMarkers) { return false }
  const markerPos = pos - ((pos - start) % markerLen)
  const params = state.src.slice(markerPos, max)
  const markup = state.src.slice(start, markerPos)

  if (!validate(params)) { return false }

  // Since start is found, we can report success here in validation mode
  if (silent) { return true }

  const oldParent = state.parentType
  const oldLineMax = state.lineMax
  const oldIndent = state.blkIndent

  let blkStart = pos
  for (; blkStart < max; blkStart += 1) {
    if (state.src[blkStart] !== ' ') { break }
  }
  state.parentType = 'admonition'
  state.blkIndent += blkStart - start

  let wasEmpty = false

  // Search for the end of the block
  nextLine = startLine
  for (; ;) {
    nextLine++
    if (nextLine >= endLine) {
      // unclosed block should be autoclosed by end of document.
      // also block seems to be autoclosed by end of parent
      break
    }
    pos = state.bMarks[nextLine] + state.tShift[nextLine]
    max = state.eMarks[nextLine]
    const isEmpty = state.sCount[nextLine] < state.blkIndent

    // two consecutive empty lines autoclose the block
    if (isEmpty && wasEmpty) {
      break
    }
    wasEmpty = isEmpty

    if (pos < max && state.sCount[nextLine] < state.blkIndent) {
      // non-empty line with negative indent should stop the block:
      // - !!!
      //  test
      break
    }
  }

  // this will prevent lazy continuations from ever going past our end marker
  state.lineMax = nextLine

  const { tag, title } = getTag(params)

  token = state.push('admonition_open', 'div', 1)
  token.markup = markup
  token.block = true
  token.attrs = [['class', `admonition ${tag}`]]
  token.meta = tag
  token.content = title
  token.info = params
  token.map = [startLine, nextLine]

  if (title) {
    const titleMarkup = markup + ' ' + tag
    token = state.push('admonition_title_open', 'p', 1)
    token.markup = titleMarkup
    token.attrs = [['class', 'admonition-title']]
    token.map = [startLine, startLine + 1]

    token = state.push('inline', '', 0)
    token.content = title
    token.map = [startLine, startLine + 1]
    token.children = []

    token = state.push('admonition_title_close', 'p', -1)
    token.markup = titleMarkup
  }

  state.md.block.tokenize(state, startLine + 1, nextLine)

  token = state.push('admonition_close', 'div', -1)
  token.markup = state.src.slice(start, pos)
  token.block = true

  state.parentType = oldParent
  state.lineMax = oldLineMax
  state.blkIndent = oldIndent
  state.line = nextLine

  return true
}

module.exports = function admonitionPlugin (md, options = {}) {
  const render = options.render || renderDefault

  md.renderer.rules.admonition_open = render
  md.renderer.rules.admonition_close = render
  md.renderer.rules.admonition_title_open = render
  md.renderer.rules.admonition_title_close = render

  md.block.ruler.before('fence', 'admonition', admonition, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  })
}
