const mkdirp = require('mkdirp')
var DatGateway = require('dat-gateway')

console.log("cwd: " + process.cwd())
console.log("__dirname: " + __dirname)

const dir = '.dat-gateway';
const max = 20;
const period = 60 * 1000 // every minute
const port = 3000
const ttl = 43200 * 60 * 1000 // 30 days

mkdirp.sync(dir) // make sure it exists
const gateway = new DatGateway({ dir, max, period, ttl })
gateway
    .load()
    .then(() => {
        return gateway.listen(port)
    })
    .then(function () {
        console.log('[dat-gateway] Now listening on port ' + port)
    })
    .catch(console.error)

