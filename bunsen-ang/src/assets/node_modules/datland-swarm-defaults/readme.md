# DatLand Swarm Defaults

DatLand Swarm Defaults gives you the Dat defaults for [Discovery-Swarm](https://www.npmjs.com/package/discovery-swarm). This will set your *dns* and *dht* servers making it easy to discover other peers. 


## Usage 

Create a config object and pass it to discovery swarm. 

Any options you specify will overwrite the defaults. See discovery swarm for options.

```javascript
var Swarm = require('discovery-swarm')
var swarmDefaults = require('datland-swarm-defaults')

// Create a Hyperdrive here

var config = swarmDefaults({
  stream: function () {
    return drive.createPeerStream()
  }
})
var swarm = Swarm(config)
```

[See a full Dat example](https://gist.github.com/joehand/1e644adc3cc43ae05855)