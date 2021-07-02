const path = require('path')
const generate = require('markdown-it-testgen')

/* eslint-env mocha */

describe('default container', function () {
  const md = require('markdown-it')()
    .use(require('../'), 'name')

  generate(path.join(__dirname, 'fixtures/default.txt'), md)
})
