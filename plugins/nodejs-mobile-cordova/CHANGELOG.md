# Node.js for Mobile Apps Cordova plugin ChangeLog

<table>
<tr>
<th>Current</th>
</tr>
<tr>
<td>
<a href="#0.2.2">0.2.2</a><br/>
<a href="#0.2.1">0.2.1</a><br/>
<a href="#0.2.0">0.2.0</a><br/>
<a href="#0.1.5">0.1.5</a><br/>
<a href="#0.1.4">0.1.4</a><br/>
<a href="#0.1.3">0.1.3</a><br/>
<a href="#0.1.2">0.1.2</a><br/>
<a href="#0.1.1">0.1.1</a><br/>
</td>
</tr>
</table>

<a id="0.2.2"></a>
## Version 0.2.2 - Nov 07 2018

### Notable Changes
 - Update `nodejs-mobile` binaries to `v0.1.8`, fixing exceptions on Apple A12 CPUs for iOS and being built with NDK r18b for Android.

### Commits
 - [[`14ee5ea`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/14ee5ea88fc1be10c93e504f1274b2c07d1e77db)] - core: update nodejs-mobile v0.1.8 (Jaime Bernardo)
 - [[`4c2394a`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/4c2394a1b113cf3364f859488ec5022178c8e6c0)] - docs: document os.tmpdir behavior in node (Jaime Bernardo)

<a id="0.2.1"></a>
## Version 0.2.1 - Jul 30 2018

### Notable Changes
 - Update `nodejs-mobile` binaries to `v0.1.7`, built with NDK r17b, to solve Android 7 C++ STL runtime issues.

### Commits
 - [[`86b4f24`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/86b4f245fcda8d6d7e38d1358d224805c010f409)] - core: update nodejs-mobile v0.1.7 (Jaime Bernardo)
 - [[`2b14218`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/2b14218fbf616249a9d3a9749fa2c2c36a28b7c0)] - ios: create Frameworks path before copying (jonathanz)

<a id="0.2.0"></a>
## Version 0.2.0 - Jul 09 2018

### Notable Changes
 - Update `nodejs-mobile` binaries to `v0.1.6`, with concurrent GC for iOS.
 - Improve native modules support.
 - Automatically detect native modules.
 - Remove simulator strip when building for iOS devices.

### Commits
 - [[`a1ab3b8`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/a1ab3b85aeeea49cd08b475f1c692d8d540a8c7e)] - core: update nodejs-mobile v0.1.6 (Jaime Bernardo)
 - [[`df7df19`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/df7df19b5d5a86b554f4e878f8770d5b41439e17)] - plugin: use original .bin for native modules (Jaime Bernardo)
 - [[`53a1aeb`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/53a1aebaf9f8e810e348bba31ed6ae96ee5acdd3)] - docs: describe native modules auto detection (Jaime Bernardo)
 - [[`7dcbe77`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/7dcbe77543fa997b40fda8cac8086c937a6096fb)] - plugin: add automatic native modules detection (Jaime Bernardo)
 - [[`fea9773`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/fea9773e8e907e9e0ca31b0d88d5a1be4d699ddd)] - docs: add native modules instructions to README (Jaime Bernardo)
 - [[`29240cd`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/29240cda7913e1e6fa00267b3dd9ab2bae11beb6)] - ios: cache native modules override preference (Jaime Bernardo)
 - [[`3d430ec`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/3d430eca8162e4f85cbaae446bb9f0a031de25a9)] - ios: building for device removes the x86_64 arch (Jaime Bernardo)
 - [[`8b7e854`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/8b7e854386e4ce5d6d64fcee27013d7ed7417bcc)] - android: check if native modules assets exist (Jaime Bernardo)
 - [[`6cd38b0`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/6cd38b0abc86f0acdbc3e899b36937abf906b119)] - ios: build native modules as frameworks (Jaime Bernardo)

<a id="0.1.5"></a>
## Version 0.1.5 - Jun 07 2018

### Notable Changes
 - Update `nodejs-mobile` binaries to `v0.1.5`.
 - Add new channel APIs.
 - Include memory optimizations.
 - Add `cordova-plugin-test-framework` tests for the plugin.
 - Add a test application to easily run the tests.

