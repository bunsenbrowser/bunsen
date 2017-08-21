# Township Auth Client Module

[![Travis](https://travis-ci.org/township/township-client.svg)](https://travis-ci.org/township/township-client) [![npm](https://img.shields.io/npm/v/township-client.svg)](https://npmjs.org/package/township-client)

Client library to login, register, and change passwords for users using [township](https://github.com/township/township) auth server(s).

#### Features

* Manage user credentials for many Township servers.
* Login, Register, and Change Password auth requests.
* Login information is persisted to a configuration file.

## Usage

```js
var TownshipClient = require('township-client')
var client = TownshipClient({
  server: 'https://api.township.site' // Set default server on init
  config: {
    filename: '.townshiprc' 
    // config file stored in user homedir. 
    // uses localstorage if in browser
  }
})

client.register({
  email: 'joe@hand.email',
  password: 'Iheartcoffee'
}, function (err, res, body) {
  if (err) return console.error('Register error', err)
  console.log('Registered successfully with ', body.key, body.token)
})

client.login({
  email: 'joe@hand.email',
  password: 'Iheartcoffee'
}, function (err, res, body) {
  if (err) return console.error('Login error', err)
  console.log('Logged in successfully!')
})
```

## API

### `var township = Township(opts)`

Options include:

```js
opts = {
  server: 'https://api.township.com',// Township API server
  config: {
    filename: '.townshiprc', // configuration filename (stored in os homedir)
    filepath: '~/.townshiprc' // specify a full config file path 
  },
  routes: { // routes for ALL township servers used by client
    register: '/register',
    login: '/login',
    updatePassword: '/updatepassword'
  }
}
```

`opts.server` can be set once on initialization or during each request. The client can handle multiple servers. `opts.server` can be passed with each request if the request should go to a different server than the client was initialized with.

### Auth Requests

#### `township.register(opts, cb)`

Register a user and receive a token. `opts.email` and `opts.password` required.

#### `township.login(opts, cb)`

Login a registered user. `opts.email` and `opts.password` required

#### `township.logout(opts, cb)`

Logout from a server. Will logout of current server or `opts.server`, if provided.

#### `township.changePassword(opts, cb)`

Reset password for a registered user. `opts.email`, `opts.password`, and `opts.newPassword` required. User must have a valid login token saved before changing password.

#### `township.secureRequest(opts, cb)`

Make a secure request to the server. `opts` are passed to the [request function](https://github.com/maxogden/nets#get). The `opts` should include `opts.method` and `opts.url`.

`opts.url` will be prefixed by the auth server if not already.

### `township.getLogin([server])`

Get login information for a `server`. If no server is specified, returns current login info (from the most recent login or register action).

## License
[MIT](LICENSE.md)
