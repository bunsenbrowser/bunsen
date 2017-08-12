module.exports = function (context) {
    const fs = require('fs');
    const _ = require('lodash');

    const scheme = 'dat';
    const insertIntent = `
    <intent-filter>
                <action android:name="android.intent.action.VIEW"></action>
                <category android:name="android.intent.category.DEFAULT"></category>
                <category android:name="android.intent.category.BROWSABLE"></category>
                <data android:scheme="${scheme}"></data>
    </intent-filter>
    `;
    const manifestPath = context.opts.projectRoot + '/platforms/android/AndroidManifest.xml';
    const androidManifest = fs.readFileSync(manifestPath).toString();
    if (!androidManifest.includes(`android:scheme="${scheme}"`)) {
        const manifestLines = androidManifest.split(/\r?\n/);
        const lineNo = _.findIndex(manifestLines, (line) => line.includes('@string/activity_name'));
        manifestLines.splice(lineNo + 1, 0, insertIntent);
        fs.writeFileSync(manifestPath, manifestLines.join('\n'));
    }
};