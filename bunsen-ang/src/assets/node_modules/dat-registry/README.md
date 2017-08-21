# dat-registry

API Registry Client for publishing dats. By default, the client is capable of registering, login, and publishing to datproject.org.

`dat-registry` allows users to interact with and publish dats to your registry via the `dat` command line. Supporting this module on your registry will allow a user to login and publish:

```
dat login custom-dat-registry.com
dat publish
```

## Installation

```
npm install dat-registry
```

### Quick Example

```js
var Registry = require('dat-registry')

var registry = Registry()

registry.login({email: 'karissa', password: 'my passw0rd r0cks!'}, function () {
  registry.dats.create({
    name: 'animal-names',
    url: 'dat://378d23adf22df',
    title: 'Animal Names',
    description: 'I did a study on animals for a very important Nature study, here are the spreadsheets with raw animals in them.'
  }, function (err, resp, json) {
    if (err) throw err
    if (resp.statusCode === 400) console.error(data.message)
    console.log('Published successfully!')
    // Created a nickname for a dat at `https://datproject.org/karissa/animal-names`
  })
})
```

### API

#### `var registry = Registry([opts])`

  * `opts.server`: the registry server. Default is `https://datproject.org`
  * `opts.apiPath`: registery server API path, e.g. we use `/api/v1` for datproject.org. This will overwrite default township routes to use server + apiPath.
  * `opts.config.filename`: defaults to `~.datrc` instead of township defaults.

Other options are passed to [township-client](https://github.com/township/township-client), these include:

```js
opts = {
  config: {
    filepath: '~/.townshiprc' // specify a full config file path 
  },
  routes: { // routes for ALL township servers used by client
    register: '/register',
    login: '/login',
    updatePassword: '/updatepassword'
  }
}
```

#### `registry.login(data, cb)`

Requires `data.email` and `data.password`.

#### `registry.register(data, cb)`

Requires `data.username`, `data.email`, and `data.password`.

#### `registry.logout(cb)`

Will callback with logout success or failure.

#### `var user = registry.whoami([opts])`

Returns user object with currently logged in user. See `township-client` for options.

### CRUD API

#### `registry.dats.create(data, cb)`

Must be logged in. Requires a unique `data.name` and unique `data.url`. Dat will be immediately available on the `/:username/:name`.

Accepts also any fields in a `dat.json` file.

#### `registry.dats.get([data], cb)`

Returns all dats that match the given (optional) querystrings.

#### `registry.dats.update(data, cb)`
#### `registry.dats.delete(data, cb)`
#### `registry.users.get([data], cb)`
#### `registry.users.update(data, cb)`
#### `registry.users.delete(data, cb)`