### Commits
 - [[`bdd9506`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/bdd95064bc5d40cb200f370f80387b6ab59dd53b)] - plugin: update sample project for new pause API (Jaime Bernardo)
 - [[`3cf9b28`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/3cf9b28ce742f0dd701a473cafb189ca0cc79dd8)] - plugin: use alternative nodejs-mobile-gyp path (Jaime Bernardo)
 - [[`e14bcc7`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/e14bcc728afc23d10c71d09122b8fc9fd85957ee)] - core: update nodejs-mobile v0.1.5 (Jaime Bernardo)
 - [[`767d0c3`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/767d0c32d71b67628a8dbc5668fd51e7f9a8a2f9)] - test: add a test application to run the tests (Jaime Bernardo)
 - [[`adfa52a`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/adfa52a3ed2a7065334cfe48a02589712d89c552)] - test: add cordova-plugin-test-framework tests (Jaime Bernardo)
 - [[`8fb32db`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/8fb32dbc9feafe66465978f971a8c1a1cdc11eba)] - android: allow starting engine after failed start (Jaime Bernardo)
 - [[`05eb3cf`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/05eb3cf75689dd223409691f281cd9f6ce8af102)] - android: release node-cordova JNI local references (Jaime Bernardo)
 - [[`6a5b842`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/6a5b842ffbc07fd2ac7e4b795cdfb26cb9549e68)] - ios: release memory from node-cordova messages (Jaime Bernardo)
 - [[`00b88ea`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/00b88ea78950be4f3ea750e3343804ec1a38baf3)] - ios: block starting engine more than once (Jaime Bernardo)
 - [[`d71a51a`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/d71a51aae7ae5a01c4970147d67537320106145f)] - docs: add license (Alexis Campailla)
 - [[`0eab389`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/0eab389a5d5ef2c9cacc246449a02e3cb8a6ed1a)] - ios: wait for pause event handler on background (Jaime Bernardo)
 - [[`775839e`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/775839ec94a23d989415ad6d2122b99fa4004cca)] - plugin: send many arguments through the channel (Jaime Bernardo)
 - [[`dfa18b4`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/dfa18b4743f5154543939e7498a553a8429a925d)] - plugin: fix falsy-valued messages sent to node (Jaime Bernardo)
 - [[`9da75bf`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/9da75bfee287776a9fdd0e2e5c6264a4c4a414b2)] - doc: document the app channel (Jaime Bernardo)
 - [[`2fec512`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/2fec512525d0145211a7e0be5edd59a2424306f5)] - plugin: add app.datadir API to get writable path (Jaime Bernardo)
 - [[`aac179b`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/aac179b6ca29fde8cfb633d2c42fd495571c85d0)] - docs: update channel API in README.md (Enrico Giordani)
 - [[`df75bb4`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/df75bb4fcd2aed7a5a0f8e57fe13d7e01ef12750)] - plugin: improved events channel, app channel (Enrico Giordani)

<a id="0.1.4"></a>
## Version 0.1.4 - Mar 07 2018

### Notable Changes
 - Hotfixes release.

### Commits
 - [[`c723064`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/c7230644e2ba7f0a2bce139ee5ecf5f9b98c7c15)] - android: build node assets lists after prepare (Jaime Bernardo)
 - [[`22e5f9f`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/22e5f9ff95d3b185f8ff747a490d0f0e2ad95838)] - android: remove version settings from gradle file (Jaime Bernardo)

<a id="0.1.3"></a>
## Version 0.1.3 - Mar 05 2018

### Notable Changes
 - Update `nodejs-mobile` binaries to `v0.1.4`.
 - Include experimental native modules build code.
 - Show stdout and stderr in Android logcat.
 - Include the nodejs-project in the runtime NODE_PATH when starting with script code.
 - Add async initialization on Android.
 - Increase the iOS node thread stack size to 1MB.

