const fs = require('fs');
const execSync = require('child_process').execSync;

module.exports = function(context) {
    const basePath = './bunsen-ang';
    var path = process.cwd();
    console.log('Building Angular 2 application into "./www" directory. basePath: '+ basePath + ' path: ' + path ) ;
    const baseWWW = basePath;

    console.log(execSync(
      "./node_modules/@angular/cli/bin/ng build -v --target=production --environment=prod --output-path ../www/app/ --base-href .",
      {
        maxBuffer: 1024*1024,
        cwd: basePath + '/'
      }).toString('utf8')
    );
    var files = fs.readdirSync(baseWWW);
    for (var i = 0; i < files.length; i++) {
      if (files[i].endsWith('.gz')) {
        fs.unlinkSync(baseWWW + '/' + files[i]);
      }
    }
};
