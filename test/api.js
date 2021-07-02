/* eslint-env mocha */

const assert = require('assert')
const mdit = require('markdown-it')
const sut = require('..')

const capitalize = ([first, ...rest], lowerRest = false) =>
  first.toUpperCase() + rest.join('')

describe('api', function () {
  describe('shall render admonition of type', function () {
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

    ADMONITION_TAGS.forEach(tag => {
      it(tag, function () {
        const html = mdit().use(sut).render(`!!! ${tag}\n    content`)
        const exp = [
        `<div class="admonition ${tag}">`,
        `<p class="admonition-title">${capitalize(tag)}</p>`,
        '<p>content</p>',
        '</div>',
        ''
        ].join('\n')
        assert.strictEqual(html, exp)
      })
    })
  })
})
