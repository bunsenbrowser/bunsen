var  bodyParser = require('body-parser') // Middleware to read POST data
var cors = require('cors')
console.log('This is bunsen server running on Android')
var express = require('express'),
	app = express(),
	port = Number(process.env.PORT || 8080);
// use cors
	app.use(cors());
// Set up body-parser.
// To parse JSON:
	app.use(bodyParser.json());
// To parse form data:
	app.use(bodyParser.urlencoded({
		extended: true
	}));

// ROUTES
//
app.get('/', function(req,res) {
	res.send('First route works!');
});

app.listen(port, function() {
	console.log('Listening on port ' + port);
});

app.post('/dat', function(req, res) {
	datUri = req.body.uri;
  console.log('datUri: ' + datUri);
});
