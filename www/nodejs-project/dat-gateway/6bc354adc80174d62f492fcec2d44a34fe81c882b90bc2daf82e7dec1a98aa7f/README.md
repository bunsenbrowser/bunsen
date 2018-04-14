# bunsen-ui

## Getting Started.

To serve up a local copy or develop:
```
npm install -g bower
npm install -g serve
git clone https://github.com/bunsenbrowser/bunsen-ui
cd bunsen-ui
bower install
serve
```

To use a local gateway as opposed to the public gateway fallback, run your own dat-gateway:
```
git clone https://github.com/rjsteinert/dat-gateway
cd dat-gateway
git checkout enable-cors-and-200-response-at-root
npm install
node bin.js
```


## Develop
See `src/bunsen-app/bunsen-app.html` for the whole thing! It's a Web Component.
