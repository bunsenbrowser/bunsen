const express = require('express');
const fs = require('fs-extra')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const path = require('path')

// Set up app.
var app = express();

// Intercept all routes.
app.all('*', function (req, res) {
  const subdomain = req.headers.host.split('.')[0]
  return express.static(path.join(__dirname, 'archives', subdomain)).apply(this, arguments);
});

app.get('/add/:uuid', async function (req, res) {
  try {
    await exec(`cd archives && dat clone ${req.params.uuid}`)
  } catch (e) {
    return res.send(e)
  }
  res.send('ok')
})

// Listen to on port 80.
app.listen(80, function () {
  console.log('Proxy is listening on port 80');
});
