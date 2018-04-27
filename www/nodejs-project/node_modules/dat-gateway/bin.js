#!/usr/bin/env node

'use strict'

const DatGateway = require('.')
const os = require('os')
const mkdirp = require('mkdirp')
const pkg = require('./package.json')

require('yargs')
  .version(pkg.version)
  .command({
    command: '$0',
    aliases: ['start'],
    builder: function (yargs) {
      yargs.options({
        port: {
          alias: 'p',
          description: 'Port for the gateway to listen on.',
          default: 3000
        },
        dir: {
          alias: 'd',
          description: 'Directory to use as a cache.',
          coerce: function (value) {
            return value.replace('~', os.homedir())
          },
          default: '~/.dat-gateway',
          normalize: true
        },
        max: {
          alias: 'm',
          description: 'Maximum number of archives allowed in the cache.',
          default: 20
        },
        period: {
          description: 'Number of milliseconds between cleaning the cache of expired archives.',
          default: 60 * 1000 // every minute
        },
        ttl: {
          alias: 't',
          description: 'Number of milliseconds before archives expire.',
          default: 10 * 60 * 1000 // ten minutes
        },
        redirect: {
          alias: 'r',
          description: 'Whether to use subdomain redirects',
          default: false
        }
      })
    },
    handler: function (argv) {
      const { dir, max, period, port, ttl, redirect } = argv
      mkdirp.sync(dir) // make sure it exists
      const gateway = new DatGateway({ dir, max, period, ttl, redirect })
      gateway
        .load()
        .then(() => {
          return gateway.listen(port)
        })
        .then(function () {
          console.log('[dat-gateway] Now listening on port ' + port)
        })
        .catch(console.error)
    }
  })
  .alias('h', 'help')
  .config()
  .parse()