### Commits
 - [[`f53534f`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/f53534fd56ff3f0d52c058428a7e910a626ffd8b)] - plugin: remove native modules detection (Jaime Bernardo)
 - [[`c4cd7ec`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/c4cd7ec65cf68d3224ae9ddcb3246e988b1cbbc2)] - docs: rephrasing of some README.md sections (Jaime Bernardo)
 - [[`dd22c90`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/dd22c901e718f8529ed32fcd4de0eecdda3c0d6d)] - bridge: emit message event inside a setImmediate (Jaime Bernardo)
 - [[`7ac8dd9`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/7ac8dd9b01446d1bbfb2b76da8ecd3b7c502918a)] - ios: increase node's thread stack size to 1MB (Jaime Bernardo)
 - [[`a4f2984`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/a4f29846abbdf065093d73ca0deee6824d003edd)] - docs: Add native modules instructions (Jaime Bernardo)
 - [[`a603da6`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/a603da61900a1127b3c8729e4ae0bd71b760b40b)] - android: cache native modules override preference (Jaime Bernardo)
 - [[`7fec514`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/7fec514c2eaadd292f71fb4a74b4885051b42523)] - android: use helper script to call npm on macOS (Jaime Bernardo)
 - [[`ff19463`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/ff19463e25690c8385544fd74b938f99260f17b4)] - android: use gradle tasks inputs and output (Jaime Bernardo)
 - [[`534114b`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/534114b5d07f85ed87887758e8cdd9a372e767a8)] - android: async initialization (Enrico Giordani)
 - [[`75c9ec0`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/75c9ec0915b433daee061325467efb4718dd56df)] - docs: update README.md (Enrico Giordani)
 - [[`43be1e8`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/43be1e8a37330b9109aee47897830e14644dc0b4)] - plugin: set NODE_PATH for 'nodejs.startWithScript' (Enrico Giordani)
 - [[`c159d1b`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/c159d1bd1d7bb07d68f32aca4c2057b2b488617a)] - android: replace AndroidManifest.xml (Enrico Giordani)
 - [[`adbe081`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/adbe081852b5a08aeb5b93044e8c9720313448f9)] - android: redirect stdout/stderr to logcat (Enrico Giordani)
 - [[`4e4d2ae`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/4e4d2aee48765b9d8855ac5b8340ac119f807d7b)] - plugin: improve helper script shell compatibility (Jaime Bernardo)
 - [[`cafd06a`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/cafd06a02b44d73fccc2b35b6f3b109df78b6d82)] - plugin: Build native modules automatically (Jaime Bernardo)
 - [[`488974d`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/488974daef72f5fa4e5221c7b6fa09a18a3e120e)] - plugin: use nodejs-mobile-gyp for native modules (Jaime Bernardo)
 - [[`3041ede`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/3041ede08ff8884c76e315f74a38f506070a159c)] - android: add 'include/' to native code includes (Jaime Bernardo)
 - [[`d134d6a`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/d134d6a8b70ece2ef3667fe6932da4d5a8651b2c)] - plugin: patch node-pre-gyp module path variables (Jaime Bernardo)
 - [[`ce674b6`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/ce674b63beaceb5a09d6b4d6c7a495519aeba7aa)] - ios: native modules support (Jaime Bernardo)
 - [[`88ef4d3`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/88ef4d3989dcfbf86a4582681b12873299e11db9)] - android: native modules support (Jaime Bernardo)
 - [[`0855d43`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/0855d434872eda07575d75d7c521b1a938632d3e)] - plugin: move native files inside package (Jaime Bernardo)
 - [[`e3635f3`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/e3635f3c8ae78e71a43e56caff159466995f62a2)] - core: update nodejs-mobile v0.1.4 (Jaime Bernardo)

<a id="0.1.2"></a>
## Version 0.1.2 - Jan 02 2018

### Notable Changes
 - Update nodejs-mobile binaries to v0.1.3.
 - Improve Android assets copy.

### Commits
 - [[`0773a17`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/0773a17bafe4c69862315a6561d89685d53b73e5)] - Android: optimized assets copy (Enrico Giordani)
 - [[`f75f65d`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/f75f65d1ff859ac62881c232bb17a676db048bdd)] - Define strict mode in the nodejs api js (#2) (stoically)
 - [[`fabe4da`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/fabe4da319e1ba85acfbc2bee3b781c7eedce685)] - Update calls to reflect changed API (Enrico Giordani)
 - [[`3091985`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/3091985832cd82ef4d00a9e97df1ffa78ff8aa39)] - libs: update nodejs-mobile to v0.1.3 (Enrico Giordani)
 - [[`933b43e`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/933b43e66e5f7c1d2ca8c8dd3fa1f27815d1f3be)] - Update package fields and plugin engines requirements. (Enrico Giordani)
 - [[`26a52e2`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/26a52e291141d9eb51633917bf180f945561609f)] - Update README.md (Enrico Giordani)

<a id="0.1.1"></a>
## Version 0.1.1 - Oct 02 2017

### Commits
 - [[`3fa38e8`](https://github.com/janeasystems/nodejs-mobile-cordova/commit/3fa38e89dd96d32e0e6107bbe8ae96ef03a3528e)] - Initial commit (Enrico Giordani)
