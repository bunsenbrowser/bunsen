/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/ /**
   @license
   Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */'use strict';const nativeShadow=!(window['ShadyDOM']&&window['ShadyDOM']['inUse']);let nativeCssVariables_;/**
                          * @param {(ShadyCSSOptions | ShadyCSSInterface)=} settings
                          */function calcCssVariables(settings){if(settings&&settings['shimcssproperties']){nativeCssVariables_=false;}else{// chrome 49 has semi-working css vars, check if box-shadow works
// safari 9.1 has a recalc bug: https://bugs.webkit.org/show_bug.cgi?id=155782
// However, shim css custom properties are only supported with ShadyDOM enabled,
// so fall back on native if we do not detect ShadyDOM
// Edge 15: custom properties used in ::before and ::after will also be used in the parent element
// https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12414257/
nativeCssVariables_=nativeShadow||Boolean(!navigator.userAgent.match(/AppleWebKit\/601|Edge\/15/)&&window.CSS&&CSS.supports&&CSS.supports('box-shadow','0 0 0 var(--foo)'));}}if(window.ShadyCSS&&window.ShadyCSS.nativeCss!==undefined){nativeCssVariables_=window.ShadyCSS.nativeCss;}else if(window.ShadyCSS){calcCssVariables(window.ShadyCSS);// reset window variable to let ShadyCSS API take its place
window.ShadyCSS=undefined;}else{calcCssVariables(window['WebComponents']&&window['WebComponents']['flags']);}// Hack for type error under new type inference which doesn't like that
// nativeCssVariables is updated in a function and assigns the type
// `function(): ?` instead of `boolean`.
const nativeCssVariables=/** @type {boolean} */nativeCssVariables_;var styleSettings={nativeShadow:nativeShadow,nativeCssVariables:nativeCssVariables};/**
   @license
   Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */ /*
      Extremely simple css parser. Intended to be not more than what we need
      and definitely not necessarily correct =).
      */'use strict';/** @unrestricted */class StyleNode{constructor(){/** @type {number} */this['start']=0;/** @type {number} */this['end']=0;/** @type {StyleNode} */this['previous']=null;/** @type {StyleNode} */this['parent']=null;/** @type {Array<StyleNode>} */this['rules']=null;/** @type {string} */this['parsedCssText']='';/** @type {string} */this['cssText']='';/** @type {boolean} */this['atRule']=false;/** @type {number} */this['type']=0;/** @type {string} */this['keyframesName']='';/** @type {string} */this['selector']='';/** @type {string} */this['parsedSelector']='';}}// given a string of css, return a simple rule tree
/**
 * @param {string} text
 * @return {StyleNode}
 */function parse(text){text=clean(text);return parseCss(lex(text),text);}// remove stuff we don't care about that may hinder parsing
/**
 * @param {string} cssText
 * @return {string}
 */function clean(cssText){return cssText.replace(RX.comments,'').replace(RX.port,'');}// super simple {...} lexer that returns a node tree
/**
 * @param {string} text
 * @return {StyleNode}
 */function lex(text){let root=new StyleNode();root['start']=0;root['end']=text.length;let n=root;for(let i=0,l=text.length;i<l;i++){if(text[i]===OPEN_BRACE){if(!n['rules']){n['rules']=[];}let p=n;let previous=p['rules'][p['rules'].length-1]||null;n=new StyleNode();n['start']=i+1;n['parent']=p;n['previous']=previous;p['rules'].push(n);}else if(text[i]===CLOSE_BRACE){n['end']=i+1;n=n['parent']||root;}}return root;}// add selectors/cssText to node tree
/**
 * @param {StyleNode} node
 * @param {string} text
 * @return {StyleNode}
 */function parseCss(node,text){let t=text.substring(node['start'],node['end']-1);node['parsedCssText']=node['cssText']=t.trim();if(node['parent']){let ss=node['previous']?node['previous']['end']:node['parent']['start'];t=text.substring(ss,node['start']-1);t=_expandUnicodeEscapes(t);t=t.replace(RX.multipleSpaces,' ');// TODO(sorvell): ad hoc; make selector include only after last ;
// helps with mixin syntax
t=t.substring(t.lastIndexOf(';')+1);let s=node['parsedSelector']=node['selector']=t.trim();node['atRule']=s.indexOf(AT_START)===0;// note, support a subset of rule types...
if(node['atRule']){if(s.indexOf(MEDIA_START)===0){node['type']=types.MEDIA_RULE;}else if(s.match(RX.keyframesRule)){node['type']=types.KEYFRAMES_RULE;node['keyframesName']=node['selector'].split(RX.multipleSpaces).pop();}}else{if(s.indexOf(VAR_START)===0){node['type']=types.MIXIN_RULE;}else{node['type']=types.STYLE_RULE;}}}let r$=node['rules'];if(r$){for(let i=0,l=r$.length,r;i<l&&(r=r$[i]);i++){parseCss(r,text);}}return node;}/**
   * conversion of sort unicode escapes with spaces like `\33 ` (and longer) into
   * expanded form that doesn't require trailing space `\000033`
   * @param {string} s
   * @return {string}
   */function _expandUnicodeEscapes(s){return s.replace(/\\([0-9a-f]{1,6})\s/gi,function(){let code=arguments[1],repeat=6-code.length;while(repeat--){code='0'+code;}return'\\'+code;});}/**
   * stringify parsed css.
   * @param {StyleNode} node
   * @param {boolean=} preserveProperties
   * @param {string=} text
   * @return {string}
   */function stringify(node,preserveProperties,text=''){// calc rule cssText
let cssText='';if(node['cssText']||node['rules']){let r$=node['rules'];if(r$&&!_hasMixinRules(r$)){for(let i=0,l=r$.length,r;i<l&&(r=r$[i]);i++){cssText=stringify(r,preserveProperties,cssText);}}else{cssText=preserveProperties?node['cssText']:removeCustomProps(node['cssText']);cssText=cssText.trim();if(cssText){cssText='  '+cssText+'\n';}}}// emit rule if there is cssText
if(cssText){if(node['selector']){text+=node['selector']+' '+OPEN_BRACE+'\n';}text+=cssText;if(node['selector']){text+=CLOSE_BRACE+'\n\n';}}return text;}/**
   * @param {Array<StyleNode>} rules
   * @return {boolean}
   */function _hasMixinRules(rules){let r=rules[0];return Boolean(r)&&Boolean(r['selector'])&&r['selector'].indexOf(VAR_START)===0;}/**
   * @param {string} cssText
   * @return {string}
   */function removeCustomProps(cssText){cssText=removeCustomPropAssignment(cssText);return removeCustomPropApply(cssText);}/**
   * @param {string} cssText
   * @return {string}
   */function removeCustomPropAssignment(cssText){return cssText.replace(RX.customProp,'').replace(RX.mixinProp,'');}/**
   * @param {string} cssText
   * @return {string}
   */function removeCustomPropApply(cssText){return cssText.replace(RX.mixinApply,'').replace(RX.varApply,'');}/** @enum {number} */const types={STYLE_RULE:1,KEYFRAMES_RULE:7,MEDIA_RULE:4,MIXIN_RULE:1000};const OPEN_BRACE='{';const CLOSE_BRACE='}';// helper regexp's
const RX={comments:/\/\*[^*]*\*+([^/*][^*]*\*+)*\//gim,port:/@import[^;]*;/gim,customProp:/(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?(?:[;\n]|$)/gim,mixinProp:/(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?{[^}]*?}(?:[;\n]|$)?/gim,mixinApply:/@apply\s*\(?[^);]*\)?\s*(?:[;\n]|$)?/gim,varApply:/[^;:]*?:[^;]*?var\([^;]*\)(?:[;\n]|$)?/gim,keyframesRule:/^@[^\s]*keyframes/,multipleSpaces:/\s+/g};const VAR_START='--';const MEDIA_START='@media';const AT_START='@';var cssParse={StyleNode:StyleNode,parse:parse,stringify:stringify,removeCustomPropAssignment:removeCustomPropAssignment,types:types};/**
   @license
   Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */const VAR_ASSIGN=/(?:^|[;\s{]\s*)(--[\w-]*?)\s*:\s*(?:((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};{])+)|\{([^}]*)\}(?:(?=[;\s}])|$))/gi;const MIXIN_MATCH=/(?:^|\W+)@apply\s*\(?([^);\n]*)\)?/gi;const VAR_CONSUMED=/(--[\w-]+)\s*([:,;)]|$)/gi;const ANIMATION_MATCH=/(animation\s*:)|(animation-name\s*:)/;const MEDIA_MATCH=/@media\s(.*)/;const IS_VAR=/^--/;const BRACKETED=/\{[^}]*\}/g;const HOST_PREFIX='(?:^|[^.#[:])';const HOST_SUFFIX='($|[.:[\\s>+~])';var commonRegex={VAR_ASSIGN:VAR_ASSIGN,MIXIN_MATCH:MIXIN_MATCH,VAR_CONSUMED:VAR_CONSUMED,ANIMATION_MATCH:ANIMATION_MATCH,MEDIA_MATCH:MEDIA_MATCH,IS_VAR:IS_VAR,BRACKETED:BRACKETED,HOST_PREFIX:HOST_PREFIX,HOST_SUFFIX:HOST_SUFFIX};/**
   @license
   Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */'use strict';/** @type {!Set<string>} */const styleTextSet=new Set();const scopingAttribute='shady-unscoped';/**
                                            * Add a specifically-marked style to the document directly, and only one copy of that style.
                                            *
                                            * @param {!HTMLStyleElement} style
                                            * @return {undefined}
                                            */function processUnscopedStyle(style){const text=style.textContent;if(!styleTextSet.has(text)){styleTextSet.add(text);const newStyle=style.cloneNode(true);document.head.appendChild(newStyle);}}/**
   * Check if a style is supposed to be unscoped
   * @param {!HTMLStyleElement} style
   * @return {boolean} true if the style has the unscoping attribute
   */function isUnscopedStyle(style){return style.hasAttribute(scopingAttribute);}var unscopedStyleHandler={scopingAttribute:scopingAttribute,processUnscopedStyle:processUnscopedStyle,isUnscopedStyle:isUnscopedStyle};/**
   @license
   Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */'use strict';/**
               * @param {string|StyleNode} rules
               * @param {function(StyleNode)=} callback
               * @return {string}
               */function toCssText(rules,callback){if(!rules){return'';}if(typeof rules==='string'){rules=parse(rules);}if(callback){forEachRule(rules,callback);}return stringify(rules,nativeCssVariables);}/**
   * @param {HTMLStyleElement} style
   * @return {StyleNode}
   */function rulesForStyle(style){if(!style['__cssRules']&&style.textContent){style['__cssRules']=parse(style.textContent);}return style['__cssRules']||null;}// Tests if a rule is a keyframes selector, which looks almost exactly
// like a normal selector but is not (it has nothing to do with scoping
// for example).
/**
 * @param {StyleNode} rule
 * @return {boolean}
 */function isKeyframesSelector(rule){return Boolean(rule['parent'])&&rule['parent']['type']===types.KEYFRAMES_RULE;}/**
   * @param {StyleNode} node
   * @param {Function=} styleRuleCallback
   * @param {Function=} keyframesRuleCallback
   * @param {boolean=} onlyActiveRules
   */function forEachRule(node,styleRuleCallback,keyframesRuleCallback,onlyActiveRules){if(!node){return;}let skipRules=false;let type=node['type'];if(onlyActiveRules){if(type===types.MEDIA_RULE){let matchMedia=node['selector'].match(MEDIA_MATCH);if(matchMedia){// if rule is a non matching @media rule, skip subrules
if(!window.matchMedia(matchMedia[1]).matches){skipRules=true;}}}}if(type===types.STYLE_RULE){styleRuleCallback(node);}else if(keyframesRuleCallback&&type===types.KEYFRAMES_RULE){keyframesRuleCallback(node);}else if(type===types.MIXIN_RULE){skipRules=true;}let r$=node['rules'];if(r$&&!skipRules){for(let i=0,l=r$.length,r;i<l&&(r=r$[i]);i++){forEachRule(r,styleRuleCallback,keyframesRuleCallback,onlyActiveRules);}}}// add a string of cssText to the document.
/**
 * @param {string} cssText
 * @param {string} moniker
 * @param {Node} target
 * @param {Node} contextNode
 * @return {HTMLStyleElement}
 */function applyCss(cssText,moniker,target,contextNode){let style=createScopeStyle(cssText,moniker);applyStyle(style,target,contextNode);return style;}/**
   * @param {string} cssText
   * @param {string} moniker
   * @return {HTMLStyleElement}
   */function createScopeStyle(cssText,moniker){let style=/** @type {HTMLStyleElement} */document.createElement('style');if(moniker){style.setAttribute('scope',moniker);}style.textContent=cssText;return style;}/**
   * Track the position of the last added style for placing placeholders
   * @type {Node}
   */let lastHeadApplyNode=null;// insert a comment node as a styling position placeholder.
/**
 * @param {string} moniker
 * @return {!Comment}
 */function applyStylePlaceHolder(moniker){let placeHolder=document.createComment(' Shady DOM styles for '+moniker+' ');let after=lastHeadApplyNode?lastHeadApplyNode['nextSibling']:null;let scope=document.head;scope.insertBefore(placeHolder,after||scope.firstChild);lastHeadApplyNode=placeHolder;return placeHolder;}/**
   * @param {HTMLStyleElement} style
   * @param {?Node} target
   * @param {?Node} contextNode
   */function applyStyle(style,target,contextNode){target=target||document.head;let after=contextNode&&contextNode.nextSibling||target.firstChild;target.insertBefore(style,after);if(!lastHeadApplyNode){lastHeadApplyNode=style;}else{// only update lastHeadApplyNode if the new style is inserted after the old lastHeadApplyNode
let position=style.compareDocumentPosition(lastHeadApplyNode);if(position===Node.DOCUMENT_POSITION_PRECEDING){lastHeadApplyNode=style;}}}/**
   * @param {string} buildType
   * @return {boolean}
   */function isTargetedBuild(buildType){return nativeShadow?buildType==='shadow':buildType==='shady';}/**
   * @param {Element} element
   * @return {?string}
   */function getCssBuildType(element){return element.getAttribute('css-build');}/**
   * Walk from text[start] matching parens and
   * returns position of the outer end paren
   * @param {string} text
   * @param {number} start
   * @return {number}
   */function findMatchingParen(text,start){let level=0;for(let i=start,l=text.length;i<l;i++){if(text[i]==='('){level++;}else if(text[i]===')'){if(--level===0){return i;}}}return-1;}/**
   * @param {string} str
   * @param {function(string, string, string, string)} callback
   */function processVariableAndFallback(str,callback){// find 'var('
let start=str.indexOf('var(');if(start===-1){// no var?, everything is prefix
return callback(str,'','','');}//${prefix}var(${inner})${suffix}
let end=findMatchingParen(str,start+3);let inner=str.substring(start+4,end);let prefix=str.substring(0,start);// suffix may have other variables
let suffix=processVariableAndFallback(str.substring(end+1),callback);let comma=inner.indexOf(',');// value and fallback args should be trimmed to match in property lookup
if(comma===-1){// variable, no fallback
return callback(prefix,inner.trim(),'',suffix);}// var(${value},${fallback})
let value=inner.substring(0,comma).trim();let fallback=inner.substring(comma+1).trim();return callback(prefix,value,fallback,suffix);}/**
   * @param {Element} element
   * @param {string} value
   */function setElementClassRaw(element,value){// use native setAttribute provided by ShadyDOM when setAttribute is patched
if(nativeShadow){element.setAttribute('class',value);}else{window['ShadyDOM']['nativeMethods']['setAttribute'].call(element,'class',value);}}/**
   * @param {Element | {is: string, extends: string}} element
   * @return {{is: string, typeExtension: string}}
   */function getIsExtends(element){let localName=element['localName'];let is='',typeExtension='';/*
                          NOTE: technically, this can be wrong for certain svg elements
                          with `-` in the name like `<font-face>`
                          */if(localName){if(localName.indexOf('-')>-1){is=localName;}else{typeExtension=localName;is=element.getAttribute&&element.getAttribute('is')||'';}}else{is=/** @type {?} */element.is;typeExtension=/** @type {?} */element.extends;}return{is,typeExtension};}/**
   * @param {Element|DocumentFragment} element
   * @return {string}
   */function gatherStyleText(element){/** @type {!Array<string>} */const styleTextParts=[];const styles=/** @type {!NodeList<!HTMLStyleElement>} */element.querySelectorAll('style');for(let i=0;i<styles.length;i++){const style=styles[i];if(isUnscopedStyle(style)){if(!nativeShadow){processUnscopedStyle(style);style.parentNode.removeChild(style);}}else{styleTextParts.push(style.textContent);style.parentNode.removeChild(style);}}return styleTextParts.join('').trim();}var styleUtil={toCssText:toCssText,rulesForStyle:rulesForStyle,isKeyframesSelector:isKeyframesSelector,forEachRule:forEachRule,applyCss:applyCss,createScopeStyle:createScopeStyle,applyStylePlaceHolder:applyStylePlaceHolder,applyStyle:applyStyle,isTargetedBuild:isTargetedBuild,getCssBuildType:getCssBuildType,processVariableAndFallback:processVariableAndFallback,setElementClassRaw:setElementClassRaw,getIsExtends:getIsExtends,gatherStyleText:gatherStyleText};/**
   @license
   Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */'use strict';/**
               * @param {Element} element
               * @param {Object=} properties
               */function updateNativeProperties(element,properties){// remove previous properties
for(let p in properties){// NOTE: for bc with shim, don't apply null values.
if(p===null){element.style.removeProperty(p);}else{element.style.setProperty(p,properties[p]);}}}/**
   * @param {Element} element
   * @param {string} property
   * @return {string}
   */function getComputedStyleValue(element,property){/**
   * @const {string}
   */const value=window.getComputedStyle(element).getPropertyValue(property);if(!value){return'';}else{return value.trim();}}/**
   * return true if `cssText` contains a mixin definition or consumption
   * @param {string} cssText
   * @return {boolean}
   */function detectMixin(cssText){const has=MIXIN_MATCH.test(cssText)||VAR_ASSIGN.test(cssText);// reset state of the regexes
MIXIN_MATCH.lastIndex=0;VAR_ASSIGN.lastIndex=0;return has;}var commonUtils={updateNativeProperties:updateNativeProperties,getComputedStyleValue:getComputedStyleValue,detectMixin:detectMixin};/**
   @license
   Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */ /*
       * The apply shim simulates the behavior of `@apply` proposed at
       * https://tabatkins.github.io/specs/css-apply-rule/.
       * The approach is to convert a property like this:
       *
       *    --foo: {color: red; background: blue;}
       *
       * to this:
       *
       *    --foo_-_color: red;
       *    --foo_-_background: blue;
       *
       * Then where `@apply --foo` is used, that is converted to:
       *
       *    color: var(--foo_-_color);
       *    background: var(--foo_-_background);
       *
       * This approach generally works but there are some issues and limitations.
       * Consider, for example, that somewhere *between* where `--foo` is set and used,
       * another element sets it to:
       *
       *    --foo: { border: 2px solid red; }
       *
       * We must now ensure that the color and background from the previous setting
       * do not apply. This is accomplished by changing the property set to this:
       *
       *    --foo_-_border: 2px solid red;
       *    --foo_-_color: initial;
       *    --foo_-_background: initial;
       *
       * This works but introduces one new issue.
       * Consider this setup at the point where the `@apply` is used:
       *
       *    background: orange;
       *    `@apply` --foo;
       *
       * In this case the background will be unset (initial) rather than the desired
       * `orange`. We address this by altering the property set to use a fallback
       * value like this:
       *
       *    color: var(--foo_-_color);
       *    background: var(--foo_-_background, orange);
       *    border: var(--foo_-_border);
       *
       * Note that the default is retained in the property set and the `background` is
       * the desired `orange`. This leads us to a limitation.
       *
       * Limitation 1:
      
       * Only properties in the rule where the `@apply`
       * is used are considered as default values.
       * If another rule matches the element and sets `background` with
       * less specificity than the rule in which `@apply` appears,
       * the `background` will not be set.
       *
       * Limitation 2:
       *
       * When using Polymer's `updateStyles` api, new properties may not be set for
       * `@apply` properties.
      
      */'use strict';const APPLY_NAME_CLEAN=/;\s*/m;const INITIAL_INHERIT=/^\s*(initial)|(inherit)\s*$/;const IMPORTANT=/\s*!important/;// separator used between mixin-name and mixin-property-name when producing properties
// NOTE: plain '-' may cause collisions in user styles
const MIXIN_VAR_SEP='_-_';/**
                              * @typedef {!Object<string, string>}
                              */let PropertyEntry;// eslint-disable-line no-unused-vars
/**
 * @typedef {!Object<string, boolean>}
 */let DependantsEntry;// eslint-disable-line no-unused-vars
/** @typedef {{
 *    properties: PropertyEntry,
 *    dependants: DependantsEntry
 * }}
 */let MixinMapEntry;// eslint-disable-line no-unused-vars
// map of mixin to property names
// --foo: {border: 2px} -> {properties: {(--foo, ['border'])}, dependants: {'element-name': proto}}
class MixinMap{constructor(){/** @type {!Object<string, !MixinMapEntry>} */this._map={};}/**
     * @param {string} name
     * @param {!PropertyEntry} props
     */set(name,props){name=name.trim();this._map[name]={properties:props,dependants:{}};}/**
     * @param {string} name
     * @return {MixinMapEntry}
     */get(name){name=name.trim();return this._map[name]||null;}}/**
   * Callback for when an element is marked invalid
   * @type {?function(string)}
   */let invalidCallback=null;/** @unrestricted */class ApplyShim{constructor(){/** @type {?string} */this._currentElement=null;/** @type {HTMLMetaElement} */this._measureElement=null;this._map=new MixinMap();}/**
     * return true if `cssText` contains a mixin definition or consumption
     * @param {string} cssText
     * @return {boolean}
     */detectMixin(cssText){return detectMixin(cssText);}/**
     * Gather styles into one style for easier processing
     * @param {!HTMLTemplateElement} template
     * @return {HTMLStyleElement}
     */gatherStyles(template){const styleText=gatherStyleText(template.content);if(styleText){const style=/** @type {!HTMLStyleElement} */document.createElement('style');style.textContent=styleText;template.content.insertBefore(style,template.content.firstChild);return style;}return null;}/**
     * @param {!HTMLTemplateElement} template
     * @param {string} elementName
     * @return {StyleNode}
     */transformTemplate(template,elementName){if(template._gatheredStyle===undefined){template._gatheredStyle=this.gatherStyles(template);}/** @type {HTMLStyleElement} */const style=template._gatheredStyle;return style?this.transformStyle(style,elementName):null;}/**
     * @param {!HTMLStyleElement} style
     * @param {string} elementName
     * @return {StyleNode}
     */transformStyle(style,elementName=''){let ast=rulesForStyle(style);this.transformRules(ast,elementName);style.textContent=toCssText(ast);return ast;}/**
     * @param {!HTMLStyleElement} style
     * @return {StyleNode}
     */transformCustomStyle(style){let ast=rulesForStyle(style);forEachRule(ast,rule=>{if(rule['selector']===':root'){rule['selector']='html';}this.transformRule(rule);});style.textContent=toCssText(ast);return ast;}/**
     * @param {StyleNode} rules
     * @param {string} elementName
     */transformRules(rules,elementName){this._currentElement=elementName;forEachRule(rules,r=>{this.transformRule(r);});this._currentElement=null;}/**
     * @param {!StyleNode} rule
     */transformRule(rule){rule['cssText']=this.transformCssText(rule['parsedCssText']);// :root was only used for variable assignment in property shim,
// but generates invalid selectors with real properties.
// replace with `:host > *`, which serves the same effect
if(rule['selector']===':root'){rule['selector']=':host > *';}}/**
     * @param {string} cssText
     * @return {string}
     */transformCssText(cssText){// produce variables
cssText=cssText.replace(VAR_ASSIGN,(matchText,propertyName,valueProperty,valueMixin)=>this._produceCssProperties(matchText,propertyName,valueProperty,valueMixin));// consume mixins
return this._consumeCssProperties(cssText);}/**
     * @param {string} property
     * @return {string}
     */_getInitialValueForProperty(property){if(!this._measureElement){this._measureElement=/** @type {HTMLMetaElement} */document.createElement('meta');this._measureElement.setAttribute('apply-shim-measure','');this._measureElement.style.all='initial';document.head.appendChild(this._measureElement);}return window.getComputedStyle(this._measureElement).getPropertyValue(property);}/**
     * replace mixin consumption with variable consumption
     * @param {string} text
     * @return {string}
     */_consumeCssProperties(text){/** @type {Array} */let m=null;// loop over text until all mixins with defintions have been applied
while(m=MIXIN_MATCH.exec(text)){let matchText=m[0];let mixinName=m[1];let idx=m.index;// collect properties before apply to be "defaults" if mixin might override them
// match includes a "prefix", so find the start and end positions of @apply
let applyPos=idx+matchText.indexOf('@apply');let afterApplyPos=idx+matchText.length;// find props defined before this @apply
let textBeforeApply=text.slice(0,applyPos);let textAfterApply=text.slice(afterApplyPos);let defaults=this._cssTextToMap(textBeforeApply);let replacement=this._atApplyToCssProperties(mixinName,defaults);// use regex match position to replace mixin, keep linear processing time
text=`${textBeforeApply}${replacement}${textAfterApply}`;// move regex search to _after_ replacement
MIXIN_MATCH.lastIndex=idx+replacement.length;}return text;}/**
     * produce variable consumption at the site of mixin consumption
     * `@apply` --foo; -> for all props (${propname}: var(--foo_-_${propname}, ${fallback[propname]}}))
     * Example:
     *  border: var(--foo_-_border); padding: var(--foo_-_padding, 2px)
     *
     * @param {string} mixinName
     * @param {Object} fallbacks
     * @return {string}
     */_atApplyToCssProperties(mixinName,fallbacks){mixinName=mixinName.replace(APPLY_NAME_CLEAN,'');let vars=[];let mixinEntry=this._map.get(mixinName);// if we depend on a mixin before it is created
// make a sentinel entry in the map to add this element as a dependency for when it is defined.
if(!mixinEntry){this._map.set(mixinName,{});mixinEntry=this._map.get(mixinName);}if(mixinEntry){if(this._currentElement){mixinEntry.dependants[this._currentElement]=true;}let p,parts,f;const properties=mixinEntry.properties;for(p in properties){f=fallbacks&&fallbacks[p];parts=[p,': var(',mixinName,MIXIN_VAR_SEP,p];if(f){parts.push(',',f.replace(IMPORTANT,''));}parts.push(')');if(IMPORTANT.test(properties[p])){parts.push(' !important');}vars.push(parts.join(''));}}return vars.join('; ');}/**
     * @param {string} property
     * @param {string} value
     * @return {string}
     */_replaceInitialOrInherit(property,value){let match=INITIAL_INHERIT.exec(value);if(match){if(match[1]){// initial
// replace `initial` with the concrete initial value for this property
value=this._getInitialValueForProperty(property);}else{// inherit
// with this purposfully illegal value, the variable will be invalid at
// compute time (https://www.w3.org/TR/css-variables/#invalid-at-computed-value-time)
// and for inheriting values, will behave similarly
// we cannot support the same behavior for non inheriting values like 'border'
value='apply-shim-inherit';}}return value;}/**
     * "parse" a mixin definition into a map of properties and values
     * cssTextToMap('border: 2px solid black') -> ('border', '2px solid black')
     * @param {string} text
     * @return {!Object<string, string>}
     */_cssTextToMap(text){let props=text.split(';');let property,value;let out={};for(let i=0,p,sp;i<props.length;i++){p=props[i];if(p){sp=p.split(':');// ignore lines that aren't definitions like @media
if(sp.length>1){property=sp[0].trim();// some properties may have ':' in the value, like data urls
value=this._replaceInitialOrInherit(property,sp.slice(1).join(':'));out[property]=value;}}}return out;}/**
     * @param {MixinMapEntry} mixinEntry
     */_invalidateMixinEntry(mixinEntry){if(!invalidCallback){return;}for(let elementName in mixinEntry.dependants){if(elementName!==this._currentElement){invalidCallback(elementName);}}}/**
     * @param {string} matchText
     * @param {string} propertyName
     * @param {?string} valueProperty
     * @param {?string} valueMixin
     * @return {string}
     */_produceCssProperties(matchText,propertyName,valueProperty,valueMixin){// handle case where property value is a mixin
if(valueProperty){// form: --mixin2: var(--mixin1), where --mixin1 is in the map
processVariableAndFallback(valueProperty,(prefix,value)=>{if(value&&this._map.get(value)){valueMixin=`@apply ${value};`;}});}if(!valueMixin){return matchText;}let mixinAsProperties=this._consumeCssProperties(''+valueMixin);let prefix=matchText.slice(0,matchText.indexOf('--'));let mixinValues=this._cssTextToMap(mixinAsProperties);let combinedProps=mixinValues;let mixinEntry=this._map.get(propertyName);let oldProps=mixinEntry&&mixinEntry.properties;if(oldProps){// NOTE: since we use mixin, the map of properties is updated here
// and this is what we want.
combinedProps=Object.assign(Object.create(oldProps),mixinValues);}else{this._map.set(propertyName,combinedProps);}let out=[];let p,v;// set variables defined by current mixin
let needToInvalidate=false;for(p in combinedProps){v=mixinValues[p];// if property not defined by current mixin, set initial
if(v===undefined){v='initial';}if(oldProps&&!(p in oldProps)){needToInvalidate=true;}out.push(`${propertyName}${MIXIN_VAR_SEP}${p}: ${v}`);}if(needToInvalidate){this._invalidateMixinEntry(mixinEntry);}if(mixinEntry){mixinEntry.properties=combinedProps;}// because the mixinMap is global, the mixin might conflict with
// a different scope's simple variable definition:
// Example:
// some style somewhere:
// --mixin1:{ ... }
// --mixin2: var(--mixin1);
// some other element:
// --mixin1: 10px solid red;
// --foo: var(--mixin1);
// In this case, we leave the original variable definition in place.
if(valueProperty){prefix=`${matchText};${prefix}`;}return`${prefix}${out.join('; ')};`;}}/* exports */ApplyShim.prototype['detectMixin']=ApplyShim.prototype.detectMixin;ApplyShim.prototype['transformStyle']=ApplyShim.prototype.transformStyle;ApplyShim.prototype['transformCustomStyle']=ApplyShim.prototype.transformCustomStyle;ApplyShim.prototype['transformRules']=ApplyShim.prototype.transformRules;ApplyShim.prototype['transformRule']=ApplyShim.prototype.transformRule;ApplyShim.prototype['transformTemplate']=ApplyShim.prototype.transformTemplate;ApplyShim.prototype['_separator']=MIXIN_VAR_SEP;Object.defineProperty(ApplyShim.prototype,'invalidCallback',{/** @return {?function(string)} */get(){return invalidCallback;},/** @param {?function(string)} cb */set(cb){invalidCallback=cb;}});var applyShim={default:ApplyShim};/**
   @license
   Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */'use strict';/**
               * @const {!Object<string, !HTMLTemplateElement>}
               */const templateMap={};var templateMap$1={default:templateMap};/**
   @license
   Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */'use strict';/*
               * Utilities for handling invalidating apply-shim mixins for a given template.
               *
               * The invalidation strategy involves keeping track of the "current" version of a template's mixins, and updating that count when a mixin is invalidated.
               * The template
               */ /** @const {string} */const CURRENT_VERSION='_applyShimCurrentVersion';/** @const {string} */const NEXT_VERSION='_applyShimNextVersion';/** @const {string} */const VALIDATING_VERSION='_applyShimValidatingVersion';/**
                                                           * @const {Promise<void>}
                                                           */const promise=Promise.resolve();/**
                                    * @param {string} elementName
                                    */function invalidate(elementName){let template=templateMap[elementName];if(template){invalidateTemplate(template);}}/**
   * This function can be called multiple times to mark a template invalid
   * and signal that the style inside must be regenerated.
   *
   * Use `startValidatingTemplate` to begin an asynchronous validation cycle.
   * During that cycle, call `templateIsValidating` to see if the template must
   * be revalidated
   * @param {HTMLTemplateElement} template
   */function invalidateTemplate(template){// default the current version to 0
template[CURRENT_VERSION]=template[CURRENT_VERSION]||0;// ensure the "validating for" flag exists
template[VALIDATING_VERSION]=template[VALIDATING_VERSION]||0;// increment the next version
template[NEXT_VERSION]=(template[NEXT_VERSION]||0)+1;}/**
   * @param {string} elementName
   * @return {boolean}
   */function isValid(elementName){let template=templateMap[elementName];if(template){return templateIsValid(template);}return true;}/**
   * @param {HTMLTemplateElement} template
   * @return {boolean}
   */function templateIsValid(template){return template[CURRENT_VERSION]===template[NEXT_VERSION];}/**
   * @param {string} elementName
   * @return {boolean}
   */function isValidating(elementName){let template=templateMap[elementName];if(template){return templateIsValidating(template);}return false;}/**
   * Returns true if the template is currently invalid and `startValidating` has been called since the last invalidation.
   * If false, the template must be validated.
   * @param {HTMLTemplateElement} template
   * @return {boolean}
   */function templateIsValidating(template){return!templateIsValid(template)&&template[VALIDATING_VERSION]===template[NEXT_VERSION];}/**
   * the template is marked as `validating` for one microtask so that all instances
   * found in the tree crawl of `applyStyle` will update themselves,
   * but the template will only be updated once.
   * @param {string} elementName
  */function startValidating(elementName){let template=templateMap[elementName];startValidatingTemplate(template);}/**
   * Begin an asynchronous invalidation cycle.
   * This should be called after every validation of a template
   *
   * After one microtask, the template will be marked as valid until the next call to `invalidateTemplate`
   * @param {HTMLTemplateElement} template
   */function startValidatingTemplate(template){// remember that the current "next version" is the reason for this validation cycle
template[VALIDATING_VERSION]=template[NEXT_VERSION];// however, there only needs to be one async task to clear the counters
if(!template._validating){template._validating=true;promise.then(function(){// sync the current version to let future invalidations cause a refresh cycle
template[CURRENT_VERSION]=template[NEXT_VERSION];template._validating=false;});}}/**
   * @return {boolean}
   */function elementsAreInvalid(){for(let elementName in templateMap){let template=templateMap[elementName];if(!templateIsValid(template)){return true;}}return false;}var applyShimUtils={invalidate:invalidate,invalidateTemplate:invalidateTemplate,isValid:isValid,templateIsValid:templateIsValid,isValidating:isValidating,templateIsValidating:templateIsValidating,startValidating:startValidating,startValidatingTemplate:startValidatingTemplate,elementsAreInvalid:elementsAreInvalid};/**
   @license
   Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */'use strict';/** @type {Promise<void>} */let readyPromise=null;/** @type {?function(?function())} */let whenReady=window['HTMLImports']&&window['HTMLImports']['whenReady']||null;/** @type {function()} */let resolveFn;/**
                * @param {?function()} callback
                */function documentWait(callback){requestAnimationFrame(function(){if(whenReady){whenReady(callback);}else{if(!readyPromise){readyPromise=new Promise(resolve=>{resolveFn=resolve;});if(document.readyState==='complete'){resolveFn();}else{document.addEventListener('readystatechange',()=>{if(document.readyState==='complete'){resolveFn();}});}}readyPromise.then(function(){callback&&callback();});}});}var documentWait$1={default:documentWait};/**
   @license
   Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */'use strict';/**
               * @typedef {HTMLStyleElement | {getStyle: function():HTMLStyleElement}}
               */let CustomStyleProvider;const SEEN_MARKER='__seenByShadyCSS';const CACHED_STYLE='__shadyCSSCachedStyle';/** @type {?function(!HTMLStyleElement)} */let transformFn=null;/** @type {?function()} */let validateFn=null;/**
                       This interface is provided to add document-level <style> elements to ShadyCSS for processing.
                       These styles must be processed by ShadyCSS to simulate ShadowRoot upper-bound encapsulation from outside styles
                       In addition, these styles may also need to be processed for @apply rules and CSS Custom Properties
                       
                       To add document-level styles to ShadyCSS, one can call `ShadyCSS.addDocumentStyle(styleElement)` or `ShadyCSS.addDocumentStyle({getStyle: () => styleElement})`
                       
                       In addition, if the process used to discover document-level styles can be synchronously flushed, one should set `ShadyCSS.documentStyleFlush`.
                       This function will be called when calculating styles.
                       
                       An example usage of the document-level styling api can be found in `examples/document-style-lib.js`
                       
                       @unrestricted
                       */class CustomStyleInterface{constructor(){/** @type {!Array<!CustomStyleProvider>} */this['customStyles']=[];this['enqueued']=false;}/**
     * Queue a validation for new custom styles to batch style recalculations
     */enqueueDocumentValidation(){if(this['enqueued']||!validateFn){return;}this['enqueued']=true;documentWait(validateFn);}/**
     * @param {!HTMLStyleElement} style
     */addCustomStyle(style){if(!style[SEEN_MARKER]){style[SEEN_MARKER]=true;this['customStyles'].push(style);this.enqueueDocumentValidation();}}/**
     * @param {!CustomStyleProvider} customStyle
     * @return {HTMLStyleElement}
     */getStyleForCustomStyle(customStyle){if(customStyle[CACHED_STYLE]){return customStyle[CACHED_STYLE];}let style;if(customStyle['getStyle']){style=customStyle['getStyle']();}else{style=customStyle;}return style;}/**
     * @return {!Array<!CustomStyleProvider>}
     */processStyles(){const cs=this['customStyles'];for(let i=0;i<cs.length;i++){const customStyle=cs[i];if(customStyle[CACHED_STYLE]){continue;}const style=this.getStyleForCustomStyle(customStyle);if(style){// HTMLImports polyfill may have cloned the style into the main document,
// which is referenced with __appliedElement.
const styleToTransform=/** @type {!HTMLStyleElement} */style['__appliedElement']||style;if(transformFn){transformFn(styleToTransform);}customStyle[CACHED_STYLE]=styleToTransform;}}return cs;}}CustomStyleInterface.prototype['addCustomStyle']=CustomStyleInterface.prototype.addCustomStyle;CustomStyleInterface.prototype['getStyleForCustomStyle']=CustomStyleInterface.prototype.getStyleForCustomStyle;CustomStyleInterface.prototype['processStyles']=CustomStyleInterface.prototype.processStyles;Object.defineProperties(CustomStyleInterface.prototype,{'transformCallback':{/** @return {?function(!HTMLStyleElement)} */get(){return transformFn;},/** @param {?function(!HTMLStyleElement)} fn */set(fn){transformFn=fn;}},'validateCallback':{/** @return {?function()} */get(){return validateFn;},/**
     * @param {?function()} fn
     * @this {CustomStyleInterface}
     */set(fn){let needsEnqueue=false;if(!validateFn){needsEnqueue=true;}validateFn=fn;if(needsEnqueue){this.enqueueDocumentValidation();}}}});/** @typedef {{
     * customStyles: !Array<!CustomStyleProvider>,
     * addCustomStyle: function(!CustomStyleProvider),
     * getStyleForCustomStyle: function(!CustomStyleProvider): HTMLStyleElement,
     * findStyles: function(),
     * transformCallback: ?function(!HTMLStyleElement),
     * validateCallback: ?function()
     * }}
     */let CustomStyleInterfaceInterface;var customStyleInterface={CustomStyleProvider:CustomStyleProvider,default:CustomStyleInterface,CustomStyleInterfaceInterface:CustomStyleInterfaceInterface};/**
   @license
   Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */'use strict';/** @const {ApplyShim} */const applyShim$1=new ApplyShim();class ApplyShimInterface{constructor(){/** @type {?CustomStyleInterfaceInterface} */this.customStyleInterface=null;documentWait(()=>{this.ensure();});applyShim$1['invalidCallback']=invalidate;}ensure(){if(this.customStyleInterface){return;}this.customStyleInterface=window.ShadyCSS.CustomStyleInterface;if(this.customStyleInterface){this.customStyleInterface['transformCallback']=style=>{applyShim$1.transformCustomStyle(style);};this.customStyleInterface['validateCallback']=()=>{requestAnimationFrame(()=>{if(this.customStyleInterface['enqueued']){this.flushCustomStyles();}});};}}/**
     * @param {!HTMLTemplateElement} template
     * @param {string} elementName
     */prepareTemplate(template,elementName){this.ensure();templateMap[elementName]=template;let ast=applyShim$1.transformTemplate(template,elementName);// save original style ast to use for revalidating instances
template['_styleAst']=ast;}flushCustomStyles(){this.ensure();if(!this.customStyleInterface){return;}let styles=this.customStyleInterface['processStyles']();if(!this.customStyleInterface['enqueued']){return;}for(let i=0;i<styles.length;i++){let cs=styles[i];let style=this.customStyleInterface['getStyleForCustomStyle'](cs);if(style){applyShim$1.transformCustomStyle(style);}}this.customStyleInterface['enqueued']=false;}/**
     * @param {HTMLElement} element
     * @param {Object=} properties
     */styleSubtree(element,properties){this.ensure();if(properties){updateNativeProperties(element,properties);}if(element.shadowRoot){this.styleElement(element);let shadowChildren=element.shadowRoot.children||element.shadowRoot.childNodes;for(let i=0;i<shadowChildren.length;i++){this.styleSubtree(/** @type {HTMLElement} */shadowChildren[i]);}}else{let children=element.children||element.childNodes;for(let i=0;i<children.length;i++){this.styleSubtree(/** @type {HTMLElement} */children[i]);}}}/**
     * @param {HTMLElement} element
     */styleElement(element){this.ensure();let{is}=getIsExtends(element);let template=templateMap[is];if(template&&!templateIsValid(template)){// only revalidate template once
if(!templateIsValidating(template)){this.prepareTemplate(template,is);startValidatingTemplate(template);}// update this element instance
let root=element.shadowRoot;if(root){let style=/** @type {HTMLStyleElement} */root.querySelector('style');if(style){// reuse the template's style ast, it has all the original css text
style['__cssRules']=template['_styleAst'];style.textContent=toCssText(template['_styleAst']);}}}}/**
     * @param {Object=} properties
     */styleDocument(properties){this.ensure();this.styleSubtree(document.body,properties);}}if(!window.ShadyCSS||!window.ShadyCSS.ScopingShim){const applyShimInterface=new ApplyShimInterface();let CustomStyleInterface$$1=window.ShadyCSS&&window.ShadyCSS.CustomStyleInterface;/** @suppress {duplicate} */window.ShadyCSS={/**
     * @param {!HTMLTemplateElement} template
     * @param {string} elementName
     * @param {string=} elementExtends
     */prepareTemplate(template,elementName,elementExtends){// eslint-disable-line no-unused-vars
applyShimInterface.flushCustomStyles();applyShimInterface.prepareTemplate(template,elementName);},/**
     * @param {!HTMLElement} element
     * @param {Object=} properties
     */styleSubtree(element,properties){applyShimInterface.flushCustomStyles();applyShimInterface.styleSubtree(element,properties);},/**
     * @param {!HTMLElement} element
     */styleElement(element){applyShimInterface.flushCustomStyles();applyShimInterface.styleElement(element);},/**
     * @param {Object=} properties
     */styleDocument(properties){applyShimInterface.flushCustomStyles();applyShimInterface.styleDocument(properties);},/**
     * @param {Element} element
     * @param {string} property
     * @return {string}
     */getComputedStyleValue(element,property){return getComputedStyleValue(element,property);},nativeCss:nativeCssVariables,nativeShadow:nativeShadow};if(CustomStyleInterface$$1){window.ShadyCSS.CustomStyleInterface=CustomStyleInterface$$1;}}window.ShadyCSS.ApplyShim=applyShim$1;window.JSCompiler_renameProperty=function(prop,obj){return prop;};/** @namespace Polymer */let __PolymerBootstrap;let CSS_URL_RX=/(url\()([^)]*)(\))/g;let ABS_URL=/(^\/)|(^#)|(^[\w-\d]*:)/;let workingURL;let resolveDoc;/**
                 * Resolves the given URL against the provided `baseUri'.
                 * 
                 * Note that this function performs no resolution for URLs that start
                 * with `/` (absolute URLs) or `#` (hash identifiers).  For general purpose
                 * URL resolution, use `window.URL`.
                 *
                 * @memberof Polymer.ResolveUrl
                 * @param {string} url Input URL to resolve
                 * @param {?string=} baseURI Base URI to resolve the URL against
                 * @return {string} resolved URL
                 */function resolveUrl(url,baseURI){if(url&&ABS_URL.test(url)){return url;}// Lazy feature detection.
if(workingURL===undefined){workingURL=false;try{const u=new URL('b','http://a');u.pathname='c%20d';workingURL=u.href==='http://a/c%20d';}catch(e){// silently fail
}}if(!baseURI){baseURI=document.baseURI||window.location.href;}if(workingURL){return new URL(url,baseURI).href;}// Fallback to creating an anchor into a disconnected document.
if(!resolveDoc){resolveDoc=document.implementation.createHTMLDocument('temp');resolveDoc.base=resolveDoc.createElement('base');resolveDoc.head.appendChild(resolveDoc.base);resolveDoc.anchor=resolveDoc.createElement('a');resolveDoc.body.appendChild(resolveDoc.anchor);}resolveDoc.base.href=baseURI;resolveDoc.anchor.href=url;return resolveDoc.anchor.href||url;}/**
   * Resolves any relative URL's in the given CSS text against the provided
   * `ownerDocument`'s `baseURI`.
   *
   * @memberof Polymer.ResolveUrl
   * @param {string} cssText CSS text to process
   * @param {string} baseURI Base URI to resolve the URL against
   * @return {string} Processed CSS text with resolved URL's
   */function resolveCss(cssText,baseURI){return cssText.replace(CSS_URL_RX,function(m,pre,url,post){return pre+'\''+resolveUrl(url.replace(/["']/g,''),baseURI)+'\''+post;});}/**
   * Returns a path from a given `url`. The path includes the trailing
   * `/` from the url.
   *
   * @memberof Polymer.ResolveUrl
   * @param {string} url Input URL to transform
   * @return {string} resolved path
   */function pathFromUrl(url){return url.substring(0,url.lastIndexOf('/')+1);}var resolveUrl$1={resolveCss:resolveCss,resolveUrl:resolveUrl,pathFromUrl:pathFromUrl};const useShadow=!window.ShadyDOM;const useNativeCSSProperties=Boolean(!window.ShadyCSS||window.ShadyCSS.nativeCss);const useNativeCustomElements=!window.customElements.polyfillWrapFlushCallback;/**
                                                                                   * Globally settable property that is automatically assigned to
                                                                                   * `Polymer.ElementMixin` instances, useful for binding in templates to
                                                                                   * make URL's relative to an application's root.  Defaults to the main
                                                                                   * document URL, but can be overridden by users.  It may be useful to set
                                                                                   * `Polymer.rootPath` to provide a stable application mount path when
                                                                                   * using client side routing.
                                                                                   *
                                                                                   * @memberof Polymer
                                                                                   */let rootPath=undefined||pathFromUrl(document.baseURI||window.location.href);const setRootPath=function(path){rootPath=path;};/**
    * A global callback used to sanitize any value before inserting it into the DOM. The callback signature is:
    *
    *     Polymer = {
    *       sanitizeDOMValue: function(value, name, type, node) { ... }
    *     }
    *
    * Where:
    *
    * `value` is the value to sanitize.
    * `name` is the name of an attribute or property (for example, href).
    * `type` indicates where the value is being inserted: one of property, attribute, or text.
    * `node` is the node where the value is being inserted.
    *
    * @type {(function(*,string,string,Node):*)|undefined}
    * @memberof Polymer
    */let sanitizeDOMValue=undefined;const setSanitizeDOMValue=function(newSanitizeDOMValue){sanitizeDOMValue=newSanitizeDOMValue;};/**
    * Globally settable property to make Polymer Gestures use passive TouchEvent listeners when recognizing gestures.
    * When set to `true`, gestures made from touch will not be able to prevent scrolling, allowing for smoother
    * scrolling performance.
    * Defaults to `false` for backwards compatibility.
    *
    * @memberof Polymer
    */let passiveTouchGestures=false;const setPassiveTouchGestures=function(usePassive){passiveTouchGestures=usePassive;};var settings={useShadow:useShadow,useNativeCSSProperties:useNativeCSSProperties,useNativeCustomElements:useNativeCustomElements,get rootPath(){return rootPath;},setRootPath:setRootPath,get sanitizeDOMValue(){return sanitizeDOMValue;},setSanitizeDOMValue:setSanitizeDOMValue,get passiveTouchGestures(){return passiveTouchGestures;},setPassiveTouchGestures:setPassiveTouchGestures};// unique global id for deduping mixins.
let dedupeId=0;/**
                   * @constructor
                   * @extends {Function}
                   */function MixinFunction(){}/** @type {(WeakMap | undefined)} */MixinFunction.prototype.__mixinApplications;/** @type {(Object | undefined)} */MixinFunction.prototype.__mixinSet;const dedupingMixin=function(mixin){let mixinApplications=/** @type {!MixinFunction} */mixin.__mixinApplications;if(!mixinApplications){mixinApplications=new WeakMap();/** @type {!MixinFunction} */mixin.__mixinApplications=mixinApplications;}// maintain a unique id for each mixin
let mixinDedupeId=dedupeId++;function dedupingMixin(base){let baseSet=/** @type {!MixinFunction} */base.__mixinSet;if(baseSet&&baseSet[mixinDedupeId]){return base;}let map=mixinApplications;let extended=map.get(base);if(!extended){extended=/** @type {!Function} */mixin(base);map.set(base,extended);}// copy inherited mixin set from the extended class, or the base class
// NOTE: we avoid use of Set here because some browser (IE11)
// cannot extend a base Set via the constructor.
let mixinSet=Object.create(/** @type {!MixinFunction} */extended.__mixinSet||baseSet||null);mixinSet[mixinDedupeId]=true;/** @type {!MixinFunction} */extended.__mixinSet=mixinSet;return extended;}return(/** @type {T} */dedupingMixin);};var mixin={dedupingMixin:dedupingMixin};const MODULE_STYLE_LINK_SELECTOR='link[rel=import][type~=css]';const INCLUDE_ATTR='include';const SHADY_UNSCOPED_ATTR='shady-unscoped';function importModule(moduleId){const/** Polymer.DomModule */PolymerDomModule=customElements.get('dom-module');if(!PolymerDomModule){return null;}return PolymerDomModule.import(moduleId);}function styleForImport(importDoc){// NOTE: polyfill affordance.
// under the HTMLImports polyfill, there will be no 'body',
// but the import pseudo-doc can be used directly.
let container=importDoc.body?importDoc.body:importDoc;const importCss=resolveCss(container.textContent,importDoc.baseURI);const style=document.createElement('style');style.textContent=importCss;return style;}/** @typedef {{assetpath: string}} */let templateWithAssetPath;// eslint-disable-line no-unused-vars
function stylesFromModules(moduleIds){const modules=moduleIds.trim().split(/\s+/);const styles=[];for(let i=0;i<modules.length;i++){styles.push(...stylesFromModule(modules[i]));}return styles;}function stylesFromModule(moduleId){const m=importModule(moduleId);if(!m){console.warn('Could not find style data in module named',moduleId);return[];}if(m._styles===undefined){const styles=[];// module imports: <link rel="import" type="css">
styles.push(..._stylesFromModuleImports(m));// include css from the first template in the module
const template=m.querySelector('template');if(template){styles.push(...stylesFromTemplate(template,/** @type {templateWithAssetPath} */m.assetpath));}m._styles=styles;}return m._styles;}function stylesFromTemplate(template,baseURI){if(!template._styles){const styles=[];// if element is a template, get content from its .content
const e$=template.content.querySelectorAll('style');for(let i=0;i<e$.length;i++){let e=e$[i];// support style sharing by allowing styles to "include"
// other dom-modules that contain styling
let include=e.getAttribute(INCLUDE_ATTR);if(include){styles.push(...stylesFromModules(include).filter(function(item,index,self){return self.indexOf(item)===index;}));}if(baseURI){e.textContent=resolveCss(e.textContent,baseURI);}styles.push(e);}template._styles=styles;}return template._styles;}function stylesFromModuleImports(moduleId){let m=importModule(moduleId);return m?_stylesFromModuleImports(m):[];}function _stylesFromModuleImports(module){const styles=[];const p$=module.querySelectorAll(MODULE_STYLE_LINK_SELECTOR);for(let i=0;i<p$.length;i++){let p=p$[i];if(p.import){const importDoc=p.import;const unscoped=p.hasAttribute(SHADY_UNSCOPED_ATTR);if(unscoped&&!importDoc._unscopedStyle){const style=styleForImport(importDoc);style.setAttribute(SHADY_UNSCOPED_ATTR,'');importDoc._unscopedStyle=style;}else if(!importDoc._style){importDoc._style=styleForImport(importDoc);}styles.push(unscoped?importDoc._unscopedStyle:importDoc._style);}}return styles;}function cssFromModules(moduleIds){let modules=moduleIds.trim().split(/\s+/);let cssText='';for(let i=0;i<modules.length;i++){cssText+=cssFromModule(modules[i]);}return cssText;}function cssFromModule(moduleId){let m=importModule(moduleId);if(m&&m._cssText===undefined){// module imports: <link rel="import" type="css">
let cssText=_cssFromModuleImports(m);// include css from the first template in the module
let t=m.querySelector('template');if(t){cssText+=cssFromTemplate(t,/** @type {templateWithAssetPath} */m.assetpath);}m._cssText=cssText||null;}if(!m){console.warn('Could not find style data in module named',moduleId);}return m&&m._cssText||'';}function cssFromTemplate(template,baseURI){let cssText='';const e$=stylesFromTemplate(template,baseURI);// if element is a template, get content from its .content
for(let i=0;i<e$.length;i++){let e=e$[i];if(e.parentNode){e.parentNode.removeChild(e);}cssText+=e.textContent;}return cssText;}function cssFromModuleImports(moduleId){let m=importModule(moduleId);return m?_cssFromModuleImports(m):'';}function _cssFromModuleImports(module){let cssText='';let styles=_stylesFromModuleImports(module);for(let i=0;i<styles.length;i++){cssText+=styles[i].textContent;}return cssText;}var styleGather={stylesFromModules:stylesFromModules,stylesFromModule:stylesFromModule,stylesFromTemplate:stylesFromTemplate,stylesFromModuleImports:stylesFromModuleImports,_stylesFromModuleImports:_stylesFromModuleImports,cssFromModules:cssFromModules,cssFromModule:cssFromModule,cssFromTemplate:cssFromTemplate,cssFromModuleImports:cssFromModuleImports,_cssFromModuleImports:_cssFromModuleImports};let modules={};let lcModules={};function findModule(id){return modules[id]||lcModules[id.toLowerCase()];}function styleOutsideTemplateCheck(inst){if(inst.querySelector('style')){console.warn('dom-module %s has style outside template',inst.id);}}/**
   * The `dom-module` element registers the dom it contains to the name given
   * by the module's id attribute. It provides a unified database of dom
   * accessible via its static `import` API.
   *
   * A key use case of `dom-module` is for providing custom element `<template>`s
   * via HTML imports that are parsed by the native HTML parser, that can be
   * relocated during a bundling pass and still looked up by `id`.
   *
   * Example:
   *
   *     <dom-module id="foo">
   *       <img src="stuff.png">
   *     </dom-module>
   *
   * Then in code in some other location that cannot access the dom-module above
   *
   *     let img = customElements.get('dom-module').import('foo', 'img');
   *
   * @customElement
   * @extends HTMLElement
   * @memberof Polymer
   * @summary Custom element that provides a registry of relocatable DOM content
   *   by `id` that is agnostic to bundling.
   * @unrestricted
   */class DomModule extends HTMLElement{static get observedAttributes(){return['id'];}/**
     * Retrieves the element specified by the css `selector` in the module
     * registered by `id`. For example, this.import('foo', 'img');
     * @param {string} id The id of the dom-module in which to search.
     * @param {string=} selector The css selector by which to find the element.
     * @return {Element} Returns the element which matches `selector` in the
     * module registered at the specified `id`.
     */static import(id,selector){if(id){let m=findModule(id);if(m&&selector){return m.querySelector(selector);}return m;}return null;}/**
     * @param {string} name Name of attribute.
     * @param {?string} old Old value of attribute.
     * @param {?string} value Current value of attribute.
     * @return {void}
     */attributeChangedCallback(name,old,value){if(old!==value){this.register();}}/**
     * The absolute URL of the original location of this `dom-module`.
     *
     * This value will differ from this element's `ownerDocument` in the
     * following ways:
     * - Takes into account any `assetpath` attribute added during bundling
     *   to indicate the original location relative to the bundled location
     * - Uses the HTMLImports polyfill's `importForElement` API to ensure
     *   the path is relative to the import document's location since
     *   `ownerDocument` is not currently polyfilled
     */get assetpath(){// Don't override existing assetpath.
if(!this.__assetpath){// note: assetpath set via an attribute must be relative to this
// element's location; accomodate polyfilled HTMLImports
const owner=window.HTMLImports&&HTMLImports.importForElement?HTMLImports.importForElement(this)||document:this.ownerDocument;const url=resolveUrl(this.getAttribute('assetpath')||'',owner.baseURI);this.__assetpath=pathFromUrl(url);}return this.__assetpath;}/**
     * Registers the dom-module at a given id. This method should only be called
     * when a dom-module is imperatively created. For
     * example, `document.createElement('dom-module').register('foo')`.
     * @param {string=} id The id at which to register the dom-module.
     * @return {void}
     */register(id){id=id||this.id;if(id){this.id=id;// store id separate from lowercased id so that
// in all cases mixedCase id will stored distinctly
// and lowercase version is a fallback
modules[id]=this;lcModules[id.toLowerCase()]=this;styleOutsideTemplateCheck(this);}}}DomModule.prototype['modules']=modules;customElements.define('dom-module',DomModule);var domModule={DomModule:DomModule};function isPath(path){return path.indexOf('.')>=0;}function root(path){let dotIndex=path.indexOf('.');if(dotIndex===-1){return path;}return path.slice(0,dotIndex);}function isAncestor(base,path){//     base.startsWith(path + '.');
return base.indexOf(path+'.')===0;}function isDescendant(base,path){//     path.startsWith(base + '.');
return path.indexOf(base+'.')===0;}function translate(base,newBase,path){return newBase+path.slice(base.length);}function matches(base,path){return base===path||isAncestor(base,path)||isDescendant(base,path);}function normalize(path){if(Array.isArray(path)){let parts=[];for(let i=0;i<path.length;i++){let args=path[i].toString().split('.');for(let j=0;j<args.length;j++){parts.push(args[j]);}}return parts.join('.');}else{return path;}}function split(path){if(Array.isArray(path)){return normalize(path).split('.');}return path.toString().split('.');}function get(root,path,info){let prop=root;let parts=split(path);// Loop over path parts[0..n-1] and dereference
for(let i=0;i<parts.length;i++){if(!prop){return;}let part=parts[i];prop=prop[part];}if(info){info.path=parts.join('.');}return prop;}function set(root,path,value){let prop=root;let parts=split(path);let last=parts[parts.length-1];if(parts.length>1){// Loop over path parts[0..n-2] and dereference
for(let i=0;i<parts.length-1;i++){let part=parts[i];prop=prop[part];if(!prop){return;}}// Set value to object at end of path
prop[last]=value;}else{// Simple property set
prop[path]=value;}return parts.join('.');}const isDeep=isPath;var path={isPath:isPath,root:root,isAncestor:isAncestor,isDescendant:isDescendant,translate:translate,matches:matches,normalize:normalize,split:split,get:get,set:set,isDeep:isDeep};const caseMap={};const DASH_TO_CAMEL=/-[a-z]/g;const CAMEL_TO_DASH=/([A-Z])/g;function dashToCamelCase(dash){return caseMap[dash]||(caseMap[dash]=dash.indexOf('-')<0?dash:dash.replace(DASH_TO_CAMEL,m=>m[1].toUpperCase()));}function camelToDashCase(camel){return caseMap[camel]||(caseMap[camel]=camel.replace(CAMEL_TO_DASH,'-$1').toLowerCase());}var caseMap$0={dashToCamelCase:dashToCamelCase,camelToDashCase:camelToDashCase};// Microtask implemented using Mutation Observer
let microtaskCurrHandle=0;let microtaskLastHandle=0;let microtaskCallbacks=[];let microtaskNodeContent=0;let microtaskNode=document.createTextNode('');new window.MutationObserver(microtaskFlush).observe(microtaskNode,{characterData:true});function microtaskFlush(){const len=microtaskCallbacks.length;for(let i=0;i<len;i++){let cb=microtaskCallbacks[i];if(cb){try{cb();}catch(e){setTimeout(()=>{throw e;});}}}microtaskCallbacks.splice(0,len);microtaskLastHandle+=len;}const timeOut={/**
   * Returns a sub-module with the async interface providing the provided
   * delay.
   *
   * @memberof Polymer.Async.timeOut
   * @param {number=} delay Time to wait before calling callbacks in ms
   * @return {!AsyncInterface} An async timeout interface
   */after(delay){return{run(fn){return window.setTimeout(fn,delay);},cancel(handle){window.clearTimeout(handle);}};},/**
   * Enqueues a function called in the next task.
   *
   * @memberof Polymer.Async.timeOut
   * @param {!Function} fn Callback to run
   * @param {number=} delay Delay in milliseconds
   * @return {number} Handle used for canceling task
   */run(fn,delay){return window.setTimeout(fn,delay);},/**
   * Cancels a previously enqueued `timeOut` callback.
   *
   * @memberof Polymer.Async.timeOut
   * @param {number} handle Handle returned from `run` of callback to cancel
   * @return {void}
   */cancel(handle){window.clearTimeout(handle);}};const animationFrame={/**
   * Enqueues a function called at `requestAnimationFrame` timing.
   *
   * @memberof Polymer.Async.animationFrame
   * @param {function(number):void} fn Callback to run
   * @return {number} Handle used for canceling task
   */run(fn){return window.requestAnimationFrame(fn);},/**
   * Cancels a previously enqueued `animationFrame` callback.
   *
   * @memberof Polymer.Async.animationFrame
   * @param {number} handle Handle returned from `run` of callback to cancel
   * @return {void}
   */cancel(handle){window.cancelAnimationFrame(handle);}};const idlePeriod={/**
   * Enqueues a function called at `requestIdleCallback` timing.
   *
   * @memberof Polymer.Async.idlePeriod
   * @param {function(!IdleDeadline):void} fn Callback to run
   * @return {number} Handle used for canceling task
   */run(fn){return window.requestIdleCallback?window.requestIdleCallback(fn):window.setTimeout(fn,16);},/**
   * Cancels a previously enqueued `idlePeriod` callback.
   *
   * @memberof Polymer.Async.idlePeriod
   * @param {number} handle Handle returned from `run` of callback to cancel
   * @return {void}
   */cancel(handle){window.cancelIdleCallback?window.cancelIdleCallback(handle):window.clearTimeout(handle);}};const microTask={/**
   * Enqueues a function called at microtask timing.
   *
   * @memberof Polymer.Async.microTask
   * @param {!Function=} callback Callback to run
   * @return {number} Handle used for canceling task
   */run(callback){microtaskNode.textContent=microtaskNodeContent++;microtaskCallbacks.push(callback);return microtaskCurrHandle++;},/**
   * Cancels a previously enqueued `microTask` callback.
   *
   * @memberof Polymer.Async.microTask
   * @param {number} handle Handle returned from `run` of callback to cancel
   * @return {void}
   */cancel(handle){const idx=handle-microtaskLastHandle;if(idx>=0){if(!microtaskCallbacks[idx]){throw new Error('invalid async handle: '+handle);}microtaskCallbacks[idx]=null;}}};var async={timeOut:timeOut,animationFrame:animationFrame,idlePeriod:idlePeriod,microTask:microTask};/** @const {!AsyncInterface} */const microtask=microTask;const PropertiesChanged=dedupingMixin(superClass=>{/**
   * @polymer
   * @mixinClass
   * @extends {superClass}
   * @implements {Polymer_PropertiesChanged}
   * @unrestricted
   */class PropertiesChanged extends superClass{/**
     * Creates property accessors for the given property names.
     * @param {!Object} props Object whose keys are names of accessors.
     * @return {void}
     * @protected
     */static createProperties(props){const proto=this.prototype;for(let prop in props){// don't stomp an existing accessor
if(!(prop in proto)){proto._createPropertyAccessor(prop);}}}/**
       * Returns an attribute name that corresponds to the given property.
       * The attribute name is the lowercased property name. Override to
       * customize this mapping.
       * @param {string} property Property to convert
       * @return {string} Attribute name corresponding to the given property.
       *
       * @protected
       */static attributeNameForProperty(property){return property.toLowerCase();}/**
       * Override point to provide a type to which to deserialize a value to
       * a given property.
       * @param {string} name Name of property
       *
       * @protected
       */static typeForProperty(name){}//eslint-disable-line no-unused-vars
/**
     * Creates a setter/getter pair for the named property with its own
     * local storage.  The getter returns the value in the local storage,
     * and the setter calls `_setProperty`, which updates the local storage
     * for the property and enqueues a `_propertiesChanged` callback.
     *
     * This method may be called on a prototype or an instance.  Calling
     * this method may overwrite a property value that already exists on
     * the prototype/instance by creating the accessor.
     *
     * @param {string} property Name of the property
     * @param {boolean=} readOnly When true, no setter is created; the
     *   protected `_setProperty` function must be used to set the property
     * @return {void}
     * @protected
     */_createPropertyAccessor(property,readOnly){this._addPropertyToAttributeMap(property);if(!this.hasOwnProperty('__dataHasAccessor')){this.__dataHasAccessor=Object.assign({},this.__dataHasAccessor);}if(!this.__dataHasAccessor[property]){this.__dataHasAccessor[property]=true;this._definePropertyAccessor(property,readOnly);}}/**
       * Adds the given `property` to a map matching attribute names
       * to property names, using `attributeNameForProperty`. This map is
       * used when deserializing attribute values to properties.
       *
       * @param {string} property Name of the property
       */_addPropertyToAttributeMap(property){if(!this.hasOwnProperty('__dataAttributes')){this.__dataAttributes=Object.assign({},this.__dataAttributes);}if(!this.__dataAttributes[property]){const attr=this.constructor.attributeNameForProperty(property);this.__dataAttributes[attr]=property;}}/**
       * Defines a property accessor for the given property.
       * @param {string} property Name of the property
       * @param {boolean=} readOnly When true, no setter is created
       * @return {void}
       */_definePropertyAccessor(property,readOnly){Object.defineProperty(this,property,{/* eslint-disable valid-jsdoc */ /** @this {PropertiesChanged} */get(){return this._getProperty(property);},/** @this {PropertiesChanged} */set:readOnly?function(){}:function(value){this._setProperty(property,value);}/* eslint-enable */});}constructor(){super();this.__dataEnabled=false;this.__dataReady=false;this.__dataInvalid=false;this.__data={};this.__dataPending=null;this.__dataOld=null;this.__dataInstanceProps=null;this.__serializing=false;this._initializeProperties();}/**
       * Lifecycle callback called when properties are enabled via
       * `_enableProperties`.
       *
       * Users may override this function to implement behavior that is
       * dependent on the element having its property data initialized, e.g.
       * from defaults (initialized from `constructor`, `_initializeProperties`),
       * `attributeChangedCallback`, or values propagated from host e.g. via
       * bindings.  `super.ready()` must be called to ensure the data system
       * becomes enabled.
       *
       * @return {void}
       * @public
       */ready(){this.__dataReady=true;this._flushProperties();}/**
       * Initializes the local storage for property accessors.
       *
       * Provided as an override point for performing any setup work prior
       * to initializing the property accessor system.
       *
       * @return {void}
       * @protected
       */_initializeProperties(){// Capture instance properties; these will be set into accessors
// during first flush. Don't set them here, since we want
// these to overwrite defaults/constructor assignments
for(let p in this.__dataHasAccessor){if(this.hasOwnProperty(p)){this.__dataInstanceProps=this.__dataInstanceProps||{};this.__dataInstanceProps[p]=this[p];delete this[p];}}}/**
       * Called at ready time with bag of instance properties that overwrote
       * accessors when the element upgraded.
       *
       * The default implementation sets these properties back into the
       * setter at ready time.  This method is provided as an override
       * point for customizing or providing more efficient initialization.
       *
       * @param {Object} props Bag of property values that were overwritten
       *   when creating property accessors.
       * @return {void}
       * @protected
       */_initializeInstanceProperties(props){Object.assign(this,props);}/**
       * Updates the local storage for a property (via `_setPendingProperty`)
       * and enqueues a `_proeprtiesChanged` callback.
       *
       * @param {string} property Name of the property
       * @param {*} value Value to set
       * @return {void}
       * @protected
       */_setProperty(property,value){if(this._setPendingProperty(property,value)){this._invalidateProperties();}}/**
       * Returns the value for the given property.
       * @param {string} property Name of property
       * @return {*} Value for the given property
       * @protected
       */_getProperty(property){return this.__data[property];}/* eslint-disable no-unused-vars */ /**
                                           * Updates the local storage for a property, records the previous value,
                                           * and adds it to the set of "pending changes" that will be passed to the
                                           * `_propertiesChanged` callback.  This method does not enqueue the
                                           * `_propertiesChanged` callback.
                                           *
                                           * @param {string} property Name of the property
                                           * @param {*} value Value to set
                                           * @param {boolean=} ext Not used here; affordance for closure
                                           * @return {boolean} Returns true if the property changed
                                           * @protected
                                           */_setPendingProperty(property,value,ext){let old=this.__data[property];let changed=this._shouldPropertyChange(property,value,old);if(changed){if(!this.__dataPending){this.__dataPending={};this.__dataOld={};}// Ensure old is captured from the last turn
if(this.__dataOld&&!(property in this.__dataOld)){this.__dataOld[property]=old;}this.__data[property]=value;this.__dataPending[property]=value;}return changed;}/* eslint-enable */ /**
                           * Marks the properties as invalid, and enqueues an async
                           * `_propertiesChanged` callback.
                           *
                           * @return {void}
                           * @protected
                           */_invalidateProperties(){if(!this.__dataInvalid&&this.__dataReady){this.__dataInvalid=true;microtask.run(()=>{if(this.__dataInvalid){this.__dataInvalid=false;this._flushProperties();}});}}/**
       * Call to enable property accessor processing. Before this method is
       * called accessor values will be set but side effects are
       * queued. When called, any pending side effects occur immediately.
       * For elements, generally `connectedCallback` is a normal spot to do so.
       * It is safe to call this method multiple times as it only turns on
       * property accessors once.
       *
       * @return {void}
       * @protected
       */_enableProperties(){if(!this.__dataEnabled){this.__dataEnabled=true;if(this.__dataInstanceProps){this._initializeInstanceProperties(this.__dataInstanceProps);this.__dataInstanceProps=null;}this.ready();}}/**
       * Calls the `_propertiesChanged` callback with the current set of
       * pending changes (and old values recorded when pending changes were
       * set), and resets the pending set of changes. Generally, this method
       * should not be called in user code.
       *
       * @return {void}
       * @protected
       */_flushProperties(){const props=this.__data;const changedProps=this.__dataPending;const old=this.__dataOld;if(this._shouldPropertiesChange(props,changedProps,old)){this.__dataPending=null;this.__dataOld=null;this._propertiesChanged(props,changedProps,old);}}/**
       * Called in `_flushProperties` to determine if `_propertiesChanged`
       * should be called. The default implementation returns true if
       * properties are pending. Override to customize when
       * `_propertiesChanged` is called.
       * @param {!Object} currentProps Bag of all current accessor values
       * @param {!Object} changedProps Bag of properties changed since the last
       *   call to `_propertiesChanged`
       * @param {!Object} oldProps Bag of previous values for each property
       *   in `changedProps`
       * @return {boolean} true if changedProps is truthy
       */_shouldPropertiesChange(currentProps,changedProps,oldProps){// eslint-disable-line no-unused-vars
return Boolean(changedProps);}/**
       * Callback called when any properties with accessors created via
       * `_createPropertyAccessor` have been set.
       *
       * @param {!Object} currentProps Bag of all current accessor values
       * @param {!Object} changedProps Bag of properties changed since the last
       *   call to `_propertiesChanged`
       * @param {!Object} oldProps Bag of previous values for each property
       *   in `changedProps`
       * @return {void}
       * @protected
       */_propertiesChanged(currentProps,changedProps,oldProps){}// eslint-disable-line no-unused-vars
/**
     * Method called to determine whether a property value should be
     * considered as a change and cause the `_propertiesChanged` callback
     * to be enqueued.
     *
     * The default implementation returns `true` if a strict equality
     * check fails. The method always returns false for `NaN`.
     *
     * Override this method to e.g. provide stricter checking for
     * Objects/Arrays when using immutable patterns.
     *
     * @param {string} property Property name
     * @param {*} value New property value
     * @param {*} old Previous property value
     * @return {boolean} Whether the property should be considered a change
     *   and enqueue a `_proeprtiesChanged` callback
     * @protected
     */_shouldPropertyChange(property,value,old){return(// Strict equality check
old!==value&&(// This ensures (old==NaN, value==NaN) always returns false
old===old||value===value));}/**
       * Implements native Custom Elements `attributeChangedCallback` to
       * set an attribute value to a property via `_attributeToProperty`.
       *
       * @param {string} name Name of attribute that changed
       * @param {?string} old Old attribute value
       * @param {?string} value New attribute value
       * @return {void}
       * @suppress {missingProperties} Super may or may not implement the callback
       */attributeChangedCallback(name,old,value){if(old!==value){this._attributeToProperty(name,value);}if(super.attributeChangedCallback){super.attributeChangedCallback(name,old,value);}}/**
       * Deserializes an attribute to its associated property.
       *
       * This method calls the `_deserializeValue` method to convert the string to
       * a typed value.
       *
       * @param {string} attribute Name of attribute to deserialize.
       * @param {?string} value of the attribute.
       * @param {*=} type type to deserialize to, defaults to the value
       * returned from `typeForProperty`
       * @return {void}
       */_attributeToProperty(attribute,value,type){if(!this.__serializing){const map=this.__dataAttributes;const property=map&&map[attribute]||attribute;this[property]=this._deserializeValue(value,type||this.constructor.typeForProperty(property));}}/**
       * Serializes a property to its associated attribute.
       *
       * @suppress {invalidCasts} Closure can't figure out `this` is an element.
       *
       * @param {string} property Property name to reflect.
       * @param {string=} attribute Attribute name to reflect to.
       * @param {*=} value Property value to refect.
       * @return {void}
       */_propertyToAttribute(property,attribute,value){this.__serializing=true;value=arguments.length<3?this[property]:value;this._valueToNodeAttribute(/** @type {!HTMLElement} */this,value,attribute||this.constructor.attributeNameForProperty(property));this.__serializing=false;}/**
       * Sets a typed value to an HTML attribute on a node.
       *
       * This method calls the `_serializeValue` method to convert the typed
       * value to a string.  If the `_serializeValue` method returns `undefined`,
       * the attribute will be removed (this is the default for boolean
       * type `false`).
       *
       * @param {Element} node Element to set attribute to.
       * @param {*} value Value to serialize.
       * @param {string} attribute Attribute name to serialize to.
       * @return {void}
       */_valueToNodeAttribute(node,value,attribute){const str=this._serializeValue(value);if(str===undefined){node.removeAttribute(attribute);}else{node.setAttribute(attribute,str);}}/**
       * Converts a typed JavaScript value to a string.
       *
       * This method is called when setting JS property values to
       * HTML attributes.  Users may override this method to provide
       * serialization for custom types.
       *
       * @param {*} value Property value to serialize.
       * @return {string | undefined} String serialized from the provided
       * property  value.
       */_serializeValue(value){switch(typeof value){case'boolean':return value?'':undefined;default:return value!=null?value.toString():undefined;}}/**
       * Converts a string to a typed JavaScript value.
       *
       * This method is called when reading HTML attribute values to
       * JS properties.  Users may override this method to provide
       * deserialization for custom `type`s. Types for `Boolean`, `String`,
       * and `Number` convert attributes to the expected types.
       *
       * @param {?string} value Value to deserialize.
       * @param {*=} type Type to deserialize the string to.
       * @return {*} Typed value deserialized from the provided string.
       */_deserializeValue(value,type){switch(type){case Boolean:return value!==null;case Number:return Number(value);default:return value;}}}return PropertiesChanged;});var propertiesChanged={PropertiesChanged:PropertiesChanged};let caseMap$1=caseMap$0;// Save map of native properties; this forms a blacklist or properties
// that won't have their values "saved" by `saveAccessorValue`, since
// reading from an HTMLElement accessor from the context of a prototype throws
const nativeProperties={};let proto=HTMLElement.prototype;while(proto){let props=Object.getOwnPropertyNames(proto);for(let i=0;i<props.length;i++){nativeProperties[props[i]]=true;}proto=Object.getPrototypeOf(proto);}/**
   * Used to save the value of a property that will be overridden with
   * an accessor. If the `model` is a prototype, the values will be saved
   * in `__dataProto`, and it's up to the user (or downstream mixin) to
   * decide how/when to set these values back into the accessors.
   * If `model` is already an instance (it has a `__data` property), then
   * the value will be set as a pending property, meaning the user should
   * call `_invalidateProperties` or `_flushProperties` to take effect
   *
   * @param {Object} model Prototype or instance
   * @param {string} property Name of property
   * @return {void}
   * @private
   */function saveAccessorValue(model,property){// Don't read/store value for any native properties since they could throw
if(!nativeProperties[property]){let value=model[property];if(value!==undefined){if(model.__data){// Adding accessor to instance; update the property
// It is the user's responsibility to call _flushProperties
model._setPendingProperty(property,value);}else{// Adding accessor to proto; save proto's value for instance-time use
if(!model.__dataProto){model.__dataProto={};}else if(!model.hasOwnProperty(JSCompiler_renameProperty('__dataProto',model))){model.__dataProto=Object.create(model.__dataProto);}model.__dataProto[property]=value;}}}}const PropertyAccessors=dedupingMixin(superClass=>{/**
   * @constructor
   * @extends {superClass}
   * @implements {Polymer_PropertiesChanged}
   * @unrestricted
   */const base=PropertiesChanged(superClass);/**
                                                  * @polymer
                                                  * @mixinClass
                                                  * @implements {Polymer_PropertyAccessors}
                                                  * @extends {base}
                                                  * @unrestricted
                                                  */class PropertyAccessors extends base{/**
     * Generates property accessors for all attributes in the standard
     * static `observedAttributes` array.
     *
     * Attribute names are mapped to property names using the `dash-case` to
     * `camelCase` convention
     *
     * @return {void}
     */static createPropertiesForAttributes(){let a$=this.observedAttributes;for(let i=0;i<a$.length;i++){this.prototype._createPropertyAccessor(caseMap$1.dashToCamelCase(a$[i]));}}/**
       * Returns an attribute name that corresponds to the given property.
       * By default, converts camel to dash case, e.g. `fooBar` to `foo-bar`.
       * @param {string} property Property to convert
       * @return {string} Attribute name corresponding to the given property.
       *
       * @protected
       */static attributeNameForProperty(property){return caseMap$1.camelToDashCase(property);}/**
       * Overrides PropertiesChanged implementation to initialize values for
       * accessors created for values that already existed on the element
       * prototype.
       *
       * @return {void}
       * @protected
       */_initializeProperties(){if(this.__dataProto){this._initializeProtoProperties(this.__dataProto);this.__dataProto=null;}super._initializeProperties();}/**
       * Called at instance time with bag of properties that were overwritten
       * by accessors on the prototype when accessors were created.
       *
       * The default implementation sets these properties back into the
       * setter at instance time.  This method is provided as an override
       * point for customizing or providing more efficient initialization.
       *
       * @param {Object} props Bag of property values that were overwritten
       *   when creating property accessors.
       * @return {void}
       * @protected
       */_initializeProtoProperties(props){for(let p in props){this._setProperty(p,props[p]);}}/**
       * Ensures the element has the given attribute. If it does not,
       * assigns the given value to the attribute.
       *
       * @suppress {invalidCasts} Closure can't figure out `this` is infact an element
       *
       * @param {string} attribute Name of attribute to ensure is set.
       * @param {string} value of the attribute.
       * @return {void}
       */_ensureAttribute(attribute,value){const el=/** @type {!HTMLElement} */this;if(!el.hasAttribute(attribute)){this._valueToNodeAttribute(el,value,attribute);}}/**
       * Overrides PropertiesChanged implemention to serialize objects as JSON.
       *
       * @param {*} value Property value to serialize.
       * @return {string | undefined} String serialized from the provided property value.
       */_serializeValue(value){/* eslint-disable no-fallthrough */switch(typeof value){case'object':if(value instanceof Date){return value.toString();}else if(value){try{return JSON.stringify(value);}catch(x){return'';}}default:return super._serializeValue(value);}}/**
       * Converts a string to a typed JavaScript value.
       *
       * This method is called by Polymer when reading HTML attribute values to
       * JS properties.  Users may override this method on Polymer element
       * prototypes to provide deserialization for custom `type`s.  Note,
       * the `type` argument is the value of the `type` field provided in the
       * `properties` configuration object for a given property, and is
       * by convention the constructor for the type to deserialize.
       *
       *
       * @param {?string} value Attribute value to deserialize.
       * @param {*=} type Type to deserialize the string to.
       * @return {*} Typed value deserialized from the provided string.
       */_deserializeValue(value,type){/**
       * @type {*}
       */let outValue;switch(type){case Object:try{outValue=JSON.parse(/** @type {string} */value);}catch(x){// allow non-JSON literals like Strings and Numbers
outValue=value;}break;case Array:try{outValue=JSON.parse(/** @type {string} */value);}catch(x){outValue=null;console.warn(`Polymer::Attributes: couldn't decode Array as JSON: ${value}`);}break;case Date:outValue=isNaN(value)?String(value):Number(value);outValue=new Date(outValue);break;default:outValue=super._deserializeValue(value,type);break;}return outValue;}/* eslint-enable no-fallthrough */ /**
                                          * Overrides PropertiesChanged implementation to save existing prototype
                                          * property value so that it can be reset.
                                          * @param {string} property Name of the property
                                          * @param {boolean=} readOnly When true, no setter is created
                                          *
                                          * When calling on a prototype, any overwritten values are saved in
                                          * `__dataProto`, and it is up to the subclasser to decide how/when
                                          * to set those properties back into the accessor.  When calling on an
                                          * instance, the overwritten value is set via `_setPendingProperty`,
                                          * and the user should call `_invalidateProperties` or `_flushProperties`
                                          * for the values to take effect.
                                          * @protected
                                          * @return {void}
                                          */_definePropertyAccessor(property,readOnly){saveAccessorValue(this,property);super._definePropertyAccessor(property,readOnly);}/**
       * Returns true if this library created an accessor for the given property.
       *
       * @param {string} property Property name
       * @return {boolean} True if an accessor was created
       */_hasAccessor(property){return this.__dataHasAccessor&&this.__dataHasAccessor[property];}/**
       * Returns true if the specified property has a pending change.
       *
       * @param {string} prop Property name
       * @return {boolean} True if property has a pending change
       * @protected
       */_isPropertyPending(prop){return Boolean(this.__dataPending&&prop in this.__dataPending);}}return PropertyAccessors;});var propertyAccessors={PropertyAccessors:PropertyAccessors};// 1.x backwards-compatible auto-wrapper for template type extensions
// This is a clear layering violation and gives favored-nation status to
// dom-if and dom-repeat templates.  This is a conceit we're choosing to keep
// a.) to ease 1.x backwards-compatibility due to loss of `is`, and
// b.) to maintain if/repeat capability in parser-constrained elements
//     (e.g. table, select) in lieu of native CE type extensions without
//     massive new invention in this space (e.g. directive system)
const templateExtensions={'dom-if':true,'dom-repeat':true};function wrapTemplateExtension(node){let is=node.getAttribute('is');if(is&&templateExtensions[is]){let t=node;t.removeAttribute('is');node=t.ownerDocument.createElement(is);t.parentNode.replaceChild(node,t);node.appendChild(t);while(t.attributes.length){node.setAttribute(t.attributes[0].name,t.attributes[0].value);t.removeAttribute(t.attributes[0].name);}}return node;}function findTemplateNode(root,nodeInfo){// recursively ascend tree until we hit root
let parent=nodeInfo.parentInfo&&findTemplateNode(root,nodeInfo.parentInfo);// unwind the stack, returning the indexed node at each level
if(parent){// note: marginally faster than indexing via childNodes
// (http://jsperf.com/childnodes-lookup)
for(let n=parent.firstChild,i=0;n;n=n.nextSibling){if(nodeInfo.parentIndex===i++){return n;}}}else{return root;}}// construct `$` map (from id annotations)
function applyIdToMap(inst,map,node,nodeInfo){if(nodeInfo.id){map[nodeInfo.id]=node;}}// install event listeners (from event annotations)
function applyEventListener(inst,node,nodeInfo){if(nodeInfo.events&&nodeInfo.events.length){for(let j=0,e$=nodeInfo.events,e;j<e$.length&&(e=e$[j]);j++){inst._addMethodEventListenerToNode(node,e.name,e.value,inst);}}}// push configuration references at configure time
function applyTemplateContent(inst,node,nodeInfo){if(nodeInfo.templateInfo){node._templateInfo=nodeInfo.templateInfo;}}function createNodeEventHandler(context,eventName,methodName){// Instances can optionally have a _methodHost which allows redirecting where
// to find methods. Currently used by `templatize`.
context=context._methodHost||context;let handler=function(e){if(context[methodName]){context[methodName](e,e.detail);}else{console.warn('listener method `'+methodName+'` not defined');}};return handler;}const TemplateStamp=dedupingMixin(superClass=>{/**
   * @polymer
   * @mixinClass
   * @implements {Polymer_TemplateStamp}
   */class TemplateStamp extends superClass{/**
     * Scans a template to produce template metadata.
     *
     * Template-specific metadata are stored in the object returned, and node-
     * specific metadata are stored in objects in its flattened `nodeInfoList`
     * array.  Only nodes in the template that were parsed as nodes of
     * interest contain an object in `nodeInfoList`.  Each `nodeInfo` object
     * contains an `index` (`childNodes` index in parent) and optionally
     * `parent`, which points to node info of its parent (including its index).
     *
     * The template metadata object returned from this method has the following
     * structure (many fields optional):
     *
     * ```js
     *   {
     *     // Flattened list of node metadata (for nodes that generated metadata)
     *     nodeInfoList: [
     *       {
     *         // `id` attribute for any nodes with id's for generating `$` map
     *         id: {string},
     *         // `on-event="handler"` metadata
     *         events: [
     *           {
     *             name: {string},   // event name
     *             value: {string},  // handler method name
     *           }, ...
     *         ],
     *         // Notes when the template contained a `<slot>` for shady DOM
     *         // optimization purposes
     *         hasInsertionPoint: {boolean},
     *         // For nested `<template>`` nodes, nested template metadata
     *         templateInfo: {object}, // nested template metadata
     *         // Metadata to allow efficient retrieval of instanced node
     *         // corresponding to this metadata
     *         parentInfo: {number},   // reference to parent nodeInfo>
     *         parentIndex: {number},  // index in parent's `childNodes` collection
     *         infoIndex: {number},    // index of this `nodeInfo` in `templateInfo.nodeInfoList`
     *       },
     *       ...
     *     ],
     *     // When true, the template had the `strip-whitespace` attribute
     *     // or was nested in a template with that setting
     *     stripWhitespace: {boolean},
     *     // For nested templates, nested template content is moved into
     *     // a document fragment stored here; this is an optimization to
     *     // avoid the cost of nested template cloning
     *     content: {DocumentFragment}
     *   }
     * ```
     *
     * This method kicks off a recursive treewalk as follows:
     *
     * ```
     *    _parseTemplate <---------------------+
     *      _parseTemplateContent              |
     *        _parseTemplateNode  <------------|--+
     *          _parseTemplateNestedTemplate --+  |
     *          _parseTemplateChildNodes ---------+
     *          _parseTemplateNodeAttributes
     *            _parseTemplateNodeAttribute
     *
     * ```
     *
     * These methods may be overridden to add custom metadata about templates
     * to either `templateInfo` or `nodeInfo`.
     *
     * Note that this method may be destructive to the template, in that
     * e.g. event annotations may be removed after being noted in the
     * template metadata.
     *
     * @param {!HTMLTemplateElement} template Template to parse
     * @param {TemplateInfo=} outerTemplateInfo Template metadata from the outer
     *   template, for parsing nested templates
     * @return {!TemplateInfo} Parsed template metadata
     */static _parseTemplate(template,outerTemplateInfo){// since a template may be re-used, memo-ize metadata
if(!template._templateInfo){let templateInfo=template._templateInfo={};templateInfo.nodeInfoList=[];templateInfo.stripWhiteSpace=outerTemplateInfo&&outerTemplateInfo.stripWhiteSpace||template.hasAttribute('strip-whitespace');this._parseTemplateContent(template,templateInfo,{parent:null});}return template._templateInfo;}static _parseTemplateContent(template,templateInfo,nodeInfo){return this._parseTemplateNode(template.content,templateInfo,nodeInfo);}/**
       * Parses template node and adds template and node metadata based on
       * the current node, and its `childNodes` and `attributes`.
       *
       * This method may be overridden to add custom node or template specific
       * metadata based on this node.
       *
       * @param {Node} node Node to parse
       * @param {!TemplateInfo} templateInfo Template metadata for current template
       * @param {!NodeInfo} nodeInfo Node metadata for current template.
       * @return {boolean} `true` if the visited node added node-specific
       *   metadata to `nodeInfo`
       */static _parseTemplateNode(node,templateInfo,nodeInfo){let noted;let element=/** @type {Element} */node;if(element.localName=='template'&&!element.hasAttribute('preserve-content')){noted=this._parseTemplateNestedTemplate(element,templateInfo,nodeInfo)||noted;}else if(element.localName==='slot'){// For ShadyDom optimization, indicating there is an insertion point
templateInfo.hasInsertionPoint=true;}if(element.firstChild){noted=this._parseTemplateChildNodes(element,templateInfo,nodeInfo)||noted;}if(element.hasAttributes&&element.hasAttributes()){noted=this._parseTemplateNodeAttributes(element,templateInfo,nodeInfo)||noted;}return noted;}/**
       * Parses template child nodes for the given root node.
       *
       * This method also wraps whitelisted legacy template extensions
       * (`is="dom-if"` and `is="dom-repeat"`) with their equivalent element
       * wrappers, collapses text nodes, and strips whitespace from the template
       * if the `templateInfo.stripWhitespace` setting was provided.
       *
       * @param {Node} root Root node whose `childNodes` will be parsed
       * @param {!TemplateInfo} templateInfo Template metadata for current template
       * @param {!NodeInfo} nodeInfo Node metadata for current template.
       * @return {void}
       */static _parseTemplateChildNodes(root,templateInfo,nodeInfo){if(root.localName==='script'||root.localName==='style'){return;}for(let node=root.firstChild,parentIndex=0,next;node;node=next){// Wrap templates
if(node.localName=='template'){node=wrapTemplateExtension(node);}// collapse adjacent textNodes: fixes an IE issue that can cause
// text nodes to be inexplicably split =(
// note that root.normalize() should work but does not so we do this
// manually.
next=node.nextSibling;if(node.nodeType===Node.TEXT_NODE){let/** Node */n=next;while(n&&n.nodeType===Node.TEXT_NODE){node.textContent+=n.textContent;next=n.nextSibling;root.removeChild(n);n=next;}// optionally strip whitespace
if(templateInfo.stripWhiteSpace&&!node.textContent.trim()){root.removeChild(node);continue;}}let childInfo={parentIndex,parentInfo:nodeInfo};if(this._parseTemplateNode(node,templateInfo,childInfo)){childInfo.infoIndex=templateInfo.nodeInfoList.push(/** @type {!NodeInfo} */childInfo)-1;}// Increment if not removed
if(node.parentNode){parentIndex++;}}}/**
       * Parses template content for the given nested `<template>`.
       *
       * Nested template info is stored as `templateInfo` in the current node's
       * `nodeInfo`. `template.content` is removed and stored in `templateInfo`.
       * It will then be the responsibility of the host to set it back to the
       * template and for users stamping nested templates to use the
       * `_contentForTemplate` method to retrieve the content for this template
       * (an optimization to avoid the cost of cloning nested template content).
       *
       * @param {HTMLTemplateElement} node Node to parse (a <template>)
       * @param {TemplateInfo} outerTemplateInfo Template metadata for current template
       *   that includes the template `node`
       * @param {!NodeInfo} nodeInfo Node metadata for current template.
       * @return {boolean} `true` if the visited node added node-specific
       *   metadata to `nodeInfo`
       */static _parseTemplateNestedTemplate(node,outerTemplateInfo,nodeInfo){let templateInfo=this._parseTemplate(node,outerTemplateInfo);let content=templateInfo.content=node.content.ownerDocument.createDocumentFragment();content.appendChild(node.content);nodeInfo.templateInfo=templateInfo;return true;}/**
       * Parses template node attributes and adds node metadata to `nodeInfo`
       * for nodes of interest.
       *
       * @param {Element} node Node to parse
       * @param {TemplateInfo} templateInfo Template metadata for current template
       * @param {NodeInfo} nodeInfo Node metadata for current template.
       * @return {boolean} `true` if the visited node added node-specific
       *   metadata to `nodeInfo`
       */static _parseTemplateNodeAttributes(node,templateInfo,nodeInfo){// Make copy of original attribute list, since the order may change
// as attributes are added and removed
let noted=false;let attrs=Array.from(node.attributes);for(let i=attrs.length-1,a;a=attrs[i];i--){noted=this._parseTemplateNodeAttribute(node,templateInfo,nodeInfo,a.name,a.value)||noted;}return noted;}/**
       * Parses a single template node attribute and adds node metadata to
       * `nodeInfo` for attributes of interest.
       *
       * This implementation adds metadata for `on-event="handler"` attributes
       * and `id` attributes.
       *
       * @param {Element} node Node to parse
       * @param {!TemplateInfo} templateInfo Template metadata for current template
       * @param {!NodeInfo} nodeInfo Node metadata for current template.
       * @param {string} name Attribute name
       * @param {string} value Attribute value
       * @return {boolean} `true` if the visited node added node-specific
       *   metadata to `nodeInfo`
       */static _parseTemplateNodeAttribute(node,templateInfo,nodeInfo,name,value){// events (on-*)
if(name.slice(0,3)==='on-'){node.removeAttribute(name);nodeInfo.events=nodeInfo.events||[];nodeInfo.events.push({name:name.slice(3),value});return true;}// static id
else if(name==='id'){nodeInfo.id=value;return true;}return false;}/**
       * Returns the `content` document fragment for a given template.
       *
       * For nested templates, Polymer performs an optimization to cache nested
       * template content to avoid the cost of cloning deeply nested templates.
       * This method retrieves the cached content for a given template.
       *
       * @param {HTMLTemplateElement} template Template to retrieve `content` for
       * @return {DocumentFragment} Content fragment
       */static _contentForTemplate(template){let templateInfo=/** @type {HTMLTemplateElementWithInfo} */template._templateInfo;return templateInfo&&templateInfo.content||template.content;}/**
       * Clones the provided template content and returns a document fragment
       * containing the cloned dom.
       *
       * The template is parsed (once and memoized) using this library's
       * template parsing features, and provides the following value-added
       * features:
       * * Adds declarative event listeners for `on-event="handler"` attributes
       * * Generates an "id map" for all nodes with id's under `$` on returned
       *   document fragment
       * * Passes template info including `content` back to templates as
       *   `_templateInfo` (a performance optimization to avoid deep template
       *   cloning)
       *
       * Note that the memoized template parsing process is destructive to the
       * template: attributes for bindings and declarative event listeners are
       * removed after being noted in notes, and any nested `<template>.content`
       * is removed and stored in notes as well.
       *
       * @param {!HTMLTemplateElement} template Template to stamp
       * @return {!StampedTemplate} Cloned template content
       */_stampTemplate(template){// Polyfill support: bootstrap the template if it has not already been
if(template&&!template.content&&window.HTMLTemplateElement&&HTMLTemplateElement.decorate){HTMLTemplateElement.decorate(template);}let templateInfo=this.constructor._parseTemplate(template);let nodeInfo=templateInfo.nodeInfoList;let content=templateInfo.content||template.content;let dom=/** @type {DocumentFragment} */document.importNode(content,true);// NOTE: ShadyDom optimization indicating there is an insertion point
dom.__noInsertionPoint=!templateInfo.hasInsertionPoint;let nodes=dom.nodeList=new Array(nodeInfo.length);dom.$={};for(let i=0,l=nodeInfo.length,info;i<l&&(info=nodeInfo[i]);i++){let node=nodes[i]=findTemplateNode(dom,info);applyIdToMap(this,dom.$,node,info);applyTemplateContent(this,node,info);applyEventListener(this,node,info);}dom=/** @type {!StampedTemplate} */dom;// eslint-disable-line no-self-assign
return dom;}/**
       * Adds an event listener by method name for the event provided.
       *
       * This method generates a handler function that looks up the method
       * name at handling time.
       *
       * @param {!Node} node Node to add listener on
       * @param {string} eventName Name of event
       * @param {string} methodName Name of method
       * @param {*=} context Context the method will be called on (defaults
       *   to `node`)
       * @return {Function} Generated handler function
       */_addMethodEventListenerToNode(node,eventName,methodName,context){context=context||node;let handler=createNodeEventHandler(context,eventName,methodName);this._addEventListenerToNode(node,eventName,handler);return handler;}/**
       * Override point for adding custom or simulated event handling.
       *
       * @param {!Node} node Node to add event listener to
       * @param {string} eventName Name of event
       * @param {function(!Event):void} handler Listener function to add
       * @return {void}
       */_addEventListenerToNode(node,eventName,handler){node.addEventListener(eventName,handler);}/**
       * Override point for adding custom or simulated event handling.
       *
       * @param {Node} node Node to remove event listener from
       * @param {string} eventName Name of event
       * @param {function(!Event):void} handler Listener function to remove
       * @return {void}
       */_removeEventListenerFromNode(node,eventName,handler){node.removeEventListener(eventName,handler);}}return TemplateStamp;});var templateStamp={TemplateStamp:TemplateStamp};/** @const {Object} */const CaseMap=caseMap$0;// Monotonically increasing unique ID used for de-duping effects triggered
// from multiple properties in the same turn
let dedupeId$1=0;/**
                     * Property effect types; effects are stored on the prototype using these keys
                     * @enum {string}
                     */const TYPES={COMPUTE:'__computeEffects',REFLECT:'__reflectEffects',NOTIFY:'__notifyEffects',PROPAGATE:'__propagateEffects',OBSERVE:'__observeEffects',READ_ONLY:'__readOnly'};/** @const {string} */const capitalAttributeRegex=/[A-Z]/;/**
                                        * @typedef {{
                                        * name: (string | undefined),
                                        * structured: (boolean | undefined),
                                        * wildcard: (boolean | undefined)
                                        * }}
                                        */let DataTrigger;//eslint-disable-line no-unused-vars
/**
 * @typedef {{
 * info: ?,
 * trigger: (!DataTrigger | undefined),
 * fn: (!Function | undefined)
 * }}
 */let DataEffect;//eslint-disable-line no-unused-vars
let PropertyEffectsType;//eslint-disable-line no-unused-vars
/**
 * Ensures that the model has an own-property map of effects for the given type.
 * The model may be a prototype or an instance.
 *
 * Property effects are stored as arrays of effects by property in a map,
 * by named type on the model. e.g.
 *
 *   __computeEffects: {
 *     foo: [ ... ],
 *     bar: [ ... ]
 *   }
 *
 * If the model does not yet have an effect map for the type, one is created
 * and returned.  If it does, but it is not an own property (i.e. the
 * prototype had effects), the the map is deeply cloned and the copy is
 * set on the model and returned, ready for new effects to be added.
 *
 * @param {Object} model Prototype or instance
 * @param {string} type Property effect type
 * @return {Object} The own-property map of effects for the given type
 * @private
 */function ensureOwnEffectMap(model,type){let effects=model[type];if(!effects){effects=model[type]={};}else if(!model.hasOwnProperty(type)){effects=model[type]=Object.create(model[type]);for(let p in effects){let protoFx=effects[p];let instFx=effects[p]=Array(protoFx.length);for(let i=0;i<protoFx.length;i++){instFx[i]=protoFx[i];}}}return effects;}// -- effects ----------------------------------------------
/**
 * Runs all effects of a given type for the given set of property changes
 * on an instance.
 *
 * @param {!PropertyEffectsType} inst The instance with effects to run
 * @param {Object} effects Object map of property-to-Array of effects
 * @param {Object} props Bag of current property changes
 * @param {Object=} oldProps Bag of previous values for changed properties
 * @param {boolean=} hasPaths True with `props` contains one or more paths
 * @param {*=} extraArgs Additional metadata to pass to effect function
 * @return {boolean} True if an effect ran for this property
 * @private
 */function runEffects(inst,effects,props,oldProps,hasPaths,extraArgs){if(effects){let ran=false;let id=dedupeId$1++;for(let prop in props){if(runEffectsForProperty(inst,effects,id,prop,props,oldProps,hasPaths,extraArgs)){ran=true;}}return ran;}return false;}/**
   * Runs a list of effects for a given property.
   *
   * @param {!PropertyEffectsType} inst The instance with effects to run
   * @param {Object} effects Object map of property-to-Array of effects
   * @param {number} dedupeId Counter used for de-duping effects
   * @param {string} prop Name of changed property
   * @param {*} props Changed properties
   * @param {*} oldProps Old properties
   * @param {boolean=} hasPaths True with `props` contains one or more paths
   * @param {*=} extraArgs Additional metadata to pass to effect function
   * @return {boolean} True if an effect ran for this property
   * @private
   */function runEffectsForProperty(inst,effects,dedupeId,prop,props,oldProps,hasPaths,extraArgs){let ran=false;let rootProperty=hasPaths?root(prop):prop;let fxs=effects[rootProperty];if(fxs){for(let i=0,l=fxs.length,fx;i<l&&(fx=fxs[i]);i++){if((!fx.info||fx.info.lastRun!==dedupeId)&&(!hasPaths||pathMatchesTrigger(prop,fx.trigger))){if(fx.info){fx.info.lastRun=dedupeId;}fx.fn(inst,prop,props,oldProps,fx.info,hasPaths,extraArgs);ran=true;}}}return ran;}/**
   * Determines whether a property/path that has changed matches the trigger
   * criteria for an effect.  A trigger is a descriptor with the following
   * structure, which matches the descriptors returned from `parseArg`.
   * e.g. for `foo.bar.*`:
   * ```
   * trigger: {
   *   name: 'a.b',
   *   structured: true,
   *   wildcard: true
   * }
   * ```
   * If no trigger is given, the path is deemed to match.
   *
   * @param {string} path Path or property that changed
   * @param {DataTrigger} trigger Descriptor
   * @return {boolean} Whether the path matched the trigger
   */function pathMatchesTrigger(path,trigger){if(trigger){let triggerPath=trigger.name;return triggerPath==path||trigger.structured&&isAncestor(triggerPath,path)||trigger.wildcard&&isDescendant(triggerPath,path);}else{return true;}}/**
   * Implements the "observer" effect.
   *
   * Calls the method with `info.methodName` on the instance, passing the
   * new and old values.
   *
   * @param {!PropertyEffectsType} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {Object} props Bag of current property changes
   * @param {Object} oldProps Bag of previous values for changed properties
   * @param {?} info Effect metadata
   * @return {void}
   * @private
   */function runObserverEffect(inst,property,props,oldProps,info){let fn=typeof info.method==="string"?inst[info.method]:info.method;let changedProp=info.property;if(fn){fn.call(inst,inst.__data[changedProp],oldProps[changedProp]);}else if(!info.dynamicFn){console.warn('observer method `'+info.method+'` not defined');}}/**
   * Runs "notify" effects for a set of changed properties.
   *
   * This method differs from the generic `runEffects` method in that it
   * will dispatch path notification events in the case that the property
   * changed was a path and the root property for that path didn't have a
   * "notify" effect.  This is to maintain 1.0 behavior that did not require
   * `notify: true` to ensure object sub-property notifications were
   * sent.
   *
   * @param {!PropertyEffectsType} inst The instance with effects to run
   * @param {Object} notifyProps Bag of properties to notify
   * @param {Object} props Bag of current property changes
   * @param {Object} oldProps Bag of previous values for changed properties
   * @param {boolean} hasPaths True with `props` contains one or more paths
   * @return {void}
   * @private
   */function runNotifyEffects(inst,notifyProps,props,oldProps,hasPaths){// Notify
let fxs=inst[TYPES.NOTIFY];let notified;let id=dedupeId$1++;// Try normal notify effects; if none, fall back to try path notification
for(let prop in notifyProps){if(notifyProps[prop]){if(fxs&&runEffectsForProperty(inst,fxs,id,prop,props,oldProps,hasPaths)){notified=true;}else if(hasPaths&&notifyPath(inst,prop,props)){notified=true;}}}// Flush host if we actually notified and host was batching
// And the host has already initialized clients; this prevents
// an issue with a host observing data changes before clients are ready.
let host;if(notified&&(host=inst.__dataHost)&&host._invalidateProperties){host._invalidateProperties();}}/**
   * Dispatches {property}-changed events with path information in the detail
   * object to indicate a sub-path of the property was changed.
   *
   * @param {!PropertyEffectsType} inst The element from which to fire the event
   * @param {string} path The path that was changed
   * @param {Object} props Bag of current property changes
   * @return {boolean} Returns true if the path was notified
   * @private
   */function notifyPath(inst,path,props){let rootProperty=root(path);if(rootProperty!==path){let eventName=camelToDashCase(rootProperty)+'-changed';dispatchNotifyEvent(inst,eventName,props[path],path);return true;}return false;}/**
   * Dispatches {property}-changed events to indicate a property (or path)
   * changed.
   *
   * @param {!PropertyEffectsType} inst The element from which to fire the event
   * @param {string} eventName The name of the event to send ('{property}-changed')
   * @param {*} value The value of the changed property
   * @param {string | null | undefined} path If a sub-path of this property changed, the path
   *   that changed (optional).
   * @return {void}
   * @private
   * @suppress {invalidCasts}
   */function dispatchNotifyEvent(inst,eventName,value,path){let detail={value:value,queueProperty:true};if(path){detail.path=path;}/** @type {!HTMLElement} */inst.dispatchEvent(new CustomEvent(eventName,{detail}));}/**
   * Implements the "notify" effect.
   *
   * Dispatches a non-bubbling event named `info.eventName` on the instance
   * with a detail object containing the new `value`.
   *
   * @param {!PropertyEffectsType} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {Object} props Bag of current property changes
   * @param {Object} oldProps Bag of previous values for changed properties
   * @param {?} info Effect metadata
   * @param {boolean} hasPaths True with `props` contains one or more paths
   * @return {void}
   * @private
   */function runNotifyEffect(inst,property,props,oldProps,info,hasPaths){let rootProperty=hasPaths?root(property):property;let path=rootProperty!=property?property:null;let value=path?get(inst,path):inst.__data[property];if(path&&value===undefined){value=props[property];// specifically for .splices
}dispatchNotifyEvent(inst,info.eventName,value,path);}/**
   * Handler function for 2-way notification events. Receives context
   * information captured in the `addNotifyListener` closure from the
   * `__notifyListeners` metadata.
   *
   * Sets the value of the notified property to the host property or path.  If
   * the event contained path information, translate that path to the host
   * scope's name for that path first.
   *
   * @param {CustomEvent} event Notification event (e.g. '<property>-changed')
   * @param {!PropertyEffectsType} inst Host element instance handling the notification event
   * @param {string} fromProp Child element property that was bound
   * @param {string} toPath Host property/path that was bound
   * @param {boolean} negate Whether the binding was negated
   * @return {void}
   * @private
   */function handleNotification(event,inst,fromProp,toPath,negate){let value;let detail=/** @type {Object} */event.detail;let fromPath=detail&&detail.path;if(fromPath){toPath=translate(fromProp,toPath,fromPath);value=detail&&detail.value;}else{value=event.target[fromProp];}value=negate?!value:value;if(!inst[TYPES.READ_ONLY]||!inst[TYPES.READ_ONLY][toPath]){if(inst._setPendingPropertyOrPath(toPath,value,true,Boolean(fromPath))&&(!detail||!detail.queueProperty)){inst._invalidateProperties();}}}/**
   * Implements the "reflect" effect.
   *
   * Sets the attribute named `info.attrName` to the given property value.
   *
   * @param {!PropertyEffectsType} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {Object} props Bag of current property changes
   * @param {Object} oldProps Bag of previous values for changed properties
   * @param {?} info Effect metadata
   * @return {void}
   * @private
   */function runReflectEffect(inst,property,props,oldProps,info){let value=inst.__data[property];if(sanitizeDOMValue){value=sanitizeDOMValue(value,info.attrName,'attribute',/** @type {Node} */inst);}inst._propertyToAttribute(property,info.attrName,value);}/**
   * Runs "computed" effects for a set of changed properties.
   *
   * This method differs from the generic `runEffects` method in that it
   * continues to run computed effects based on the output of each pass until
   * there are no more newly computed properties.  This ensures that all
   * properties that will be computed by the initial set of changes are
   * computed before other effects (binding propagation, observers, and notify)
   * run.
   *
   * @param {!PropertyEffectsType} inst The instance the effect will be run on
   * @param {!Object} changedProps Bag of changed properties
   * @param {!Object} oldProps Bag of previous values for changed properties
   * @param {boolean} hasPaths True with `props` contains one or more paths
   * @return {void}
   * @private
   */function runComputedEffects(inst,changedProps,oldProps,hasPaths){let computeEffects=inst[TYPES.COMPUTE];if(computeEffects){let inputProps=changedProps;while(runEffects(inst,computeEffects,inputProps,oldProps,hasPaths)){Object.assign(oldProps,inst.__dataOld);Object.assign(changedProps,inst.__dataPending);inputProps=inst.__dataPending;inst.__dataPending=null;}}}/**
   * Implements the "computed property" effect by running the method with the
   * values of the arguments specified in the `info` object and setting the
   * return value to the computed property specified.
   *
   * @param {!PropertyEffectsType} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {Object} props Bag of current property changes
   * @param {Object} oldProps Bag of previous values for changed properties
   * @param {?} info Effect metadata
   * @return {void}
   * @private
   */function runComputedEffect(inst,property,props,oldProps,info){let result=runMethodEffect(inst,property,props,oldProps,info);let computedProp=info.methodInfo;if(inst.__dataHasAccessor&&inst.__dataHasAccessor[computedProp]){inst._setPendingProperty(computedProp,result,true);}else{inst[computedProp]=result;}}/**
   * Computes path changes based on path links set up using the `linkPaths`
   * API.
   *
   * @param {!PropertyEffectsType} inst The instance whose props are changing
   * @param {string | !Array<(string|number)>} path Path that has changed
   * @param {*} value Value of changed path
   * @return {void}
   * @private
   */function computeLinkedPaths(inst,path,value){let links=inst.__dataLinkedPaths;if(links){let link;for(let a in links){let b=links[a];if(isDescendant(a,path)){link=translate(a,b,path);inst._setPendingPropertyOrPath(link,value,true,true);}else if(isDescendant(b,path)){link=translate(b,a,path);inst._setPendingPropertyOrPath(link,value,true,true);}}}}// -- bindings ----------------------------------------------
/**
 * Adds binding metadata to the current `nodeInfo`, and binding effects
 * for all part dependencies to `templateInfo`.
 *
 * @param {Function} constructor Class that `_parseTemplate` is currently
 *   running on
 * @param {TemplateInfo} templateInfo Template metadata for current template
 * @param {NodeInfo} nodeInfo Node metadata for current template node
 * @param {string} kind Binding kind, either 'property', 'attribute', or 'text'
 * @param {string} target Target property name
 * @param {!Array<!BindingPart>} parts Array of binding part metadata
 * @param {string=} literal Literal text surrounding binding parts (specified
 *   only for 'property' bindings, since these must be initialized as part
 *   of boot-up)
 * @return {void}
 * @private
 */function addBinding(constructor,templateInfo,nodeInfo,kind,target,parts,literal){// Create binding metadata and add to nodeInfo
nodeInfo.bindings=nodeInfo.bindings||[];let/** Binding */binding={kind,target,parts,literal,isCompound:parts.length!==1};nodeInfo.bindings.push(binding);// Add listener info to binding metadata
if(shouldAddListener(binding)){let{event,negate}=binding.parts[0];binding.listenerEvent=event||CaseMap.camelToDashCase(target)+'-changed';binding.listenerNegate=negate;}// Add "propagate" property effects to templateInfo
let index=templateInfo.nodeInfoList.length;for(let i=0;i<binding.parts.length;i++){let part=binding.parts[i];part.compoundIndex=i;addEffectForBindingPart(constructor,templateInfo,binding,part,index);}}/**
   * Adds property effects to the given `templateInfo` for the given binding
   * part.
   *
   * @param {Function} constructor Class that `_parseTemplate` is currently
   *   running on
   * @param {TemplateInfo} templateInfo Template metadata for current template
   * @param {!Binding} binding Binding metadata
   * @param {!BindingPart} part Binding part metadata
   * @param {number} index Index into `nodeInfoList` for this node
   * @return {void}
   */function addEffectForBindingPart(constructor,templateInfo,binding,part,index){if(!part.literal){if(binding.kind==='attribute'&&binding.target[0]==='-'){console.warn('Cannot set attribute '+binding.target+' because "-" is not a valid attribute starting character');}else{let dependencies=part.dependencies;let info={index,binding,part,evaluator:constructor};for(let j=0;j<dependencies.length;j++){let trigger=dependencies[j];if(typeof trigger=='string'){trigger=parseArg(trigger);trigger.wildcard=true;}constructor._addTemplatePropertyEffect(templateInfo,trigger.rootProperty,{fn:runBindingEffect,info,trigger});}}}}/**
   * Implements the "binding" (property/path binding) effect.
   *
   * Note that binding syntax is overridable via `_parseBindings` and
   * `_evaluateBinding`.  This method will call `_evaluateBinding` for any
   * non-literal parts returned from `_parseBindings`.  However,
   * there is no support for _path_ bindings via custom binding parts,
   * as this is specific to Polymer's path binding syntax.
   *
   * @param {!PropertyEffectsType} inst The instance the effect will be run on
   * @param {string} path Name of property
   * @param {Object} props Bag of current property changes
   * @param {Object} oldProps Bag of previous values for changed properties
   * @param {?} info Effect metadata
   * @param {boolean} hasPaths True with `props` contains one or more paths
   * @param {Array} nodeList List of nodes associated with `nodeInfoList` template
   *   metadata
   * @return {void}
   * @private
   */function runBindingEffect(inst,path,props,oldProps,info,hasPaths,nodeList){let node=nodeList[info.index];let binding=info.binding;let part=info.part;// Subpath notification: transform path and set to client
// e.g.: foo="{{obj.sub}}", path: 'obj.sub.prop', set 'foo.prop'=obj.sub.prop
if(hasPaths&&part.source&&path.length>part.source.length&&binding.kind=='property'&&!binding.isCompound&&node.__isPropertyEffectsClient&&node.__dataHasAccessor&&node.__dataHasAccessor[binding.target]){let value=props[path];path=translate(part.source,binding.target,path);if(node._setPendingPropertyOrPath(path,value,false,true)){inst._enqueueClient(node);}}else{let value=info.evaluator._evaluateBinding(inst,part,path,props,oldProps,hasPaths);// Propagate value to child
applyBindingValue(inst,node,binding,part,value);}}/**
   * Sets the value for an "binding" (binding) effect to a node,
   * either as a property or attribute.
   *
   * @param {!PropertyEffectsType} inst The instance owning the binding effect
   * @param {Node} node Target node for binding
   * @param {!Binding} binding Binding metadata
   * @param {!BindingPart} part Binding part metadata
   * @param {*} value Value to set
   * @return {void}
   * @private
   */function applyBindingValue(inst,node,binding,part,value){value=computeBindingValue(node,value,binding,part);if(sanitizeDOMValue){value=sanitizeDOMValue(value,binding.target,binding.kind,node);}if(binding.kind=='attribute'){// Attribute binding
inst._valueToNodeAttribute(/** @type {Element} */node,value,binding.target);}else{// Property binding
let prop=binding.target;if(node.__isPropertyEffectsClient&&node.__dataHasAccessor&&node.__dataHasAccessor[prop]){if(!node[TYPES.READ_ONLY]||!node[TYPES.READ_ONLY][prop]){if(node._setPendingProperty(prop,value)){inst._enqueueClient(node);}}}else{inst._setUnmanagedPropertyToNode(node,prop,value);}}}/**
   * Transforms an "binding" effect value based on compound & negation
   * effect metadata, as well as handling for special-case properties
   *
   * @param {Node} node Node the value will be set to
   * @param {*} value Value to set
   * @param {!Binding} binding Binding metadata
   * @param {!BindingPart} part Binding part metadata
   * @return {*} Transformed value to set
   * @private
   */function computeBindingValue(node,value,binding,part){if(binding.isCompound){let storage=node.__dataCompoundStorage[binding.target];storage[part.compoundIndex]=value;value=storage.join('');}if(binding.kind!=='attribute'){// Some browsers serialize `undefined` to `"undefined"`
if(binding.target==='textContent'||binding.target==='value'&&(node.localName==='input'||node.localName==='textarea')){value=value==undefined?'':value;}}return value;}/**
   * Returns true if a binding's metadata meets all the requirements to allow
   * 2-way binding, and therefore a `<property>-changed` event listener should be
   * added:
   * - used curly braces
   * - is a property (not attribute) binding
   * - is not a textContent binding
   * - is not compound
   *
   * @param {!Binding} binding Binding metadata
   * @return {boolean} True if 2-way listener should be added
   * @private
   */function shouldAddListener(binding){return Boolean(binding.target)&&binding.kind!='attribute'&&binding.kind!='text'&&!binding.isCompound&&binding.parts[0].mode==='{';}/**
   * Setup compound binding storage structures, notify listeners, and dataHost
   * references onto the bound nodeList.
   *
   * @param {!PropertyEffectsType} inst Instance that bas been previously bound
   * @param {TemplateInfo} templateInfo Template metadata
   * @return {void}
   * @private
   */function setupBindings(inst,templateInfo){// Setup compound storage, dataHost, and notify listeners
let{nodeList,nodeInfoList}=templateInfo;if(nodeInfoList.length){for(let i=0;i<nodeInfoList.length;i++){let info=nodeInfoList[i];let node=nodeList[i];let bindings=info.bindings;if(bindings){for(let i=0;i<bindings.length;i++){let binding=bindings[i];setupCompoundStorage(node,binding);addNotifyListener(node,inst,binding);}}node.__dataHost=inst;}}}/**
   * Initializes `__dataCompoundStorage` local storage on a bound node with
   * initial literal data for compound bindings, and sets the joined
   * literal parts to the bound property.
   *
   * When changes to compound parts occur, they are first set into the compound
   * storage array for that property, and then the array is joined to result in
   * the final value set to the property/attribute.
   *
   * @param {Node} node Bound node to initialize
   * @param {Binding} binding Binding metadata
   * @return {void}
   * @private
   */function setupCompoundStorage(node,binding){if(binding.isCompound){// Create compound storage map
let storage=node.__dataCompoundStorage||(node.__dataCompoundStorage={});let parts=binding.parts;// Copy literals from parts into storage for this binding
let literals=new Array(parts.length);for(let j=0;j<parts.length;j++){literals[j]=parts[j].literal;}let target=binding.target;storage[target]=literals;// Configure properties with their literal parts
if(binding.literal&&binding.kind=='property'){node[target]=binding.literal;}}}/**
   * Adds a 2-way binding notification event listener to the node specified
   *
   * @param {Object} node Child element to add listener to
   * @param {!PropertyEffectsType} inst Host element instance to handle notification event
   * @param {Binding} binding Binding metadata
   * @return {void}
   * @private
   */function addNotifyListener(node,inst,binding){if(binding.listenerEvent){let part=binding.parts[0];node.addEventListener(binding.listenerEvent,function(e){handleNotification(e,inst,binding.target,part.source,part.negate);});}}// -- for method-based effects (complexObserver & computed) --------------
/**
 * Adds property effects for each argument in the method signature (and
 * optionally, for the method name if `dynamic` is true) that calls the
 * provided effect function.
 *
 * @param {Element | Object} model Prototype or instance
 * @param {!MethodSignature} sig Method signature metadata
 * @param {string} type Type of property effect to add
 * @param {Function} effectFn Function to run when arguments change
 * @param {*=} methodInfo Effect-specific information to be included in
 *   method effect metadata
 * @param {boolean|Object=} dynamicFn Boolean or object map indicating whether
 *   method names should be included as a dependency to the effect. Note,
 *   defaults to true if the signature is static (sig.static is true).
 * @return {void}
 * @private
 */function createMethodEffect(model,sig,type,effectFn,methodInfo,dynamicFn){dynamicFn=sig.static||dynamicFn&&(typeof dynamicFn!=='object'||dynamicFn[sig.methodName]);let info={methodName:sig.methodName,args:sig.args,methodInfo,dynamicFn};for(let i=0,arg;i<sig.args.length&&(arg=sig.args[i]);i++){if(!arg.literal){model._addPropertyEffect(arg.rootProperty,type,{fn:effectFn,info:info,trigger:arg});}}if(dynamicFn){model._addPropertyEffect(sig.methodName,type,{fn:effectFn,info:info});}}/**
   * Calls a method with arguments marshaled from properties on the instance
   * based on the method signature contained in the effect metadata.
   *
   * Multi-property observers, computed properties, and inline computing
   * functions call this function to invoke the method, then use the return
   * value accordingly.
   *
   * @param {!PropertyEffectsType} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {Object} props Bag of current property changes
   * @param {Object} oldProps Bag of previous values for changed properties
   * @param {?} info Effect metadata
   * @return {*} Returns the return value from the method invocation
   * @private
   */function runMethodEffect(inst,property,props,oldProps,info){// Instances can optionally have a _methodHost which allows redirecting where
// to find methods. Currently used by `templatize`.
let context=inst._methodHost||inst;let fn=context[info.methodName];if(fn){let args=marshalArgs(inst.__data,info.args,property,props);return fn.apply(context,args);}else if(!info.dynamicFn){console.warn('method `'+info.methodName+'` not defined');}}const emptyArray=[];// Regular expressions used for binding
const IDENT='(?:'+'[a-zA-Z_$][\\w.:$\\-*]*'+')';const NUMBER='(?:'+'[-+]?[0-9]*\\.?[0-9]+(?:[eE][-+]?[0-9]+)?'+')';const SQUOTE_STRING='(?:'+'\'(?:[^\'\\\\]|\\\\.)*\''+')';const DQUOTE_STRING='(?:'+'"(?:[^"\\\\]|\\\\.)*"'+')';const STRING='(?:'+SQUOTE_STRING+'|'+DQUOTE_STRING+')';const ARGUMENT='(?:('+IDENT+'|'+NUMBER+'|'+STRING+')\\s*'+')';const ARGUMENTS='(?:'+ARGUMENT+'(?:,\\s*'+ARGUMENT+')*'+')';const ARGUMENT_LIST='(?:'+'\\(\\s*'+'(?:'+ARGUMENTS+'?'+')'+'\\)\\s*'+')';const BINDING='('+IDENT+'\\s*'+ARGUMENT_LIST+'?'+')';// Group 3
const OPEN_BRACKET='(\\[\\[|{{)'+'\\s*';const CLOSE_BRACKET='(?:]]|}})';const NEGATE='(?:(!)\\s*)?';// Group 2
const EXPRESSION=OPEN_BRACKET+NEGATE+BINDING+CLOSE_BRACKET;const bindingRegex=new RegExp(EXPRESSION,"g");/**
                                                   * Create a string from binding parts of all the literal parts
                                                   *
                                                   * @param {!Array<BindingPart>} parts All parts to stringify
                                                   * @return {string} String made from the literal parts
                                                   */function literalFromParts(parts){let s='';for(let i=0;i<parts.length;i++){let literal=parts[i].literal;s+=literal||'';}return s;}/**
   * Parses an expression string for a method signature, and returns a metadata
   * describing the method in terms of `methodName`, `static` (whether all the
   * arguments are literals), and an array of `args`
   *
   * @param {string} expression The expression to parse
   * @return {?MethodSignature} The method metadata object if a method expression was
   *   found, otherwise `undefined`
   * @private
   */function parseMethod(expression){// tries to match valid javascript property names
let m=expression.match(/([^\s]+?)\(([\s\S]*)\)/);if(m){let methodName=m[1];let sig={methodName,static:true,args:emptyArray};if(m[2].trim()){// replace escaped commas with comma entity, split on un-escaped commas
let args=m[2].replace(/\\,/g,'&comma;').split(',');return parseArgs(args,sig);}else{return sig;}}return null;}/**
   * Parses an array of arguments and sets the `args` property of the supplied
   * signature metadata object. Sets the `static` property to false if any
   * argument is a non-literal.
   *
   * @param {!Array<string>} argList Array of argument names
   * @param {!MethodSignature} sig Method signature metadata object
   * @return {!MethodSignature} The updated signature metadata object
   * @private
   */function parseArgs(argList,sig){sig.args=argList.map(function(rawArg){let arg=parseArg(rawArg);if(!arg.literal){sig.static=false;}return arg;},this);return sig;}/**
   * Parses an individual argument, and returns an argument metadata object
   * with the following fields:
   *
   *   {
   *     value: 'prop',        // property/path or literal value
   *     literal: false,       // whether argument is a literal
   *     structured: false,    // whether the property is a path
   *     rootProperty: 'prop', // the root property of the path
   *     wildcard: false       // whether the argument was a wildcard '.*' path
   *   }
   *
   * @param {string} rawArg The string value of the argument
   * @return {!MethodArg} Argument metadata object
   * @private
   */function parseArg(rawArg){// clean up whitespace
let arg=rawArg.trim()// replace comma entity with comma
.replace(/&comma;/g,',')// repair extra escape sequences; note only commas strictly need
// escaping, but we allow any other char to be escaped since its
// likely users will do this
.replace(/\\(.)/g,'\$1');// basic argument descriptor
let a={name:arg,value:'',literal:false};// detect literal value (must be String or Number)
let fc=arg[0];if(fc==='-'){fc=arg[1];}if(fc>='0'&&fc<='9'){fc='#';}switch(fc){case"'":case'"':a.value=arg.slice(1,-1);a.literal=true;break;case'#':a.value=Number(arg);a.literal=true;break;}// if not literal, look for structured path
if(!a.literal){a.rootProperty=root(arg);// detect structured path (has dots)
a.structured=isPath(arg);if(a.structured){a.wildcard=arg.slice(-2)=='.*';if(a.wildcard){a.name=arg.slice(0,-2);}}}return a;}/**
   * Gather the argument values for a method specified in the provided array
   * of argument metadata.
   *
   * The `path` and `value` arguments are used to fill in wildcard descriptor
   * when the method is being called as a result of a path notification.
   *
   * @param {Object} data Instance data storage object to read properties from
   * @param {!Array<!MethodArg>} args Array of argument metadata
   * @param {string} path Property/path name that triggered the method effect
   * @param {Object} props Bag of current property changes
   * @return {Array<*>} Array of argument values
   * @private
   */function marshalArgs(data,args,path,props){let values=[];for(let i=0,l=args.length;i<l;i++){let arg=args[i];let name=arg.name;let v;if(arg.literal){v=arg.value;}else{if(arg.structured){v=get(data,name);// when data is not stored e.g. `splices`
if(v===undefined){v=props[name];}}else{v=data[name];}}if(arg.wildcard){// Only send the actual path changed info if the change that
// caused the observer to run matched the wildcard
let baseChanged=name.indexOf(path+'.')===0;let matches$$1=path.indexOf(name)===0&&!baseChanged;values[i]={path:matches$$1?path:name,value:matches$$1?props[path]:v,base:v};}else{values[i]=v;}}return values;}// data api
/**
 * Sends array splice notifications (`.splices` and `.length`)
 *
 * Note: this implementation only accepts normalized paths
 *
 * @param {!PropertyEffectsType} inst Instance to send notifications to
 * @param {Array} array The array the mutations occurred on
 * @param {string} path The path to the array that was mutated
 * @param {Array} splices Array of splice records
 * @return {void}
 * @private
 */function notifySplices(inst,array,path,splices){let splicesPath=path+'.splices';inst.notifyPath(splicesPath,{indexSplices:splices});inst.notifyPath(path+'.length',array.length);// Null here to allow potentially large splice records to be GC'ed.
inst.__data[splicesPath]={indexSplices:null};}/**
   * Creates a splice record and sends an array splice notification for
   * the described mutation
   *
   * Note: this implementation only accepts normalized paths
   *
   * @param {!PropertyEffectsType} inst Instance to send notifications to
   * @param {Array} array The array the mutations occurred on
   * @param {string} path The path to the array that was mutated
   * @param {number} index Index at which the array mutation occurred
   * @param {number} addedCount Number of added items
   * @param {Array} removed Array of removed items
   * @return {void}
   * @private
   */function notifySplice(inst,array,path,index,addedCount,removed){notifySplices(inst,array,path,[{index:index,addedCount:addedCount,removed:removed,object:array,type:'splice'}]);}/**
   * Returns an upper-cased version of the string.
   *
   * @param {string} name String to uppercase
   * @return {string} Uppercased string
   * @private
   */function upper(name){return name[0].toUpperCase()+name.substring(1);}const PropertyEffects=dedupingMixin(superClass=>{/**
   * @constructor
   * @extends {superClass}
   * @implements {Polymer_PropertyAccessors}
   * @implements {Polymer_TemplateStamp}
   * @unrestricted
   */const propertyEffectsBase=TemplateStamp(PropertyAccessors(superClass));/**
                                                                                * @polymer
                                                                                * @mixinClass
                                                                                * @implements {Polymer_PropertyEffects}
                                                                                * @extends {propertyEffectsBase}
                                                                                * @unrestricted
                                                                                */class PropertyEffects extends propertyEffectsBase{constructor(){super();/** @type {boolean} */ // Used to identify users of this mixin, ala instanceof
this.__isPropertyEffectsClient=true;/** @type {number} */ // NOTE: used to track re-entrant calls to `_flushProperties`
// path changes dirty check against `__dataTemp` only during one "turn"
// and are cleared when `__dataCounter` returns to 0.
this.__dataCounter=0;/** @type {boolean} */this.__dataClientsReady;/** @type {Array} */this.__dataPendingClients;/** @type {Object} */this.__dataToNotify;/** @type {Object} */this.__dataLinkedPaths;/** @type {boolean} */this.__dataHasPaths;/** @type {Object} */this.__dataCompoundStorage;/** @type {Polymer_PropertyEffects} */this.__dataHost;/** @type {!Object} */this.__dataTemp;/** @type {boolean} */this.__dataClientsInitialized;/** @type {!Object} */this.__data;/** @type {!Object} */this.__dataPending;/** @type {!Object} */this.__dataOld;/** @type {Object} */this.__computeEffects;/** @type {Object} */this.__reflectEffects;/** @type {Object} */this.__notifyEffects;/** @type {Object} */this.__propagateEffects;/** @type {Object} */this.__observeEffects;/** @type {Object} */this.__readOnly;/** @type {!TemplateInfo} */this.__templateInfo;}get PROPERTY_EFFECT_TYPES(){return TYPES;}/**
       * @return {void}
       */_initializeProperties(){super._initializeProperties();hostStack.registerHost(this);this.__dataClientsReady=false;this.__dataPendingClients=null;this.__dataToNotify=null;this.__dataLinkedPaths=null;this.__dataHasPaths=false;// May be set on instance prior to upgrade
this.__dataCompoundStorage=this.__dataCompoundStorage||null;this.__dataHost=this.__dataHost||null;this.__dataTemp={};this.__dataClientsInitialized=false;}/**
       * Overrides `Polymer.PropertyAccessors` implementation to provide a
       * more efficient implementation of initializing properties from
       * the prototype on the instance.
       *
       * @override
       * @param {Object} props Properties to initialize on the prototype
       * @return {void}
       */_initializeProtoProperties(props){this.__data=Object.create(props);this.__dataPending=Object.create(props);this.__dataOld={};}/**
       * Overrides `Polymer.PropertyAccessors` implementation to avoid setting
       * `_setProperty`'s `shouldNotify: true`.
       *
       * @override
       * @param {Object} props Properties to initialize on the instance
       * @return {void}
       */_initializeInstanceProperties(props){let readOnly=this[TYPES.READ_ONLY];for(let prop in props){if(!readOnly||!readOnly[prop]){this.__dataPending=this.__dataPending||{};this.__dataOld=this.__dataOld||{};this.__data[prop]=this.__dataPending[prop]=props[prop];}}}// Prototype setup ----------------------------------------
/**
     * Equivalent to static `addPropertyEffect` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * @param {string} property Property that should trigger the effect
     * @param {string} type Effect type, from this.PROPERTY_EFFECT_TYPES
     * @param {Object=} effect Effect metadata object
     * @return {void}
     * @protected
     */_addPropertyEffect(property,type,effect){this._createPropertyAccessor(property,type==TYPES.READ_ONLY);// effects are accumulated into arrays per property based on type
let effects=ensureOwnEffectMap(this,type)[property];if(!effects){effects=this[type][property]=[];}effects.push(effect);}/**
       * Removes the given property effect.
       *
       * @param {string} property Property the effect was associated with
       * @param {string} type Effect type, from this.PROPERTY_EFFECT_TYPES
       * @param {Object=} effect Effect metadata object to remove
       * @return {void}
       */_removePropertyEffect(property,type,effect){let effects=ensureOwnEffectMap(this,type)[property];let idx=effects.indexOf(effect);if(idx>=0){effects.splice(idx,1);}}/**
       * Returns whether the current prototype/instance has a property effect
       * of a certain type.
       *
       * @param {string} property Property name
       * @param {string=} type Effect type, from this.PROPERTY_EFFECT_TYPES
       * @return {boolean} True if the prototype/instance has an effect of this type
       * @protected
       */_hasPropertyEffect(property,type){let effects=this[type];return Boolean(effects&&effects[property]);}/**
       * Returns whether the current prototype/instance has a "read only"
       * accessor for the given property.
       *
       * @param {string} property Property name
       * @return {boolean} True if the prototype/instance has an effect of this type
       * @protected
       */_hasReadOnlyEffect(property){return this._hasPropertyEffect(property,TYPES.READ_ONLY);}/**
       * Returns whether the current prototype/instance has a "notify"
       * property effect for the given property.
       *
       * @param {string} property Property name
       * @return {boolean} True if the prototype/instance has an effect of this type
       * @protected
       */_hasNotifyEffect(property){return this._hasPropertyEffect(property,TYPES.NOTIFY);}/**
       * Returns whether the current prototype/instance has a "reflect to attribute"
       * property effect for the given property.
       *
       * @param {string} property Property name
       * @return {boolean} True if the prototype/instance has an effect of this type
       * @protected
       */_hasReflectEffect(property){return this._hasPropertyEffect(property,TYPES.REFLECT);}/**
       * Returns whether the current prototype/instance has a "computed"
       * property effect for the given property.
       *
       * @param {string} property Property name
       * @return {boolean} True if the prototype/instance has an effect of this type
       * @protected
       */_hasComputedEffect(property){return this._hasPropertyEffect(property,TYPES.COMPUTE);}// Runtime ----------------------------------------
/**
     * Sets a pending property or path.  If the root property of the path in
     * question had no accessor, the path is set, otherwise it is enqueued
     * via `_setPendingProperty`.
     *
     * This function isolates relatively expensive functionality necessary
     * for the public API (`set`, `setProperties`, `notifyPath`, and property
     * change listeners via {{...}} bindings), such that it is only done
     * when paths enter the system, and not at every propagation step.  It
     * also sets a `__dataHasPaths` flag on the instance which is used to
     * fast-path slower path-matching code in the property effects host paths.
     *
     * `path` can be a path string or array of path parts as accepted by the
     * public API.
     *
     * @param {string | !Array<number|string>} path Path to set
     * @param {*} value Value to set
     * @param {boolean=} shouldNotify Set to true if this change should
     *  cause a property notification event dispatch
     * @param {boolean=} isPathNotification If the path being set is a path
     *   notification of an already changed value, as opposed to a request
     *   to set and notify the change.  In the latter `false` case, a dirty
     *   check is performed and then the value is set to the path before
     *   enqueuing the pending property change.
     * @return {boolean} Returns true if the property/path was enqueued in
     *   the pending changes bag.
     * @protected
     */_setPendingPropertyOrPath(path,value,shouldNotify,isPathNotification){if(isPathNotification||root(Array.isArray(path)?path[0]:path)!==path){// Dirty check changes being set to a path against the actual object,
// since this is the entry point for paths into the system; from here
// the only dirty checks are against the `__dataTemp` cache to prevent
// duplicate work in the same turn only. Note, if this was a notification
// of a change already set to a path (isPathNotification: true),
// we always let the change through and skip the `set` since it was
// already dirty checked at the point of entry and the underlying
// object has already been updated
if(!isPathNotification){let old=get(this,path);path=/** @type {string} */set(this,path,value);// Use property-accessor's simpler dirty check
if(!path||!super._shouldPropertyChange(path,value,old)){return false;}}this.__dataHasPaths=true;if(this._setPendingProperty(/**@type{string}*/path,value,shouldNotify)){computeLinkedPaths(this,path,value);return true;}}else{if(this.__dataHasAccessor&&this.__dataHasAccessor[path]){return this._setPendingProperty(/**@type{string}*/path,value,shouldNotify);}else{this[path]=value;}}return false;}/**
       * Applies a value to a non-Polymer element/node's property.
       *
       * The implementation makes a best-effort at binding interop:
       * Some native element properties have side-effects when
       * re-setting the same value (e.g. setting `<input>.value` resets the
       * cursor position), so we do a dirty-check before setting the value.
       * However, for better interop with non-Polymer custom elements that
       * accept objects, we explicitly re-set object changes coming from the
       * Polymer world (which may include deep object changes without the
       * top reference changing), erring on the side of providing more
       * information.
       *
       * Users may override this method to provide alternate approaches.
       *
       * @param {!Node} node The node to set a property on
       * @param {string} prop The property to set
       * @param {*} value The value to set
       * @return {void}
       * @protected
       */_setUnmanagedPropertyToNode(node,prop,value){// It is a judgment call that resetting primitives is
// "bad" and resettings objects is also "good"; alternatively we could
// implement a whitelist of tag & property values that should never
// be reset (e.g. <input>.value && <select>.value)
if(value!==node[prop]||typeof value=='object'){node[prop]=value;}}/**
       * Overrides the `PropertiesChanged` implementation to introduce special
       * dirty check logic depending on the property & value being set:
       *
       * 1. Any value set to a path (e.g. 'obj.prop': 42 or 'obj.prop': {...})
       *    Stored in `__dataTemp`, dirty checked against `__dataTemp`
       * 2. Object set to simple property (e.g. 'prop': {...})
       *    Stored in `__dataTemp` and `__data`, dirty checked against
       *    `__dataTemp` by default implementation of `_shouldPropertyChange`
       * 3. Primitive value set to simple property (e.g. 'prop': 42)
       *    Stored in `__data`, dirty checked against `__data`
       *
       * The dirty-check is important to prevent cycles due to two-way
       * notification, but paths and objects are only dirty checked against any
       * previous value set during this turn via a "temporary cache" that is
       * cleared when the last `_propertiesChanged` exits. This is so:
       * a. any cached array paths (e.g. 'array.3.prop') may be invalidated
       *    due to array mutations like shift/unshift/splice; this is fine
       *    since path changes are dirty-checked at user entry points like `set`
       * b. dirty-checking for objects only lasts one turn to allow the user
       *    to mutate the object in-place and re-set it with the same identity
       *    and have all sub-properties re-propagated in a subsequent turn.
       *
       * The temp cache is not necessarily sufficient to prevent invalid array
       * paths, since a splice can happen during the same turn (with pathological
       * user code); we could introduce a "fixup" for temporarily cached array
       * paths if needed: https://github.com/Polymer/polymer/issues/4227
       *
       * @override
       * @param {string} property Name of the property
       * @param {*} value Value to set
       * @param {boolean=} shouldNotify True if property should fire notification
       *   event (applies only for `notify: true` properties)
       * @return {boolean} Returns true if the property changed
       */_setPendingProperty(property,value,shouldNotify){let isPath$$1=this.__dataHasPaths&&isPath(property);let prevProps=isPath$$1?this.__dataTemp:this.__data;if(this._shouldPropertyChange(property,value,prevProps[property])){if(!this.__dataPending){this.__dataPending={};this.__dataOld={};}// Ensure old is captured from the last turn
if(!(property in this.__dataOld)){this.__dataOld[property]=this.__data[property];}// Paths are stored in temporary cache (cleared at end of turn),
// which is used for dirty-checking, all others stored in __data
if(isPath$$1){this.__dataTemp[property]=value;}else{this.__data[property]=value;}// All changes go into pending property bag, passed to _propertiesChanged
this.__dataPending[property]=value;// Track properties that should notify separately
if(isPath$$1||this[TYPES.NOTIFY]&&this[TYPES.NOTIFY][property]){this.__dataToNotify=this.__dataToNotify||{};this.__dataToNotify[property]=shouldNotify;}return true;}return false;}/**
       * Overrides base implementation to ensure all accessors set `shouldNotify`
       * to true, for per-property notification tracking.
       *
       * @override
       * @param {string} property Name of the property
       * @param {*} value Value to set
       * @return {void}
       */_setProperty(property,value){if(this._setPendingProperty(property,value,true)){this._invalidateProperties();}}/**
       * Overrides `PropertyAccessor`'s default async queuing of
       * `_propertiesChanged`: if `__dataReady` is false (has not yet been
       * manually flushed), the function no-ops; otherwise flushes
       * `_propertiesChanged` synchronously.
       *
       * @override
       * @return {void}
       */_invalidateProperties(){if(this.__dataReady){this._flushProperties();}}/**
       * Enqueues the given client on a list of pending clients, whose
       * pending property changes can later be flushed via a call to
       * `_flushClients`.
       *
       * @param {Object} client PropertyEffects client to enqueue
       * @return {void}
       * @protected
       */_enqueueClient(client){this.__dataPendingClients=this.__dataPendingClients||[];if(client!==this){this.__dataPendingClients.push(client);}}/**
       * Overrides superclass implementation.
       *
       * @return {void}
       * @protected
       */_flushProperties(){this.__dataCounter++;super._flushProperties();this.__dataCounter--;}/**
       * Flushes any clients previously enqueued via `_enqueueClient`, causing
       * their `_flushProperties` method to run.
       *
       * @return {void}
       * @protected
       */_flushClients(){if(!this.__dataClientsReady){this.__dataClientsReady=true;this._readyClients();// Override point where accessors are turned on; importantly,
// this is after clients have fully readied, providing a guarantee
// that any property effects occur only after all clients are ready.
this.__dataReady=true;}else{this.__enableOrFlushClients();}}// NOTE: We ensure clients either enable or flush as appropriate. This
// handles two corner cases:
// (1) clients flush properly when connected/enabled before the host
// enables; e.g.
//   (a) Templatize stamps with no properties and does not flush and
//   (b) the instance is inserted into dom and
//   (c) then the instance flushes.
// (2) clients enable properly when not connected/enabled when the host
// flushes; e.g.
//   (a) a template is runtime stamped and not yet connected/enabled
//   (b) a host sets a property, causing stamped dom to flush
//   (c) the stamped dom enables.
__enableOrFlushClients(){let clients=this.__dataPendingClients;if(clients){this.__dataPendingClients=null;for(let i=0;i<clients.length;i++){let client=clients[i];if(!client.__dataEnabled){client._enableProperties();}else if(client.__dataPending){client._flushProperties();}}}}/**
       * Perform any initial setup on client dom. Called before the first
       * `_flushProperties` call on client dom and before any element
       * observers are called.
       *
       * @return {void}
       * @protected
       */_readyClients(){this.__enableOrFlushClients();}/**
       * Sets a bag of property changes to this instance, and
       * synchronously processes all effects of the properties as a batch.
       *
       * Property names must be simple properties, not paths.  Batched
       * path propagation is not supported.
       *
       * @param {Object} props Bag of one or more key-value pairs whose key is
       *   a property and value is the new value to set for that property.
       * @param {boolean=} setReadOnly When true, any private values set in
       *   `props` will be set. By default, `setProperties` will not set
       *   `readOnly: true` root properties.
       * @return {void}
       * @public
       */setProperties(props,setReadOnly){for(let path in props){if(setReadOnly||!this[TYPES.READ_ONLY]||!this[TYPES.READ_ONLY][path]){//TODO(kschaaf): explicitly disallow paths in setProperty?
// wildcard observers currently only pass the first changed path
// in the `info` object, and you could do some odd things batching
// paths, e.g. {'foo.bar': {...}, 'foo': null}
this._setPendingPropertyOrPath(path,props[path],true);}}this._invalidateProperties();}/**
       * Overrides `PropertyAccessors` so that property accessor
       * side effects are not enabled until after client dom is fully ready.
       * Also calls `_flushClients` callback to ensure client dom is enabled
       * that was not enabled as a result of flushing properties.
       *
       * @override
       * @return {void}
       */ready(){// It is important that `super.ready()` is not called here as it
// immediately turns on accessors. Instead, we wait until `readyClients`
// to enable accessors to provide a guarantee that clients are ready
// before processing any accessors side effects.
this._flushProperties();// If no data was pending, `_flushProperties` will not `flushClients`
// so ensure this is done.
if(!this.__dataClientsReady){this._flushClients();}// Before ready, client notifications do not trigger _flushProperties.
// Therefore a flush is necessary here if data has been set.
if(this.__dataPending){this._flushProperties();}}/**
       * Implements `PropertyAccessors`'s properties changed callback.
       *
       * Runs each class of effects for the batch of changed properties in
       * a specific order (compute, propagate, reflect, observe, notify).
       *
       * @param {!Object} currentProps Bag of all current accessor values
       * @param {!Object} changedProps Bag of properties changed since the last
       *   call to `_propertiesChanged`
       * @param {!Object} oldProps Bag of previous values for each property
       *   in `changedProps`
       * @return {void}
       */_propertiesChanged(currentProps,changedProps,oldProps){// ----------------------------
// let c = Object.getOwnPropertyNames(changedProps || {});
// window.debug && console.group(this.localName + '#' + this.id + ': ' + c);
// if (window.debug) { debugger; }
// ----------------------------
let hasPaths=this.__dataHasPaths;this.__dataHasPaths=false;// Compute properties
runComputedEffects(this,changedProps,oldProps,hasPaths);// Clear notify properties prior to possible reentry (propagate, observe),
// but after computing effects have a chance to add to them
let notifyProps=this.__dataToNotify;this.__dataToNotify=null;// Propagate properties to clients
this._propagatePropertyChanges(changedProps,oldProps,hasPaths);// Flush clients
this._flushClients();// Reflect properties
runEffects(this,this[TYPES.REFLECT],changedProps,oldProps,hasPaths);// Observe properties
runEffects(this,this[TYPES.OBSERVE],changedProps,oldProps,hasPaths);// Notify properties to host
if(notifyProps){runNotifyEffects(this,notifyProps,changedProps,oldProps,hasPaths);}// Clear temporary cache at end of turn
if(this.__dataCounter==1){this.__dataTemp={};}// ----------------------------
// window.debug && console.groupEnd(this.localName + '#' + this.id + ': ' + c);
// ----------------------------
}/**
       * Called to propagate any property changes to stamped template nodes
       * managed by this element.
       *
       * @param {Object} changedProps Bag of changed properties
       * @param {Object} oldProps Bag of previous values for changed properties
       * @param {boolean} hasPaths True with `props` contains one or more paths
       * @return {void}
       * @protected
       */_propagatePropertyChanges(changedProps,oldProps,hasPaths){if(this[TYPES.PROPAGATE]){runEffects(this,this[TYPES.PROPAGATE],changedProps,oldProps,hasPaths);}let templateInfo=this.__templateInfo;while(templateInfo){runEffects(this,templateInfo.propertyEffects,changedProps,oldProps,hasPaths,templateInfo.nodeList);templateInfo=templateInfo.nextTemplateInfo;}}/**
       * Aliases one data path as another, such that path notifications from one
       * are routed to the other.
       *
       * @param {string | !Array<string|number>} to Target path to link.
       * @param {string | !Array<string|number>} from Source path to link.
       * @return {void}
       * @public
       */linkPaths(to,from){to=normalize(to);from=normalize(from);this.__dataLinkedPaths=this.__dataLinkedPaths||{};this.__dataLinkedPaths[to]=from;}/**
       * Removes a data path alias previously established with `_linkPaths`.
       *
       * Note, the path to unlink should be the target (`to`) used when
       * linking the paths.
       *
       * @param {string | !Array<string|number>} path Target path to unlink.
       * @return {void}
       * @public
       */unlinkPaths(path){path=normalize(path);if(this.__dataLinkedPaths){delete this.__dataLinkedPaths[path];}}/**
       * Notify that an array has changed.
       *
       * Example:
       *
       *     this.items = [ {name: 'Jim'}, {name: 'Todd'}, {name: 'Bill'} ];
       *     ...
       *     this.items.splice(1, 1, {name: 'Sam'});
       *     this.items.push({name: 'Bob'});
       *     this.notifySplices('items', [
       *       { index: 1, removed: [{name: 'Todd'}], addedCount: 1, object: this.items, type: 'splice' },
       *       { index: 3, removed: [], addedCount: 1, object: this.items, type: 'splice'}
       *     ]);
       *
       * @param {string} path Path that should be notified.
       * @param {Array} splices Array of splice records indicating ordered
       *   changes that occurred to the array. Each record should have the
       *   following fields:
       *    * index: index at which the change occurred
       *    * removed: array of items that were removed from this index
       *    * addedCount: number of new items added at this index
       *    * object: a reference to the array in question
       *    * type: the string literal 'splice'
       *
       *   Note that splice records _must_ be normalized such that they are
       *   reported in index order (raw results from `Object.observe` are not
       *   ordered and must be normalized/merged before notifying).
       * @return {void}
       * @public
      */notifySplices(path,splices){let info={path:''};let array=/** @type {Array} */get(this,path,info);notifySplices(this,array,info.path,splices);}/**
       * Convenience method for reading a value from a path.
       *
       * Note, if any part in the path is undefined, this method returns
       * `undefined` (this method does not throw when dereferencing undefined
       * paths).
       *
       * @param {(string|!Array<(string|number)>)} path Path to the value
       *   to read.  The path may be specified as a string (e.g. `foo.bar.baz`)
       *   or an array of path parts (e.g. `['foo.bar', 'baz']`).  Note that
       *   bracketed expressions are not supported; string-based path parts
       *   *must* be separated by dots.  Note that when dereferencing array
       *   indices, the index may be used as a dotted part directly
       *   (e.g. `users.12.name` or `['users', 12, 'name']`).
       * @param {Object=} root Root object from which the path is evaluated.
       * @return {*} Value at the path, or `undefined` if any part of the path
       *   is undefined.
       * @public
       */get(path,root$$1){return get(root$$1||this,path);}/**
       * Convenience method for setting a value to a path and notifying any
       * elements bound to the same path.
       *
       * Note, if any part in the path except for the last is undefined,
       * this method does nothing (this method does not throw when
       * dereferencing undefined paths).
       *
       * @param {(string|!Array<(string|number)>)} path Path to the value
       *   to write.  The path may be specified as a string (e.g. `'foo.bar.baz'`)
       *   or an array of path parts (e.g. `['foo.bar', 'baz']`).  Note that
       *   bracketed expressions are not supported; string-based path parts
       *   *must* be separated by dots.  Note that when dereferencing array
       *   indices, the index may be used as a dotted part directly
       *   (e.g. `'users.12.name'` or `['users', 12, 'name']`).
       * @param {*} value Value to set at the specified path.
       * @param {Object=} root Root object from which the path is evaluated.
       *   When specified, no notification will occur.
       * @return {void}
       * @public
      */set(path,value,root$$1){if(root$$1){set(root$$1,path,value);}else{if(!this[TYPES.READ_ONLY]||!this[TYPES.READ_ONLY][/** @type {string} */path]){if(this._setPendingPropertyOrPath(path,value,true)){this._invalidateProperties();}}}}/**
       * Adds items onto the end of the array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.push`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @param {string | !Array<string|number>} path Path to array.
       * @param {...*} items Items to push onto array
       * @return {number} New length of the array.
       * @public
       */push(path,...items){let info={path:''};let array=/** @type {Array}*/get(this,path,info);let len=array.length;let ret=array.push(...items);if(items.length){notifySplice(this,array,info.path,len,items.length,[]);}return ret;}/**
       * Removes an item from the end of array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.pop`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @param {string | !Array<string|number>} path Path to array.
       * @return {*} Item that was removed.
       * @public
       */pop(path){let info={path:''};let array=/** @type {Array} */get(this,path,info);let hadLength=Boolean(array.length);let ret=array.pop();if(hadLength){notifySplice(this,array,info.path,array.length,0,[ret]);}return ret;}/**
       * Starting from the start index specified, removes 0 or more items
       * from the array and inserts 0 or more new items in their place.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.splice`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @param {string | !Array<string|number>} path Path to array.
       * @param {number} start Index from which to start removing/inserting.
       * @param {number} deleteCount Number of items to remove.
       * @param {...*} items Items to insert into array.
       * @return {Array} Array of removed items.
       * @public
       */splice(path,start,deleteCount,...items){let info={path:''};let array=/** @type {Array} */get(this,path,info);// Normalize fancy native splice handling of crazy start values
if(start<0){start=array.length-Math.floor(-start);}else if(start){start=Math.floor(start);}// array.splice does different things based on the number of arguments
// you pass in. Therefore, array.splice(0) and array.splice(0, undefined)
// do different things. In the former, the whole array is cleared. In the
// latter, no items are removed.
// This means that we need to detect whether 1. one of the arguments
// is actually passed in and then 2. determine how many arguments
// we should pass on to the native array.splice
//
let ret;// Omit any additional arguments if they were not passed in
if(arguments.length===2){ret=array.splice(start);// Either start was undefined and the others were defined, but in this
// case we can safely pass on all arguments
//
// Note: this includes the case where none of the arguments were passed in,
// e.g. this.splice('array'). However, if both start and deleteCount
// are undefined, array.splice will not modify the array (as expected)
}else{ret=array.splice(start,deleteCount,...items);}// At the end, check whether any items were passed in (e.g. insertions)
// or if the return array contains items (e.g. deletions).
// Only notify if items were added or deleted.
if(items.length||ret.length){notifySplice(this,array,info.path,start,items.length,ret);}return ret;}/**
       * Removes an item from the beginning of array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.pop`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @param {string | !Array<string|number>} path Path to array.
       * @return {*} Item that was removed.
       * @public
       */shift(path){let info={path:''};let array=/** @type {Array} */get(this,path,info);let hadLength=Boolean(array.length);let ret=array.shift();if(hadLength){notifySplice(this,array,info.path,0,0,[ret]);}return ret;}/**
       * Adds items onto the beginning of the array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.push`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @param {string | !Array<string|number>} path Path to array.
       * @param {...*} items Items to insert info array
       * @return {number} New length of the array.
       * @public
       */unshift(path,...items){let info={path:''};let array=/** @type {Array} */get(this,path,info);let ret=array.unshift(...items);if(items.length){notifySplice(this,array,info.path,0,items.length,[]);}return ret;}/**
       * Notify that a path has changed.
       *
       * Example:
       *
       *     this.item.user.name = 'Bob';
       *     this.notifyPath('item.user.name');
       *
       * @param {string} path Path that should be notified.
       * @param {*=} value Value at the path (optional).
       * @return {void}
       * @public
      */notifyPath(path,value){/** @type {string} */let propPath;if(arguments.length==1){// Get value if not supplied
let info={path:''};value=get(this,path,info);propPath=info.path;}else if(Array.isArray(path)){// Normalize path if needed
propPath=normalize(path);}else{propPath=/** @type{string} */path;}if(this._setPendingPropertyOrPath(propPath,value,true,true)){this._invalidateProperties();}}/**
       * Equivalent to static `createReadOnlyProperty` API but can be called on
       * an instance to add effects at runtime.  See that method for
       * full API docs.
       *
       * @param {string} property Property name
       * @param {boolean=} protectedSetter Creates a custom protected setter
       *   when `true`.
       * @return {void}
       * @protected
       */_createReadOnlyProperty(property,protectedSetter){this._addPropertyEffect(property,TYPES.READ_ONLY);if(protectedSetter){this['_set'+upper(property)]=/** @this {PropertyEffects} */function(value){this._setProperty(property,value);};}}/**
       * Equivalent to static `createPropertyObserver` API but can be called on
       * an instance to add effects at runtime.  See that method for
       * full API docs.
       *
       * @param {string} property Property name
       * @param {string|function(*,*)} method Function or name of observer method to call
       * @param {boolean=} dynamicFn Whether the method name should be included as
       *   a dependency to the effect.
       * @return {void}
       * @protected
       */_createPropertyObserver(property,method,dynamicFn){let info={property,method,dynamicFn:Boolean(dynamicFn)};this._addPropertyEffect(property,TYPES.OBSERVE,{fn:runObserverEffect,info,trigger:{name:property}});if(dynamicFn){this._addPropertyEffect(/** @type {string} */method,TYPES.OBSERVE,{fn:runObserverEffect,info,trigger:{name:method}});}}/**
       * Equivalent to static `createMethodObserver` API but can be called on
       * an instance to add effects at runtime.  See that method for
       * full API docs.
       *
       * @param {string} expression Method expression
       * @param {boolean|Object=} dynamicFn Boolean or object map indicating
       *   whether method names should be included as a dependency to the effect.
       * @return {void}
       * @protected
       */_createMethodObserver(expression,dynamicFn){let sig=parseMethod(expression);if(!sig){throw new Error("Malformed observer expression '"+expression+"'");}createMethodEffect(this,sig,TYPES.OBSERVE,runMethodEffect,null,dynamicFn);}/**
       * Equivalent to static `createNotifyingProperty` API but can be called on
       * an instance to add effects at runtime.  See that method for
       * full API docs.
       *
       * @param {string} property Property name
       * @return {void}
       * @protected
       */_createNotifyingProperty(property){this._addPropertyEffect(property,TYPES.NOTIFY,{fn:runNotifyEffect,info:{eventName:CaseMap.camelToDashCase(property)+'-changed',property:property}});}/**
       * Equivalent to static `createReflectedProperty` API but can be called on
       * an instance to add effects at runtime.  See that method for
       * full API docs.
       *
       * @param {string} property Property name
       * @return {void}
       * @protected
       */_createReflectedProperty(property){let attr=this.constructor.attributeNameForProperty(property);if(attr[0]==='-'){console.warn('Property '+property+' cannot be reflected to attribute '+attr+' because "-" is not a valid starting attribute name. Use a lowercase first letter for the property instead.');}else{this._addPropertyEffect(property,TYPES.REFLECT,{fn:runReflectEffect,info:{attrName:attr}});}}/**
       * Equivalent to static `createComputedProperty` API but can be called on
       * an instance to add effects at runtime.  See that method for
       * full API docs.
       *
       * @param {string} property Name of computed property to set
       * @param {string} expression Method expression
       * @param {boolean|Object=} dynamicFn Boolean or object map indicating
       *   whether method names should be included as a dependency to the effect.
       * @return {void}
       * @protected
       */_createComputedProperty(property,expression,dynamicFn){let sig=parseMethod(expression);if(!sig){throw new Error("Malformed computed expression '"+expression+"'");}createMethodEffect(this,sig,TYPES.COMPUTE,runComputedEffect,property,dynamicFn);}// -- static class methods ------------
/**
     * Ensures an accessor exists for the specified property, and adds
     * to a list of "property effects" that will run when the accessor for
     * the specified property is set.  Effects are grouped by "type", which
     * roughly corresponds to a phase in effect processing.  The effect
     * metadata should be in the following form:
     *
     *     {
     *       fn: effectFunction, // Reference to function to call to perform effect
     *       info: { ... }       // Effect metadata passed to function
     *       trigger: {          // Optional triggering metadata; if not provided
     *         name: string      // the property is treated as a wildcard
     *         structured: boolean
     *         wildcard: boolean
     *       }
     *     }
     *
     * Effects are called from `_propertiesChanged` in the following order by
     * type:
     *
     * 1. COMPUTE
     * 2. PROPAGATE
     * 3. REFLECT
     * 4. OBSERVE
     * 5. NOTIFY
     *
     * Effect functions are called with the following signature:
     *
     *     effectFunction(inst, path, props, oldProps, info, hasPaths)
     *
     * @param {string} property Property that should trigger the effect
     * @param {string} type Effect type, from this.PROPERTY_EFFECT_TYPES
     * @param {Object=} effect Effect metadata object
     * @return {void}
     * @protected
     */static addPropertyEffect(property,type,effect){this.prototype._addPropertyEffect(property,type,effect);}/**
       * Creates a single-property observer for the given property.
       *
       * @param {string} property Property name
       * @param {string|function(*,*)} method Function or name of observer method to call
       * @param {boolean=} dynamicFn Whether the method name should be included as
       *   a dependency to the effect.
       * @return {void}
       * @protected
       */static createPropertyObserver(property,method,dynamicFn){this.prototype._createPropertyObserver(property,method,dynamicFn);}/**
       * Creates a multi-property "method observer" based on the provided
       * expression, which should be a string in the form of a normal JavaScript
       * function signature: `'methodName(arg1, [..., argn])'`.  Each argument
       * should correspond to a property or path in the context of this
       * prototype (or instance), or may be a literal string or number.
       *
       * @param {string} expression Method expression
       * @param {boolean|Object=} dynamicFn Boolean or object map indicating
       * @return {void}
       *   whether method names should be included as a dependency to the effect.
       * @protected
       */static createMethodObserver(expression,dynamicFn){this.prototype._createMethodObserver(expression,dynamicFn);}/**
       * Causes the setter for the given property to dispatch `<property>-changed`
       * events to notify of changes to the property.
       *
       * @param {string} property Property name
       * @return {void}
       * @protected
       */static createNotifyingProperty(property){this.prototype._createNotifyingProperty(property);}/**
       * Creates a read-only accessor for the given property.
       *
       * To set the property, use the protected `_setProperty` API.
       * To create a custom protected setter (e.g. `_setMyProp()` for
       * property `myProp`), pass `true` for `protectedSetter`.
       *
       * Note, if the property will have other property effects, this method
       * should be called first, before adding other effects.
       *
       * @param {string} property Property name
       * @param {boolean=} protectedSetter Creates a custom protected setter
       *   when `true`.
       * @return {void}
       * @protected
       */static createReadOnlyProperty(property,protectedSetter){this.prototype._createReadOnlyProperty(property,protectedSetter);}/**
       * Causes the setter for the given property to reflect the property value
       * to a (dash-cased) attribute of the same name.
       *
       * @param {string} property Property name
       * @return {void}
       * @protected
       */static createReflectedProperty(property){this.prototype._createReflectedProperty(property);}/**
       * Creates a computed property whose value is set to the result of the
       * method described by the given `expression` each time one or more
       * arguments to the method changes.  The expression should be a string
       * in the form of a normal JavaScript function signature:
       * `'methodName(arg1, [..., argn])'`
       *
       * @param {string} property Name of computed property to set
       * @param {string} expression Method expression
       * @param {boolean|Object=} dynamicFn Boolean or object map indicating whether
       *   method names should be included as a dependency to the effect.
       * @return {void}
       * @protected
       */static createComputedProperty(property,expression,dynamicFn){this.prototype._createComputedProperty(property,expression,dynamicFn);}/**
       * Parses the provided template to ensure binding effects are created
       * for them, and then ensures property accessors are created for any
       * dependent properties in the template.  Binding effects for bound
       * templates are stored in a linked list on the instance so that
       * templates can be efficiently stamped and unstamped.
       *
       * @param {!HTMLTemplateElement} template Template containing binding
       *   bindings
       * @return {!TemplateInfo} Template metadata object
       * @protected
       */static bindTemplate(template){return this.prototype._bindTemplate(template);}// -- binding ----------------------------------------------
/**
     * Equivalent to static `bindTemplate` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * This method may be called on the prototype (for prototypical template
     * binding, to avoid creating accessors every instance) once per prototype,
     * and will be called with `runtimeBinding: true` by `_stampTemplate` to
     * create and link an instance of the template metadata associated with a
     * particular stamping.
     *
     * @param {!HTMLTemplateElement} template Template containing binding
     *   bindings
     * @param {boolean=} instanceBinding When false (default), performs
     *   "prototypical" binding of the template and overwrites any previously
     *   bound template for the class. When true (as passed from
     *   `_stampTemplate`), the template info is instanced and linked into
     *   the list of bound templates.
     * @return {!TemplateInfo} Template metadata object; for `runtimeBinding`,
     *   this is an instance of the prototypical template info
     * @protected
     */_bindTemplate(template,instanceBinding){let templateInfo=this.constructor._parseTemplate(template);let wasPreBound=this.__templateInfo==templateInfo;// Optimization: since this is called twice for proto-bound templates,
// don't attempt to recreate accessors if this template was pre-bound
if(!wasPreBound){for(let prop in templateInfo.propertyEffects){this._createPropertyAccessor(prop);}}if(instanceBinding){// For instance-time binding, create instance of template metadata
// and link into list of templates if necessary
templateInfo=/** @type {!TemplateInfo} */Object.create(templateInfo);templateInfo.wasPreBound=wasPreBound;if(!wasPreBound&&this.__templateInfo){let last=this.__templateInfoLast||this.__templateInfo;this.__templateInfoLast=last.nextTemplateInfo=templateInfo;templateInfo.previousTemplateInfo=last;return templateInfo;}}return this.__templateInfo=templateInfo;}/**
       * Adds a property effect to the given template metadata, which is run
       * at the "propagate" stage of `_propertiesChanged` when the template
       * has been bound to the element via `_bindTemplate`.
       *
       * The `effect` object should match the format in `_addPropertyEffect`.
       *
       * @param {Object} templateInfo Template metadata to add effect to
       * @param {string} prop Property that should trigger the effect
       * @param {Object=} effect Effect metadata object
       * @return {void}
       * @protected
       */static _addTemplatePropertyEffect(templateInfo,prop,effect){let hostProps=templateInfo.hostProps=templateInfo.hostProps||{};hostProps[prop]=true;let effects=templateInfo.propertyEffects=templateInfo.propertyEffects||{};let propEffects=effects[prop]=effects[prop]||[];propEffects.push(effect);}/**
       * Stamps the provided template and performs instance-time setup for
       * Polymer template features, including data bindings, declarative event
       * listeners, and the `this.$` map of `id`'s to nodes.  A document fragment
       * is returned containing the stamped DOM, ready for insertion into the
       * DOM.
       *
       * This method may be called more than once; however note that due to
       * `shadycss` polyfill limitations, only styles from templates prepared
       * using `ShadyCSS.prepareTemplate` will be correctly polyfilled (scoped
       * to the shadow root and support CSS custom properties), and note that
       * `ShadyCSS.prepareTemplate` may only be called once per element. As such,
       * any styles required by in runtime-stamped templates must be included
       * in the main element template.
       *
       * @param {!HTMLTemplateElement} template Template to stamp
       * @return {!StampedTemplate} Cloned template content
       * @override
       * @protected
       */_stampTemplate(template){// Ensures that created dom is `_enqueueClient`'d to this element so
// that it can be flushed on next call to `_flushProperties`
hostStack.beginHosting(this);let dom=super._stampTemplate(template);hostStack.endHosting(this);let templateInfo=/** @type {!TemplateInfo} */this._bindTemplate(template,true);// Add template-instance-specific data to instanced templateInfo
templateInfo.nodeList=dom.nodeList;// Capture child nodes to allow unstamping of non-prototypical templates
if(!templateInfo.wasPreBound){let nodes=templateInfo.childNodes=[];for(let n=dom.firstChild;n;n=n.nextSibling){nodes.push(n);}}dom.templateInfo=templateInfo;// Setup compound storage, 2-way listeners, and dataHost for bindings
setupBindings(this,templateInfo);// Flush properties into template nodes if already booted
if(this.__dataReady){runEffects(this,templateInfo.propertyEffects,this.__data,null,false,templateInfo.nodeList);}return dom;}/**
       * Removes and unbinds the nodes previously contained in the provided
       * DocumentFragment returned from `_stampTemplate`.
       *
       * @param {!StampedTemplate} dom DocumentFragment previously returned
       *   from `_stampTemplate` associated with the nodes to be removed
       * @return {void}
       * @protected
       */_removeBoundDom(dom){// Unlink template info
let templateInfo=dom.templateInfo;if(templateInfo.previousTemplateInfo){templateInfo.previousTemplateInfo.nextTemplateInfo=templateInfo.nextTemplateInfo;}if(templateInfo.nextTemplateInfo){templateInfo.nextTemplateInfo.previousTemplateInfo=templateInfo.previousTemplateInfo;}if(this.__templateInfoLast==templateInfo){this.__templateInfoLast=templateInfo.previousTemplateInfo;}templateInfo.previousTemplateInfo=templateInfo.nextTemplateInfo=null;// Remove stamped nodes
let nodes=templateInfo.childNodes;for(let i=0;i<nodes.length;i++){let node=nodes[i];node.parentNode.removeChild(node);}}/**
       * Overrides default `TemplateStamp` implementation to add support for
       * parsing bindings from `TextNode`'s' `textContent`.  A `bindings`
       * array is added to `nodeInfo` and populated with binding metadata
       * with information capturing the binding target, and a `parts` array
       * with one or more metadata objects capturing the source(s) of the
       * binding.
       *
       * @override
       * @param {Node} node Node to parse
       * @param {TemplateInfo} templateInfo Template metadata for current template
       * @param {NodeInfo} nodeInfo Node metadata for current template node
       * @return {boolean} `true` if the visited node added node-specific
       *   metadata to `nodeInfo`
       * @protected
       * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
       */static _parseTemplateNode(node,templateInfo,nodeInfo){let noted=super._parseTemplateNode(node,templateInfo,nodeInfo);if(node.nodeType===Node.TEXT_NODE){let parts=this._parseBindings(node.textContent,templateInfo);if(parts){// Initialize the textContent with any literal parts
// NOTE: default to a space here so the textNode remains; some browsers
// (IE) omit an empty textNode following cloneNode/importNode.
node.textContent=literalFromParts(parts)||' ';addBinding(this,templateInfo,nodeInfo,'text','textContent',parts);noted=true;}}return noted;}/**
       * Overrides default `TemplateStamp` implementation to add support for
       * parsing bindings from attributes.  A `bindings`
       * array is added to `nodeInfo` and populated with binding metadata
       * with information capturing the binding target, and a `parts` array
       * with one or more metadata objects capturing the source(s) of the
       * binding.
       *
       * @override
       * @param {Element} node Node to parse
       * @param {TemplateInfo} templateInfo Template metadata for current template
       * @param {NodeInfo} nodeInfo Node metadata for current template node
       * @param {string} name Attribute name
       * @param {string} value Attribute value
       * @return {boolean} `true` if the visited node added node-specific
       *   metadata to `nodeInfo`
       * @protected
       * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
       */static _parseTemplateNodeAttribute(node,templateInfo,nodeInfo,name,value){let parts=this._parseBindings(value,templateInfo);if(parts){// Attribute or property
let origName=name;let kind='property';// The only way we see a capital letter here is if the attr has
// a capital letter in it per spec. In this case, to make sure
// this binding works, we go ahead and make the binding to the attribute.
if(capitalAttributeRegex.test(name)){kind='attribute';}else if(name[name.length-1]=='$'){name=name.slice(0,-1);kind='attribute';}// Initialize attribute bindings with any literal parts
let literal=literalFromParts(parts);if(literal&&kind=='attribute'){node.setAttribute(name,literal);}// Clear attribute before removing, since IE won't allow removing
// `value` attribute if it previously had a value (can't
// unconditionally set '' before removing since attributes with `$`
// can't be set using setAttribute)
if(node.localName==='input'&&origName==='value'){node.setAttribute(origName,'');}// Remove annotation
node.removeAttribute(origName);// Case hackery: attributes are lower-case, but bind targets
// (properties) are case sensitive. Gambit is to map dash-case to
// camel-case: `foo-bar` becomes `fooBar`.
// Attribute bindings are excepted.
if(kind==='property'){name=dashToCamelCase(name);}addBinding(this,templateInfo,nodeInfo,kind,name,parts,literal);return true;}else{return super._parseTemplateNodeAttribute(node,templateInfo,nodeInfo,name,value);}}/**
       * Overrides default `TemplateStamp` implementation to add support for
       * binding the properties that a nested template depends on to the template
       * as `_host_<property>`.
       *
       * @override
       * @param {Node} node Node to parse
       * @param {TemplateInfo} templateInfo Template metadata for current template
       * @param {NodeInfo} nodeInfo Node metadata for current template node
       * @return {boolean} `true` if the visited node added node-specific
       *   metadata to `nodeInfo`
       * @protected
       * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
       */static _parseTemplateNestedTemplate(node,templateInfo,nodeInfo){let noted=super._parseTemplateNestedTemplate(node,templateInfo,nodeInfo);// Merge host props into outer template and add bindings
let hostProps=nodeInfo.templateInfo.hostProps;let mode='{';for(let source in hostProps){let parts=[{mode,source,dependencies:[source]}];addBinding(this,templateInfo,nodeInfo,'property','_host_'+source,parts);}return noted;}/**
       * Called to parse text in a template (either attribute values or
       * textContent) into binding metadata.
       *
       * Any overrides of this method should return an array of binding part
       * metadata  representing one or more bindings found in the provided text
       * and any "literal" text in between.  Any non-literal parts will be passed
       * to `_evaluateBinding` when any dependencies change.  The only required
       * fields of each "part" in the returned array are as follows:
       *
       * - `dependencies` - Array containing trigger metadata for each property
       *   that should trigger the binding to update
       * - `literal` - String containing text if the part represents a literal;
       *   in this case no `dependencies` are needed
       *
       * Additional metadata for use by `_evaluateBinding` may be provided in
       * each part object as needed.
       *
       * The default implementation handles the following types of bindings
       * (one or more may be intermixed with literal strings):
       * - Property binding: `[[prop]]`
       * - Path binding: `[[object.prop]]`
       * - Negated property or path bindings: `[[!prop]]` or `[[!object.prop]]`
       * - Two-way property or path bindings (supports negation):
       *   `{{prop}}`, `{{object.prop}}`, `{{!prop}}` or `{{!object.prop}}`
       * - Inline computed method (supports negation):
       *   `[[compute(a, 'literal', b)]]`, `[[!compute(a, 'literal', b)]]`
       *
       * @param {string} text Text to parse from attribute or textContent
       * @param {Object} templateInfo Current template metadata
       * @return {Array<!BindingPart>} Array of binding part metadata
       * @protected
       */static _parseBindings(text,templateInfo){let parts=[];let lastIndex=0;let m;// Example: "literal1{{prop}}literal2[[!compute(foo,bar)]]final"
// Regex matches:
//        Iteration 1:  Iteration 2:
// m[1]: '{{'          '[['
// m[2]: ''            '!'
// m[3]: 'prop'        'compute(foo,bar)'
while((m=bindingRegex.exec(text))!==null){// Add literal part
if(m.index>lastIndex){parts.push({literal:text.slice(lastIndex,m.index)});}// Add binding part
let mode=m[1][0];let negate=Boolean(m[2]);let source=m[3].trim();let customEvent=false,notifyEvent='',colon=-1;if(mode=='{'&&(colon=source.indexOf('::'))>0){notifyEvent=source.substring(colon+2);source=source.substring(0,colon);customEvent=true;}let signature=parseMethod(source);let dependencies=[];if(signature){// Inline computed function
let{args,methodName}=signature;for(let i=0;i<args.length;i++){let arg=args[i];if(!arg.literal){dependencies.push(arg);}}let dynamicFns=templateInfo.dynamicFns;if(dynamicFns&&dynamicFns[methodName]||signature.static){dependencies.push(methodName);signature.dynamicFn=true;}}else{// Property or path
dependencies.push(source);}parts.push({source,mode,negate,customEvent,signature,dependencies,event:notifyEvent});lastIndex=bindingRegex.lastIndex;}// Add a final literal part
if(lastIndex&&lastIndex<text.length){let literal=text.substring(lastIndex);if(literal){parts.push({literal:literal});}}if(parts.length){return parts;}else{return null;}}/**
       * Called to evaluate a previously parsed binding part based on a set of
       * one or more changed dependencies.
       *
       * @param {this} inst Element that should be used as scope for
       *   binding dependencies
       * @param {BindingPart} part Binding part metadata
       * @param {string} path Property/path that triggered this effect
       * @param {Object} props Bag of current property changes
       * @param {Object} oldProps Bag of previous values for changed properties
       * @param {boolean} hasPaths True with `props` contains one or more paths
       * @return {*} Value the binding part evaluated to
       * @protected
       */static _evaluateBinding(inst,part,path,props,oldProps,hasPaths){let value;if(part.signature){value=runMethodEffect(inst,path,props,oldProps,part.signature);}else if(path!=part.source){value=get(inst,part.source);}else{if(hasPaths&&isPath(path)){value=get(inst,path);}else{value=inst.__data[path];}}if(part.negate){value=!value;}return value;}}// make a typing for closure :P
PropertyEffectsType=PropertyEffects;return PropertyEffects;});/**
     * Helper api for enqueuing client dom created by a host element.
     *
     * By default elements are flushed via `_flushProperties` when
     * `connectedCallback` is called. Elements attach their client dom to
     * themselves at `ready` time which results from this first flush.
     * This provides an ordering guarantee that the client dom an element
     * creates is flushed before the element itself (i.e. client `ready`
     * fires before host `ready`).
     *
     * However, if `_flushProperties` is called *before* an element is connected,
     * as for example `Templatize` does, this ordering guarantee cannot be
     * satisfied because no elements are connected. (Note: Bound elements that
     * receive data do become enqueued clients and are properly ordered but
     * unbound elements are not.)
     *
     * To maintain the desired "client before host" ordering guarantee for this
     * case we rely on the "host stack. Client nodes registers themselves with
     * the creating host element when created. This ensures that all client dom
     * is readied in the proper order, maintaining the desired guarantee.
     *
     * @private
     */let hostStack={stack:[],/**
   * @param {*} inst Instance to add to hostStack
   * @return {void}
   * @this {hostStack}
   */registerHost(inst){if(this.stack.length){let host=this.stack[this.stack.length-1];host._enqueueClient(inst);}},/**
   * @param {*} inst Instance to begin hosting
   * @return {void}
   * @this {hostStack}
   */beginHosting(inst){this.stack.push(inst);},/**
   * @param {*} inst Instance to end hosting
   * @return {void}
   * @this {hostStack}
   */endHosting(inst){let stackLen=this.stack.length;if(stackLen&&this.stack[stackLen-1]==inst){this.stack.pop();}}};var propertyEffects={PropertyEffects:PropertyEffects};/**
    * Creates a copy of `props` with each property normalized such that
    * upgraded it is an object with at least a type property { type: Type}.
    *
    * @param {Object} props Properties to normalize
    * @return {Object} Copy of input `props` with normalized properties that
    * are in the form {type: Type}
    * @private
    */function normalizeProperties(props){const output={};for(let p in props){const o=props[p];output[p]=typeof o==='function'?{type:o}:o;}return output;}const PropertiesMixin=dedupingMixin(superClass=>{/**
   * @constructor
   * @extends {superClass}
   * @implements {Polymer_PropertiesChanged}
   */const base=PropertiesChanged(superClass);/**
                                                  * Returns the super class constructor for the given class, if it is an
                                                  * instance of the PropertiesMixin.
                                                  *
                                                  * @param {!PropertiesMixinConstructor} constructor PropertiesMixin constructor
                                                  * @return {PropertiesMixinConstructor} Super class constructor
                                                  */function superPropertiesClass(constructor){const superCtor=Object.getPrototypeOf(constructor);// Note, the `PropertiesMixin` class below only refers to the class
// generated by this call to the mixin; the instanceof test only works
// because the mixin is deduped and guaranteed only to apply once, hence
// all constructors in a proto chain will see the same `PropertiesMixin`
return superCtor.prototype instanceof PropertiesMixin?/** @type {PropertiesMixinConstructor} */superCtor:null;}/**
     * Returns a memoized version of the `properties` object for the
     * given class. Properties not in object format are converted to at
     * least {type}.
     *
     * @param {PropertiesMixinConstructor} constructor PropertiesMixin constructor
     * @return {Object} Memoized properties object
     */function ownProperties(constructor){if(!constructor.hasOwnProperty(JSCompiler_renameProperty('__ownProperties',constructor))){let props=null;if(constructor.hasOwnProperty(JSCompiler_renameProperty('properties',constructor))&&constructor.properties){props=normalizeProperties(constructor.properties);}constructor.__ownProperties=props;}return constructor.__ownProperties;}/**
     * @polymer
     * @mixinClass
     * @extends {base}
     * @implements {Polymer_PropertiesMixin}
     * @unrestricted
     */class PropertiesMixin extends base{/**
     * Implements standard custom elements getter to observes the attributes
     * listed in `properties`.
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     */static get observedAttributes(){const props=this._properties;return props?Object.keys(props).map(p=>this.attributeNameForProperty(p)):[];}/**
       * Finalizes an element definition, including ensuring any super classes
       * are also finalized. This includes ensuring property
       * accessors exist on the element prototype. This method calls
       * `_finalizeClass` to finalize each constructor in the prototype chain.
       * @return {void}
       */static finalize(){if(!this.hasOwnProperty(JSCompiler_renameProperty('__finalized',this))){const superCtor=superPropertiesClass(/** @type {PropertiesMixinConstructor} */this);if(superCtor){superCtor.finalize();}this.__finalized=true;this._finalizeClass();}}/**
       * Finalize an element class. This includes ensuring property
       * accessors exist on the element prototype. This method is called by
       * `finalize` and finalizes the class constructor.
       *
       * @protected
       */static _finalizeClass(){const props=ownProperties(/** @type {PropertiesMixinConstructor} */this);if(props){this.createProperties(props);}}/**
       * Returns a memoized version of all properties, including those inherited
       * from super classes. Properties not in object format are converted to
       * at least {type}.
       *
       * @return {Object} Object containing properties for this class
       * @protected
       */static get _properties(){if(!this.hasOwnProperty(JSCompiler_renameProperty('__properties',this))){const superCtor=superPropertiesClass(/** @type {PropertiesMixinConstructor} */this);this.__properties=Object.assign({},superCtor&&superCtor._properties,ownProperties(/** @type {PropertiesMixinConstructor} */this));}return this.__properties;}/**
       * Overrides `PropertiesChanged` method to return type specified in the
       * static `properties` object for the given property.
       * @param {string} name Name of property
       * @return {*} Type to which to deserialize attribute
       *
       * @protected
       */static typeForProperty(name){const info=this._properties[name];return info&&info.type;}/**
       * Overrides `PropertiesChanged` method and adds a call to
       * `finalize` which lazily configures the element's property accessors.
       * @override
       * @return {void}
       */_initializeProperties(){this.constructor.finalize();super._initializeProperties();}/**
       * Called when the element is added to a document.
       * Calls `_enableProperties` to turn on property system from
       * `PropertiesChanged`.
       * @suppress {missingProperties} Super may or may not implement the callback
       * @return {void}
       */connectedCallback(){if(super.connectedCallback){super.connectedCallback();}this._enableProperties();}/**
       * Called when the element is removed from a document
       * @suppress {missingProperties} Super may or may not implement the callback
       * @return {void}
       */disconnectedCallback(){if(super.disconnectedCallback){super.disconnectedCallback();}}}return PropertiesMixin;});var propertiesMixin={PropertiesMixin:PropertiesMixin};const ElementMixin=dedupingMixin(base=>{/**
   * @constructor
   * @extends {base}
   * @implements {Polymer_PropertyEffects}
   * @implements {Polymer_PropertiesMixin}
   */const polymerElementBase=PropertiesMixin(PropertyEffects(base));/**
                                                                         * Returns a list of properties with default values.
                                                                         * This list is created as an optimization since it is a subset of
                                                                         * the list returned from `_properties`.
                                                                         * This list is used in `_initializeProperties` to set property defaults.
                                                                         *
                                                                         * @param {PolymerElementConstructor} constructor Element class
                                                                         * @return {PolymerElementProperties} Flattened properties for this class
                                                                         *   that have default values
                                                                         * @private
                                                                         */function propertyDefaults(constructor){if(!constructor.hasOwnProperty(JSCompiler_renameProperty('__propertyDefaults',constructor))){constructor.__propertyDefaults=null;let props=constructor._properties;for(let p in props){let info=props[p];if('value'in info){constructor.__propertyDefaults=constructor.__propertyDefaults||{};constructor.__propertyDefaults[p]=info;}}}return constructor.__propertyDefaults;}/**
     * Returns a memoized version of the the `observers` array.
     * @param {PolymerElementConstructor} constructor Element class
     * @return {Array} Array containing own observers for the given class
     * @protected
     */function ownObservers(constructor){if(!constructor.hasOwnProperty(JSCompiler_renameProperty('__ownObservers',constructor))){constructor.__ownObservers=constructor.hasOwnProperty(JSCompiler_renameProperty('observers',constructor))?/** @type {PolymerElementConstructor} */constructor.observers:null;}return constructor.__ownObservers;}/**
     * Creates effects for a property.
     *
     * Note, once a property has been set to
     * `readOnly`, `computed`, `reflectToAttribute`, or `notify`
     * these values may not be changed. For example, a subclass cannot
     * alter these settings. However, additional `observers` may be added
     * by subclasses.
     *
     * The info object should may contain property metadata as follows:
     *
     * * `type`: {function} type to which an attribute matching the property
     * is deserialized. Note the property is camel-cased from a dash-cased
     * attribute. For example, 'foo-bar' attribute is deserialized to a
     * property named 'fooBar'.
     *
     * * `readOnly`: {boolean} creates a readOnly property and
     * makes a private setter for the private of the form '_setFoo' for a
     * property 'foo',
     *
     * * `computed`: {string} creates a computed property. A computed property
     * also automatically is set to `readOnly: true`. The value is calculated
     * by running a method and arguments parsed from the given string. For
     * example 'compute(foo)' will compute a given property when the
     * 'foo' property changes by executing the 'compute' method. This method
     * must return the computed value.
     *
     * * `reflectToAttribute`: {boolean} If true, the property value is reflected
     * to an attribute of the same name. Note, the attribute is dash-cased
     * so a property named 'fooBar' is reflected as 'foo-bar'.
     *
     * * `notify`: {boolean} sends a non-bubbling notification event when
     * the property changes. For example, a property named 'foo' sends an
     * event named 'foo-changed' with `event.detail` set to the value of
     * the property.
     *
     * * observer: {string} name of a method that runs when the property
     * changes. The arguments of the method are (value, previousValue).
     *
     * Note: Users may want control over modifying property
     * effects via subclassing. For example, a user might want to make a
     * reflectToAttribute property not do so in a subclass. We've chosen to
     * disable this because it leads to additional complication.
     * For example, a readOnly effect generates a special setter. If a subclass
     * disables the effect, the setter would fail unexpectedly.
     * Based on feedback, we may want to try to make effects more malleable
     * and/or provide an advanced api for manipulating them.
     * Also consider adding warnings when an effect cannot be changed.
     *
     * @param {!PolymerElement} proto Element class prototype to add accessors
     *   and effects to
     * @param {string} name Name of the property.
     * @param {Object} info Info object from which to create property effects.
     * Supported keys:
     * @param {Object} allProps Flattened map of all properties defined in this
     *   element (including inherited properties)
     * @return {void}
     * @private
     */function createPropertyFromConfig(proto,name,info,allProps){// computed forces readOnly...
if(info.computed){info.readOnly=true;}// Note, since all computed properties are readOnly, this prevents
// adding additional computed property effects (which leads to a confusing
// setup where multiple triggers for setting a property)
// While we do have `hasComputedEffect` this is set on the property's
// dependencies rather than itself.
if(info.computed&&!proto._hasReadOnlyEffect(name)){proto._createComputedProperty(name,info.computed,allProps);}if(info.readOnly&&!proto._hasReadOnlyEffect(name)){proto._createReadOnlyProperty(name,!info.computed);}if(info.reflectToAttribute&&!proto._hasReflectEffect(name)){proto._createReflectedProperty(name);}if(info.notify&&!proto._hasNotifyEffect(name)){proto._createNotifyingProperty(name);}// always add observer
if(info.observer){proto._createPropertyObserver(name,info.observer,allProps[info.observer]);}// always create the mapping from attribute back to property for deserialization.
proto._addPropertyToAttributeMap(name);}/**
     * Process all style elements in the element template. Styles with the
     * `include` attribute are processed such that any styles in
     * the associated "style modules" are included in the element template.
     * @param {PolymerElementConstructor} klass Element class
     * @param {!HTMLTemplateElement} template Template to process
     * @param {string} is Name of element
     * @param {string} baseURI Base URI for element
     * @private
     */function processElementStyles(klass,template,is,baseURI){const templateStyles=template.content.querySelectorAll('style');const stylesWithImports=stylesFromTemplate(template);// insert styles from <link rel="import" type="css"> at the top of the template
const linkedStyles=stylesFromModuleImports(is);const firstTemplateChild=template.content.firstElementChild;for(let idx=0;idx<linkedStyles.length;idx++){let s=linkedStyles[idx];s.textContent=klass._processStyleText(s.textContent,baseURI);template.content.insertBefore(s,firstTemplateChild);}// keep track of the last "concrete" style in the template we have encountered
let templateStyleIndex=0;// ensure all gathered styles are actually in this template.
for(let i=0;i<stylesWithImports.length;i++){let s=stylesWithImports[i];let templateStyle=templateStyles[templateStyleIndex];// if the style is not in this template, it's been "included" and
// we put a clone of it in the template before the style that included it
if(templateStyle!==s){s=s.cloneNode(true);templateStyle.parentNode.insertBefore(s,templateStyle);}else{templateStyleIndex++;}s.textContent=klass._processStyleText(s.textContent,baseURI);}if(window.ShadyCSS){window.ShadyCSS.prepareTemplate(template,is);}}/**
     * @polymer
     * @mixinClass
     * @unrestricted
     * @implements {Polymer_ElementMixin}
     */class PolymerElement extends polymerElementBase{/**
     * Override of PropertiesMixin _finalizeClass to create observers and
     * find the template.
     * @return {void}
     * @protected
     * @override
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     */static _finalizeClass(){super._finalizeClass();if(this.hasOwnProperty(JSCompiler_renameProperty('is',this))&&this.is){register(this.prototype);}const observers=ownObservers(this);if(observers){this.createObservers(observers,this._properties);}// note: create "working" template that is finalized at instance time
let template=/** @type {PolymerElementConstructor} */this.template;if(template){if(typeof template==='string'){let t=document.createElement('template');t.innerHTML=template;template=t;}else{template=template.cloneNode(true);}}this.prototype._template=template;}/**
       * Override of PropertiesChanged createProperties to create accessors
       * and property effects for all of the properties.
       * @return {void}
       * @protected
       * @override
       */static createProperties(props){for(let p in props){createPropertyFromConfig(this.prototype,p,props[p],props);}}/**
       * Creates observers for the given `observers` array.
       * Leverages `PropertyEffects` to create observers.
       * @param {Object} observers Array of observer descriptors for
       *   this class
       * @param {Object} dynamicFns Object containing keys for any properties
       *   that are functions and should trigger the effect when the function
       *   reference is changed
       * @return {void}
       * @protected
       */static createObservers(observers,dynamicFns){const proto=this.prototype;for(let i=0;i<observers.length;i++){proto._createMethodObserver(observers[i],dynamicFns);}}/**
       * Returns the template that will be stamped into this element's shadow root.
       *
       * If a `static get is()` getter is defined, the default implementation
       * will return the first `<template>` in a `dom-module` whose `id`
       * matches this element's `is`.
       *
       * Users may override this getter to return an arbitrary template
       * (in which case the `is` getter is unnecessary). The template returned
       * may be either an `HTMLTemplateElement` or a string that will be
       * automatically parsed into a template.
       *
       * Note that when subclassing, if the super class overrode the default
       * implementation and the subclass would like to provide an alternate
       * template via a `dom-module`, it should override this getter and
       * return `Polymer.DomModule.import(this.is, 'template')`.
       *
       * If a subclass would like to modify the super class template, it should
       * clone it rather than modify it in place.  If the getter does expensive
       * work such as cloning/modifying a template, it should memoize the
       * template for maximum performance:
       *
       *   let memoizedTemplate;
       *   class MySubClass extends MySuperClass {
       *     static get template() {
       *       if (!memoizedTemplate) {
       *         memoizedTemplate = super.template.cloneNode(true);
       *         let subContent = document.createElement('div');
       *         subContent.textContent = 'This came from MySubClass';
       *         memoizedTemplate.content.appendChild(subContent);
       *       }
       *       return memoizedTemplate;
       *     }
       *   }
       *
       * @return {HTMLTemplateElement|string} Template to be stamped
       */static get template(){if(!this.hasOwnProperty(JSCompiler_renameProperty('_template',this))){this._template=DomModule&&DomModule.import(/** @type {PolymerElementConstructor}*/this.is,'template')||// note: implemented so a subclass can retrieve the super
// template; call the super impl this way so that `this` points
// to the superclass.
Object.getPrototypeOf(/** @type {PolymerElementConstructor}*/this.prototype).constructor.template;}return this._template;}/**
       * Path matching the url from which the element was imported.
       * This path is used to resolve url's in template style cssText.
       * The `importPath` property is also set on element instances and can be
       * used to create bindings relative to the import path.
       * Defaults to the path matching the url containing a `dom-module` element
       * matching this element's static `is` property.
       * Note, this path should contain a trailing `/`.
       *
       * @return {string} The import path for this element class
       */static get importPath(){if(!this.hasOwnProperty(JSCompiler_renameProperty('_importPath',this))){const module=DomModule&&DomModule.import(/** @type {PolymerElementConstructor} */this.is);this._importPath=module?module.assetpath:''||Object.getPrototypeOf(/** @type {PolymerElementConstructor}*/this.prototype).constructor.importPath;}return this._importPath;}constructor(){super();/** @type {HTMLTemplateElement} */this._template;/** @type {string} */this._importPath;/** @type {string} */this.rootPath;/** @type {string} */this.importPath;/** @type {StampedTemplate | HTMLElement | ShadowRoot} */this.root;/** @type {!Object<string, !Element>} */this.$;}/**
       * Overrides the default `Polymer.PropertyAccessors` to ensure class
       * metaprogramming related to property accessors and effects has
       * completed (calls `finalize`).
       *
       * It also initializes any property defaults provided via `value` in
       * `properties` metadata.
       *
       * @return {void}
       * @override
       * @suppress {invalidCasts}
       */_initializeProperties(){instanceCount++;this.constructor.finalize();const importPath=this.constructor.importPath;// note: finalize template when we have access to `localName` to
// avoid dependence on `is` for polyfilling styling.
this.constructor._finalizeTemplate(/** @type {!HTMLElement} */this.localName);super._initializeProperties();// set path defaults
this.rootPath=rootPath;this.importPath=importPath;// apply property defaults...
let p$=propertyDefaults(this.constructor);if(!p$){return;}for(let p in p$){let info=p$[p];// Don't set default value if there is already an own property, which
// happens when a `properties` property with default but no effects had
// a property set (e.g. bound) by its host before upgrade
if(!this.hasOwnProperty(p)){let value=typeof info.value=='function'?info.value.call(this):info.value;// Set via `_setProperty` if there is an accessor, to enable
// initializing readOnly property defaults
if(this._hasAccessor(p)){this._setPendingProperty(p,value,true);}else{this[p]=value;}}}}/**
       * Gather style text for a style element in the template.
       *
       * @param {string} cssText Text containing styling to process
       * @param {string} baseURI Base URI to rebase CSS paths against
       * @return {string} The processed CSS text
       * @protected
       */static _processStyleText(cssText,baseURI){return resolveCss(cssText,baseURI);}/**
      * Configures an element `proto` to function with a given `template`.
      * The element name `is` and extends `ext` must be specified for ShadyCSS
      * style scoping.
      *
      * @param {string} is Tag name (or type extension name) for this element
      * @return {void}
      * @protected
      */static _finalizeTemplate(is){/** @const {HTMLTemplateElement} */const template=this.prototype._template;if(template&&!template.__polymerFinalized){template.__polymerFinalized=true;const importPath=this.importPath;const baseURI=importPath?resolveUrl(importPath):'';// e.g. support `include="module-name"`, and ShadyCSS
processElementStyles(this,template,is,baseURI);this.prototype._bindTemplate(template);}}/**
       * Provides a default implementation of the standard Custom Elements
       * `connectedCallback`.
       *
       * The default implementation enables the property effects system and
       * flushes any pending properties, and updates shimmed CSS properties
       * when using the ShadyCSS scoping/custom properties polyfill.
       *
       * @suppress {missingProperties, invalidCasts} Super may or may not implement the callback
       * @return {void}
       */connectedCallback(){if(window.ShadyCSS&&this._template){window.ShadyCSS.styleElement(/** @type {!HTMLElement} */this);}super.connectedCallback();}/**
       * Stamps the element template.
       *
       * @return {void}
       * @override
       */ready(){if(this._template){this.root=this._stampTemplate(this._template);this.$=this.root.$;}super.ready();}/**
       * Implements `PropertyEffects`'s `_readyClients` call. Attaches
       * element dom by calling `_attachDom` with the dom stamped from the
       * element's template via `_stampTemplate`. Note that this allows
       * client dom to be attached to the element prior to any observers
       * running.
       *
       * @return {void}
       * @override
       */_readyClients(){if(this._template){this.root=this._attachDom(/** @type {StampedTemplate} */this.root);}// The super._readyClients here sets the clients initialized flag.
// We must wait to do this until after client dom is created/attached
// so that this flag can be checked to prevent notifications fired
// during this process from being handled before clients are ready.
super._readyClients();}/**
       * Attaches an element's stamped dom to itself. By default,
       * this method creates a `shadowRoot` and adds the dom to it.
       * However, this method may be overridden to allow an element
       * to put its dom in another location.
       *
       * @throws {Error}
       * @suppress {missingReturn}
       * @param {StampedTemplate} dom to attach to the element.
       * @return {ShadowRoot} node to which the dom has been attached.
       */_attachDom(dom){if(this.attachShadow){if(dom){if(!this.shadowRoot){this.attachShadow({mode:'open'});}this.shadowRoot.appendChild(dom);return this.shadowRoot;}return null;}else{throw new Error('ShadowDOM not available. '+// TODO(sorvell): move to compile-time conditional when supported
'Polymer.Element can create dom as children instead of in '+'ShadowDOM by setting `this.root = this;\` before \`ready\`.');}}/**
       * When using the ShadyCSS scoping and custom property shim, causes all
       * shimmed styles in this element (and its subtree) to be updated
       * based on current custom property values.
       *
       * The optional parameter overrides inline custom property styles with an
       * object of properties where the keys are CSS properties, and the values
       * are strings.
       *
       * Example: `this.updateStyles({'--color': 'blue'})`
       *
       * These properties are retained unless a value of `null` is set.
       *
       * Note: This function does not support updating CSS mixins.
       * You can not dynamically change the value of an `@apply`.
       *
       * @param {Object=} properties Bag of custom property key/values to
       *   apply to this element.
       * @return {void}
       * @suppress {invalidCasts}
       */updateStyles(properties){if(window.ShadyCSS){window.ShadyCSS.styleSubtree(/** @type {!HTMLElement} */this,properties);}}/**
       * Rewrites a given URL relative to a base URL. The base URL defaults to
       * the original location of the document containing the `dom-module` for
       * this element. This method will return the same URL before and after
       * bundling.
       *
       * Note that this function performs no resolution for URLs that start
       * with `/` (absolute URLs) or `#` (hash identifiers).  For general purpose
       * URL resolution, use `window.URL`.
       *
       * @param {string} url URL to resolve.
       * @param {string=} base Optional base URL to resolve against, defaults
       * to the element's `importPath`
       * @return {string} Rewritten URL relative to base
       */resolveUrl(url,base){if(!base&&this.importPath){base=resolveUrl(this.importPath);}return resolveUrl(url,base);}/**
       * Overrides `PropertyAccessors` to add map of dynamic functions on
       * template info, for consumption by `PropertyEffects` template binding
       * code. This map determines which method templates should have accessors
       * created for them.
       *
       * @override
       * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
       */static _parseTemplateContent(template,templateInfo,nodeInfo){templateInfo.dynamicFns=templateInfo.dynamicFns||this._properties;return super._parseTemplateContent(template,templateInfo,nodeInfo);}}return PolymerElement;});let instanceCount=0;const registrations=[];function _regLog(prototype){console.log('['+prototype.is+']: registered');}function register(prototype){registrations.push(prototype);undefined&&_regLog(prototype);}function dumpRegistrations(){registrations.forEach(_regLog);}const updateStyles=function(props){if(window.ShadyCSS){window.ShadyCSS.styleDocument(props);}};var elementMixin={ElementMixin:ElementMixin,get instanceCount(){return instanceCount;},registrations:registrations,_regLog:_regLog,register:register,dumpRegistrations:dumpRegistrations,updateStyles:updateStyles};/**
    * @summary Collapse multiple callbacks into one invocation after a timer.
    * @memberof Polymer
    */class Debouncer{constructor(){this._asyncModule=null;this._callback=null;this._timer=null;}/**
     * Sets the scheduler; that is, a module with the Async interface,
     * a callback and optional arguments to be passed to the run function
     * from the async module.
     *
     * @param {!AsyncInterface} asyncModule Object with Async interface.
     * @param {function()} callback Callback to run.
     * @return {void}
     */setConfig(asyncModule,callback){this._asyncModule=asyncModule;this._callback=callback;this._timer=this._asyncModule.run(()=>{this._timer=null;this._callback();});}/**
     * Cancels an active debouncer and returns a reference to itself.
     *
     * @return {void}
     */cancel(){if(this.isActive()){this._asyncModule.cancel(this._timer);this._timer=null;}}/**
     * Flushes an active debouncer and returns a reference to itself.
     *
     * @return {void}
     */flush(){if(this.isActive()){this.cancel();this._callback();}}/**
     * Returns true if the debouncer is active.
     *
     * @return {boolean} True if active.
     */isActive(){return this._timer!=null;}/**
     * Creates a debouncer if no debouncer is passed as a parameter
     * or it cancels an active debouncer otherwise. The following
     * example shows how a debouncer can be called multiple times within a
     * microtask and "debounced" such that the provided callback function is
     * called once. Add this method to a custom element:
     *
     * _debounceWork() {
     *   this._debounceJob = Polymer.Debouncer.debounce(this._debounceJob,
     *       Polymer.Async.microTask, () => {
     *     this._doWork();
     *   });
     * }
     *
     * If the `_debounceWork` method is called multiple times within the same
     * microtask, the `_doWork` function will be called only once at the next
     * microtask checkpoint.
     *
     * Note: In testing it is often convenient to avoid asynchrony. To accomplish
     * this with a debouncer, you can use `Polymer.enqueueDebouncer` and
     * `Polymer.flush`. For example, extend the above example by adding
     * `Polymer.enqueueDebouncer(this._debounceJob)` at the end of the
     * `_debounceWork` method. Then in a test, call `Polymer.flush` to ensure
     * the debouncer has completed.
     *
     * @param {Debouncer?} debouncer Debouncer object.
     * @param {!AsyncInterface} asyncModule Object with Async interface
     * @param {function()} callback Callback to run.
     * @return {!Debouncer} Returns a debouncer object.
     */static debounce(debouncer,asyncModule,callback){if(debouncer instanceof Debouncer){debouncer.cancel();}else{debouncer=new Debouncer();}debouncer.setConfig(asyncModule,callback);return debouncer;}}var debounce={Debouncer:Debouncer};// detect native touch action support
let HAS_NATIVE_TA=typeof document.head.style.touchAction==='string';let GESTURE_KEY='__polymerGestures';let HANDLED_OBJ='__polymerGesturesHandled';let TOUCH_ACTION='__polymerGesturesTouchAction';// radius for tap and track
let TAP_DISTANCE=25;let TRACK_DISTANCE=5;// number of last N track positions to keep
let TRACK_LENGTH=2;// Disabling "mouse" handlers for 2500ms is enough
let MOUSE_TIMEOUT=2500;let MOUSE_EVENTS=['mousedown','mousemove','mouseup','click'];// an array of bitmask values for mapping MouseEvent.which to MouseEvent.buttons
let MOUSE_WHICH_TO_BUTTONS=[0,1,4,2];let MOUSE_HAS_BUTTONS=function(){try{return new MouseEvent('test',{buttons:1}).buttons===1;}catch(e){return false;}}();/**
      * @param {string} name Possible mouse event name
      * @return {boolean} true if mouse event, false if not
      */function isMouseEvent(name){return MOUSE_EVENTS.indexOf(name)>-1;}/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */ // check for passive event listeners
let SUPPORTS_PASSIVE=false;(function(){try{let opts=Object.defineProperty({},'passive',{get(){SUPPORTS_PASSIVE=true;}});window.addEventListener('test',null,opts);window.removeEventListener('test',null,opts);}catch(e){}})();/**
       * Generate settings for event listeners, dependant on `Polymer.passiveTouchGestures`
       *
       * @param {string} eventName Event name to determine if `{passive}` option is needed
       * @return {{passive: boolean} | undefined} Options to use for addEventListener and removeEventListener
       */function PASSIVE_TOUCH(eventName){if(isMouseEvent(eventName)||eventName==='touchend'){return;}if(HAS_NATIVE_TA&&SUPPORTS_PASSIVE&&passiveTouchGestures){return{passive:true};}else{return;}}// Check for touch-only devices
let IS_TOUCH_ONLY=navigator.userAgent.match(/iP(?:[oa]d|hone)|Android/);let GestureRecognizer=function(){};// eslint-disable-line no-unused-vars
/** @type {function(): void} */GestureRecognizer.prototype.reset;/** @type {function(MouseEvent): void | undefined} */GestureRecognizer.prototype.mousedown;/** @type {(function(MouseEvent): void | undefined)} */GestureRecognizer.prototype.mousemove;/** @type {(function(MouseEvent): void | undefined)} */GestureRecognizer.prototype.mouseup;/** @type {(function(TouchEvent): void | undefined)} */GestureRecognizer.prototype.touchstart;/** @type {(function(TouchEvent): void | undefined)} */GestureRecognizer.prototype.touchmove;/** @type {(function(TouchEvent): void | undefined)} */GestureRecognizer.prototype.touchend;/** @type {(function(MouseEvent): void | undefined)} */GestureRecognizer.prototype.click;// keep track of any labels hit by the mouseCanceller
/** @type {!Array<!HTMLLabelElement>} */const clickedLabels=[];/** @type {!Object<boolean>} */const labellable={'button':true,'input':true,'keygen':true,'meter':true,'output':true,'textarea':true,'progress':true,'select':true};/**
    * @param {HTMLElement} el Element to check labelling status
    * @return {boolean} element can have labels
    */function canBeLabelled(el){return labellable[el.localName]||false;}/**
   * @param {HTMLElement} el Element that may be labelled.
   * @return {!Array<!HTMLLabelElement>} Relevant label for `el`
   */function matchingLabels(el){let labels=[...(/** @type {HTMLInputElement} */el.labels||[])];// IE doesn't have `labels` and Safari doesn't populate `labels`
// if element is in a shadowroot.
// In this instance, finding the non-ancestor labels is enough,
// as the mouseCancellor code will handle ancstor labels
if(!labels.length){labels=[];let root=el.getRootNode();// if there is an id on `el`, check for all labels with a matching `for` attribute
if(el.id){let matching=root.querySelectorAll(`label[for = ${el.id}]`);for(let i=0;i<matching.length;i++){labels.push(/** @type {!HTMLLabelElement} */matching[i]);}}}return labels;}// touch will make synthetic mouse events
// `preventDefault` on touchend will cancel them,
// but this breaks `<input>` focus and link clicks
// disable mouse handlers for MOUSE_TIMEOUT ms after
// a touchend to ignore synthetic mouse events
let mouseCanceller=function(mouseEvent){// Check for sourceCapabilities, used to distinguish synthetic events
// if mouseEvent did not come from a device that fires touch events,
// it was made by a real mouse and should be counted
// http://wicg.github.io/InputDeviceCapabilities/#dom-inputdevicecapabilities-firestouchevents
let sc=mouseEvent.sourceCapabilities;if(sc&&!sc.firesTouchEvents){return;}// skip synthetic mouse events
mouseEvent[HANDLED_OBJ]={skip:true};// disable "ghost clicks"
if(mouseEvent.type==='click'){let clickFromLabel=false;let path=mouseEvent.composedPath&&mouseEvent.composedPath();if(path){for(let i=0;i<path.length;i++){if(path[i].nodeType===Node.ELEMENT_NODE){if(path[i].localName==='label'){clickedLabels.push(path[i]);}else if(canBeLabelled(path[i])){let ownerLabels=matchingLabels(path[i]);// check if one of the clicked labels is labelling this element
for(let j=0;j<ownerLabels.length;j++){clickFromLabel=clickFromLabel||clickedLabels.indexOf(ownerLabels[j])>-1;}}}if(path[i]===POINTERSTATE.mouse.target){return;}}}// if one of the clicked labels was labelling the target element,
// this is not a ghost click
if(clickFromLabel){return;}mouseEvent.preventDefault();mouseEvent.stopPropagation();}};/**
    * @param {boolean=} setup True to add, false to remove.
    * @return {void}
    */function setupTeardownMouseCanceller(setup){let events=IS_TOUCH_ONLY?['click']:MOUSE_EVENTS;for(let i=0,en;i<events.length;i++){en=events[i];if(setup){// reset clickLabels array
clickedLabels.length=0;document.addEventListener(en,mouseCanceller,true);}else{document.removeEventListener(en,mouseCanceller,true);}}}function ignoreMouse(e){if(!POINTERSTATE.mouse.mouseIgnoreJob){setupTeardownMouseCanceller(true);}let unset=function(){setupTeardownMouseCanceller();POINTERSTATE.mouse.target=null;POINTERSTATE.mouse.mouseIgnoreJob=null;};POINTERSTATE.mouse.target=e.composedPath()[0];POINTERSTATE.mouse.mouseIgnoreJob=Debouncer.debounce(POINTERSTATE.mouse.mouseIgnoreJob,timeOut.after(MOUSE_TIMEOUT),unset);}/**
   * @param {MouseEvent} ev event to test for left mouse button down
   * @return {boolean} has left mouse button down
   */function hasLeftMouseButton(ev){let type=ev.type;// exit early if the event is not a mouse event
if(!isMouseEvent(type)){return false;}// ev.button is not reliable for mousemove (0 is overloaded as both left button and no buttons)
// instead we use ev.buttons (bitmask of buttons) or fall back to ev.which (deprecated, 0 for no buttons, 1 for left button)
if(type==='mousemove'){// allow undefined for testing events
let buttons=ev.buttons===undefined?1:ev.buttons;if(ev instanceof window.MouseEvent&&!MOUSE_HAS_BUTTONS){buttons=MOUSE_WHICH_TO_BUTTONS[ev.which]||0;}// buttons is a bitmask, check that the left button bit is set (1)
return Boolean(buttons&1);}else{// allow undefined for testing events
let button=ev.button===undefined?0:ev.button;// ev.button is 0 in mousedown/mouseup/click for left button activation
return button===0;}}function isSyntheticClick(ev){if(ev.type==='click'){// ev.detail is 0 for HTMLElement.click in most browsers
if(ev.detail===0){return true;}// in the worst case, check that the x/y position of the click is within
// the bounding box of the target of the event
// Thanks IE 10 >:(
let t=_findOriginalTarget(ev);// make sure the target of the event is an element so we can use getBoundingClientRect,
// if not, just assume it is a synthetic click
if(!t.nodeType||/** @type {Element} */t.nodeType!==Node.ELEMENT_NODE){return true;}let bcr=/** @type {Element} */t.getBoundingClientRect();// use page x/y to account for scrolling
let x=ev.pageX,y=ev.pageY;// ev is a synthetic click if the position is outside the bounding box of the target
return!(x>=bcr.left&&x<=bcr.right&&y>=bcr.top&&y<=bcr.bottom);}return false;}let POINTERSTATE={mouse:{target:null,mouseIgnoreJob:null},touch:{x:0,y:0,id:-1,scrollDecided:false}};function firstTouchAction(ev){let ta='auto';let path=ev.composedPath&&ev.composedPath();if(path){for(let i=0,n;i<path.length;i++){n=path[i];if(n[TOUCH_ACTION]){ta=n[TOUCH_ACTION];break;}}}return ta;}function trackDocument(stateObj,movefn,upfn){stateObj.movefn=movefn;stateObj.upfn=upfn;document.addEventListener('mousemove',movefn);document.addEventListener('mouseup',upfn);}function untrackDocument(stateObj){document.removeEventListener('mousemove',stateObj.movefn);document.removeEventListener('mouseup',stateObj.upfn);stateObj.movefn=null;stateObj.upfn=null;}// use a document-wide touchend listener to start the ghost-click prevention mechanism
// Use passive event listeners, if supported, to not affect scrolling performance
document.addEventListener('touchend',ignoreMouse,SUPPORTS_PASSIVE?{passive:true}:false);const gestures={};const recognizers=[];function deepTargetFind(x,y){let node=document.elementFromPoint(x,y);let next=node;// this code path is only taken when native ShadowDOM is used
// if there is a shadowroot, it may have a node at x/y
// if there is not a shadowroot, exit the loop
while(next&&next.shadowRoot&&!window.ShadyDOM){// if there is a node at x/y in the shadowroot, look deeper
let oldNext=next;next=next.shadowRoot.elementFromPoint(x,y);// on Safari, elementFromPoint may return the shadowRoot host
if(oldNext===next){break;}if(next){node=next;}}return node;}function _findOriginalTarget(ev){// shadowdom
if(ev.composedPath){const targets=/** @type {!Array<!EventTarget>} */ev.composedPath();// It shouldn't be, but sometimes targets is empty (window on Safari).
return targets.length>0?targets[0]:ev.target;}// shadydom
return ev.target;}function _handleNative(ev){let handled;let type=ev.type;let node=ev.currentTarget;let gobj=node[GESTURE_KEY];if(!gobj){return;}let gs=gobj[type];if(!gs){return;}if(!ev[HANDLED_OBJ]){ev[HANDLED_OBJ]={};if(type.slice(0,5)==='touch'){ev=/** @type {TouchEvent} */ev;// eslint-disable-line no-self-assign
let t=ev.changedTouches[0];if(type==='touchstart'){// only handle the first finger
if(ev.touches.length===1){POINTERSTATE.touch.id=t.identifier;}}if(POINTERSTATE.touch.id!==t.identifier){return;}if(!HAS_NATIVE_TA){if(type==='touchstart'||type==='touchmove'){_handleTouchAction(ev);}}}}handled=ev[HANDLED_OBJ];// used to ignore synthetic mouse events
if(handled.skip){return;}// reset recognizer state
for(let i=0,r;i<recognizers.length;i++){r=recognizers[i];if(gs[r.name]&&!handled[r.name]){if(r.flow&&r.flow.start.indexOf(ev.type)>-1&&r.reset){r.reset();}}}// enforce gesture recognizer order
for(let i=0,r;i<recognizers.length;i++){r=recognizers[i];if(gs[r.name]&&!handled[r.name]){handled[r.name]=true;r[type](ev);}}}function _handleTouchAction(ev){let t=ev.changedTouches[0];let type=ev.type;if(type==='touchstart'){POINTERSTATE.touch.x=t.clientX;POINTERSTATE.touch.y=t.clientY;POINTERSTATE.touch.scrollDecided=false;}else if(type==='touchmove'){if(POINTERSTATE.touch.scrollDecided){return;}POINTERSTATE.touch.scrollDecided=true;let ta=firstTouchAction(ev);let prevent=false;let dx=Math.abs(POINTERSTATE.touch.x-t.clientX);let dy=Math.abs(POINTERSTATE.touch.y-t.clientY);if(!ev.cancelable){// scrolling is happening
}else if(ta==='none'){prevent=true;}else if(ta==='pan-x'){prevent=dy>dx;}else if(ta==='pan-y'){prevent=dx>dy;}if(prevent){ev.preventDefault();}else{prevent('track');}}}function addListener(node,evType,handler){if(gestures[evType]){_add(node,evType,handler);return true;}return false;}function removeListener(node,evType,handler){if(gestures[evType]){_remove(node,evType,handler);return true;}return false;}function _add(node,evType,handler){let recognizer=gestures[evType];let deps=recognizer.deps;let name=recognizer.name;let gobj=node[GESTURE_KEY];if(!gobj){node[GESTURE_KEY]=gobj={};}for(let i=0,dep,gd;i<deps.length;i++){dep=deps[i];// don't add mouse handlers on iOS because they cause gray selection overlays
if(IS_TOUCH_ONLY&&isMouseEvent(dep)&&dep!=='click'){continue;}gd=gobj[dep];if(!gd){gobj[dep]=gd={_count:0};}if(gd._count===0){node.addEventListener(dep,_handleNative,PASSIVE_TOUCH(dep));}gd[name]=(gd[name]||0)+1;gd._count=(gd._count||0)+1;}node.addEventListener(evType,handler);if(recognizer.touchAction){setTouchAction(node,recognizer.touchAction);}}function _remove(node,evType,handler){let recognizer=gestures[evType];let deps=recognizer.deps;let name=recognizer.name;let gobj=node[GESTURE_KEY];if(gobj){for(let i=0,dep,gd;i<deps.length;i++){dep=deps[i];gd=gobj[dep];if(gd&&gd[name]){gd[name]=(gd[name]||1)-1;gd._count=(gd._count||1)-1;if(gd._count===0){node.removeEventListener(dep,_handleNative,PASSIVE_TOUCH(dep));}}}}node.removeEventListener(evType,handler);}function register$1(recog){recognizers.push(recog);for(let i=0;i<recog.emits.length;i++){gestures[recog.emits[i]]=recog;}}function _findRecognizerByEvent(evName){for(let i=0,r;i<recognizers.length;i++){r=recognizers[i];for(let j=0,n;j<r.emits.length;j++){n=r.emits[j];if(n===evName){return r;}}}return null;}function setTouchAction(node,value){if(HAS_NATIVE_TA){// NOTE: add touchAction async so that events can be added in
// custom element constructors. Otherwise we run afoul of custom
// elements restriction against settings attributes (style) in the
// constructor.
microTask.run(()=>{node.style.touchAction=value;});}node[TOUCH_ACTION]=value;}function _fire(target,type,detail){let ev=new Event(type,{bubbles:true,cancelable:true,composed:true});ev.detail=detail;target.dispatchEvent(ev);// forward `preventDefault` in a clean way
if(ev.defaultPrevented){let preventer=detail.preventer||detail.sourceEvent;if(preventer&&preventer.preventDefault){preventer.preventDefault();}}}function prevent(evName){let recognizer=_findRecognizerByEvent(evName);if(recognizer.info){recognizer.info.prevent=true;}}function resetMouseCanceller(){if(POINTERSTATE.mouse.mouseIgnoreJob){POINTERSTATE.mouse.mouseIgnoreJob.flush();}}/* eslint-disable valid-jsdoc */register$1({name:'downup',deps:['mousedown','touchstart','touchend'],flow:{start:['mousedown','touchstart'],end:['mouseup','touchend']},emits:['down','up'],info:{movefn:null,upfn:null},/**
   * @this {GestureRecognizer}
   * @return {void}
   */reset:function(){untrackDocument(this.info);},/**
   * @this {GestureRecognizer}
   * @param {MouseEvent} e
   * @return {void}
   */mousedown:function(e){if(!hasLeftMouseButton(e)){return;}let t=_findOriginalTarget(e);let self=this;let movefn=function movefn(e){if(!hasLeftMouseButton(e)){self._fire('up',t,e);untrackDocument(self.info);}};let upfn=function upfn(e){if(hasLeftMouseButton(e)){self._fire('up',t,e);}untrackDocument(self.info);};trackDocument(this.info,movefn,upfn);this._fire('down',t,e);},/**
   * @this {GestureRecognizer}
   * @param {TouchEvent} e
   * @return {void}
   */touchstart:function(e){this._fire('down',_findOriginalTarget(e),e.changedTouches[0],e);},/**
   * @this {GestureRecognizer}
   * @param {TouchEvent} e
   * @return {void}
   */touchend:function(e){this._fire('up',_findOriginalTarget(e),e.changedTouches[0],e);},/**
   * @param {string} type
   * @param {!EventTarget} target
   * @param {Event} event
   * @param {Function} preventer
   * @return {void}
   */_fire:function(type,target,event,preventer){_fire(target,type,{x:event.clientX,y:event.clientY,sourceEvent:event,preventer:preventer,prevent:function(e){return prevent(e);}});}});register$1({name:'track',touchAction:'none',deps:['mousedown','touchstart','touchmove','touchend'],flow:{start:['mousedown','touchstart'],end:['mouseup','touchend']},emits:['track'],info:{x:0,y:0,state:'start',started:false,moves:[],/** @this {GestureRecognizer} */addMove:function(move){if(this.moves.length>TRACK_LENGTH){this.moves.shift();}this.moves.push(move);},movefn:null,upfn:null,prevent:false},/**
   * @this {GestureRecognizer}
   * @return {void}
   */reset:function(){this.info.state='start';this.info.started=false;this.info.moves=[];this.info.x=0;this.info.y=0;this.info.prevent=false;untrackDocument(this.info);},/**
   * @this {GestureRecognizer}
   * @param {number} x
   * @param {number} y
   * @return {boolean}
   */hasMovedEnough:function(x,y){if(this.info.prevent){return false;}if(this.info.started){return true;}let dx=Math.abs(this.info.x-x);let dy=Math.abs(this.info.y-y);return dx>=TRACK_DISTANCE||dy>=TRACK_DISTANCE;},/**
   * @this {GestureRecognizer}
   * @param {MouseEvent} e
   * @return {void}
   */mousedown:function(e){if(!hasLeftMouseButton(e)){return;}let t=_findOriginalTarget(e);let self=this;let movefn=function movefn(e){let x=e.clientX,y=e.clientY;if(self.hasMovedEnough(x,y)){// first move is 'start', subsequent moves are 'move', mouseup is 'end'
self.info.state=self.info.started?e.type==='mouseup'?'end':'track':'start';if(self.info.state==='start'){// if and only if tracking, always prevent tap
prevent('tap');}self.info.addMove({x:x,y:y});if(!hasLeftMouseButton(e)){// always _fire "end"
self.info.state='end';untrackDocument(self.info);}self._fire(t,e);self.info.started=true;}};let upfn=function upfn(e){if(self.info.started){movefn(e);}// remove the temporary listeners
untrackDocument(self.info);};// add temporary document listeners as mouse retargets
trackDocument(this.info,movefn,upfn);this.info.x=e.clientX;this.info.y=e.clientY;},/**
   * @this {GestureRecognizer}
   * @param {TouchEvent} e
   * @return {void}
   */touchstart:function(e){let ct=e.changedTouches[0];this.info.x=ct.clientX;this.info.y=ct.clientY;},/**
   * @this {GestureRecognizer}
   * @param {TouchEvent} e
   * @return {void}
   */touchmove:function(e){let t=_findOriginalTarget(e);let ct=e.changedTouches[0];let x=ct.clientX,y=ct.clientY;if(this.hasMovedEnough(x,y)){if(this.info.state==='start'){// if and only if tracking, always prevent tap
prevent('tap');}this.info.addMove({x:x,y:y});this._fire(t,ct);this.info.state='track';this.info.started=true;}},/**
   * @this {GestureRecognizer}
   * @param {TouchEvent} e
   * @return {void}
   */touchend:function(e){let t=_findOriginalTarget(e);let ct=e.changedTouches[0];// only trackend if track was started and not aborted
if(this.info.started){// reset started state on up
this.info.state='end';this.info.addMove({x:ct.clientX,y:ct.clientY});this._fire(t,ct,e);}},/**
   * @this {GestureRecognizer}
   * @param {!EventTarget} target
   * @param {Touch} touch
   * @return {void}
   */_fire:function(target,touch){let secondlast=this.info.moves[this.info.moves.length-2];let lastmove=this.info.moves[this.info.moves.length-1];let dx=lastmove.x-this.info.x;let dy=lastmove.y-this.info.y;let ddx,ddy=0;if(secondlast){ddx=lastmove.x-secondlast.x;ddy=lastmove.y-secondlast.y;}_fire(target,'track',{state:this.info.state,x:touch.clientX,y:touch.clientY,dx:dx,dy:dy,ddx:ddx,ddy:ddy,sourceEvent:touch,hover:function(){return deepTargetFind(touch.clientX,touch.clientY);}});}});register$1({name:'tap',deps:['mousedown','click','touchstart','touchend'],flow:{start:['mousedown','touchstart'],end:['click','touchend']},emits:['tap'],info:{x:NaN,y:NaN,prevent:false},/**
   * @this {GestureRecognizer}
   * @return {void}
   */reset:function(){this.info.x=NaN;this.info.y=NaN;this.info.prevent=false;},/**
   * @this {GestureRecognizer}
   * @param {MouseEvent} e
   * @return {void}
   */save:function(e){this.info.x=e.clientX;this.info.y=e.clientY;},/**
   * @this {GestureRecognizer}
   * @param {MouseEvent} e
   * @return {void}
   */mousedown:function(e){if(hasLeftMouseButton(e)){this.save(e);}},/**
   * @this {GestureRecognizer}
   * @param {MouseEvent} e
   * @return {void}
   */click:function(e){if(hasLeftMouseButton(e)){this.forward(e);}},/**
   * @this {GestureRecognizer}
   * @param {TouchEvent} e
   * @return {void}
   */touchstart:function(e){this.save(e.changedTouches[0],e);},/**
   * @this {GestureRecognizer}
   * @param {TouchEvent} e
   * @return {void}
   */touchend:function(e){this.forward(e.changedTouches[0],e);},/**
   * @this {GestureRecognizer}
   * @param {Event | Touch} e
   * @param {Event=} preventer
   * @return {void}
   */forward:function(e,preventer){let dx=Math.abs(e.clientX-this.info.x);let dy=Math.abs(e.clientY-this.info.y);// find original target from `preventer` for TouchEvents, or `e` for MouseEvents
let t=_findOriginalTarget(preventer||e);if(!t||t.disabled){return;}// dx,dy can be NaN if `click` has been simulated and there was no `down` for `start`
if(isNaN(dx)||isNaN(dy)||dx<=TAP_DISTANCE&&dy<=TAP_DISTANCE||isSyntheticClick(e)){// prevent taps from being generated if an event has canceled them
if(!this.info.prevent){_fire(t,'tap',{x:e.clientX,y:e.clientY,sourceEvent:e,preventer:preventer});}}}});const findOriginalTarget=_findOriginalTarget;const add=addListener;const remove=removeListener;var gestures$0={gestures:gestures,recognizers:recognizers,deepTargetFind:deepTargetFind,_findOriginalTarget:_findOriginalTarget,_handleNative:_handleNative,_handleTouchAction:_handleTouchAction,addListener:addListener,removeListener:removeListener,_add:_add,_remove:_remove,register:register$1,_findRecognizerByEvent:_findRecognizerByEvent,setTouchAction:setTouchAction,_fire:_fire,prevent:prevent,resetMouseCanceller:resetMouseCanceller,findOriginalTarget:findOriginalTarget,add:add,remove:remove};/**
    * @const {Polymer.Gestures}
    */const gestures$1=gestures$0;const GestureEventListeners=dedupingMixin(superClass=>{/**
   * @polymer
   * @mixinClass
   * @implements {Polymer_GestureEventListeners}
   */class GestureEventListeners extends superClass{/**
     * Add the event listener to the node if it is a gestures event.
     *
     * @param {!Node} node Node to add event listener to
     * @param {string} eventName Name of event
     * @param {function(!Event):void} handler Listener function to add
     * @return {void}
     */_addEventListenerToNode(node,eventName,handler){if(!gestures$1.addListener(node,eventName,handler)){super._addEventListenerToNode(node,eventName,handler);}}/**
       * Remove the event listener to the node if it is a gestures event.
       *
       * @param {!Node} node Node to remove event listener from
       * @param {string} eventName Name of event
       * @param {function(!Event):void} handler Listener function to remove
       * @return {void}
       */_removeEventListenerFromNode(node,eventName,handler){if(!gestures$1.removeListener(node,eventName,handler)){super._removeEventListenerFromNode(node,eventName,handler);}}}return GestureEventListeners;});var gestureEventListeners={GestureEventListeners:GestureEventListeners};const HOST_DIR=/:host\(:dir\((ltr|rtl)\)\)/g;const HOST_DIR_REPLACMENT=':host([dir="$1"])';const EL_DIR=/([\s\w-#\.\[\]\*]*):dir\((ltr|rtl)\)/g;const EL_DIR_REPLACMENT=':host([dir="$2"]) $1';/**
                                                   * @type {!Array<!Polymer_DirMixin>}
                                                   */const DIR_INSTANCES=[];/** @type {MutationObserver} */let observer=null;let DOCUMENT_DIR='';function getRTL(){DOCUMENT_DIR=document.documentElement.getAttribute('dir');}/**
   * @param {!Polymer_DirMixin} instance Instance to set RTL status on
   */function setRTL(instance){if(!instance.__autoDirOptOut){const el=/** @type {!HTMLElement} */instance;el.setAttribute('dir',DOCUMENT_DIR);}}function updateDirection(){getRTL();DOCUMENT_DIR=document.documentElement.getAttribute('dir');for(let i=0;i<DIR_INSTANCES.length;i++){setRTL(DIR_INSTANCES[i]);}}function takeRecords(){if(observer&&observer.takeRecords().length){updateDirection();}}const DirMixin=dedupingMixin(base=>{if(!observer){getRTL();observer=new MutationObserver(updateDirection);observer.observe(document.documentElement,{attributes:true,attributeFilter:['dir']});}/**
     * @constructor
     * @extends {base}
     * @implements {Polymer_PropertyAccessors}
     */const elementBase=PropertyAccessors(base);/**
                                                * @polymer
                                                * @mixinClass
                                                * @implements {Polymer_DirMixin}
                                                */class Dir extends elementBase{/**
     * @override
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     */static _processStyleText(cssText,baseURI){cssText=super._processStyleText(cssText,baseURI);cssText=this._replaceDirInCssText(cssText);return cssText;}/**
       * Replace `:dir` in the given CSS text
       *
       * @param {string} text CSS text to replace DIR
       * @return {string} Modified CSS
       */static _replaceDirInCssText(text){let replacedText=text;replacedText=replacedText.replace(HOST_DIR,HOST_DIR_REPLACMENT);replacedText=replacedText.replace(EL_DIR,EL_DIR_REPLACMENT);if(text!==replacedText){this.__activateDir=true;}return replacedText;}constructor(){super();/** @type {boolean} */this.__autoDirOptOut=false;}/**
       * @suppress {invalidCasts} Closure doesn't understand that `this` is an HTMLElement
       * @return {void}
       */ready(){super.ready();this.__autoDirOptOut=/** @type {!HTMLElement} */this.hasAttribute('dir');}/**
       * @suppress {missingProperties} If it exists on elementBase, it can be super'd
       * @return {void}
       */connectedCallback(){if(elementBase.prototype.connectedCallback){super.connectedCallback();}if(this.constructor.__activateDir){takeRecords();DIR_INSTANCES.push(this);setRTL(this);}}/**
       * @suppress {missingProperties} If it exists on elementBase, it can be super'd
       * @return {void}
       */disconnectedCallback(){if(elementBase.prototype.disconnectedCallback){super.disconnectedCallback();}if(this.constructor.__activateDir){const idx=DIR_INSTANCES.indexOf(this);if(idx>-1){DIR_INSTANCES.splice(idx,1);}}}}Dir.__activateDir=false;return Dir;});var dirMixin={DirMixin:DirMixin};// run a callback when HTMLImports are ready or immediately if
// this api is not available.
function whenImportsReady(cb){if(window.HTMLImports){HTMLImports.whenReady(cb);}else{cb();}}const importHref=function(href,onload,onerror,optAsync){let link=/** @type {HTMLLinkElement} */document.head.querySelector('link[href="'+href+'"][import-href]');if(!link){link=/** @type {HTMLLinkElement} */document.createElement('link');link.rel='import';link.href=href;link.setAttribute('import-href','');}// always ensure link has `async` attribute if user specified one,
// even if it was previously not async. This is considered less confusing.
if(optAsync){link.setAttribute('async','');}// NOTE: the link may now be in 3 states: (1) pending insertion,
// (2) inflight, (3) already loaded. In each case, we need to add
// event listeners to process callbacks.
let cleanup=function(){link.removeEventListener('load',loadListener);link.removeEventListener('error',errorListener);};let loadListener=function(event){cleanup();// In case of a successful load, cache the load event on the link so
// that it can be used to short-circuit this method in the future when
// it is called with the same href param.
link.__dynamicImportLoaded=true;if(onload){whenImportsReady(()=>{onload(event);});}};let errorListener=function(event){cleanup();// In case of an error, remove the link from the document so that it
// will be automatically created again the next time `importHref` is
// called.
if(link.parentNode){link.parentNode.removeChild(link);}if(onerror){whenImportsReady(()=>{onerror(event);});}};link.addEventListener('load',loadListener);link.addEventListener('error',errorListener);if(link.parentNode==null){document.head.appendChild(link);// if the link already loaded, dispatch a fake load event
// so that listeners are called and get a proper event argument.
}else if(link.__dynamicImportLoaded){link.dispatchEvent(new Event('load'));}return link;};var importHref$1={importHref:importHref};let scheduled=false;let beforeRenderQueue=[];let afterRenderQueue=[];function schedule(){scheduled=true;// before next render
requestAnimationFrame(function(){scheduled=false;flushQueue(beforeRenderQueue);// after the render
setTimeout(function(){runQueue(afterRenderQueue);});});}function flushQueue(queue){while(queue.length){callMethod(queue.shift());}}function runQueue(queue){for(let i=0,l=queue.length;i<l;i++){callMethod(queue.shift());}}function callMethod(info){const context=info[0];const callback=info[1];const args=info[2];try{callback.apply(context,args);}catch(e){setTimeout(()=>{throw e;});}}function flush(){while(beforeRenderQueue.length||afterRenderQueue.length){flushQueue(beforeRenderQueue);flushQueue(afterRenderQueue);}scheduled=false;}function beforeNextRender(context,callback,args){if(!scheduled){schedule();}beforeRenderQueue.push([context,callback,args]);}function afterNextRender(context,callback,args){if(!scheduled){schedule();}afterRenderQueue.push([context,callback,args]);}var renderStatus={beforeNextRender:beforeNextRender,afterNextRender:afterNextRender,flush:flush};function resolve(){document.body.removeAttribute('unresolved');}if(document.readyState==='interactive'||document.readyState==='complete'){resolve();}else{window.addEventListener('DOMContentLoaded',resolve);}function newSplice(index,removed,addedCount){return{index:index,removed:removed,addedCount:addedCount};}const EDIT_LEAVE=0;const EDIT_UPDATE=1;const EDIT_ADD=2;const EDIT_DELETE=3;// Note: This function is *based* on the computation of the Levenshtein
// "edit" distance. The one change is that "updates" are treated as two
// edits - not one. With Array splices, an update is really a delete
// followed by an add. By retaining this, we optimize for "keeping" the
// maximum array items in the original array. For example:
//
//   'xxxx123' -> '123yyyy'
//
// With 1-edit updates, the shortest path would be just to update all seven
// characters. With 2-edit updates, we delete 4, leave 3, and add 4. This
// leaves the substring '123' intact.
function calcEditDistances(current,currentStart,currentEnd,old,oldStart,oldEnd){// "Deletion" columns
let rowCount=oldEnd-oldStart+1;let columnCount=currentEnd-currentStart+1;let distances=new Array(rowCount);// "Addition" rows. Initialize null column.
for(let i=0;i<rowCount;i++){distances[i]=new Array(columnCount);distances[i][0]=i;}// Initialize null row
for(let j=0;j<columnCount;j++)distances[0][j]=j;for(let i=1;i<rowCount;i++){for(let j=1;j<columnCount;j++){if(equals(current[currentStart+j-1],old[oldStart+i-1]))distances[i][j]=distances[i-1][j-1];else{let north=distances[i-1][j]+1;let west=distances[i][j-1]+1;distances[i][j]=north<west?north:west;}}}return distances;}// This starts at the final weight, and walks "backward" by finding
// the minimum previous weight recursively until the origin of the weight
// matrix.
function spliceOperationsFromEditDistances(distances){let i=distances.length-1;let j=distances[0].length-1;let current=distances[i][j];let edits=[];while(i>0||j>0){if(i==0){edits.push(EDIT_ADD);j--;continue;}if(j==0){edits.push(EDIT_DELETE);i--;continue;}let northWest=distances[i-1][j-1];let west=distances[i-1][j];let north=distances[i][j-1];let min;if(west<north)min=west<northWest?west:northWest;else min=north<northWest?north:northWest;if(min==northWest){if(northWest==current){edits.push(EDIT_LEAVE);}else{edits.push(EDIT_UPDATE);current=northWest;}i--;j--;}else if(min==west){edits.push(EDIT_DELETE);i--;current=west;}else{edits.push(EDIT_ADD);j--;current=north;}}edits.reverse();return edits;}/**
   * Splice Projection functions:
   *
   * A splice map is a representation of how a previous array of items
   * was transformed into a new array of items. Conceptually it is a list of
   * tuples of
   *
   *   <index, removed, addedCount>
   *
   * which are kept in ascending index order of. The tuple represents that at
   * the |index|, |removed| sequence of items were removed, and counting forward
   * from |index|, |addedCount| items were added.
   */ /**
       * Lacking individual splice mutation information, the minimal set of
       * splices can be synthesized given the previous state and final state of an
       * array. The basic approach is to calculate the edit distance matrix and
       * choose the shortest path through it.
       *
       * Complexity: O(l * p)
       *   l: The length of the current array
       *   p: The length of the old array
       *
       * @param {!Array} current The current "changed" array for which to
       * calculate splices.
       * @param {number} currentStart Starting index in the `current` array for
       * which splices are calculated.
       * @param {number} currentEnd Ending index in the `current` array for
       * which splices are calculated.
       * @param {!Array} old The original "unchanged" array to compare `current`
       * against to determine splices.
       * @param {number} oldStart Starting index in the `old` array for
       * which splices are calculated.
       * @param {number} oldEnd Ending index in the `old` array for
       * which splices are calculated.
       * @return {!Array} Returns an array of splice record objects. Each of these
       * contains: `index` the location where the splice occurred; `removed`
       * the array of removed items from this location; `addedCount` the number
       * of items added at this location.
       */function calcSplices(current,currentStart,currentEnd,old,oldStart,oldEnd){let prefixCount=0;let suffixCount=0;let splice;let minLength=Math.min(currentEnd-currentStart,oldEnd-oldStart);if(currentStart==0&&oldStart==0)prefixCount=sharedPrefix(current,old,minLength);if(currentEnd==current.length&&oldEnd==old.length)suffixCount=sharedSuffix(current,old,minLength-prefixCount);currentStart+=prefixCount;oldStart+=prefixCount;currentEnd-=suffixCount;oldEnd-=suffixCount;if(currentEnd-currentStart==0&&oldEnd-oldStart==0)return[];if(currentStart==currentEnd){splice=newSplice(currentStart,[],0);while(oldStart<oldEnd)splice.removed.push(old[oldStart++]);return[splice];}else if(oldStart==oldEnd)return[newSplice(currentStart,[],currentEnd-currentStart)];let ops=spliceOperationsFromEditDistances(calcEditDistances(current,currentStart,currentEnd,old,oldStart,oldEnd));splice=undefined;let splices=[];let index=currentStart;let oldIndex=oldStart;for(let i=0;i<ops.length;i++){switch(ops[i]){case EDIT_LEAVE:if(splice){splices.push(splice);splice=undefined;}index++;oldIndex++;break;case EDIT_UPDATE:if(!splice)splice=newSplice(index,[],0);splice.addedCount++;index++;splice.removed.push(old[oldIndex]);oldIndex++;break;case EDIT_ADD:if(!splice)splice=newSplice(index,[],0);splice.addedCount++;index++;break;case EDIT_DELETE:if(!splice)splice=newSplice(index,[],0);splice.removed.push(old[oldIndex]);oldIndex++;break;}}if(splice){splices.push(splice);}return splices;}function sharedPrefix(current,old,searchLength){for(let i=0;i<searchLength;i++)if(!equals(current[i],old[i]))return i;return searchLength;}function sharedSuffix(current,old,searchLength){let index1=current.length;let index2=old.length;let count=0;while(count<searchLength&&equals(current[--index1],old[--index2]))count++;return count;}function calculateSplices(current,previous){return calcSplices(current,0,current.length,previous,0,previous.length);}function equals(currentValue,previousValue){return currentValue===previousValue;}var arraySplice={calculateSplices:calculateSplices};/**
    * Returns true if `node` is a slot element
    * @param {Node} node Node to test.
    * @return {boolean} Returns true if the given `node` is a slot
    * @private
    */function isSlot(node){return node.localName==='slot';}/**
   * Class that listens for changes (additions or removals) to
   * "flattened nodes" on a given `node`. The list of flattened nodes consists
   * of a node's children and, for any children that are `<slot>` elements,
   * the expanded flattened list of `assignedNodes`.
   * For example, if the observed node has children `<a></a><slot></slot><b></b>`
   * and the `<slot>` has one `<div>` assigned to it, then the flattened
   * nodes list is `<a></a><div></div><b></b>`. If the `<slot>` has other
   * `<slot>` elements assigned to it, these are flattened as well.
   *
   * The provided `callback` is called whenever any change to this list
   * of flattened nodes occurs, where an addition or removal of a node is
   * considered a change. The `callback` is called with one argument, an object
   * containing an array of any `addedNodes` and `removedNodes`.
   *
   * Note: the callback is called asynchronous to any changes
   * at a microtask checkpoint. This is because observation is performed using
   * `MutationObserver` and the `<slot>` element's `slotchange` event which
   * are asynchronous.
   *
   * An example:
   * ```js
   * class TestSelfObserve extends Polymer.Element {
   *   static get is() { return 'test-self-observe';}
   *   connectedCallback() {
   *     super.connectedCallback();
   *     this._observer = new Polymer.FlattenedNodesObserver(this, (info) => {
   *       this.info = info;
   *     });
   *   }
   *   disconnectedCallback() {
   *     super.disconnectedCallback();
   *     this._observer.disconnect();
   *   }
   * }
   * customElements.define(TestSelfObserve.is, TestSelfObserve);
   * ```
   *
   * @memberof Polymer
   * @summary Class that listens for changes (additions or removals) to
   * "flattened nodes" on a given `node`.
   */class FlattenedNodesObserver{/**
   * Returns the list of flattened nodes for the given `node`.
   * This list consists of a node's children and, for any children
   * that are `<slot>` elements, the expanded flattened list of `assignedNodes`.
   * For example, if the observed node has children `<a></a><slot></slot><b></b>`
   * and the `<slot>` has one `<div>` assigned to it, then the flattened
   * nodes list is `<a></a><div></div><b></b>`. If the `<slot>` has other
   * `<slot>` elements assigned to it, these are flattened as well.
   *
   * @param {HTMLElement|HTMLSlotElement} node The node for which to return the list of flattened nodes.
   * @return {Array} The list of flattened nodes for the given `node`.
  */static getFlattenedNodes(node){if(isSlot(node)){node=/** @type {HTMLSlotElement} */node;// eslint-disable-line no-self-assign
return node.assignedNodes({flatten:true});}else{return Array.from(node.childNodes).map(node=>{if(isSlot(node)){node=/** @type {HTMLSlotElement} */node;// eslint-disable-line no-self-assign
return node.assignedNodes({flatten:true});}else{return[node];}}).reduce((a,b)=>a.concat(b),[]);}}/**
     * @param {Element} target Node on which to listen for changes.
     * @param {?function(!Element, { target: !Element, addedNodes: !Array<!Element>, removedNodes: !Array<!Element> }):void} callback Function called when there are additions
     * or removals from the target's list of flattened nodes.
    */constructor(target,callback){/**
     * @type {MutationObserver}
     * @private
     */this._shadyChildrenObserver=null;/**
                                            * @type {MutationObserver}
                                            * @private
                                            */this._nativeChildrenObserver=null;this._connected=false;/**
                              * @type {Element}
                              * @private
                              */this._target=target;this.callback=callback;this._effectiveNodes=[];this._observer=null;this._scheduled=false;/**
                              * @type {function()}
                              * @private
                              */this._boundSchedule=()=>{this._schedule();};this.connect();this._schedule();}/**
     * Activates an observer. This method is automatically called when
     * a `FlattenedNodesObserver` is created. It should only be called to
     * re-activate an observer that has been deactivated via the `disconnect` method.
     *
     * @return {void}
     */connect(){if(isSlot(this._target)){this._listenSlots([this._target]);}else if(this._target.children){this._listenSlots(this._target.children);if(window.ShadyDOM){this._shadyChildrenObserver=ShadyDOM.observeChildren(this._target,mutations=>{this._processMutations(mutations);});}else{this._nativeChildrenObserver=new MutationObserver(mutations=>{this._processMutations(mutations);});this._nativeChildrenObserver.observe(this._target,{childList:true});}}this._connected=true;}/**
     * Deactivates the flattened nodes observer. After calling this method
     * the observer callback will not be called when changes to flattened nodes
     * occur. The `connect` method may be subsequently called to reactivate
     * the observer.
     *
     * @return {void}
     */disconnect(){if(isSlot(this._target)){this._unlistenSlots([this._target]);}else if(this._target.children){this._unlistenSlots(this._target.children);if(window.ShadyDOM&&this._shadyChildrenObserver){ShadyDOM.unobserveChildren(this._shadyChildrenObserver);this._shadyChildrenObserver=null;}else if(this._nativeChildrenObserver){this._nativeChildrenObserver.disconnect();this._nativeChildrenObserver=null;}}this._connected=false;}/**
     * @return {void}
     * @private
     */_schedule(){if(!this._scheduled){this._scheduled=true;microTask.run(()=>this.flush());}}/**
     * @param {Array<MutationRecord>} mutations Mutations signaled by the mutation observer
     * @return {void}
     * @private
     */_processMutations(mutations){this._processSlotMutations(mutations);this.flush();}/**
     * @param {Array<MutationRecord>} mutations Mutations signaled by the mutation observer
     * @return {void}
     * @private
     */_processSlotMutations(mutations){if(mutations){for(let i=0;i<mutations.length;i++){let mutation=mutations[i];if(mutation.addedNodes){this._listenSlots(mutation.addedNodes);}if(mutation.removedNodes){this._unlistenSlots(mutation.removedNodes);}}}}/**
     * Flushes the observer causing any pending changes to be immediately
     * delivered the observer callback. By default these changes are delivered
     * asynchronously at the next microtask checkpoint.
     *
     * @return {boolean} Returns true if any pending changes caused the observer
     * callback to run.
     */flush(){if(!this._connected){return false;}if(window.ShadyDOM){ShadyDOM.flush();}if(this._nativeChildrenObserver){this._processSlotMutations(this._nativeChildrenObserver.takeRecords());}else if(this._shadyChildrenObserver){this._processSlotMutations(this._shadyChildrenObserver.takeRecords());}this._scheduled=false;let info={target:this._target,addedNodes:[],removedNodes:[]};let newNodes=this.constructor.getFlattenedNodes(this._target);let splices=calculateSplices(newNodes,this._effectiveNodes);// process removals
for(let i=0,s;i<splices.length&&(s=splices[i]);i++){for(let j=0,n;j<s.removed.length&&(n=s.removed[j]);j++){info.removedNodes.push(n);}}// process adds
for(let i=0,s;i<splices.length&&(s=splices[i]);i++){for(let j=s.index;j<s.index+s.addedCount;j++){info.addedNodes.push(newNodes[j]);}}// update cache
this._effectiveNodes=newNodes;let didFlush=false;if(info.addedNodes.length||info.removedNodes.length){didFlush=true;this.callback.call(this._target,info);}return didFlush;}/**
     * @param {!Array<Element|Node>|!NodeList<Node>} nodeList Nodes that could change
     * @return {void}
     * @private
     */_listenSlots(nodeList){for(let i=0;i<nodeList.length;i++){let n=nodeList[i];if(isSlot(n)){n.addEventListener('slotchange',this._boundSchedule);}}}/**
     * @param {!Array<Element|Node>|!NodeList<Node>} nodeList Nodes that could change
     * @return {void}
     * @private
     */_unlistenSlots(nodeList){for(let i=0;i<nodeList.length;i++){let n=nodeList[i];if(isSlot(n)){n.removeEventListener('slotchange',this._boundSchedule);}}}}var flattenedNodesObserver={FlattenedNodesObserver:FlattenedNodesObserver};let debouncerQueue=[];const enqueueDebouncer=function(debouncer){debouncerQueue.push(debouncer);};function flushDebouncers(){const didFlush=Boolean(debouncerQueue.length);while(debouncerQueue.length){try{debouncerQueue.shift().flush();}catch(e){setTimeout(()=>{throw e;});}}return didFlush;}const flush$1=function(){let shadyDOM,debouncers;do{shadyDOM=window.ShadyDOM&&ShadyDOM.flush();if(window.ShadyCSS&&window.ShadyCSS.ScopingShim){window.ShadyCSS.ScopingShim.flush();}debouncers=flushDebouncers();}while(shadyDOM||debouncers);};var flush$2={enqueueDebouncer:enqueueDebouncer,flush:flush$1};const p=Element.prototype;/**
                              * @const {function(this:Node, string): boolean}
                              */const normalizedMatchesSelector=p.matches||p.matchesSelector||p.mozMatchesSelector||p.msMatchesSelector||p.oMatchesSelector||p.webkitMatchesSelector;/**
                                                                                                                                                                   * Cross-platform `element.matches` shim.
                                                                                                                                                                   *
                                                                                                                                                                   * @function matchesSelector
                                                                                                                                                                   * @memberof Polymer.dom
                                                                                                                                                                   * @param {!Node} node Node to check selector against
                                                                                                                                                                   * @param {string} selector Selector to match
                                                                                                                                                                   * @return {boolean} True if node matched selector
                                                                                                                                                                   */const matchesSelector=function(node,selector){return normalizedMatchesSelector.call(node,selector);};/**
    * Node API wrapper class returned from `Polymer.dom.(target)` when
    * `target` is a `Node`.
    *
    * @memberof Polymer
    */class DomApi{/**
   * @param {Node} node Node for which to create a Polymer.dom helper object.
   */constructor(node){this.node=node;}/**
     * Returns an instance of `Polymer.FlattenedNodesObserver` that
     * listens for node changes on this element.
     *
     * @param {function(!Element, { target: !Element, addedNodes: !Array<!Element>, removedNodes: !Array<!Element> }):void} callback Called when direct or distributed children
     *   of this element changes
     * @return {!Polymer.FlattenedNodesObserver} Observer instance
     */observeNodes(callback){return new FlattenedNodesObserver(this.node,callback);}/**
     * Disconnects an observer previously created via `observeNodes`
     *
     * @param {!Polymer.FlattenedNodesObserver} observerHandle Observer instance
     *   to disconnect.
     * @return {void}
     */unobserveNodes(observerHandle){observerHandle.disconnect();}/**
     * Provided as a backwards-compatible API only.  This method does nothing.
     * @return {void}
     */notifyObserver(){}/**
                       * Returns true if the provided node is contained with this element's
                       * light-DOM children or shadow root, including any nested shadow roots
                       * of children therein.
                       *
                       * @param {Node} node Node to test
                       * @return {boolean} Returns true if the given `node` is contained within
                       *   this element's light or shadow DOM.
                       */deepContains(node){if(this.node.contains(node)){return true;}let n=node;let doc=node.ownerDocument;// walk from node to `this` or `document`
while(n&&n!==doc&&n!==this.node){// use logical parentnode, or native ShadowRoot host
n=n.parentNode||n.host;}return n===this.node;}/**
     * Returns the root node of this node.  Equivalent to `getRoodNode()`.
     *
     * @return {Node} Top most element in the dom tree in which the node
     * exists. If the node is connected to a document this is either a
     * shadowRoot or the document; otherwise, it may be the node
     * itself or a node or document fragment containing it.
     */getOwnerRoot(){return this.node.getRootNode();}/**
     * For slot elements, returns the nodes assigned to the slot; otherwise
     * an empty array. It is equivalent to `<slot>.addignedNodes({flatten:true})`.
     *
     * @return {!Array<!Node>} Array of assigned nodes
     */getDistributedNodes(){return this.node.localName==='slot'?this.node.assignedNodes({flatten:true}):[];}/**
     * Returns an array of all slots this element was distributed to.
     *
     * @return {!Array<!HTMLSlotElement>} Description
     */getDestinationInsertionPoints(){let ip$=[];let n=this.node.assignedSlot;while(n){ip$.push(n);n=n.assignedSlot;}return ip$;}/**
     * Calls `importNode` on the `ownerDocument` for this node.
     *
     * @param {!Node} node Node to import
     * @param {boolean} deep True if the node should be cloned deeply during
     *   import
     * @return {Node} Clone of given node imported to this owner document
     */importNode(node,deep){let doc=this.node instanceof Document?this.node:this.node.ownerDocument;return doc.importNode(node,deep);}/**
     * @return {!Array<!Node>} Returns a flattened list of all child nodes and
     * nodes assigned to child slots.
     */getEffectiveChildNodes(){return FlattenedNodesObserver.getFlattenedNodes(this.node);}/**
     * Returns a filtered list of flattened child elements for this element based
     * on the given selector.
     *
     * @param {string} selector Selector to filter nodes against
     * @return {!Array<!HTMLElement>} List of flattened child elements
     */queryDistributedElements(selector){let c$=this.getEffectiveChildNodes();let list=[];for(let i=0,l=c$.length,c;i<l&&(c=c$[i]);i++){if(c.nodeType===Node.ELEMENT_NODE&&matchesSelector(c,selector)){list.push(c);}}return list;}/**
     * For shadow roots, returns the currently focused element within this
     * shadow root.
     *
     * @return {Node|undefined} Currently focused element
     */get activeElement(){let node=this.node;return node._activeElement!==undefined?node._activeElement:node.activeElement;}}function forwardMethods(proto,methods){for(let i=0;i<methods.length;i++){let method=methods[i];/* eslint-disable valid-jsdoc */proto[method]=/** @this {DomApi} */function(){return this.node[method].apply(this.node,arguments);};/* eslint-enable */}}function forwardReadOnlyProperties(proto,properties){for(let i=0;i<properties.length;i++){let name=properties[i];Object.defineProperty(proto,name,{get:function(){const domApi=/** @type {DomApi} */this;return domApi.node[name];},configurable:true});}}function forwardProperties(proto,properties){for(let i=0;i<properties.length;i++){let name=properties[i];Object.defineProperty(proto,name,{get:function(){const domApi=/** @type {DomApi} */this;return domApi.node[name];},set:function(value){/** @type {DomApi} */this.node[name]=value;},configurable:true});}}forwardMethods(DomApi.prototype,['cloneNode','appendChild','insertBefore','removeChild','replaceChild','setAttribute','removeAttribute','querySelector','querySelectorAll']);forwardReadOnlyProperties(DomApi.prototype,['parentNode','firstChild','lastChild','nextSibling','previousSibling','firstElementChild','lastElementChild','nextElementSibling','previousElementSibling','childNodes','children','classList']);forwardProperties(DomApi.prototype,['textContent','innerHTML']);/**
                                                                    * Event API wrapper class returned from `Polymer.dom.(target)` when
                                                                    * `target` is an `Event`.
                                                                    */class EventApi{constructor(event){this.event=event;}/**
     * Returns the first node on the `composedPath` of this event.
     *
     * @return {!EventTarget} The node this event was dispatched to
     */get rootTarget(){return this.event.composedPath()[0];}/**
     * Returns the local (re-targeted) target for this event.
     *
     * @return {!EventTarget} The local (re-targeted) target for this event.
     */get localTarget(){return this.event.target;}/**
     * Returns the `composedPath` for this event.
     * @return {!Array<!EventTarget>} The nodes this event propagated through
     */get path(){return this.event.composedPath();}}/**
   * @function
   * @param {boolean=} deep
   * @return {!Node}
   */DomApi.prototype.cloneNode;/**
                             * @function
                             * @param {!Node} node
                             * @return {!Node}
                             */DomApi.prototype.appendChild;/**
                               * @function
                               * @param {!Node} newChild
                               * @param {Node} refChild
                               * @return {!Node}
                               */DomApi.prototype.insertBefore;/**
                                * @function
                                * @param {!Node} node
                                * @return {!Node}
                                */DomApi.prototype.removeChild;/**
                               * @function
                               * @param {!Node} oldChild
                               * @param {!Node} newChild
                               * @return {!Node}
                               */DomApi.prototype.replaceChild;/**
                                * @function
                                * @param {string} name
                                * @param {string} value
                                * @return {void}
                                */DomApi.prototype.setAttribute;/**
                                * @function
                                * @param {string} name
                                * @return {void}
                                */DomApi.prototype.removeAttribute;/**
                                   * @function
                                   * @param {string} selector
                                   * @return {?Element}
                                   */DomApi.prototype.querySelector;/**
                                 * @function
                                 * @param {string} selector
                                 * @return {!NodeList<!Element>}
                                 */DomApi.prototype.querySelectorAll;const dom=function(obj){obj=obj||document;if(!obj.__domApi){let helper;if(obj instanceof Event){helper=new EventApi(obj);}else{helper=new DomApi(obj);}obj.__domApi=helper;}return obj.__domApi;};var polymer_dom={DomApi:DomApi,dom:dom,matchesSelector:matchesSelector,flush:flush$1,addDebouncer:enqueueDebouncer};let styleInterface=window.ShadyCSS;const LegacyElementMixin=dedupingMixin(base=>{/**
   * @constructor
   * @extends {base}
   * @implements {Polymer_ElementMixin}
   * @implements {Polymer_GestureEventListeners}
   * @implements {Polymer_DirMixin}
   */const legacyElementBase=DirMixin(GestureEventListeners(ElementMixin(base)));/**
                                                                                     * Map of simple names to touch action names
                                                                                     * @dict
                                                                                     */const DIRECTION_MAP={'x':'pan-x','y':'pan-y','none':'none','all':'auto'};/**
      * @polymer
      * @mixinClass
      * @extends {legacyElementBase}
      * @implements {Polymer_LegacyElementMixin}
      * @unrestricted
      */class LegacyElement extends legacyElementBase{constructor(){super();/** @type {boolean} */this.isAttached;/** @type {WeakMap<!Element, !Object<string, !Function>>} */this.__boundListeners;/** @type {Object<string, Function>} */this._debouncers;// Ensure listeners are applied immediately so that they are
// added before declarative event listeners. This allows an element to
// decorate itself via an event prior to any declarative listeners
// seeing the event. Note, this ensures compatibility with 1.x ordering.
this._applyListeners();}/**
       * Legacy callback called during the `constructor`, for overriding
       * by the user.
       * @return {void}
       */created(){}/**
                  * Provides an implementation of `connectedCallback`
                  * which adds Polymer legacy API's `attached` method.
                  * @return {void}
                  * @override
                  */connectedCallback(){super.connectedCallback();this.isAttached=true;this.attached();}/**
       * Legacy callback called during `connectedCallback`, for overriding
       * by the user.
       * @return {void}
       */attached(){}/**
                   * Provides an implementation of `disconnectedCallback`
                   * which adds Polymer legacy API's `detached` method.
                   * @return {void}
                   * @override
                   */disconnectedCallback(){super.disconnectedCallback();this.isAttached=false;this.detached();}/**
       * Legacy callback called during `disconnectedCallback`, for overriding
       * by the user.
       * @return {void}
       */detached(){}/**
                   * Provides an override implementation of `attributeChangedCallback`
                   * which adds the Polymer legacy API's `attributeChanged` method.
                   * @param {string} name Name of attribute.
                   * @param {?string} old Old value of attribute.
                   * @param {?string} value Current value of attribute.
                   * @return {void}
                   * @override
                   */attributeChangedCallback(name,old,value){if(old!==value){super.attributeChangedCallback(name,old,value);this.attributeChanged(name,old,value);}}/**
       * Legacy callback called during `attributeChangedChallback`, for overriding
       * by the user.
       * @param {string} name Name of attribute.
       * @param {?string} old Old value of attribute.
       * @param {?string} value Current value of attribute.
       * @return {void}
       */attributeChanged(name,old,value){}// eslint-disable-line no-unused-vars
/**
     * Overrides the default `Polymer.PropertyEffects` implementation to
     * add support for class initialization via the `_registered` callback.
     * This is called only when the first instance of the element is created.
     *
     * @return {void}
     * @override
     * @suppress {invalidCasts}
     */_initializeProperties(){let proto=Object.getPrototypeOf(this);if(!proto.hasOwnProperty('__hasRegisterFinished')){proto.__hasRegisterFinished=true;this._registered();}super._initializeProperties();this.root=/** @type {HTMLElement} */this;this.created();}/**
       * Called automatically when an element is initializing.
       * Users may override this method to perform class registration time
       * work. The implementation should ensure the work is performed
       * only once for the class.
       * @protected
       * @return {void}
       */_registered(){}/**
                      * Overrides the default `Polymer.PropertyEffects` implementation to
                      * add support for installing `hostAttributes` and `listeners`.
                      *
                      * @return {void}
                      * @override
                      */ready(){this._ensureAttributes();super.ready();}/**
       * Ensures an element has required attributes. Called when the element
       * is being readied via `ready`. Users should override to set the
       * element's required attributes. The implementation should be sure
       * to check and not override existing attributes added by
       * the user of the element. Typically, setting attributes should be left
       * to the element user and not done here; reasonable exceptions include
       * setting aria roles and focusability.
       * @protected
       * @return {void}
       */_ensureAttributes(){}/**
                            * Adds element event listeners. Called when the element
                            * is being readied via `ready`. Users should override to
                            * add any required element event listeners.
                            * In performance critical elements, the work done here should be kept
                            * to a minimum since it is done before the element is rendered. In
                            * these elements, consider adding listeners asynchronously so as not to
                            * block render.
                            * @protected
                            * @return {void}
                            */_applyListeners(){}/**
                          * Converts a typed JavaScript value to a string.
                          *
                          * Note this method is provided as backward-compatible legacy API
                          * only.  It is not directly called by any Polymer features. To customize
                          * how properties are serialized to attributes for attribute bindings and
                          * `reflectToAttribute: true` properties as well as this method, override
                          * the `_serializeValue` method provided by `Polymer.PropertyAccessors`.
                          *
                          * @param {*} value Value to deserialize
                          * @return {string | undefined} Serialized value
                          */serialize(value){return this._serializeValue(value);}/**
       * Converts a string to a typed JavaScript value.
       *
       * Note this method is provided as backward-compatible legacy API
       * only.  It is not directly called by any Polymer features.  To customize
       * how attributes are deserialized to properties for in
       * `attributeChangedCallback`, override `_deserializeValue` method
       * provided by `Polymer.PropertyAccessors`.
       *
       * @param {string} value String to deserialize
       * @param {*} type Type to deserialize the string to
       * @return {*} Returns the deserialized value in the `type` given.
       */deserialize(value,type){return this._deserializeValue(value,type);}/**
       * Serializes a property to its associated attribute.
       *
       * Note this method is provided as backward-compatible legacy API
       * only.  It is not directly called by any Polymer features.
       *
       * @param {string} property Property name to reflect.
       * @param {string=} attribute Attribute name to reflect.
       * @param {*=} value Property value to reflect.
       * @return {void}
       */reflectPropertyToAttribute(property,attribute,value){this._propertyToAttribute(property,attribute,value);}/**
       * Sets a typed value to an HTML attribute on a node.
       *
       * Note this method is provided as backward-compatible legacy API
       * only.  It is not directly called by any Polymer features.
       *
       * @param {*} value Value to serialize.
       * @param {string} attribute Attribute name to serialize to.
       * @param {Element} node Element to set attribute to.
       * @return {void}
       */serializeValueToAttribute(value,attribute,node){this._valueToNodeAttribute(/** @type {Element} */node||this,value,attribute);}/**
       * Copies own properties (including accessor descriptors) from a source
       * object to a target object.
       *
       * @param {Object} prototype Target object to copy properties to.
       * @param {Object} api Source object to copy properties from.
       * @return {Object} prototype object that was passed as first argument.
       */extend(prototype,api){if(!(prototype&&api)){return prototype||api;}let n$=Object.getOwnPropertyNames(api);for(let i=0,n;i<n$.length&&(n=n$[i]);i++){let pd=Object.getOwnPropertyDescriptor(api,n);if(pd){Object.defineProperty(prototype,n,pd);}}return prototype;}/**
       * Copies props from a source object to a target object.
       *
       * Note, this method uses a simple `for...in` strategy for enumerating
       * properties.  To ensure only `ownProperties` are copied from source
       * to target and that accessor implementations are copied, use `extend`.
       *
       * @param {!Object} target Target object to copy properties to.
       * @param {!Object} source Source object to copy properties from.
       * @return {!Object} Target object that was passed as first argument.
       */mixin(target,source){for(let i in source){target[i]=source[i];}return target;}/**
       * Sets the prototype of an object.
       *
       * Note this method is provided as backward-compatible legacy API
       * only.  It is not directly called by any Polymer features.
       * @param {Object} object The object on which to set the prototype.
       * @param {Object} prototype The prototype that will be set on the given
       * `object`.
       * @return {Object} Returns the given `object` with its prototype set
       * to the given `prototype` object.
       */chainObject(object,prototype){if(object&&prototype&&object!==prototype){object.__proto__=prototype;}return object;}/* **** Begin Template **** */ /**
                                      * Calls `importNode` on the `content` of the `template` specified and
                                      * returns a document fragment containing the imported content.
                                      *
                                      * @param {HTMLTemplateElement} template HTML template element to instance.
                                      * @return {!DocumentFragment} Document fragment containing the imported
                                      *   template content.
                                     */instanceTemplate(template){let content=this.constructor._contentForTemplate(template);let dom$$1=/** @type {!DocumentFragment} */document.importNode(content,true);return dom$$1;}/* **** Begin Events **** */ /**
                                    * Dispatches a custom event with an optional detail value.
                                    *
                                    * @param {string} type Name of event type.
                                    * @param {*=} detail Detail value containing event-specific
                                    *   payload.
                                    * @param {{ bubbles: (boolean|undefined), cancelable: (boolean|undefined), composed: (boolean|undefined) }=}
                                    *  options Object specifying options.  These may include:
                                    *  `bubbles` (boolean, defaults to `true`),
                                    *  `cancelable` (boolean, defaults to false), and
                                    *  `node` on which to fire the event (HTMLElement, defaults to `this`).
                                    * @return {!Event} The new event that was fired.
                                    */fire(type,detail,options){options=options||{};detail=detail===null||detail===undefined?{}:detail;let event=new Event(type,{bubbles:options.bubbles===undefined?true:options.bubbles,cancelable:Boolean(options.cancelable),composed:options.composed===undefined?true:options.composed});event.detail=detail;let node=options.node||this;node.dispatchEvent(event);return event;}/**
       * Convenience method to add an event listener on a given element,
       * late bound to a named method on this element.
       *
       * @param {Element} node Element to add event listener to.
       * @param {string} eventName Name of event to listen for.
       * @param {string} methodName Name of handler method on `this` to call.
       * @return {void}
       */listen(node,eventName,methodName){node=/** @type {!Element} */node||this;let hbl=this.__boundListeners||(this.__boundListeners=new WeakMap());let bl=hbl.get(node);if(!bl){bl={};hbl.set(node,bl);}let key=eventName+methodName;if(!bl[key]){bl[key]=this._addMethodEventListenerToNode(node,eventName,methodName,this);}}/**
       * Convenience method to remove an event listener from a given element,
       * late bound to a named method on this element.
       *
       * @param {Element} node Element to remove event listener from.
       * @param {string} eventName Name of event to stop listening to.
       * @param {string} methodName Name of handler method on `this` to not call
       anymore.
       * @return {void}
       */unlisten(node,eventName,methodName){node=/** @type {!Element} */node||this;let bl=this.__boundListeners&&this.__boundListeners.get(node);let key=eventName+methodName;let handler=bl&&bl[key];if(handler){this._removeEventListenerFromNode(node,eventName,handler);bl[key]=null;}}/**
       * Override scrolling behavior to all direction, one direction, or none.
       *
       * Valid scroll directions:
       *   - 'all': scroll in any direction
       *   - 'x': scroll only in the 'x' direction
       *   - 'y': scroll only in the 'y' direction
       *   - 'none': disable scrolling for this node
       *
       * @param {string=} direction Direction to allow scrolling
       * Defaults to `all`.
       * @param {Element=} node Element to apply scroll direction setting.
       * Defaults to `this`.
       * @return {void}
       */setScrollDirection(direction,node){setTouchAction(node||this,DIRECTION_MAP[direction]||'auto');}/* **** End Events **** */ /**
                                  * Convenience method to run `querySelector` on this local DOM scope.
                                  *
                                  * This function calls `Polymer.dom(this.root).querySelector(slctr)`.
                                  *
                                  * @param {string} slctr Selector to run on this local DOM scope
                                  * @return {Element} Element found by the selector, or null if not found.
                                  */$$(slctr){return this.root.querySelector(slctr);}/**
       * Return the element whose local dom within which this element
       * is contained. This is a shorthand for
       * `this.getRootNode().host`.
       * @this {Element}
       */get domHost(){let root$$1=this.getRootNode();return root$$1 instanceof DocumentFragment?/** @type {ShadowRoot} */root$$1.host:root$$1;}/**
       * Force this element to distribute its children to its local dom.
       * This should not be necessary as of Polymer 2.0.2 and is provided only
       * for backwards compatibility.
       * @return {void}
       */distributeContent(){if(window.ShadyDOM&&this.shadowRoot){ShadyDOM.flush();}}/**
       * Returns a list of nodes that are the effective childNodes. The effective
       * childNodes list is the same as the element's childNodes except that
       * any `<content>` elements are replaced with the list of nodes distributed
       * to the `<content>`, the result of its `getDistributedNodes` method.
       * @return {!Array<!Node>} List of effective child nodes.
       * @suppress {invalidCasts} LegacyElementMixin must be applied to an HTMLElement
       */getEffectiveChildNodes(){const thisEl=/** @type {Element} */this;const domApi=/** @type {Polymer.DomApi} */dom(thisEl);return domApi.getEffectiveChildNodes();}/**
       * Returns a list of nodes distributed within this element that match
       * `selector`. These can be dom children or elements distributed to
       * children that are insertion points.
       * @param {string} selector Selector to run.
       * @return {!Array<!Node>} List of distributed elements that match selector.
       * @suppress {invalidCasts} LegacyElementMixin must be applied to an HTMLElement
       */queryDistributedElements(selector){const thisEl=/** @type {Element} */this;const domApi=/** @type {Polymer.DomApi} */dom(thisEl);return domApi.queryDistributedElements(selector);}/**
       * Returns a list of elements that are the effective children. The effective
       * children list is the same as the element's children except that
       * any `<content>` elements are replaced with the list of elements
       * distributed to the `<content>`.
       *
       * @return {!Array<!Node>} List of effective children.
       */getEffectiveChildren(){let list=this.getEffectiveChildNodes();return list.filter(function(/** @type {!Node} */n){return n.nodeType===Node.ELEMENT_NODE;});}/**
       * Returns a string of text content that is the concatenation of the
       * text content's of the element's effective childNodes (the elements
       * returned by <a href="#getEffectiveChildNodes>getEffectiveChildNodes</a>.
       *
       * @return {string} List of effective children.
       */getEffectiveTextContent(){let cn=this.getEffectiveChildNodes();let tc=[];for(let i=0,c;c=cn[i];i++){if(c.nodeType!==Node.COMMENT_NODE){tc.push(c.textContent);}}return tc.join('');}/**
       * Returns the first effective childNode within this element that
       * match `selector`. These can be dom child nodes or elements distributed
       * to children that are insertion points.
       * @param {string} selector Selector to run.
       * @return {Node} First effective child node that matches selector.
       */queryEffectiveChildren(selector){let e$=this.queryDistributedElements(selector);return e$&&e$[0];}/**
       * Returns a list of effective childNodes within this element that
       * match `selector`. These can be dom child nodes or elements distributed
       * to children that are insertion points.
       * @param {string} selector Selector to run.
       * @return {!Array<!Node>} List of effective child nodes that match selector.
       */queryAllEffectiveChildren(selector){return this.queryDistributedElements(selector);}/**
       * Returns a list of nodes distributed to this element's `<slot>`.
       *
       * If this element contains more than one `<slot>` in its local DOM,
       * an optional selector may be passed to choose the desired content.
       *
       * @param {string=} slctr CSS selector to choose the desired
       *   `<slot>`.  Defaults to `content`.
       * @return {!Array<!Node>} List of distributed nodes for the `<slot>`.
       */getContentChildNodes(slctr){let content=this.root.querySelector(slctr||'slot');return content?/** @type {Polymer.DomApi} */dom(content).getDistributedNodes():[];}/**
       * Returns a list of element children distributed to this element's
       * `<slot>`.
       *
       * If this element contains more than one `<slot>` in its
       * local DOM, an optional selector may be passed to choose the desired
       * content.  This method differs from `getContentChildNodes` in that only
       * elements are returned.
       *
       * @param {string=} slctr CSS selector to choose the desired
       *   `<content>`.  Defaults to `content`.
       * @return {!Array<!HTMLElement>} List of distributed nodes for the
       *   `<slot>`.
       * @suppress {invalidCasts}
       */getContentChildren(slctr){let children=/** @type {!Array<!HTMLElement>} */this.getContentChildNodes(slctr).filter(function(n){return n.nodeType===Node.ELEMENT_NODE;});return children;}/**
       * Checks whether an element is in this element's light DOM tree.
       *
       * @param {?Node} node The element to be checked.
       * @return {boolean} true if node is in this element's light DOM tree.
       * @suppress {invalidCasts} LegacyElementMixin must be applied to an HTMLElement
       */isLightDescendant(node){const thisNode=/** @type {Node} */this;return thisNode!==node&&thisNode.contains(node)&&thisNode.getRootNode()===node.getRootNode();}/**
       * Checks whether an element is in this element's local DOM tree.
       *
       * @param {!Element} node The element to be checked.
       * @return {boolean} true if node is in this element's local DOM tree.
       */isLocalDescendant(node){return this.root===node.getRootNode();}/**
       * No-op for backwards compatibility. This should now be handled by
       * ShadyCss library.
       * @param  {*} container Unused
       * @param  {*} shouldObserve Unused
       * @return {void}
       */scopeSubtree(container,shouldObserve){}// eslint-disable-line no-unused-vars
/**
     * Returns the computed style value for the given property.
     * @param {string} property The css property name.
     * @return {string} Returns the computed css property value for the given
     * `property`.
     * @suppress {invalidCasts} LegacyElementMixin must be applied to an HTMLElement
     */getComputedStyleValue(property){return styleInterface.getComputedStyleValue(/** @type {!Element} */this,property);}// debounce
/**
     * Call `debounce` to collapse multiple requests for a named task into
     * one invocation which is made after the wait time has elapsed with
     * no new request.  If no wait time is given, the callback will be called
     * at microtask timing (guaranteed before paint).
     *
     *     debouncedClickAction(e) {
     *       // will not call `processClick` more than once per 100ms
     *       this.debounce('click', function() {
     *        this.processClick();
     *       } 100);
     *     }
     *
     * @param {string} jobName String to identify the debounce job.
     * @param {function():void} callback Function that is called (with `this`
     *   context) when the wait time elapses.
     * @param {number} wait Optional wait time in milliseconds (ms) after the
     *   last signal that must elapse before invoking `callback`
     * @return {!Object} Returns a debouncer object on which exists the
     * following methods: `isActive()` returns true if the debouncer is
     * active; `cancel()` cancels the debouncer if it is active;
     * `flush()` immediately invokes the debounced callback if the debouncer
     * is active.
     */debounce(jobName,callback,wait){this._debouncers=this._debouncers||{};return this._debouncers[jobName]=Debouncer.debounce(this._debouncers[jobName],wait>0?timeOut.after(wait):microTask,callback.bind(this));}/**
       * Returns whether a named debouncer is active.
       *
       * @param {string} jobName The name of the debouncer started with `debounce`
       * @return {boolean} Whether the debouncer is active (has not yet fired).
       */isDebouncerActive(jobName){this._debouncers=this._debouncers||{};let debouncer=this._debouncers[jobName];return!!(debouncer&&debouncer.isActive());}/**
       * Immediately calls the debouncer `callback` and inactivates it.
       *
       * @param {string} jobName The name of the debouncer started with `debounce`
       * @return {void}
       */flushDebouncer(jobName){this._debouncers=this._debouncers||{};let debouncer=this._debouncers[jobName];if(debouncer){debouncer.flush();}}/**
       * Cancels an active debouncer.  The `callback` will not be called.
       *
       * @param {string} jobName The name of the debouncer started with `debounce`
       * @return {void}
       */cancelDebouncer(jobName){this._debouncers=this._debouncers||{};let debouncer=this._debouncers[jobName];if(debouncer){debouncer.cancel();}}/**
       * Runs a callback function asynchronously.
       *
       * By default (if no waitTime is specified), async callbacks are run at
       * microtask timing, which will occur before paint.
       *
       * @param {!Function} callback The callback function to run, bound to `this`.
       * @param {number=} waitTime Time to wait before calling the
       *   `callback`.  If unspecified or 0, the callback will be run at microtask
       *   timing (before paint).
       * @return {number} Handle that may be used to cancel the async job.
       */async(callback,waitTime){return waitTime>0?timeOut.run(callback.bind(this),waitTime):~microTask.run(callback.bind(this));}/**
       * Cancels an async operation started with `async`.
       *
       * @param {number} handle Handle returned from original `async` call to
       *   cancel.
       * @return {void}
       */cancelAsync(handle){handle<0?microTask.cancel(~handle):timeOut.cancel(handle);}// other
/**
     * Convenience method for creating an element and configuring it.
     *
     * @param {string} tag HTML element tag to create.
     * @param {Object=} props Object of properties to configure on the
     *    instance.
     * @return {!Element} Newly created and configured element.
     */create(tag,props){let elt=document.createElement(tag);if(props){if(elt.setProperties){elt.setProperties(props);}else{for(let n in props){elt[n]=props[n];}}}return elt;}/**
       * Convenience method for importing an HTML document imperatively.
       *
       * This method creates a new `<link rel="import">` element with
       * the provided URL and appends it to the document to start loading.
       * In the `onload` callback, the `import` property of the `link`
       * element will contain the imported document contents.
       *
       * @param {string} href URL to document to load.
       * @param {?function(!Event):void=} onload Callback to notify when an import successfully
       *   loaded.
       * @param {?function(!ErrorEvent):void=} onerror Callback to notify when an import
       *   unsuccessfully loaded.
       * @param {boolean=} optAsync True if the import should be loaded `async`.
       *   Defaults to `false`.
       * @return {!HTMLLinkElement} The link element for the URL to be loaded.
       */importHref(href,onload,onerror,optAsync){// eslint-disable-line no-unused-vars
let loadFn=onload?onload.bind(this):null;let errorFn=onerror?onerror.bind(this):null;return importHref(href,loadFn,errorFn,optAsync);}/**
       * Polyfill for Element.prototype.matches, which is sometimes still
       * prefixed.
       *
       * @param {string} selector Selector to test.
       * @param {!Element=} node Element to test the selector against.
       * @return {boolean} Whether the element matches the selector.
       */elementMatches(selector,node){return matchesSelector(node||this,selector);}/**
       * Toggles an HTML attribute on or off.
       *
       * @param {string} name HTML attribute name
       * @param {boolean=} bool Boolean to force the attribute on or off.
       *    When unspecified, the state of the attribute will be reversed.
       * @param {Element=} node Node to target.  Defaults to `this`.
       * @return {void}
       */toggleAttribute(name,bool,node){node=/** @type {Element} */node||this;if(arguments.length==1){bool=!node.hasAttribute(name);}if(bool){node.setAttribute(name,'');}else{node.removeAttribute(name);}}/**
       * Toggles a CSS class on or off.
       *
       * @param {string} name CSS class name
       * @param {boolean=} bool Boolean to force the class on or off.
       *    When unspecified, the state of the class will be reversed.
       * @param {Element=} node Node to target.  Defaults to `this`.
       * @return {void}
       */toggleClass(name,bool,node){node=/** @type {Element} */node||this;if(arguments.length==1){bool=!node.classList.contains(name);}if(bool){node.classList.add(name);}else{node.classList.remove(name);}}/**
       * Cross-platform helper for setting an element's CSS `transform` property.
       *
       * @param {string} transformText Transform setting.
       * @param {Element=} node Element to apply the transform to.
       * Defaults to `this`
       * @return {void}
       */transform(transformText,node){node=/** @type {Element} */node||this;node.style.webkitTransform=transformText;node.style.transform=transformText;}/**
       * Cross-platform helper for setting an element's CSS `translate3d`
       * property.
       *
       * @param {number} x X offset.
       * @param {number} y Y offset.
       * @param {number} z Z offset.
       * @param {Element=} node Element to apply the transform to.
       * Defaults to `this`.
       * @return {void}
       */translate3d(x,y,z,node){node=/** @type {Element} */node||this;this.transform('translate3d('+x+','+y+','+z+')',node);}/**
       * Removes an item from an array, if it exists.
       *
       * If the array is specified by path, a change notification is
       * generated, so that observers, data bindings and computed
       * properties watching that path can update.
       *
       * If the array is passed directly, **no change
       * notification is generated**.
       *
       * @param {string | !Array<number|string>} arrayOrPath Path to array from which to remove the item
       *   (or the array itself).
       * @param {*} item Item to remove.
       * @return {Array} Array containing item removed.
       */arrayDelete(arrayOrPath,item){let index;if(Array.isArray(arrayOrPath)){index=arrayOrPath.indexOf(item);if(index>=0){return arrayOrPath.splice(index,1);}}else{let arr=get(this,arrayOrPath);index=arr.indexOf(item);if(index>=0){return this.splice(arrayOrPath,index,1);}}return null;}// logging
/**
     * Facades `console.log`/`warn`/`error` as override point.
     *
     * @param {string} level One of 'log', 'warn', 'error'
     * @param {Array} args Array of strings or objects to log
     * @return {void}
     */_logger(level,args){// accept ['foo', 'bar'] and [['foo', 'bar']]
if(Array.isArray(args)&&args.length===1&&Array.isArray(args[0])){args=args[0];}switch(level){case'log':case'warn':case'error':console[level](...args);}}/**
       * Facades `console.log` as an override point.
       *
       * @param {...*} args Array of strings or objects to log
       * @return {void}
       */_log(...args){this._logger('log',args);}/**
       * Facades `console.warn` as an override point.
       *
       * @param {...*} args Array of strings or objects to log
       * @return {void}
       */_warn(...args){this._logger('warn',args);}/**
       * Facades `console.error` as an override point.
       *
       * @param {...*} args Array of strings or objects to log
       * @return {void}
       */_error(...args){this._logger('error',args);}/**
       * Formats a message using the element type an a method name.
       *
       * @param {string} methodName Method name to associate with message
       * @param {...*} args Array of strings or objects to log
       * @return {Array} Array with formatting information for `console`
       *   logging.
       */_logf(methodName,...args){return['[%s::%s]',this.is,methodName,...args];}}LegacyElement.prototype.is='';return LegacyElement;});var legacyElementMixin={LegacyElementMixin:LegacyElementMixin};let metaProps={attached:true,detached:true,ready:true,created:true,beforeRegister:true,registered:true,attributeChanged:true,// meta objects
behaviors:true};/**
    * Applies a "legacy" behavior or array of behaviors to the provided class.
    *
    * Note: this method will automatically also apply the `Polymer.LegacyElementMixin`
    * to ensure that any legacy behaviors can rely on legacy Polymer API on
    * the underlying element.
    *
    * @template T
    * @param {!Object|!Array<!Object>} behaviors Behavior object or array of behaviors.
    * @param {function(new:T)} klass Element class.
    * @return {function(new:T)} Returns a new Element class extended by the
    * passed in `behaviors` and also by `Polymer.LegacyElementMixin`.
    * @memberof Polymer
    * @suppress {invalidCasts, checkTypes}
    */function mixinBehaviors(behaviors,klass){if(!behaviors){klass=/** @type {HTMLElement} */klass;// eslint-disable-line no-self-assign
return klass;}// NOTE: ensure the behavior is extending a class with
// legacy element api. This is necessary since behaviors expect to be able
// to access 1.x legacy api.
klass=LegacyElementMixin(klass);if(!Array.isArray(behaviors)){behaviors=[behaviors];}let superBehaviors=klass.prototype.behaviors;// get flattened, deduped list of behaviors *not* already on super class
behaviors=flattenBehaviors(behaviors,null,superBehaviors);// mixin new behaviors
klass=_mixinBehaviors(behaviors,klass);if(superBehaviors){behaviors=superBehaviors.concat(behaviors);}// Set behaviors on prototype for BC...
klass.prototype.behaviors=behaviors;return klass;}// NOTE:
// 1.x
// Behaviors were mixed in *in reverse order* and de-duped on the fly.
// The rule was that behavior properties were copied onto the element
// prototype if and only if the property did not already exist.
// Given: Polymer{ behaviors: [A, B, C, A, B]}, property copy order was:
// (1), B, (2), A, (3) C. This means prototype properties win over
// B properties win over A win over C. This mirrors what would happen
// with inheritance if element extended B extended A extended C.
//
// Again given, Polymer{ behaviors: [A, B, C, A, B]}, the resulting
// `behaviors` array was [C, A, B].
// Behavior lifecycle methods were called in behavior array order
// followed by the element, e.g. (1) C.created, (2) A.created,
// (3) B.created, (4) element.created. There was no support for
// super, and "super-behavior" methods were callable only by name).
//
// 2.x
// Behaviors are made into proper mixins which live in the
// element's prototype chain. Behaviors are placed in the element prototype
// eldest to youngest and de-duped youngest to oldest:
// So, first [A, B, C, A, B] becomes [C, A, B] then,
// the element prototype becomes (oldest) (1) Polymer.Element, (2) class(C),
// (3) class(A), (4) class(B), (5) class(Polymer({...})).
// Result:
// This means element properties win over B properties win over A win
// over C. (same as 1.x)
// If lifecycle is called (super then me), order is
// (1) C.created, (2) A.created, (3) B.created, (4) element.created
// (again same as 1.x)
function _mixinBehaviors(behaviors,klass){for(let i=0;i<behaviors.length;i++){let b=behaviors[i];if(b){klass=Array.isArray(b)?_mixinBehaviors(b,klass):GenerateClassFromInfo(b,klass);}}return klass;}/**
   * @param {Array} behaviors List of behaviors to flatten.
   * @param {Array=} list Target list to flatten behaviors into.
   * @param {Array=} exclude List of behaviors to exclude from the list.
   * @return {!Array} Returns the list of flattened behaviors.
   */function flattenBehaviors(behaviors,list,exclude){list=list||[];for(let i=behaviors.length-1;i>=0;i--){let b=behaviors[i];if(b){if(Array.isArray(b)){flattenBehaviors(b,list);}else{// dedup
if(list.indexOf(b)<0&&(!exclude||exclude.indexOf(b)<0)){list.unshift(b);}}}else{console.warn('behavior is null, check for missing or 404 import');}}return list;}/**
   * @param {!PolymerInit} info Polymer info object
   * @param {function(new:HTMLElement)} Base base class to extend with info object
   * @return {function(new:HTMLElement)} Generated class
   * @suppress {checkTypes}
   * @private
   */function GenerateClassFromInfo(info,Base){class PolymerGenerated extends Base{static get properties(){return info.properties;}static get observers(){return info.observers;}/**
       * @return {HTMLTemplateElement} template for this class
       */static get template(){// get template first from any imperative set in `info._template`
return info._template||// next look in dom-module associated with this element's is.
DomModule&&DomModule.import(this.is,'template')||// next look for superclass template (note: use superclass symbol
// to ensure correct `this.is`)
Base.template||// finally fall back to `_template` in element's prototype.
this.prototype._template||null;}/**
       * @return {void}
       */created(){super.created();if(info.created){info.created.call(this);}}/**
       * @return {void}
       */_registered(){super._registered();/* NOTE: `beforeRegister` is called here for bc, but the behavior
                            is different than in 1.x. In 1.0, the method was called *after*
                            mixing prototypes together but *before* processing of meta-objects.
                            However, dynamic effects can still be set here and can be done either
                            in `beforeRegister` or `registered`. It is no longer possible to set
                            `is` in `beforeRegister` as you could in 1.x.
                           */if(info.beforeRegister){info.beforeRegister.call(Object.getPrototypeOf(this));}if(info.registered){info.registered.call(Object.getPrototypeOf(this));}}/**
       * @return {void}
       */_applyListeners(){super._applyListeners();if(info.listeners){for(let l in info.listeners){this._addMethodEventListenerToNode(this,l,info.listeners[l]);}}}// note: exception to "super then me" rule;
// do work before calling super so that super attributes
// only apply if not already set.
/**
     * @return {void}
     */_ensureAttributes(){if(info.hostAttributes){for(let a in info.hostAttributes){this._ensureAttribute(a,info.hostAttributes[a]);}}super._ensureAttributes();}/**
       * @return {void}
       */ready(){super.ready();if(info.ready){info.ready.call(this);}}/**
       * @return {void}
       */attached(){super.attached();if(info.attached){info.attached.call(this);}}/**
       * @return {void}
       */detached(){super.detached();if(info.detached){info.detached.call(this);}}/**
       * Implements native Custom Elements `attributeChangedCallback` to
       * set an attribute value to a property via `_attributeToProperty`.
       *
       * @param {string} name Name of attribute that changed
       * @param {?string} old Old attribute value
       * @param {?string} value New attribute value
       * @return {void}
       */attributeChanged(name,old,value){super.attributeChanged(name,old,value);if(info.attributeChanged){info.attributeChanged.call(this,name,old,value);}}}PolymerGenerated.generatedFrom=info;for(let p in info){// NOTE: cannot copy `metaProps` methods onto prototype at least because
// `super.ready` must be called and is not included in the user fn.
if(!(p in metaProps)){let pd=Object.getOwnPropertyDescriptor(info,p);if(pd){Object.defineProperty(PolymerGenerated.prototype,p,pd);}}}return PolymerGenerated;}const Class=function(info){if(!info){console.warn('Polymer.Class requires `info` argument');}let klass=GenerateClassFromInfo(info,info.behaviors?// note: mixinBehaviors ensures `LegacyElementMixin`.
mixinBehaviors(info.behaviors,HTMLElement):LegacyElementMixin(HTMLElement));// decorate klass with registration info
klass.is=info.is;return klass;};var _class={Class:Class,mixinBehaviors:mixinBehaviors};const Polymer=function(info){// if input is a `class` (aka a function with a prototype), use the prototype
// remember that the `constructor` will never be called
let klass;if(typeof info==='function'){klass=info;}else{klass=Class(info);}customElements.define(klass.is,/** @type {!HTMLElement} */klass);return klass;};var polymerFn={Polymer:Polymer};// Common implementation for mixin & behavior
function mutablePropertyChange(inst,property,value,old,mutableData){let isObject;if(mutableData){isObject=typeof value==='object'&&value!==null;// Pull `old` for Objects from temp cache, but treat `null` as a primitive
if(isObject){old=inst.__dataTemp[property];}}// Strict equality check, but return false for NaN===NaN
let shouldChange=old!==value&&(old===old||value===value);// Objects are stored in temporary cache (cleared at end of
// turn), which is used for dirty-checking
if(isObject&&shouldChange){inst.__dataTemp[property]=value;}return shouldChange;}const MutableData=dedupingMixin(superClass=>{/**
   * @polymer
   * @mixinClass
   * @implements {Polymer_MutableData}
   */class MutableData extends superClass{/**
     * Overrides `Polymer.PropertyEffects` to provide option for skipping
     * strict equality checking for Objects and Arrays.
     *
     * This method pulls the value to dirty check against from the `__dataTemp`
     * cache (rather than the normal `__data` cache) for Objects.  Since the temp
     * cache is cleared at the end of a turn, this implementation allows
     * side-effects of deep object changes to be processed by re-setting the
     * same object (using the temp cache as an in-turn backstop to prevent
     * cycles due to 2-way notification).
     *
     * @param {string} property Property name
     * @param {*} value New property value
     * @param {*} old Previous property value
     * @return {boolean} Whether the property should be considered a change
     * @protected
     */_shouldPropertyChange(property,value,old){return mutablePropertyChange(this,property,value,old,true);}}return MutableData;});const OptionalMutableData=dedupingMixin(superClass=>{/**
   * @mixinClass
   * @polymer
   * @implements {Polymer_OptionalMutableData}
   */class OptionalMutableData extends superClass{static get properties(){return{/**
         * Instance-level flag for configuring the dirty-checking strategy
         * for this element.  When true, Objects and Arrays will skip dirty
         * checking, otherwise strict equality checking will be used.
         */mutableData:Boolean};}/**
       * Overrides `Polymer.PropertyEffects` to provide option for skipping
       * strict equality checking for Objects and Arrays.
       *
       * When `this.mutableData` is true on this instance, this method
       * pulls the value to dirty check against from the `__dataTemp` cache
       * (rather than the normal `__data` cache) for Objects.  Since the temp
       * cache is cleared at the end of a turn, this implementation allows
       * side-effects of deep object changes to be processed by re-setting the
       * same object (using the temp cache as an in-turn backstop to prevent
       * cycles due to 2-way notification).
       *
       * @param {string} property Property name
       * @param {*} value New property value
       * @param {*} old Previous property value
       * @return {boolean} Whether the property should be considered a change
       * @protected
       */_shouldPropertyChange(property,value,old){return mutablePropertyChange(this,property,value,old,this.mutableData);}}return OptionalMutableData;});// Export for use by legacy behavior
MutableData._mutablePropertyChange=mutablePropertyChange;var mutableData={MutableData:MutableData,OptionalMutableData:OptionalMutableData};// Base class for HTMLTemplateElement extension that has property effects
// machinery for propagating host properties to children. This is an ES5
// class only because Babel (incorrectly) requires super() in the class
// constructor even though no `this` is used and it returns an instance.
let newInstance=null;/**
                         * @constructor
                         * @extends {HTMLTemplateElement}
                         */function HTMLTemplateElementExtension(){return newInstance;}HTMLTemplateElementExtension.prototype=Object.create(HTMLTemplateElement.prototype,{constructor:{value:HTMLTemplateElementExtension,writable:true}});/**
     * @constructor
     * @implements {Polymer_PropertyEffects}
     * @extends {HTMLTemplateElementExtension}
     */const DataTemplate=PropertyEffects(HTMLTemplateElementExtension);/**
                                                                     * @constructor
                                                                     * @implements {Polymer_MutableData}
                                                                     * @extends {DataTemplate}
                                                                     */const MutableDataTemplate=MutableData(DataTemplate);// Applies a DataTemplate subclass to a <template> instance
function upgradeTemplate(template,constructor){newInstance=template;Object.setPrototypeOf(template,constructor.prototype);new constructor();newInstance=null;}// Base class for TemplateInstance's
/**
 * @constructor
 * @implements {Polymer_PropertyEffects}
 */const base=PropertyEffects(class{});/**
                                         * @polymer
                                         * @customElement
                                         * @appliesMixin Polymer.PropertyEffects
                                         * @unrestricted
                                         */class TemplateInstanceBase extends base{constructor(props){super();this._configureProperties(props);this.root=this._stampTemplate(this.__dataHost);// Save list of stamped children
let children=this.children=[];for(let n=this.root.firstChild;n;n=n.nextSibling){children.push(n);n.__templatizeInstance=this;}if(this.__templatizeOwner&&this.__templatizeOwner.__hideTemplateChildren__){this._showHideChildren(true);}// Flush props only when props are passed if instance props exist
// or when there isn't instance props.
let options=this.__templatizeOptions;if(props&&options.instanceProps||!options.instanceProps){this._enableProperties();}}/**
     * Configure the given `props` by calling `_setPendingProperty`. Also
     * sets any properties stored in `__hostProps`.
     * @private
     * @param {Object} props Object of property name-value pairs to set.
     * @return {void}
     */_configureProperties(props){let options=this.__templatizeOptions;if(options.forwardHostProp){for(let hprop in this.__hostProps){this._setPendingProperty(hprop,this.__dataHost['_host_'+hprop]);}}// Any instance props passed in the constructor will overwrite host props;
// normally this would be a user error but we don't specifically filter them
for(let iprop in props){this._setPendingProperty(iprop,props[iprop]);}}/**
     * Forwards a host property to this instance.  This method should be
     * called on instances from the `options.forwardHostProp` callback
     * to propagate changes of host properties to each instance.
     *
     * Note this method enqueues the change, which are flushed as a batch.
     *
     * @param {string} prop Property or path name
     * @param {*} value Value of the property to forward
     * @return {void}
     */forwardHostProp(prop,value){if(this._setPendingPropertyOrPath(prop,value,false,true)){this.__dataHost._enqueueClient(this);}}/**
     * Override point for adding custom or simulated event handling.
     *
     * @param {!Node} node Node to add event listener to
     * @param {string} eventName Name of event
     * @param {function(!Event):void} handler Listener function to add
     * @return {void}
     */_addEventListenerToNode(node,eventName,handler){if(this._methodHost&&this.__templatizeOptions.parentModel){// If this instance should be considered a parent model, decorate
// events this template instance as `model`
this._methodHost._addEventListenerToNode(node,eventName,e=>{e.model=this;handler(e);});}else{// Otherwise delegate to the template's host (which could be)
// another template instance
let templateHost=this.__dataHost.__dataHost;if(templateHost){templateHost._addEventListenerToNode(node,eventName,handler);}}}/**
     * Shows or hides the template instance top level child elements. For
     * text nodes, `textContent` is removed while "hidden" and replaced when
     * "shown."
     * @param {boolean} hide Set to true to hide the children;
     * set to false to show them.
     * @return {void}
     * @protected
     */_showHideChildren(hide){let c=this.children;for(let i=0;i<c.length;i++){let n=c[i];// Ignore non-changes
if(Boolean(hide)!=Boolean(n.__hideTemplateChildren__)){if(n.nodeType===Node.TEXT_NODE){if(hide){n.__polymerTextContent__=n.textContent;n.textContent='';}else{n.textContent=n.__polymerTextContent__;}// remove and replace slot
}else if(n.localName==='slot'){if(hide){n.__polymerReplaced__=document.createComment('hidden-slot');n.parentNode.replaceChild(n.__polymerReplaced__,n);}else{const replace=n.__polymerReplaced__;if(replace){replace.parentNode.replaceChild(n,replace);}}}else if(n.style){if(hide){n.__polymerDisplay__=n.style.display;n.style.display='none';}else{n.style.display=n.__polymerDisplay__;}}}n.__hideTemplateChildren__=hide;if(n._showHideChildren){n._showHideChildren(hide);}}}/**
     * Overrides default property-effects implementation to intercept
     * textContent bindings while children are "hidden" and cache in
     * private storage for later retrieval.
     *
     * @param {!Node} node The node to set a property on
     * @param {string} prop The property to set
     * @param {*} value The value to set
     * @return {void}
     * @protected
     */_setUnmanagedPropertyToNode(node,prop,value){if(node.__hideTemplateChildren__&&node.nodeType==Node.TEXT_NODE&&prop=='textContent'){node.__polymerTextContent__=value;}else{super._setUnmanagedPropertyToNode(node,prop,value);}}/**
     * Find the parent model of this template instance.  The parent model
     * is either another templatize instance that had option `parentModel: true`,
     * or else the host element.
     *
     * @return {!Polymer_PropertyEffects} The parent model of this instance
     */get parentModel(){let model=this.__parentModel;if(!model){let options;model=this;do{// A template instance's `__dataHost` is a <template>
// `model.__dataHost.__dataHost` is the template's host
model=model.__dataHost.__dataHost;}while((options=model.__templatizeOptions)&&!options.parentModel);this.__parentModel=model;}return model;}/**
     * Stub of HTMLElement's `dispatchEvent`, so that effects that may
     * dispatch events safely no-op.
     *
     * @param {Event} event Event to dispatch
     * @return {boolean} Always true.
     */dispatchEvent(event){// eslint-disable-line no-unused-vars
return true;}}/** @type {!DataTemplate} */TemplateInstanceBase.prototype.__dataHost;/** @type {!TemplatizeOptions} */TemplateInstanceBase.prototype.__templatizeOptions;/** @type {!Polymer_PropertyEffects} */TemplateInstanceBase.prototype._methodHost;/** @type {!Object} */TemplateInstanceBase.prototype.__templatizeOwner;/** @type {!Object} */TemplateInstanceBase.prototype.__hostProps;/**
                                             * @constructor
                                             * @extends {TemplateInstanceBase}
                                             * @implements {Polymer_MutableData}
                                             */const MutableTemplateInstanceBase=MutableData(TemplateInstanceBase);function findMethodHost(template){// Technically this should be the owner of the outermost template.
// In shadow dom, this is always getRootNode().host, but we can
// approximate this via cooperation with our dataHost always setting
// `_methodHost` as long as there were bindings (or id's) on this
// instance causing it to get a dataHost.
let templateHost=template.__dataHost;return templateHost&&templateHost._methodHost||templateHost;}/* eslint-disable valid-jsdoc */ /**
                                    * @suppress {missingProperties} class.prototype is not defined for some reason
                                    */function createTemplatizerClass(template,templateInfo,options){// Anonymous class created by the templatize
let base=options.mutableData?MutableTemplateInstanceBase:TemplateInstanceBase;/**
                                                                                        * @constructor
                                                                                        * @extends {base}
                                                                                        * @private
                                                                                        */let klass=class extends base{};klass.prototype.__templatizeOptions=options;klass.prototype._bindTemplate(template);addNotifyEffects(klass,template,templateInfo,options);return klass;}/**
   * @suppress {missingProperties} class.prototype is not defined for some reason
   */function addPropagateEffects(template,templateInfo,options){let userForwardHostProp=options.forwardHostProp;if(userForwardHostProp){// Provide data API and property effects on memoized template class
let klass=templateInfo.templatizeTemplateClass;if(!klass){let base=options.mutableData?MutableDataTemplate:DataTemplate;klass=templateInfo.templatizeTemplateClass=class TemplatizedTemplate extends base{};// Add template - >instances effects
// and host <- template effects
let hostProps=templateInfo.hostProps;for(let prop in hostProps){klass.prototype._addPropertyEffect('_host_'+prop,klass.prototype.PROPERTY_EFFECT_TYPES.PROPAGATE,{fn:createForwardHostPropEffect(prop,userForwardHostProp)});klass.prototype._createNotifyingProperty('_host_'+prop);}}upgradeTemplate(template,klass);// Mix any pre-bound data into __data; no need to flush this to
// instances since they pull from the template at instance-time
if(template.__dataProto){// Note, generally `__dataProto` could be chained, but it's guaranteed
// to not be since this is a vanilla template we just added effects to
Object.assign(template.__data,template.__dataProto);}// Clear any pending data for performance
template.__dataTemp={};template.__dataPending=null;template.__dataOld=null;template._enableProperties();}}/* eslint-enable valid-jsdoc */function createForwardHostPropEffect(hostProp,userForwardHostProp){return function forwardHostProp(template,prop,props){userForwardHostProp.call(template.__templatizeOwner,prop.substring('_host_'.length),props[prop]);};}function addNotifyEffects(klass,template,templateInfo,options){let hostProps=templateInfo.hostProps||{};for(let iprop in options.instanceProps){delete hostProps[iprop];let userNotifyInstanceProp=options.notifyInstanceProp;if(userNotifyInstanceProp){klass.prototype._addPropertyEffect(iprop,klass.prototype.PROPERTY_EFFECT_TYPES.NOTIFY,{fn:createNotifyInstancePropEffect(iprop,userNotifyInstanceProp)});}}if(options.forwardHostProp&&template.__dataHost){for(let hprop in hostProps){klass.prototype._addPropertyEffect(hprop,klass.prototype.PROPERTY_EFFECT_TYPES.NOTIFY,{fn:createNotifyHostPropEffect()});}}}function createNotifyInstancePropEffect(instProp,userNotifyInstanceProp){return function notifyInstanceProp(inst,prop,props){userNotifyInstanceProp.call(inst.__templatizeOwner,inst,prop,props[prop]);};}function createNotifyHostPropEffect(){return function notifyHostProp(inst,prop,props){inst.__dataHost._setPendingPropertyOrPath('_host_'+prop,props[prop],true,true);};}function templatize(template,owner,options){options=/** @type {!TemplatizeOptions} */options||{};if(template.__templatizeOwner){throw new Error('A <template> can only be templatized once');}template.__templatizeOwner=owner;const ctor=owner?owner.constructor:TemplateInstanceBase;let templateInfo=ctor._parseTemplate(template);// Get memoized base class for the prototypical template, which
// includes property effects for binding template & forwarding
let baseClass=templateInfo.templatizeInstanceClass;if(!baseClass){baseClass=createTemplatizerClass(template,templateInfo,options);templateInfo.templatizeInstanceClass=baseClass;}// Host property forwarding must be installed onto template instance
addPropagateEffects(template,templateInfo,options);// Subclass base class and add reference for this specific template
/** @private */let klass=class TemplateInstance extends baseClass{};klass.prototype._methodHost=findMethodHost(template);klass.prototype.__dataHost=template;klass.prototype.__templatizeOwner=owner;klass.prototype.__hostProps=templateInfo.hostProps;klass=/** @type {function(new:TemplateInstanceBase)} */klass;//eslint-disable-line no-self-assign
return klass;}function modelForElement(template,node){let model;while(node){// An element with a __templatizeInstance marks the top boundary
// of a scope; walk up until we find one, and then ensure that
// its __dataHost matches `this`, meaning this dom-repeat stamped it
if(model=node.__templatizeInstance){// Found an element stamped by another template; keep walking up
// from its __dataHost
if(model.__dataHost!=template){node=model.__dataHost;}else{return model;}}else{// Still in a template scope, keep going up until
// a __templatizeInstance is found
node=node.parentNode;}}return null;}var templatize$1={templatize:templatize,modelForElement:modelForElement,TemplateInstanceBase:TemplateInstanceBase};let TemplateInstanceBase$1=TemplateInstanceBase;// eslint-disable-line
/**
 * @typedef {{
 *   _templatizerTemplate: HTMLTemplateElement,
 *   _parentModel: boolean,
 *   _instanceProps: Object,
 *   _forwardHostPropV2: Function,
 *   _notifyInstancePropV2: Function,
 *   ctor: TemplateInstanceBase
 * }}
 */let TemplatizerUser;// eslint-disable-line
const Templatizer={/**
   * Generates an anonymous `TemplateInstance` class (stored as `this.ctor`)
   * for the provided template.  This method should be called once per
   * template to prepare an element for stamping the template, followed
   * by `stamp` to create new instances of the template.
   *
   * @param {!HTMLTemplateElement} template Template to prepare
   * @param {boolean=} mutableData When `true`, the generated class will skip
   *   strict dirty-checking for objects and arrays (always consider them to
   *   be "dirty"). Defaults to false.
   * @return {void}
   * @this {TemplatizerUser}
   */templatize(template,mutableData){this._templatizerTemplate=template;this.ctor=templatize(template,this,{mutableData:Boolean(mutableData),parentModel:this._parentModel,instanceProps:this._instanceProps,forwardHostProp:this._forwardHostPropV2,notifyInstanceProp:this._notifyInstancePropV2});},/**
   * Creates an instance of the template prepared by `templatize`.  The object
   * returned is an instance of the anonymous class generated by `templatize`
   * whose `root` property is a document fragment containing newly cloned
   * template content, and which has property accessors corresponding to
   * properties referenced in template bindings.
   *
   * @param {Object=} model Object containing initial property values to
   *   populate into the template bindings.
   * @return {TemplateInstanceBase} Returns the created instance of
   * the template prepared by `templatize`.
   * @this {TemplatizerUser}
   */stamp(model){return new this.ctor(model);},/**
   * Returns the template "model" (`TemplateInstance`) associated with
   * a given element, which serves as the binding scope for the template
   * instance the element is contained in.  A template model should be used
   * to manipulate data associated with this template instance.
   *
   * @param {HTMLElement} el Element for which to return a template model.
   * @return {TemplateInstanceBase} Model representing the binding scope for
   *   the element.
   * @this {TemplatizerUser}
   */modelForElement(el){return modelForElement(this._templatizerTemplate,el);}};var templatizerBehavior={Templatizer:Templatizer};/**
    * @constructor
    * @extends {HTMLElement}
    * @implements {Polymer_PropertyEffects}
    * @implements {Polymer_OptionalMutableData}
    * @implements {Polymer_GestureEventListeners}
    */const domBindBase=GestureEventListeners(OptionalMutableData(PropertyEffects(HTMLElement)));/**
                                                                                               * Custom element to allow using Polymer's template features (data binding,
                                                                                               * declarative event listeners, etc.) in the main document without defining
                                                                                               * a new custom element.
                                                                                               *
                                                                                               * `<template>` tags utilizing bindings may be wrapped with the `<dom-bind>`
                                                                                               * element, which will immediately stamp the wrapped template into the main
                                                                                               * document and bind elements to the `dom-bind` element itself as the
                                                                                               * binding scope.
                                                                                               *
                                                                                               * @polymer
                                                                                               * @customElement
                                                                                               * @appliesMixin Polymer.PropertyEffects
                                                                                               * @appliesMixin Polymer.OptionalMutableData
                                                                                               * @appliesMixin Polymer.GestureEventListeners
                                                                                               * @extends {domBindBase}
                                                                                               * @memberof Polymer
                                                                                               * @summary Custom element to allow using Polymer's template features (data
                                                                                               *   binding, declarative event listeners, etc.) in the main document.
                                                                                               */class DomBind extends domBindBase{static get observedAttributes(){return['mutable-data'];}constructor(){super();this.root=null;this.$=null;this.__children=null;}/** @return {void} */attributeChangedCallback(){// assumes only one observed attribute
this.mutableData=true;}/** @return {void} */connectedCallback(){this.style.display='none';this.render();}/** @return {void} */disconnectedCallback(){this.__removeChildren();}__insertChildren(){this.parentNode.insertBefore(this.root,this);}__removeChildren(){if(this.__children){for(let i=0;i<this.__children.length;i++){this.root.appendChild(this.__children[i]);}}}/**
     * Forces the element to render its content. This is typically only
     * necessary to call if HTMLImports with the async attribute are used.
     * @return {void}
     */render(){let template;if(!this.__children){template=/** @type {HTMLTemplateElement} */template||this.querySelector('template');if(!template){// Wait until childList changes and template should be there by then
let observer=new MutationObserver(()=>{template=/** @type {HTMLTemplateElement} */this.querySelector('template');if(template){observer.disconnect();this.render();}else{throw new Error('dom-bind requires a <template> child');}});observer.observe(this,{childList:true});return;}this.root=this._stampTemplate(template);this.$=this.root.$;this.__children=[];for(let n=this.root.firstChild;n;n=n.nextSibling){this.__children[this.__children.length]=n;}this._enableProperties();}this.__insertChildren();this.dispatchEvent(new CustomEvent('dom-change',{bubbles:true,composed:true}));}}customElements.define('dom-bind',DomBind);var domBind={DomBind:DomBind};/**
    * Class representing a static string value which can be used to filter
    * strings by asseting that they have been created via this class. The
    * `value` property returns the string passed to the constructor.
    */class LiteralString{constructor(string){/** @type {string} */this.value=string.toString();}/**
     * @return {string} LiteralString string value
     */toString(){return this.value;}}/**
   * @param {*} value Object to stringify into HTML
   * @return {string} HTML stringified form of `obj`
   */function literalValue(value){if(value instanceof LiteralString){return(/** @type {!LiteralString} */value.value);}else{throw new Error(`non-literal value passed to Polymer.htmlLiteral: ${value}`);}}/**
   * @param {*} value Object to stringify into HTML
   * @return {string} HTML stringified form of `obj`
   */function htmlValue(value){if(value instanceof HTMLTemplateElement){return(/** @type {!HTMLTemplateElement } */value.innerHTML);}else if(value instanceof LiteralString){return literalValue(value);}else{throw new Error(`non-template value passed to Polymer.html: ${value}`);}}const html=function html(strings,...values){const template=/** @type {!HTMLTemplateElement} */document.createElement('template');template.innerHTML=values.reduce((acc,v,idx)=>acc+htmlValue(v)+strings[idx+1],strings[0]);return template;};const htmlLiteral=function(strings,...values){return new LiteralString(values.reduce((acc,v,idx)=>acc+literalValue(v)+strings[idx+1],strings[0]));};var htmlTag={html:html,htmlLiteral:htmlLiteral};/**
    * Base class that provides the core API for Polymer's meta-programming
    * features including template stamping, data-binding, attribute deserialization,
    * and property change observation.
    *
    * @customElement
    * @polymer
    * @memberof Polymer
    * @constructor
    * @implements {Polymer_ElementMixin}
    * @extends HTMLElement
    * @appliesMixin Polymer.ElementMixin
    * @summary Custom element base class that provides the core API for Polymer's
    *   key meta-programming features including template stamping, data-binding,
    *   attribute deserialization, and property change observation
    */const Element$1=ElementMixin(HTMLElement);var polymerElement={PolymerElement:Element$1,html:html};let TemplateInstanceBase$2=TemplateInstanceBase;// eslint-disable-line
/**
 * @constructor
 * @implements {Polymer_OptionalMutableData}
 * @extends {Polymer.Element}
 */const domRepeatBase=OptionalMutableData(Element$1);/**
                                                       * The `<dom-repeat>` element will automatically stamp and binds one instance
                                                       * of template content to each object in a user-provided array.
                                                       * `dom-repeat` accepts an `items` property, and one instance of the template
                                                       * is stamped for each item into the DOM at the location of the `dom-repeat`
                                                       * element.  The `item` property will be set on each instance's binding
                                                       * scope, thus templates should bind to sub-properties of `item`.
                                                       *
                                                       * Example:
                                                       *
                                                       * ```html
                                                       * <dom-module id="employee-list">
                                                       *
                                                       *   <template>
                                                       *
                                                       *     <div> Employee list: </div>
                                                       *     <dom-repeat items="{{employees}}">
                                                       *       <template>
                                                       *         <div>First name: <span>{{item.first}}</span></div>
                                                       *         <div>Last name: <span>{{item.last}}</span></div>
                                                       *       </template>
                                                       *     </dom-repeat>
                                                       *
                                                       *   </template>
                                                       *
                                                       * </dom-module>
                                                       * ```
                                                       *
                                                       * With the following custom element definition:
                                                       *
                                                       * ```js
                                                       * class EmployeeList extends Polymer.Element {
                                                       *   static get is() { return 'employee-list'; }
                                                       *   static get properties() {
                                                       *     return {
                                                       *       employees: {
                                                       *         value() {
                                                       *           return [
                                                       *             {first: 'Bob', last: 'Smith'},
                                                       *             {first: 'Sally', last: 'Johnson'},
                                                       *             ...
                                                       *           ];
                                                       *         }
                                                       *       }
                                                       *     };
                                                       *   }
                                                       * }
                                                       * ```
                                                       *
                                                       * Notifications for changes to items sub-properties will be forwarded to template
                                                       * instances, which will update via the normal structured data notification system.
                                                       *
                                                       * Mutations to the `items` array itself should be made using the Array
                                                       * mutation API's on `Polymer.Base` (`push`, `pop`, `splice`, `shift`,
                                                       * `unshift`), and template instances will be kept in sync with the data in the
                                                       * array.
                                                       *
                                                       * Events caught by event handlers within the `dom-repeat` template will be
                                                       * decorated with a `model` property, which represents the binding scope for
                                                       * each template instance.  The model is an instance of Polymer.Base, and should
                                                       * be used to manipulate data on the instance, for example
                                                       * `event.model.set('item.checked', true);`.
                                                       *
                                                       * Alternatively, the model for a template instance for an element stamped by
                                                       * a `dom-repeat` can be obtained using the `modelForElement` API on the
                                                       * `dom-repeat` that stamped it, for example
                                                       * `this.$.domRepeat.modelForElement(event.target).set('item.checked', true);`.
                                                       * This may be useful for manipulating instance data of event targets obtained
                                                       * by event handlers on parents of the `dom-repeat` (event delegation).
                                                       *
                                                       * A view-specific filter/sort may be applied to each `dom-repeat` by supplying a
                                                       * `filter` and/or `sort` property.  This may be a string that names a function on
                                                       * the host, or a function may be assigned to the property directly.  The functions
                                                       * should implemented following the standard `Array` filter/sort API.
                                                       *
                                                       * In order to re-run the filter or sort functions based on changes to sub-fields
                                                       * of `items`, the `observe` property may be set as a space-separated list of
                                                       * `item` sub-fields that should cause a re-filter/sort when modified.  If
                                                       * the filter or sort function depends on properties not contained in `items`,
                                                       * the user should observe changes to those properties and call `render` to update
                                                       * the view based on the dependency change.
                                                       *
                                                       * For example, for an `dom-repeat` with a filter of the following:
                                                       *
                                                       * ```js
                                                       * isEngineer(item) {
                                                       *   return item.type == 'engineer' || item.manager.type == 'engineer';
                                                       * }
                                                       * ```
                                                       *
                                                       * Then the `observe` property should be configured as follows:
                                                       *
                                                       * ```html
                                                       * <dom-repeat items="{{employees}}" filter="isEngineer" observe="type manager.type">
                                                       * ```
                                                       *
                                                       * @customElement
                                                       * @polymer
                                                       * @memberof Polymer
                                                       * @extends {domRepeatBase}
                                                       * @appliesMixin Polymer.OptionalMutableData
                                                       * @summary Custom element for stamping instance of a template bound to
                                                       *   items in an array.
                                                       */class DomRepeat extends domRepeatBase{// Not needed to find template; can be removed once the analyzer
// can find the tag name from customElements.define call
static get is(){return'dom-repeat';}static get template(){return null;}static get properties(){/**
     * Fired whenever DOM is added or removed by this template (by
     * default, rendering occurs lazily).  To force immediate rendering, call
     * `render`.
     *
     * @event dom-change
     */return{/**
       * An array containing items determining how many instances of the template
       * to stamp and that that each template instance should bind to.
       */items:{type:Array},/**
       * The name of the variable to add to the binding scope for the array
       * element associated with a given template instance.
       */as:{type:String,value:'item'},/**
       * The name of the variable to add to the binding scope with the index
       * of the instance in the sorted and filtered list of rendered items.
       * Note, for the index in the `this.items` array, use the value of the
       * `itemsIndexAs` property.
       */indexAs:{type:String,value:'index'},/**
       * The name of the variable to add to the binding scope with the index
       * of the instance in the `this.items` array. Note, for the index of
       * this instance in the sorted and filtered list of rendered items,
       * use the value of the `indexAs` property.
       */itemsIndexAs:{type:String,value:'itemsIndex'},/**
       * A function that should determine the sort order of the items.  This
       * property should either be provided as a string, indicating a method
       * name on the element's host, or else be an actual function.  The
       * function should match the sort function passed to `Array.sort`.
       * Using a sort function has no effect on the underlying `items` array.
       */sort:{type:Function,observer:'__sortChanged'},/**
       * A function that can be used to filter items out of the view.  This
       * property should either be provided as a string, indicating a method
       * name on the element's host, or else be an actual function.  The
       * function should match the sort function passed to `Array.filter`.
       * Using a filter function has no effect on the underlying `items` array.
       */filter:{type:Function,observer:'__filterChanged'},/**
       * When using a `filter` or `sort` function, the `observe` property
       * should be set to a space-separated list of the names of item
       * sub-fields that should trigger a re-sort or re-filter when changed.
       * These should generally be fields of `item` that the sort or filter
       * function depends on.
       */observe:{type:String,observer:'__observeChanged'},/**
       * When using a `filter` or `sort` function, the `delay` property
       * determines a debounce time in ms after a change to observed item
       * properties that must pass before the filter or sort is re-run.
       * This is useful in rate-limiting shuffling of the view when
       * item changes may be frequent.
       */delay:Number,/**
       * Count of currently rendered items after `filter` (if any) has been applied.
       * If "chunking mode" is enabled, `renderedItemCount` is updated each time a
       * set of template instances is rendered.
       *
       */renderedItemCount:{type:Number,notify:true,readOnly:true},/**
       * Defines an initial count of template instances to render after setting
       * the `items` array, before the next paint, and puts the `dom-repeat`
       * into "chunking mode".  The remaining items will be created and rendered
       * incrementally at each animation frame therof until all instances have
       * been rendered.
       */initialCount:{type:Number,observer:'__initializeChunking'},/**
       * When `initialCount` is used, this property defines a frame rate (in
       * fps) to target by throttling the number of instances rendered each
       * frame to not exceed the budget for the target frame rate.  The
       * framerate is effectively the number of `requestAnimationFrame`s that
       * it tries to allow to actually fire in a given second. It does this
       * by measuring the time between `rAF`s and continuously adjusting the
       * number of items created each `rAF` to maintain the target framerate.
       * Setting this to a higher number allows lower latency and higher
       * throughput for event handlers and other tasks, but results in a
       * longer time for the remaining items to complete rendering.
       */targetFramerate:{type:Number,value:20},_targetFrameTime:{type:Number,computed:'__computeFrameTime(targetFramerate)'}};}static get observers(){return['__itemsChanged(items.*)'];}constructor(){super();this.__instances=[];this.__limit=Infinity;this.__pool=[];this.__renderDebouncer=null;this.__itemsIdxToInstIdx={};this.__chunkCount=null;this.__lastChunkTime=null;this.__sortFn=null;this.__filterFn=null;this.__observePaths=null;this.__ctor=null;this.__isDetached=true;this.template=null;}/**
     * @return {void}
     */disconnectedCallback(){super.disconnectedCallback();this.__isDetached=true;for(let i=0;i<this.__instances.length;i++){this.__detachInstance(i);}}/**
     * @return {void}
     */connectedCallback(){super.connectedCallback();this.style.display='none';// only perform attachment if the element was previously detached.
if(this.__isDetached){this.__isDetached=false;let parent=this.parentNode;for(let i=0;i<this.__instances.length;i++){this.__attachInstance(i,parent);}}}__ensureTemplatized(){// Templatizing (generating the instance constructor) needs to wait
// until ready, since won't have its template content handed back to
// it until then
if(!this.__ctor){let template=this.template=/** @type {HTMLTemplateElement} */this.querySelector('template');if(!template){// // Wait until childList changes and template should be there by then
let observer=new MutationObserver(()=>{if(this.querySelector('template')){observer.disconnect();this.__render();}else{throw new Error('dom-repeat requires a <template> child');}});observer.observe(this,{childList:true});return false;}// Template instance props that should be excluded from forwarding
let instanceProps={};instanceProps[this.as]=true;instanceProps[this.indexAs]=true;instanceProps[this.itemsIndexAs]=true;this.__ctor=templatize(template,this,{mutableData:this.mutableData,parentModel:true,instanceProps:instanceProps,/**
         * @this {this}
         * @param {string} prop Property to set
         * @param {*} value Value to set property to
         */forwardHostProp:function(prop,value){let i$=this.__instances;for(let i=0,inst;i<i$.length&&(inst=i$[i]);i++){inst.forwardHostProp(prop,value);}},/**
         * @this {this}
         * @param {Object} inst Instance to notify
         * @param {string} prop Property to notify
         * @param {*} value Value to notify
         */notifyInstanceProp:function(inst,prop,value){if(matches(this.as,prop)){let idx=inst[this.itemsIndexAs];if(prop==this.as){this.items[idx]=value;}let path=translate(this.as,'items.'+idx,prop);this.notifyPath(path,value);}}});}return true;}__getMethodHost(){// Technically this should be the owner of the outermost template.
// In shadow dom, this is always getRootNode().host, but we can
// approximate this via cooperation with our dataHost always setting
// `_methodHost` as long as there were bindings (or id's) on this
// instance causing it to get a dataHost.
return this.__dataHost._methodHost||this.__dataHost;}__functionFromPropertyValue(functionOrMethodName){if(typeof functionOrMethodName==='string'){let methodName=functionOrMethodName;let obj=this.__getMethodHost();return function(){return obj[methodName].apply(obj,arguments);};}return functionOrMethodName;}__sortChanged(sort){this.__sortFn=this.__functionFromPropertyValue(sort);if(this.items){this.__debounceRender(this.__render);}}__filterChanged(filter){this.__filterFn=this.__functionFromPropertyValue(filter);if(this.items){this.__debounceRender(this.__render);}}__computeFrameTime(rate){return Math.ceil(1000/rate);}__initializeChunking(){if(this.initialCount){this.__limit=this.initialCount;this.__chunkCount=this.initialCount;this.__lastChunkTime=performance.now();}}__tryRenderChunk(){// Debounced so that multiple calls through `_render` between animation
// frames only queue one new rAF (e.g. array mutation & chunked render)
if(this.items&&this.__limit<this.items.length){this.__debounceRender(this.__requestRenderChunk);}}__requestRenderChunk(){requestAnimationFrame(()=>this.__renderChunk());}__renderChunk(){// Simple auto chunkSize throttling algorithm based on feedback loop:
// measure actual time between frames and scale chunk count by ratio
// of target/actual frame time
let currChunkTime=performance.now();let ratio=this._targetFrameTime/(currChunkTime-this.__lastChunkTime);this.__chunkCount=Math.round(this.__chunkCount*ratio)||1;this.__limit+=this.__chunkCount;this.__lastChunkTime=currChunkTime;this.__debounceRender(this.__render);}__observeChanged(){this.__observePaths=this.observe&&this.observe.replace('.*','.').split(' ');}__itemsChanged(change){if(this.items&&!Array.isArray(this.items)){console.warn('dom-repeat expected array for `items`, found',this.items);}// If path was to an item (e.g. 'items.3' or 'items.3.foo'), forward the
// path to that instance synchronously (returns false for non-item paths)
if(!this.__handleItemPath(change.path,change.value)){// Otherwise, the array was reset ('items') or spliced ('items.splices'),
// so queue a full refresh
this.__initializeChunking();this.__debounceRender(this.__render);}}__handleObservedPaths(path){// Handle cases where path changes should cause a re-sort/filter
if(this.__sortFn||this.__filterFn){if(!path){// Always re-render if the item itself changed
this.__debounceRender(this.__render,this.delay);}else if(this.__observePaths){// Otherwise, re-render if the path changed matches an observed path
let paths=this.__observePaths;for(let i=0;i<paths.length;i++){if(path.indexOf(paths[i])===0){this.__debounceRender(this.__render,this.delay);}}}}}/**
     * @param {function(this:DomRepeat)} fn Function to debounce.
     * @param {number=} delay Delay in ms to debounce by.
     */__debounceRender(fn,delay=0){this.__renderDebouncer=Debouncer.debounce(this.__renderDebouncer,delay>0?timeOut.after(delay):microTask,fn.bind(this));enqueueDebouncer(this.__renderDebouncer);}/**
     * Forces the element to render its content. Normally rendering is
     * asynchronous to a provoking change. This is done for efficiency so
     * that multiple changes trigger only a single render. The render method
     * should be called if, for example, template rendering is required to
     * validate application state.
     * @return {void}
     */render(){// Queue this repeater, then flush all in order
this.__debounceRender(this.__render);flush$1();}__render(){if(!this.__ensureTemplatized()){// No template found yet
return;}this.__applyFullRefresh();// Reset the pool
// TODO(kschaaf): Reuse pool across turns and nested templates
// Now that objects/arrays are re-evaluated when set, we can safely
// reuse pooled instances across turns, however we still need to decide
// semantics regarding how long to hold, how many to hold, etc.
this.__pool.length=0;// Set rendered item count
this._setRenderedItemCount(this.__instances.length);// Notify users
this.dispatchEvent(new CustomEvent('dom-change',{bubbles:true,composed:true}));// Check to see if we need to render more items
this.__tryRenderChunk();}__applyFullRefresh(){let items=this.items||[];let isntIdxToItemsIdx=new Array(items.length);for(let i=0;i<items.length;i++){isntIdxToItemsIdx[i]=i;}// Apply user filter
if(this.__filterFn){isntIdxToItemsIdx=isntIdxToItemsIdx.filter((i,idx,array)=>this.__filterFn(items[i],idx,array));}// Apply user sort
if(this.__sortFn){isntIdxToItemsIdx.sort((a,b)=>this.__sortFn(items[a],items[b]));}// items->inst map kept for item path forwarding
const itemsIdxToInstIdx=this.__itemsIdxToInstIdx={};let instIdx=0;// Generate instances and assign items
const limit=Math.min(isntIdxToItemsIdx.length,this.__limit);for(;instIdx<limit;instIdx++){let inst=this.__instances[instIdx];let itemIdx=isntIdxToItemsIdx[instIdx];let item=items[itemIdx];itemsIdxToInstIdx[itemIdx]=instIdx;if(inst){inst._setPendingProperty(this.as,item);inst._setPendingProperty(this.indexAs,instIdx);inst._setPendingProperty(this.itemsIndexAs,itemIdx);inst._flushProperties();}else{this.__insertInstance(item,instIdx,itemIdx);}}// Remove any extra instances from previous state
for(let i=this.__instances.length-1;i>=instIdx;i--){this.__detachAndRemoveInstance(i);}}__detachInstance(idx){let inst=this.__instances[idx];for(let i=0;i<inst.children.length;i++){let el=inst.children[i];inst.root.appendChild(el);}return inst;}__attachInstance(idx,parent){let inst=this.__instances[idx];parent.insertBefore(inst.root,this);}__detachAndRemoveInstance(idx){let inst=this.__detachInstance(idx);if(inst){this.__pool.push(inst);}this.__instances.splice(idx,1);}__stampInstance(item,instIdx,itemIdx){let model={};model[this.as]=item;model[this.indexAs]=instIdx;model[this.itemsIndexAs]=itemIdx;return new this.__ctor(model);}__insertInstance(item,instIdx,itemIdx){let inst=this.__pool.pop();if(inst){// TODO(kschaaf): If the pool is shared across turns, hostProps
// need to be re-set to reused instances in addition to item
inst._setPendingProperty(this.as,item);inst._setPendingProperty(this.indexAs,instIdx);inst._setPendingProperty(this.itemsIndexAs,itemIdx);inst._flushProperties();}else{inst=this.__stampInstance(item,instIdx,itemIdx);}let beforeRow=this.__instances[instIdx+1];let beforeNode=beforeRow?beforeRow.children[0]:this;this.parentNode.insertBefore(inst.root,beforeNode);this.__instances[instIdx]=inst;return inst;}// Implements extension point from Templatize mixin
/**
   * Shows or hides the template instance top level child elements. For
   * text nodes, `textContent` is removed while "hidden" and replaced when
   * "shown."
   * @param {boolean} hidden Set to true to hide the children;
   * set to false to show them.
   * @return {void}
   * @protected
   */_showHideChildren(hidden){for(let i=0;i<this.__instances.length;i++){this.__instances[i]._showHideChildren(hidden);}}// Called as a side effect of a host items.<key>.<path> path change,
// responsible for notifying item.<path> changes to inst for key
__handleItemPath(path,value){let itemsPath=path.slice(6);// 'items.'.length == 6
let dot=itemsPath.indexOf('.');let itemsIdx=dot<0?itemsPath:itemsPath.substring(0,dot);// If path was index into array...
if(itemsIdx==parseInt(itemsIdx,10)){let itemSubPath=dot<0?'':itemsPath.substring(dot+1);// If the path is observed, it will trigger a full refresh
this.__handleObservedPaths(itemSubPath);// Note, even if a rull refresh is triggered, always do the path
// notification because unless mutableData is used for dom-repeat
// and all elements in the instance subtree, a full refresh may
// not trigger the proper update.
let instIdx=this.__itemsIdxToInstIdx[itemsIdx];let inst=this.__instances[instIdx];if(inst){let itemPath=this.as+(itemSubPath?'.'+itemSubPath:'');// This is effectively `notifyPath`, but avoids some of the overhead
// of the public API
inst._setPendingPropertyOrPath(itemPath,value,false,true);inst._flushProperties();}return true;}}/**
     * Returns the item associated with a given element stamped by
     * this `dom-repeat`.
     *
     * Note, to modify sub-properties of the item,
     * `modelForElement(el).set('item.<sub-prop>', value)`
     * should be used.
     *
     * @param {!HTMLElement} el Element for which to return the item.
     * @return {*} Item associated with the element.
     */itemForElement(el){let instance=this.modelForElement(el);return instance&&instance[this.as];}/**
     * Returns the inst index for a given element stamped by this `dom-repeat`.
     * If `sort` is provided, the index will reflect the sorted order (rather
     * than the original array order).
     *
     * @param {!HTMLElement} el Element for which to return the index.
     * @return {?number} Row index associated with the element (note this may
     *   not correspond to the array index if a user `sort` is applied).
     */indexForElement(el){let instance=this.modelForElement(el);return instance&&instance[this.indexAs];}/**
     * Returns the template "model" associated with a given element, which
     * serves as the binding scope for the template instance the element is
     * contained in. A template model is an instance of `Polymer.Base`, and
     * should be used to manipulate data associated with this template instance.
     *
     * Example:
     *
     *   let model = modelForElement(el);
     *   if (model.index < 10) {
     *     model.set('item.checked', true);
     *   }
     *
     * @param {!HTMLElement} el Element for which to return a template model.
     * @return {TemplateInstanceBase} Model representing the binding scope for
     *   the element.
     */modelForElement(el){return modelForElement(this.template,el);}}customElements.define(DomRepeat.is,DomRepeat);var domRepeat={DomRepeat:DomRepeat};/**
    * The `<dom-if>` element will stamp a light-dom `<template>` child when
    * the `if` property becomes truthy, and the template can use Polymer
    * data-binding and declarative event features when used in the context of
    * a Polymer element's template.
    *
    * When `if` becomes falsy, the stamped content is hidden but not
    * removed from dom. When `if` subsequently becomes truthy again, the content
    * is simply re-shown. This approach is used due to its favorable performance
    * characteristics: the expense of creating template content is paid only
    * once and lazily.
    *
    * Set the `restamp` property to true to force the stamped content to be
    * created / destroyed when the `if` condition changes.
    *
    * @customElement
    * @polymer
    * @extends Polymer.Element
    * @memberof Polymer
    * @summary Custom element that conditionally stamps and hides or removes
    *   template content based on a boolean flag.
    */class DomIf extends Element$1{// Not needed to find template; can be removed once the analyzer
// can find the tag name from customElements.define call
static get is(){return'dom-if';}static get template(){return null;}static get properties(){return{/**
       * Fired whenever DOM is added or removed/hidden by this template (by
       * default, rendering occurs lazily).  To force immediate rendering, call
       * `render`.
       *
       * @event dom-change
       */ /**
           * A boolean indicating whether this template should stamp.
           */if:{type:Boolean,observer:'__debounceRender'},/**
       * When true, elements will be removed from DOM and discarded when `if`
       * becomes false and re-created and added back to the DOM when `if`
       * becomes true.  By default, stamped elements will be hidden but left
       * in the DOM when `if` becomes false, which is generally results
       * in better performance.
       */restamp:{type:Boolean,observer:'__debounceRender'}};}constructor(){super();this.__renderDebouncer=null;this.__invalidProps=null;this.__instance=null;this._lastIf=false;this.__ctor=null;}__debounceRender(){// Render is async for 2 reasons:
// 1. To eliminate dom creation trashing if user code thrashes `if` in the
//    same turn. This was more common in 1.x where a compound computed
//    property could result in the result changing multiple times, but is
//    mitigated to a large extent by batched property processing in 2.x.
// 2. To avoid double object propagation when a bag including values bound
//    to the `if` property as well as one or more hostProps could enqueue
//    the <dom-if> to flush before the <template>'s host property
//    forwarding. In that scenario creating an instance would result in
//    the host props being set once, and then the enqueued changes on the
//    template would set properties a second time, potentially causing an
//    object to be set to an instance more than once.  Creating the
//    instance async from flushing data ensures this doesn't happen. If
//    we wanted a sync option in the future, simply having <dom-if> flush
//    (or clear) its template's pending host properties before creating
//    the instance would also avoid the problem.
this.__renderDebouncer=Debouncer.debounce(this.__renderDebouncer,microTask,()=>this.__render());enqueueDebouncer(this.__renderDebouncer);}/**
     * @return {void}
     */disconnectedCallback(){super.disconnectedCallback();if(!this.parentNode||this.parentNode.nodeType==Node.DOCUMENT_FRAGMENT_NODE&&!this.parentNode.host){this.__teardownInstance();}}/**
     * @return {void}
     */connectedCallback(){super.connectedCallback();this.style.display='none';if(this.if){this.__debounceRender();}}/**
     * Forces the element to render its content. Normally rendering is
     * asynchronous to a provoking change. This is done for efficiency so
     * that multiple changes trigger only a single render. The render method
     * should be called if, for example, template rendering is required to
     * validate application state.
     * @return {void}
     */render(){flush$1();}__render(){if(this.if){if(!this.__ensureInstance()){// No template found yet
return;}this._showHideChildren();}else if(this.restamp){this.__teardownInstance();}if(!this.restamp&&this.__instance){this._showHideChildren();}if(this.if!=this._lastIf){this.dispatchEvent(new CustomEvent('dom-change',{bubbles:true,composed:true}));this._lastIf=this.if;}}__ensureInstance(){let parentNode=this.parentNode;// Guard against element being detached while render was queued
if(parentNode){if(!this.__ctor){let template=/** @type {HTMLTemplateElement} */this.querySelector('template');if(!template){// Wait until childList changes and template should be there by then
let observer=new MutationObserver(()=>{if(this.querySelector('template')){observer.disconnect();this.__render();}else{throw new Error('dom-if requires a <template> child');}});observer.observe(this,{childList:true});return false;}this.__ctor=templatize(template,this,{// dom-if templatizer instances require `mutable: true`, as
// `__syncHostProperties` relies on that behavior to sync objects
mutableData:true,/**
           * @param {string} prop Property to forward
           * @param {*} value Value of property
           * @this {this}
           */forwardHostProp:function(prop,value){if(this.__instance){if(this.if){this.__instance.forwardHostProp(prop,value);}else{// If we have an instance but are squelching host property
// forwarding due to if being false, note the invalidated
// properties so `__syncHostProperties` can sync them the next
// time `if` becomes true
this.__invalidProps=this.__invalidProps||Object.create(null);this.__invalidProps[root(prop)]=true;}}}});}if(!this.__instance){this.__instance=new this.__ctor();parentNode.insertBefore(this.__instance.root,this);}else{this.__syncHostProperties();let c$=this.__instance.children;if(c$&&c$.length){// Detect case where dom-if was re-attached in new position
let lastChild=this.previousSibling;if(lastChild!==c$[c$.length-1]){for(let i=0,n;i<c$.length&&(n=c$[i]);i++){parentNode.insertBefore(n,this);}}}}}return true;}__syncHostProperties(){let props=this.__invalidProps;if(props){for(let prop in props){this.__instance._setPendingProperty(prop,this.__dataHost[prop]);}this.__invalidProps=null;this.__instance._flushProperties();}}__teardownInstance(){if(this.__instance){let c$=this.__instance.children;if(c$&&c$.length){// use first child parent, for case when dom-if may have been detached
let parent=c$[0].parentNode;for(let i=0,n;i<c$.length&&(n=c$[i]);i++){parent.removeChild(n);}}this.__instance=null;this.__invalidProps=null;}}/**
     * Shows or hides the template instance top level child elements. For
     * text nodes, `textContent` is removed while "hidden" and replaced when
     * "shown."
     * @return {void}
     * @protected
     */_showHideChildren(){let hidden=this.__hideTemplateChildren__||!this.if;if(this.__instance){this.__instance._showHideChildren(hidden);}}}customElements.define(DomIf.is,DomIf);var domIf={DomIf:DomIf};/**
    * Element mixin for recording dynamic associations between item paths in a
    * master `items` array and a `selected` array such that path changes to the
    * master array (at the host) element or elsewhere via data-binding) are
    * correctly propagated to items in the selected array and vice-versa.
    *
    * The `items` property accepts an array of user data, and via the
    * `select(item)` and `deselect(item)` API, updates the `selected` property
    * which may be bound to other parts of the application, and any changes to
    * sub-fields of `selected` item(s) will be kept in sync with items in the
    * `items` array.  When `multi` is false, `selected` is a property
    * representing the last selected item.  When `multi` is true, `selected`
    * is an array of multiply selected items.
    *
    * @polymer
    * @mixinFunction
    * @appliesMixin Polymer.ElementMixin
    * @memberof Polymer
    * @summary Element mixin for recording dynamic associations between item paths in a
    * master `items` array and a `selected` array
    */let ArraySelectorMixin=dedupingMixin(superClass=>{/**
   * @constructor
   * @extends {superClass}
   * @implements {Polymer_ElementMixin}
   */let elementBase=ElementMixin(superClass);/**
                                                  * @polymer
                                                  * @mixinClass
                                                  * @implements {Polymer_ArraySelectorMixin}
                                                  * @unrestricted
                                                  */class ArraySelectorMixin extends elementBase{static get properties(){return{/**
         * An array containing items from which selection will be made.
         */items:{type:Array},/**
         * When `true`, multiple items may be selected at once (in this case,
         * `selected` is an array of currently selected items).  When `false`,
         * only one item may be selected at a time.
         */multi:{type:Boolean,value:false},/**
         * When `multi` is true, this is an array that contains any selected.
         * When `multi` is false, this is the currently selected item, or `null`
         * if no item is selected.
         * @type {?(Object|Array<!Object>)}
         */selected:{type:Object,notify:true},/**
         * When `multi` is false, this is the currently selected item, or `null`
         * if no item is selected.
         * @type {?Object}
         */selectedItem:{type:Object,notify:true},/**
         * When `true`, calling `select` on an item that is already selected
         * will deselect the item.
         */toggle:{type:Boolean,value:false}};}static get observers(){return['__updateSelection(multi, items.*)'];}constructor(){super();this.__lastItems=null;this.__lastMulti=null;this.__selectedMap=null;}__updateSelection(multi,itemsInfo){let path=itemsInfo.path;if(path=='items'){// Case 1 - items array changed, so diff against previous array and
// deselect any removed items and adjust selected indices
let newItems=itemsInfo.base||[];let lastItems=this.__lastItems;let lastMulti=this.__lastMulti;if(multi!==lastMulti){this.clearSelection();}if(lastItems){let splices=calculateSplices(newItems,lastItems);this.__applySplices(splices);}this.__lastItems=newItems;this.__lastMulti=multi;}else if(itemsInfo.path=='items.splices'){// Case 2 - got specific splice information describing the array mutation:
// deselect any removed items and adjust selected indices
this.__applySplices(itemsInfo.value.indexSplices);}else{// Case 3 - an array element was changed, so deselect the previous
// item for that index if it was previously selected
let part=path.slice('items.'.length);let idx=parseInt(part,10);if(part.indexOf('.')<0&&part==idx){this.__deselectChangedIdx(idx);}}}__applySplices(splices){let selected=this.__selectedMap;// Adjust selected indices and mark removals
for(let i=0;i<splices.length;i++){let s=splices[i];selected.forEach((idx,item)=>{if(idx<s.index){// no change
}else if(idx>=s.index+s.removed.length){// adjust index
selected.set(item,idx+s.addedCount-s.removed.length);}else{// remove index
selected.set(item,-1);}});for(let j=0;j<s.addedCount;j++){let idx=s.index+j;if(selected.has(this.items[idx])){selected.set(this.items[idx],idx);}}}// Update linked paths
this.__updateLinks();// Remove selected items that were removed from the items array
let sidx=0;selected.forEach((idx,item)=>{if(idx<0){if(this.multi){this.splice('selected',sidx,1);}else{this.selected=this.selectedItem=null;}selected.delete(item);}else{sidx++;}});}__updateLinks(){this.__dataLinkedPaths={};if(this.multi){let sidx=0;this.__selectedMap.forEach(idx=>{if(idx>=0){this.linkPaths('items.'+idx,'selected.'+sidx++);}});}else{this.__selectedMap.forEach(idx=>{this.linkPaths('selected','items.'+idx);this.linkPaths('selectedItem','items.'+idx);});}}/**
       * Clears the selection state.
       * @return {void}
       */clearSelection(){// Unbind previous selection
this.__dataLinkedPaths={};// The selected map stores 3 pieces of information:
// key: items array object
// value: items array index
// order: selected array index
this.__selectedMap=new Map();// Initialize selection
this.selected=this.multi?[]:null;this.selectedItem=null;}/**
       * Returns whether the item is currently selected.
       *
       * @param {*} item Item from `items` array to test
       * @return {boolean} Whether the item is selected
       */isSelected(item){return this.__selectedMap.has(item);}/**
       * Returns whether the item is currently selected.
       *
       * @param {number} idx Index from `items` array to test
       * @return {boolean} Whether the item is selected
       */isIndexSelected(idx){return this.isSelected(this.items[idx]);}__deselectChangedIdx(idx){let sidx=this.__selectedIndexForItemIndex(idx);if(sidx>=0){let i=0;this.__selectedMap.forEach((idx,item)=>{if(sidx==i++){this.deselect(item);}});}}__selectedIndexForItemIndex(idx){let selected=this.__dataLinkedPaths['items.'+idx];if(selected){return parseInt(selected.slice('selected.'.length),10);}}/**
       * Deselects the given item if it is already selected.
       *
       * @param {*} item Item from `items` array to deselect
       * @return {void}
       */deselect(item){let idx=this.__selectedMap.get(item);if(idx>=0){this.__selectedMap.delete(item);let sidx;if(this.multi){sidx=this.__selectedIndexForItemIndex(idx);}this.__updateLinks();if(this.multi){this.splice('selected',sidx,1);}else{this.selected=this.selectedItem=null;}}}/**
       * Deselects the given index if it is already selected.
       *
       * @param {number} idx Index from `items` array to deselect
       * @return {void}
       */deselectIndex(idx){this.deselect(this.items[idx]);}/**
       * Selects the given item.  When `toggle` is true, this will automatically
       * deselect the item if already selected.
       *
       * @param {*} item Item from `items` array to select
       * @return {void}
       */select(item){this.selectIndex(this.items.indexOf(item));}/**
       * Selects the given index.  When `toggle` is true, this will automatically
       * deselect the item if already selected.
       *
       * @param {number} idx Index from `items` array to select
       * @return {void}
       */selectIndex(idx){let item=this.items[idx];if(!this.isSelected(item)){if(!this.multi){this.__selectedMap.clear();}this.__selectedMap.set(item,idx);this.__updateLinks();if(this.multi){this.push('selected',item);}else{this.selected=this.selectedItem=item;}}else if(this.toggle){this.deselectIndex(idx);}}}return ArraySelectorMixin;});/**
     * @constructor
     * @extends {Polymer.Element}
     * @implements {Polymer_ArraySelectorMixin}
     */let baseArraySelector=ArraySelectorMixin(Element$1);/**
                                                        * Element implementing the `Polymer.ArraySelector` mixin, which records
                                                        * dynamic associations between item paths in a master `items` array and a
                                                        * `selected` array such that path changes to the master array (at the host)
                                                        * element or elsewhere via data-binding) are correctly propagated to items
                                                        * in the selected array and vice-versa.
                                                        *
                                                        * The `items` property accepts an array of user data, and via the
                                                        * `select(item)` and `deselect(item)` API, updates the `selected` property
                                                        * which may be bound to other parts of the application, and any changes to
                                                        * sub-fields of `selected` item(s) will be kept in sync with items in the
                                                        * `items` array.  When `multi` is false, `selected` is a property
                                                        * representing the last selected item.  When `multi` is true, `selected`
                                                        * is an array of multiply selected items.
                                                        *
                                                        * Example:
                                                        *
                                                        * ```html
                                                        * <dom-module id="employee-list">
                                                        *
                                                        *   <template>
                                                        *
                                                        *     <div> Employee list: </div>
                                                        *     <dom-repeat id="employeeList" items="{{employees}}">
                                                        *       <template>
                                                        *         <div>First name: <span>{{item.first}}</span></div>
                                                        *           <div>Last name: <span>{{item.last}}</span></div>
                                                        *           <button on-click="toggleSelection">Select</button>
                                                        *       </template>
                                                        *     </dom-repeat>
                                                        *
                                                        *     <array-selector id="selector" items="{{employees}}" selected="{{selected}}" multi toggle></array-selector>
                                                        *
                                                        *     <div> Selected employees: </div>
                                                        *     <dom-repeat items="{{selected}}">
                                                        *       <template>
                                                        *         <div>First name: <span>{{item.first}}</span></div>
                                                        *         <div>Last name: <span>{{item.last}}</span></div>
                                                        *       </template>
                                                        *     </dom-repeat>
                                                        *
                                                        *   </template>
                                                        *
                                                        * </dom-module>
                                                        * ```
                                                        *
                                                        * ```js
                                                        *class EmployeeList extends Polymer.Element {
                                                        *  static get is() { return 'employee-list'; }
                                                        *  static get properties() {
                                                        *    return {
                                                        *      employees: {
                                                        *        value() {
                                                        *          return [
                                                        *            {first: 'Bob', last: 'Smith'},
                                                        *            {first: 'Sally', last: 'Johnson'},
                                                        *            ...
                                                        *          ];
                                                        *        }
                                                        *      }
                                                        *    };
                                                        *  }
                                                        *  toggleSelection(e) {
                                                        *    let item = this.$.employeeList.itemForElement(e.target);
                                                        *    this.$.selector.select(item);
                                                        *  }
                                                        *}
                                                        * ```
                                                        *
                                                        * @polymer
                                                        * @customElement
                                                        * @extends {baseArraySelector}
                                                        * @appliesMixin Polymer.ArraySelectorMixin
                                                        * @memberof Polymer
                                                        * @summary Custom element that links paths between an input `items` array and
                                                        *   an output `selected` item or array based on calls to its selection API.
                                                        */class ArraySelector extends baseArraySelector{// Not needed to find template; can be removed once the analyzer
// can find the tag name from customElements.define call
static get is(){return'array-selector';}}customElements.define(ArraySelector.is,ArraySelector);var arraySelector={ArraySelectorMixin:ArraySelectorMixin,ArraySelector:ArraySelector};/**
   @license
   Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */'use strict';const customStyleInterface$1=new CustomStyleInterface();if(!window.ShadyCSS){window.ShadyCSS={/**
     * @param {HTMLTemplateElement} template
     * @param {string} elementName
     * @param {string=} elementExtends
     */prepareTemplate(template,elementName,elementExtends){},// eslint-disable-line no-unused-vars
/**
     * @param {Element} element
     * @param {Object=} properties
     */styleSubtree(element,properties){customStyleInterface$1.processStyles();updateNativeProperties(element,properties);},/**
     * @param {Element} element
     */styleElement(element){// eslint-disable-line no-unused-vars
customStyleInterface$1.processStyles();},/**
     * @param {Object=} properties
     */styleDocument(properties){customStyleInterface$1.processStyles();updateNativeProperties(document.body,properties);},/**
     * @param {Element} element
     * @param {string} property
     * @return {string}
     */getComputedStyleValue(element,property){return getComputedStyleValue(element,property);},nativeCss:nativeCssVariables,nativeShadow:nativeShadow};}window.ShadyCSS.CustomStyleInterface=customStyleInterface$1;const attr='include';const CustomStyleInterface$1=window.ShadyCSS.CustomStyleInterface;/**
                                                                      * Custom element for defining styles in the main document that can take
                                                                      * advantage of [shady DOM](https://github.com/webcomponents/shadycss) shims
                                                                      * for style encapsulation, custom properties, and custom mixins.
                                                                      *
                                                                      * - Document styles defined in a `<custom-style>` are shimmed to ensure they
                                                                      *   do not leak into local DOM when running on browsers without native
                                                                      *   Shadow DOM.
                                                                      * - Custom properties can be defined in a `<custom-style>`. Use the `html` selector
                                                                      *   to define custom properties that apply to all custom elements.
                                                                      * - Custom mixins can be defined in a `<custom-style>`, if you import the optional
                                                                      *   [apply shim](https://github.com/webcomponents/shadycss#about-applyshim)
                                                                      *   (`shadycss/apply-shim.html`).
                                                                      *
                                                                      * To use:
                                                                      *
                                                                      * - Import `custom-style.html`.
                                                                      * - Place a `<custom-style>` element in the main document, wrapping an inline `<style>` tag that
                                                                      *   contains the CSS rules you want to shim.
                                                                      *
                                                                      * For example:
                                                                      *
                                                                      * ```html
                                                                      * <!-- import apply shim--only required if using mixins -->
                                                                      * <link rel="import" href="bower_components/shadycss/apply-shim.html">
                                                                      * <!-- import custom-style element -->
                                                                      * <link rel="import" href="bower_components/polymer/lib/elements/custom-style.html">
                                                                      *
                                                                      * <custom-style>
                                                                      *   <style>
                                                                      *     html {
                                                                      *       --custom-color: blue;
                                                                      *       --custom-mixin: {
                                                                      *         font-weight: bold;
                                                                      *         color: red;
                                                                      *       };
                                                                      *     }
                                                                      *   </style>
                                                                      * </custom-style>
                                                                      * ```
                                                                      *
                                                                      * @customElement
                                                                      * @extends HTMLElement
                                                                      * @memberof Polymer
                                                                      * @summary Custom element for defining styles in the main document that can
                                                                      *   take advantage of Polymer's style scoping and custom properties shims.
                                                                      */class CustomStyle extends HTMLElement{constructor(){super();this._style=null;CustomStyleInterface$1.addCustomStyle(this);}/**
     * Returns the light-DOM `<style>` child this element wraps.  Upon first
     * call any style modules referenced via the `include` attribute will be
     * concatenated to this element's `<style>`.
     *
     * @return {HTMLStyleElement} This element's light-DOM `<style>`
     */getStyle(){if(this._style){return this._style;}const style=/** @type {HTMLStyleElement} */this.querySelector('style');if(!style){return null;}this._style=style;const include=style.getAttribute(attr);if(include){style.removeAttribute(attr);style.textContent=cssFromModules(include)+style.textContent;}/*
      HTML Imports styling the main document are deprecated in Chrome
      https://crbug.com/523952
       If this element is not in the main document, then it must be in an HTML Import document.
      In that case, move the custom style to the main document.
       The ordering of `<custom-style>` should stay the same as when loaded by HTML Imports, but there may be odd
      cases of ordering w.r.t the main document styles.
      */if(this.ownerDocument!==window.document){window.document.head.appendChild(this);}return this._style;}}window.customElements.define('custom-style',CustomStyle);var customStyle={CustomStyle:CustomStyle};let mutablePropertyChange$1;/** @suppress {missingProperties} */(()=>{mutablePropertyChange$1=MutableData._mutablePropertyChange;})();const MutableDataBehavior={/**
   * Overrides `Polymer.PropertyEffects` to provide option for skipping
   * strict equality checking for Objects and Arrays.
   *
   * This method pulls the value to dirty check against from the `__dataTemp`
   * cache (rather than the normal `__data` cache) for Objects.  Since the temp
   * cache is cleared at the end of a turn, this implementation allows
   * side-effects of deep object changes to be processed by re-setting the
   * same object (using the temp cache as an in-turn backstop to prevent
   * cycles due to 2-way notification).
   *
   * @param {string} property Property name
   * @param {*} value New property value
   * @param {*} old Previous property value
   * @return {boolean} Whether the property should be considered a change
   * @protected
   */_shouldPropertyChange(property,value,old){return mutablePropertyChange$1(this,property,value,old,true);}};const OptionalMutableDataBehavior={properties:{/**
     * Instance-level flag for configuring the dirty-checking strategy
     * for this element.  When true, Objects and Arrays will skip dirty
     * checking, otherwise strict equality checking will be used.
     */mutableData:Boolean},/**
   * Overrides `Polymer.PropertyEffects` to skip strict equality checking
   * for Objects and Arrays.
   *
   * Pulls the value to dirty check against from the `__dataTemp` cache
   * (rather than the normal `__data` cache) for Objects.  Since the temp
   * cache is cleared at the end of a turn, this implementation allows
   * side-effects of deep object changes to be processed by re-setting the
   * same object (using the temp cache as an in-turn backstop to prevent
   * cycles due to 2-way notification).
   *
   * @param {string} property Property name
   * @param {*} value New property value
   * @param {*} old Previous property value
   * @return {boolean} Whether the property should be considered a change
   * @this {this}
   * @protected
   */_shouldPropertyChange(property,value,old){return mutablePropertyChange$1(this,property,value,old,this.mutableData);}};var mutableDataBehavior={MutableDataBehavior:MutableDataBehavior,OptionalMutableDataBehavior:OptionalMutableDataBehavior};const Base=LegacyElementMixin(HTMLElement).prototype;var polymerLegacy={Base:Base,html:html};const IronA11yAnnouncer=Polymer({_template:html`
    <style>
      :host {
        display: inline-block;
        position: fixed;
        clip: rect(0px,0px,0px,0px);
      }
    </style>
    <div aria-live\$="[[mode]]">[[_text]]</div>
`,is:'iron-a11y-announcer',properties:{/**
     * The value of mode is used to set the `aria-live` attribute
     * for the element that will be announced. Valid values are: `off`,
     * `polite` and `assertive`.
     */mode:{type:String,value:'polite'},_text:{type:String,value:''}},created:function(){if(!IronA11yAnnouncer.instance){IronA11yAnnouncer.instance=this;}document.body.addEventListener('iron-announce',this._onIronAnnounce.bind(this));},/**
   * Cause a text string to be announced by screen readers.
   *
   * @param {string} text The text that should be announced.
   */announce:function(text){this._text='';this.async(function(){this._text=text;},100);},_onIronAnnounce:function(event){if(event.detail&&event.detail.text){this.announce(event.detail.text);}}});IronA11yAnnouncer.instance=null;IronA11yAnnouncer.requestAvailability=function(){if(!IronA11yAnnouncer.instance){IronA11yAnnouncer.instance=document.createElement('iron-a11y-announcer');}document.body.appendChild(IronA11yAnnouncer.instance);};var ironA11yAnnouncer={IronA11yAnnouncer:IronA11yAnnouncer};/**
    * Chrome uses an older version of DOM Level 3 Keyboard Events
    *
    * Most keys are labeled as text, but some are Unicode codepoints.
    * Values taken from: http://www.w3.org/TR/2007/WD-DOM-Level-3-Events-20071221/keyset.html#KeySet-Set
    */var KEY_IDENTIFIER={'U+0008':'backspace','U+0009':'tab','U+001B':'esc','U+0020':'space','U+007F':'del'};/**
    * Special table for KeyboardEvent.keyCode.
    * KeyboardEvent.keyIdentifier is better, and KeyBoardEvent.key is even better
    * than that.
    *
    * Values from: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent.keyCode#Value_of_keyCode
    */var KEY_CODE={8:'backspace',9:'tab',13:'enter',27:'esc',33:'pageup',34:'pagedown',35:'end',36:'home',32:'space',37:'left',38:'up',39:'right',40:'down',46:'del',106:'*'};/**
    * MODIFIER_KEYS maps the short name for modifier keys used in a key
    * combo string to the property name that references those same keys
    * in a KeyboardEvent instance.
    */var MODIFIER_KEYS={'shift':'shiftKey','ctrl':'ctrlKey','alt':'altKey','meta':'metaKey'};/**
    * KeyboardEvent.key is mostly represented by printable character made by
    * the keyboard, with unprintable keys labeled nicely.
    *
    * However, on OS X, Alt+char can make a Unicode character that follows an
    * Apple-specific mapping. In this case, we fall back to .keyCode.
    */var KEY_CHAR=/[a-z0-9*]/;/**
                             * Matches a keyIdentifier string.
                             */var IDENT_CHAR=/U\+/;/**
                         * Matches arrow keys in Gecko 27.0+
                         */var ARROW_KEY=/^arrow/;/**
                           * Matches space keys everywhere (notably including IE10's exceptional name
                           * `spacebar`).
                           */var SPACE_KEY=/^space(bar)?/;/**
                                 * Matches ESC key.
                                 *
                                 * Value from: http://w3c.github.io/uievents-key/#key-Escape
                                 */var ESC_KEY=/^escape$/;/**
                           * Transforms the key.
                           * @param {string} key The KeyBoardEvent.key
                           * @param {Boolean} [noSpecialChars] Limits the transformation to
                           * alpha-numeric characters.
                           */function transformKey(key,noSpecialChars){var validKey='';if(key){var lKey=key.toLowerCase();if(lKey===' '||SPACE_KEY.test(lKey)){validKey='space';}else if(ESC_KEY.test(lKey)){validKey='esc';}else if(lKey.length==1){if(!noSpecialChars||KEY_CHAR.test(lKey)){validKey=lKey;}}else if(ARROW_KEY.test(lKey)){validKey=lKey.replace('arrow','');}else if(lKey=='multiply'){// numpad '*' can map to Multiply on IE/Windows
validKey='*';}else{validKey=lKey;}}return validKey;}function transformKeyIdentifier(keyIdent){var validKey='';if(keyIdent){if(keyIdent in KEY_IDENTIFIER){validKey=KEY_IDENTIFIER[keyIdent];}else if(IDENT_CHAR.test(keyIdent)){keyIdent=parseInt(keyIdent.replace('U+','0x'),16);validKey=String.fromCharCode(keyIdent).toLowerCase();}else{validKey=keyIdent.toLowerCase();}}return validKey;}function transformKeyCode(keyCode){var validKey='';if(Number(keyCode)){if(keyCode>=65&&keyCode<=90){// ascii a-z
// lowercase is 32 offset from uppercase
validKey=String.fromCharCode(32+keyCode);}else if(keyCode>=112&&keyCode<=123){// function keys f1-f12
validKey='f'+(keyCode-112+1);}else if(keyCode>=48&&keyCode<=57){// top 0-9 keys
validKey=String(keyCode-48);}else if(keyCode>=96&&keyCode<=105){// num pad 0-9
validKey=String(keyCode-96);}else{validKey=KEY_CODE[keyCode];}}return validKey;}/**
    * Calculates the normalized key for a KeyboardEvent.
    * @param {KeyboardEvent} keyEvent
    * @param {Boolean} [noSpecialChars] Set to true to limit keyEvent.key
    * transformation to alpha-numeric chars. This is useful with key
    * combinations like shift + 2, which on FF for MacOS produces
    * keyEvent.key = @
    * To get 2 returned, set noSpecialChars = true
    * To get @ returned, set noSpecialChars = false
   */function normalizedKeyForEvent(keyEvent,noSpecialChars){// Fall back from .key, to .detail.key for artifical keyboard events,
// and then to deprecated .keyIdentifier and .keyCode.
if(keyEvent.key){return transformKey(keyEvent.key,noSpecialChars);}if(keyEvent.detail&&keyEvent.detail.key){return transformKey(keyEvent.detail.key,noSpecialChars);}return transformKeyIdentifier(keyEvent.keyIdentifier)||transformKeyCode(keyEvent.keyCode)||'';}function keyComboMatchesEvent(keyCombo,event){// For combos with modifiers we support only alpha-numeric keys
var keyEvent=normalizedKeyForEvent(event,keyCombo.hasModifiers);return keyEvent===keyCombo.key&&(!keyCombo.hasModifiers||!!event.shiftKey===!!keyCombo.shiftKey&&!!event.ctrlKey===!!keyCombo.ctrlKey&&!!event.altKey===!!keyCombo.altKey&&!!event.metaKey===!!keyCombo.metaKey);}function parseKeyComboString(keyComboString){if(keyComboString.length===1){return{combo:keyComboString,key:keyComboString,event:'keydown'};}return keyComboString.split('+').reduce(function(parsedKeyCombo,keyComboPart){var eventParts=keyComboPart.split(':');var keyName=eventParts[0];var event=eventParts[1];if(keyName in MODIFIER_KEYS){parsedKeyCombo[MODIFIER_KEYS[keyName]]=true;parsedKeyCombo.hasModifiers=true;}else{parsedKeyCombo.key=keyName;parsedKeyCombo.event=event||'keydown';}return parsedKeyCombo;},{combo:keyComboString.split(':').shift()});}function parseEventString(eventString){return eventString.trim().split(' ').map(function(keyComboString){return parseKeyComboString(keyComboString);});}const IronA11yKeysBehavior={properties:{/**
     * The EventTarget that will be firing relevant KeyboardEvents. Set it to
     * `null` to disable the listeners.
     * @type {?EventTarget}
     */keyEventTarget:{type:Object,value:function(){return this;}},/**
     * If true, this property will cause the implementing element to
     * automatically stop propagation on any handled KeyboardEvents.
     */stopKeyboardEventPropagation:{type:Boolean,value:false},_boundKeyHandlers:{type:Array,value:function(){return[];}},// We use this due to a limitation in IE10 where instances will have
// own properties of everything on the "prototype".
_imperativeKeyBindings:{type:Object,value:function(){return{};}}},observers:['_resetKeyEventListeners(keyEventTarget, _boundKeyHandlers)'],/**
   * To be used to express what combination of keys  will trigger the relative
   * callback. e.g. `keyBindings: { 'esc': '_onEscPressed'}`
   * @type {!Object}
   */keyBindings:{},registered:function(){this._prepKeyBindings();},attached:function(){this._listenKeyEventListeners();},detached:function(){this._unlistenKeyEventListeners();},/**
   * Can be used to imperatively add a key binding to the implementing
   * element. This is the imperative equivalent of declaring a keybinding
   * in the `keyBindings` prototype property.
   *
   * @param {string} eventString
   * @param {string} handlerName
   */addOwnKeyBinding:function(eventString,handlerName){this._imperativeKeyBindings[eventString]=handlerName;this._prepKeyBindings();this._resetKeyEventListeners();},/**
   * When called, will remove all imperatively-added key bindings.
   */removeOwnKeyBindings:function(){this._imperativeKeyBindings={};this._prepKeyBindings();this._resetKeyEventListeners();},/**
   * Returns true if a keyboard event matches `eventString`.
   *
   * @param {KeyboardEvent} event
   * @param {string} eventString
   * @return {boolean}
   */keyboardEventMatchesKeys:function(event,eventString){var keyCombos=parseEventString(eventString);for(var i=0;i<keyCombos.length;++i){if(keyComboMatchesEvent(keyCombos[i],event)){return true;}}return false;},_collectKeyBindings:function(){var keyBindings=this.behaviors.map(function(behavior){return behavior.keyBindings;});if(keyBindings.indexOf(this.keyBindings)===-1){keyBindings.push(this.keyBindings);}return keyBindings;},_prepKeyBindings:function(){this._keyBindings={};this._collectKeyBindings().forEach(function(keyBindings){for(var eventString in keyBindings){this._addKeyBinding(eventString,keyBindings[eventString]);}},this);for(var eventString in this._imperativeKeyBindings){this._addKeyBinding(eventString,this._imperativeKeyBindings[eventString]);}// Give precedence to combos with modifiers to be checked first.
for(var eventName in this._keyBindings){this._keyBindings[eventName].sort(function(kb1,kb2){var b1=kb1[0].hasModifiers;var b2=kb2[0].hasModifiers;return b1===b2?0:b1?-1:1;});}},_addKeyBinding:function(eventString,handlerName){parseEventString(eventString).forEach(function(keyCombo){this._keyBindings[keyCombo.event]=this._keyBindings[keyCombo.event]||[];this._keyBindings[keyCombo.event].push([keyCombo,handlerName]);},this);},_resetKeyEventListeners:function(){this._unlistenKeyEventListeners();if(this.isAttached){this._listenKeyEventListeners();}},_listenKeyEventListeners:function(){if(!this.keyEventTarget){return;}Object.keys(this._keyBindings).forEach(function(eventName){var keyBindings=this._keyBindings[eventName];var boundKeyHandler=this._onKeyBindingEvent.bind(this,keyBindings);this._boundKeyHandlers.push([this.keyEventTarget,eventName,boundKeyHandler]);this.keyEventTarget.addEventListener(eventName,boundKeyHandler);},this);},_unlistenKeyEventListeners:function(){var keyHandlerTuple;var keyEventTarget;var eventName;var boundKeyHandler;while(this._boundKeyHandlers.length){// My kingdom for block-scope binding and destructuring assignment..
keyHandlerTuple=this._boundKeyHandlers.pop();keyEventTarget=keyHandlerTuple[0];eventName=keyHandlerTuple[1];boundKeyHandler=keyHandlerTuple[2];keyEventTarget.removeEventListener(eventName,boundKeyHandler);}},_onKeyBindingEvent:function(keyBindings,event){if(this.stopKeyboardEventPropagation){event.stopPropagation();}// if event has been already prevented, don't do anything
if(event.defaultPrevented){return;}for(var i=0;i<keyBindings.length;i++){var keyCombo=keyBindings[i][0];var handlerName=keyBindings[i][1];if(keyComboMatchesEvent(keyCombo,event)){this._triggerKeyHandler(keyCombo,handlerName,event);// exit the loop if eventDefault was prevented
if(event.defaultPrevented){return;}}}},_triggerKeyHandler:function(keyCombo,handlerName,keyboardEvent){var detail=Object.create(keyCombo);detail.keyboardEvent=keyboardEvent;var event=new CustomEvent(keyCombo.event,{detail:detail,cancelable:true});this[handlerName].call(this,event);if(event.defaultPrevented){keyboardEvent.preventDefault();}}};var ironA11yKeysBehavior={IronA11yKeysBehavior:IronA11yKeysBehavior};/**
   @license
   Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */ /*
      iron-request can be used to perform XMLHttpRequests.
      
          <iron-request id="xhr"></iron-request>
          ...
          this.$.xhr.send({url: url, body: params});
      */Polymer({is:'iron-request',hostAttributes:{hidden:true},properties:{/**
     * A reference to the XMLHttpRequest instance used to generate the
     * network request.
     *
     * @type {XMLHttpRequest}
     */xhr:{type:Object,notify:true,readOnly:true,value:function(){return new XMLHttpRequest();}},/**
     * A reference to the parsed response body, if the `xhr` has completely
     * resolved.
     *
     * @type {*}
     * @default null
     */response:{type:Object,notify:true,readOnly:true,value:function(){return null;}},/**
     * A reference to the status code, if the `xhr` has completely resolved.
     */status:{type:Number,notify:true,readOnly:true,value:0},/**
     * A reference to the status text, if the `xhr` has completely resolved.
     */statusText:{type:String,notify:true,readOnly:true,value:''},/**
     * A promise that resolves when the `xhr` response comes back, or rejects
     * if there is an error before the `xhr` completes.
     * The resolve callback is called with the original request as an argument.
     * By default, the reject callback is called with an `Error` as an argument.
     * If `rejectWithRequest` is true, the reject callback is called with an
     * object with two keys: `request`, the original request, and `error`, the
     * error object.
     *
     * @type {Promise}
     */completes:{type:Object,readOnly:true,notify:true,value:function(){return new Promise(function(resolve,reject){this.resolveCompletes=resolve;this.rejectCompletes=reject;}.bind(this));}},/**
     * An object that contains progress information emitted by the XHR if
     * available.
     *
     * @default {}
     */progress:{type:Object,notify:true,readOnly:true,value:function(){return{};}},/**
     * Aborted will be true if an abort of the request is attempted.
     */aborted:{type:Boolean,notify:true,readOnly:true,value:false},/**
     * Errored will be true if the browser fired an error event from the
     * XHR object (mainly network errors).
     */errored:{type:Boolean,notify:true,readOnly:true,value:false},/**
     * TimedOut will be true if the XHR threw a timeout event.
     */timedOut:{type:Boolean,notify:true,readOnly:true,value:false}},/**
   * Succeeded is true if the request succeeded. The request succeeded if it
   * loaded without error, wasn't aborted, and the status code is ≥ 200, and
   * < 300, or if the status code is 0.
   *
   * The status code 0 is accepted as a success because some schemes - e.g.
   * file:// - don't provide status codes.
   *
   * @return {boolean}
   */get succeeded(){if(this.errored||this.aborted||this.timedOut){return false;}var status=this.xhr.status||0;// Note: if we are using the file:// protocol, the status code will be 0
// for all outcomes (successful or otherwise).
return status===0||status>=200&&status<300;},/**
   * Sends an HTTP request to the server and returns a promise (see the `completes`
   * property for details).
   *
   * The handling of the `body` parameter will vary based on the Content-Type
   * header. See the docs for iron-ajax's `body` property for details.
   *
   * @param {{
   *   url: string,
   *   method: (string|undefined),
   *   async: (boolean|undefined),
   *   body: (ArrayBuffer|ArrayBufferView|Blob|Document|FormData|null|string|undefined|Object),
   *   headers: (Object|undefined),
   *   handleAs: (string|undefined),
   *   jsonPrefix: (string|undefined),
   *   withCredentials: (boolean|undefined),
   *   timeout: (Number|undefined),
   *   rejectWithRequest: (boolean|undefined)}} options -
   *   - url The url to which the request is sent.
   *   - method The HTTP method to use, default is GET.
   *   - async By default, all requests are sent asynchronously. To send synchronous requests,
   *         set to false.
   *   -  body The content for the request body for POST method.
   *   -  headers HTTP request headers.
   *   -  handleAs The response type. Default is 'text'.
   *   -  withCredentials Whether or not to send credentials on the request. Default is false.
   *   -  timeout - Timeout for request, in milliseconds.
   *   -  rejectWithRequest Set to true to include the request object with promise rejections.
   * @return {Promise}
   */send:function(options){var xhr=this.xhr;if(xhr.readyState>0){return null;}xhr.addEventListener('progress',function(progress){this._setProgress({lengthComputable:progress.lengthComputable,loaded:progress.loaded,total:progress.total});// Webcomponents v1 spec does not fire *-changed events when not connected
this.fire('iron-request-progress-changed',{value:this.progress});}.bind(this));xhr.addEventListener('error',function(error){this._setErrored(true);this._updateStatus();var response=options.rejectWithRequest?{error:error,request:this}:error;this.rejectCompletes(response);}.bind(this));xhr.addEventListener('timeout',function(error){this._setTimedOut(true);this._updateStatus();var response=options.rejectWithRequest?{error:error,request:this}:error;this.rejectCompletes(response);}.bind(this));xhr.addEventListener('abort',function(){this._setAborted(true);this._updateStatus();var error=new Error('Request aborted.');var response=options.rejectWithRequest?{error:error,request:this}:error;this.rejectCompletes(response);}.bind(this));// Called after all of the above.
xhr.addEventListener('loadend',function(){this._updateStatus();this._setResponse(this.parseResponse());if(!this.succeeded){var error=new Error('The request failed with status code: '+this.xhr.status);var response=options.rejectWithRequest?{error:error,request:this}:error;this.rejectCompletes(response);return;}this.resolveCompletes(this);}.bind(this));this.url=options.url;var isXHRAsync=options.async!==false;xhr.open(options.method||'GET',options.url,isXHRAsync);var acceptType={'json':'application/json','text':'text/plain','html':'text/html','xml':'application/xml','arraybuffer':'application/octet-stream'}[options.handleAs];var headers=options.headers||Object.create(null);var newHeaders=Object.create(null);for(var key in headers){newHeaders[key.toLowerCase()]=headers[key];}headers=newHeaders;if(acceptType&&!headers['accept']){headers['accept']=acceptType;}Object.keys(headers).forEach(function(requestHeader){if(/[A-Z]/.test(requestHeader)){Base._error('Headers must be lower case, got',requestHeader);}xhr.setRequestHeader(requestHeader,headers[requestHeader]);},this);if(isXHRAsync){xhr.timeout=options.timeout;var handleAs=options.handleAs;// If a JSON prefix is present, the responseType must be 'text' or the
// browser won’t be able to parse the response.
if(!!options.jsonPrefix||!handleAs){handleAs='text';}// In IE, `xhr.responseType` is an empty string when the response
// returns. Hence, caching it as `xhr._responseType`.
xhr.responseType=xhr._responseType=handleAs;// Cache the JSON prefix, if it exists.
if(!!options.jsonPrefix){xhr._jsonPrefix=options.jsonPrefix;}}xhr.withCredentials=!!options.withCredentials;var body=this._encodeBodyObject(options.body,headers['content-type']);xhr.send(/** @type {ArrayBuffer|ArrayBufferView|Blob|Document|FormData|
                         null|string|undefined} */body);return this.completes;},/**
   * Attempts to parse the response body of the XHR. If parsing succeeds,
   * the value returned will be deserialized based on the `responseType`
   * set on the XHR.
   *
   * @return {*} The parsed response,
   * or undefined if there was an empty response or parsing failed.
   */parseResponse:function(){var xhr=this.xhr;var responseType=xhr.responseType||xhr._responseType;var preferResponseText=!this.xhr.responseType;var prefixLen=xhr._jsonPrefix&&xhr._jsonPrefix.length||0;try{switch(responseType){case'json':// If the xhr object doesn't have a natural `xhr.responseType`,
// we can assume that the browser hasn't parsed the response for us,
// and so parsing is our responsibility. Likewise if response is
// undefined, as there's no way to encode undefined in JSON.
if(preferResponseText||xhr.response===undefined){// Try to emulate the JSON section of the response body section of
// the spec: https://xhr.spec.whatwg.org/#response-body
// That is to say, we try to parse as JSON, but if anything goes
// wrong return null.
try{return JSON.parse(xhr.responseText);}catch(_){console.warn('Failed to parse JSON sent from '+xhr.responseURL);return null;}}return xhr.response;case'xml':return xhr.responseXML;case'blob':case'document':case'arraybuffer':return xhr.response;case'text':default:{// If `prefixLen` is set, it implies the response should be parsed
// as JSON once the prefix of length `prefixLen` is stripped from
// it. Emulate the behavior above where null is returned on failure
// to parse.
if(prefixLen){try{return JSON.parse(xhr.responseText.substring(prefixLen));}catch(_){console.warn('Failed to parse JSON sent from '+xhr.responseURL);return null;}}return xhr.responseText;}}}catch(e){this.rejectCompletes(new Error('Could not parse response. '+e.message));}},/**
   * Aborts the request.
   */abort:function(){this._setAborted(true);this.xhr.abort();},/**
   * @param {*} body The given body of the request to try and encode.
   * @param {?string} contentType The given content type, to infer an encoding
   *     from.
   * @return {*} Either the encoded body as a string, if successful,
   *     or the unaltered body object if no encoding could be inferred.
   */_encodeBodyObject:function(body,contentType){if(typeof body=='string'){return body;// Already encoded.
}var bodyObj=/** @type {Object} */body;switch(contentType){case'application/json':return JSON.stringify(bodyObj);case'application/x-www-form-urlencoded':return this._wwwFormUrlEncode(bodyObj);}return body;},/**
   * @param {Object} object The object to encode as x-www-form-urlencoded.
   * @return {string} .
   */_wwwFormUrlEncode:function(object){if(!object){return'';}var pieces=[];Object.keys(object).forEach(function(key){// TODO(rictic): handle array values here, in a consistent way with
//   iron-ajax params.
pieces.push(this._wwwFormUrlEncodePiece(key)+'='+this._wwwFormUrlEncodePiece(object[key]));},this);return pieces.join('&');},/**
   * @param {*} str A key or value to encode as x-www-form-urlencoded.
   * @return {string} .
   */_wwwFormUrlEncodePiece:function(str){// Spec says to normalize newlines to \r\n and replace %20 spaces with +.
// jQuery does this as well, so this is likely to be widely compatible.
if(str===null||str===undefined||!str.toString){return'';}return encodeURIComponent(str.toString().replace(/\r?\n/g,'\r\n')).replace(/%20/g,'+');},/**
   * Updates the status code and status text.
   */_updateStatus:function(){this._setStatus(this.xhr.status);this._setStatusText(this.xhr.statusText===undefined?'':this.xhr.statusText);}});/**
    @license
    Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
    This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
    The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
    The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
    Code distributed by Google as part of the polymer project is also
    subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
    */ /**
       The `iron-ajax` element exposes network request functionality.
       
           <iron-ajax
               auto
               url="https://www.googleapis.com/youtube/v3/search"
               params='{"part":"snippet", "q":"polymer", "key": "YOUTUBE_API_KEY", "type": "video"}'
               handle-as="json"
               on-response="handleResponse"
               debounce-duration="300"></iron-ajax>
       
       With `auto` set to `true`, the element performs a request whenever
       its `url`, `params` or `body` properties are changed. Automatically generated
       requests will be debounced in the case that multiple attributes are changed
       sequentially.
       
       Note: The `params` attribute must be double quoted JSON.
       
       You can trigger a request explicitly by calling `generateRequest` on the
       element.
       
       @demo demo/index.html
       @hero hero.svg
       */Polymer({is:'iron-ajax',/**
   * Fired before a request is sent.
   *
   * @event iron-ajax-presend
   */ /**
       * Fired when a request is sent.
       *
       * @event request
       */ /**
           * Fired when a request is sent.
           *
           * @event iron-ajax-request
           */ /**
               * Fired when a response is received.
               *
               * @event response
               */ /**
                   * Fired when a response is received.
                   *
                   * @event iron-ajax-response
                   */ /**
                       * Fired when an error is received.
                       *
                       * @event error
                       */ /**
                           * Fired when an error is received.
                           *
                           * @event iron-ajax-error
                           */hostAttributes:{hidden:true},properties:{/**
     * The URL target of the request.
     */url:{type:String},/**
     * An object that contains query parameters to be appended to the
     * specified `url` when generating a request. If you wish to set the body
     * content when making a POST request, you should use the `body` property
     * instead.
     */params:{type:Object,value:function(){return{};}},/**
     * The HTTP method to use such as 'GET', 'POST', 'PUT', or 'DELETE'.
     * Default is 'GET'.
     */method:{type:String,value:'GET'},/**
     * HTTP request headers to send.
     *
     * Example:
     *
     *     <iron-ajax
     *         auto
     *         url="http://somesite.com"
     *         headers='{"X-Requested-With": "XMLHttpRequest"}'
     *         handle-as="json"></iron-ajax>
     *
     * Note: setting a `Content-Type` header here will override the value
     * specified by the `contentType` property of this element.
     */headers:{type:Object,value:function(){return{};}},/**
     * Content type to use when sending data. If the `contentType` property
     * is set and a `Content-Type` header is specified in the `headers`
     * property, the `headers` property value will take precedence.
     *
     * Varies the handling of the `body` param.
     */contentType:{type:String,value:null},/**
     * Body content to send with the request, typically used with "POST"
     * requests.
     *
     * If body is a string it will be sent unmodified.
     *
     * If Content-Type is set to a value listed below, then
     * the body will be encoded accordingly.
     *
     *    * `content-type="application/json"`
     *      * body is encoded like `{"foo":"bar baz","x":1}`
     *    * `content-type="application/x-www-form-urlencoded"`
     *      * body is encoded like `foo=bar+baz&x=1`
     *
     * Otherwise the body will be passed to the browser unmodified, and it
     * will handle any encoding (e.g. for FormData, Blob, ArrayBuffer).
     *
     * @type (ArrayBuffer|ArrayBufferView|Blob|Document|FormData|null|string|undefined|Object)
     */body:{type:Object,value:null},/**
     * Toggle whether XHR is synchronous or asynchronous. Don't change this
     * to true unless You Know What You Are Doing™.
     */sync:{type:Boolean,value:false},/**
     * Specifies what data to store in the `response` property, and
     * to deliver as `event.detail.response` in `response` events.
     *
     * One of:
     *
     *    `text`: uses `XHR.responseText`.
     *
     *    `xml`: uses `XHR.responseXML`.
     *
     *    `json`: uses `XHR.responseText` parsed as JSON.
     *
     *    `arraybuffer`: uses `XHR.response`.
     *
     *    `blob`: uses `XHR.response`.
     *
     *    `document`: uses `XHR.response`.
     */handleAs:{type:String,value:'json'},/**
     * Set the withCredentials flag on the request.
     */withCredentials:{type:Boolean,value:false},/**
     * Set the timeout flag on the request.
     */timeout:{type:Number,value:0},/**
     * If true, automatically performs an Ajax request when either `url` or
     * `params` changes.
     */auto:{type:Boolean,value:false},/**
     * If true, error messages will automatically be logged to the console.
     */verbose:{type:Boolean,value:false},/**
     * The most recent request made by this iron-ajax element.
     *
     * @type {Object|undefined}
     */lastRequest:{type:Object,notify:true,readOnly:true},/**
     * The `progress` property of this element's `lastRequest`.
     *
     * @type {Object|undefined}
     */lastProgress:{type:Object,notify:true,readOnly:true},/**
     * True while lastRequest is in flight.
     */loading:{type:Boolean,notify:true,readOnly:true},/**
     * lastRequest's response.
     *
     * Note that lastResponse and lastError are set when lastRequest finishes,
     * so if loading is true, then lastResponse and lastError will correspond
     * to the result of the previous request.
     *
     * The type of the response is determined by the value of `handleAs` at
     * the time that the request was generated.
     *
     * @type {Object}
     */lastResponse:{type:Object,notify:true,readOnly:true},/**
     * lastRequest's error, if any.
     *
     * @type {Object}
     */lastError:{type:Object,notify:true,readOnly:true},/**
     * An Array of all in-flight requests originating from this iron-ajax
     * element.
     */activeRequests:{type:Array,notify:true,readOnly:true,value:function(){return[];}},/**
     * Length of time in milliseconds to debounce multiple automatically generated requests.
     */debounceDuration:{type:Number,value:0,notify:true},/**
     * Prefix to be stripped from a JSON response before parsing it.
     *
     * In order to prevent an attack using CSRF with Array responses
     * (http://haacked.com/archive/2008/11/20/anatomy-of-a-subtle-json-vulnerability.aspx/)
     * many backends will mitigate this by prefixing all JSON response bodies
     * with a string that would be nonsensical to a JavaScript parser.
     *
     */jsonPrefix:{type:String,value:''},/**
     * By default, iron-ajax's events do not bubble. Setting this attribute will cause its
     * request and response events as well as its iron-ajax-request, -response,  and -error
     * events to bubble to the window object. The vanilla error event never bubbles when
     * using shadow dom even if this.bubbles is true because a scoped flag is not passed with
     * it (first link) and because the shadow dom spec did not used to allow certain events,
     * including events named error, to leak outside of shadow trees (second link).
     * https://www.w3.org/TR/shadow-dom/#scoped-flag
     * https://www.w3.org/TR/2015/WD-shadow-dom-20151215/#events-that-are-not-leaked-into-ancestor-trees
     */bubbles:{type:Boolean,value:false},/**
     * Changes the [`completes`](iron-request#property-completes) promise chain 
     * from `generateRequest` to reject with an object
     * containing the original request, as well an error message.
     * If false (default), the promise rejects with an error message only.
     */rejectWithRequest:{type:Boolean,value:false},_boundHandleResponse:{type:Function,value:function(){return this._handleResponse.bind(this);}}},observers:['_requestOptionsChanged(url, method, params.*, headers, contentType, '+'body, sync, handleAs, jsonPrefix, withCredentials, timeout, auto)'],created:function(){this._boundOnProgressChanged=this._onProgressChanged.bind(this);},/**
   * The query string that should be appended to the `url`, serialized from
   * the current value of `params`.
   *
   * @return {string}
   */get queryString(){var queryParts=[];var param;var value;for(param in this.params){value=this.params[param];param=window.encodeURIComponent(param);if(Array.isArray(value)){for(var i=0;i<value.length;i++){queryParts.push(param+'='+window.encodeURIComponent(value[i]));}}else if(value!==null){queryParts.push(param+'='+window.encodeURIComponent(value));}else{queryParts.push(param);}}return queryParts.join('&');},/**
   * The `url` with query string (if `params` are specified), suitable for
   * providing to an `iron-request` instance.
   *
   * @return {string}
   */get requestUrl(){var queryString=this.queryString;var url=this.url||'';if(queryString){var bindingChar=url.indexOf('?')>=0?'&':'?';return url+bindingChar+queryString;}return url;},/**
   * An object that maps header names to header values, first applying the
   * the value of `Content-Type` and then overlaying the headers specified
   * in the `headers` property.
   *
   * @return {Object}
   */get requestHeaders(){var headers={};var contentType=this.contentType;if(contentType==null&&typeof this.body==='string'){contentType='application/x-www-form-urlencoded';}if(contentType){headers['content-type']=contentType;}var header;if(typeof this.headers==='object'){for(header in this.headers){headers[header]=this.headers[header].toString();}}return headers;},_onProgressChanged:function(event){this._setLastProgress(event.detail.value);},/**
   * Request options suitable for generating an `iron-request` instance based
   * on the current state of the `iron-ajax` instance's properties.
   *
   * @return {{
   *   url: string,
   *   method: (string|undefined),
   *   async: (boolean|undefined),
   *   body: (ArrayBuffer|ArrayBufferView|Blob|Document|FormData|null|string|undefined|Object),
   *   headers: (Object|undefined),
   *   handleAs: (string|undefined),
   *   jsonPrefix: (string|undefined),
   *   withCredentials: (boolean|undefined)}}
   */toRequestOptions:function(){return{url:this.requestUrl||'',method:this.method,headers:this.requestHeaders,body:this.body,async:!this.sync,handleAs:this.handleAs,jsonPrefix:this.jsonPrefix,withCredentials:this.withCredentials,timeout:this.timeout,rejectWithRequest:this.rejectWithRequest};},/**
   * Performs an AJAX request to the specified URL.
   *
   * @return {!IronRequestElement}
   */generateRequest:function(){var request=/** @type {!IronRequestElement} */document.createElement('iron-request');var requestOptions=this.toRequestOptions();this.push('activeRequests',request);request.completes.then(this._boundHandleResponse).catch(this._handleError.bind(this,request)).then(this._discardRequest.bind(this,request));var evt=this.fire('iron-ajax-presend',{request:request,options:requestOptions},{bubbles:this.bubbles,cancelable:true});if(evt.defaultPrevented){request.abort();request.rejectCompletes(request);return request;}if(this.lastRequest){this.lastRequest.removeEventListener('iron-request-progress-changed',this._boundOnProgressChanged);}request.addEventListener('iron-request-progress-changed',this._boundOnProgressChanged);request.send(requestOptions);this._setLastProgress(null);this._setLastRequest(request);this._setLoading(true);this.fire('request',{request:request,options:requestOptions},{bubbles:this.bubbles,composed:true});this.fire('iron-ajax-request',{request:request,options:requestOptions},{bubbles:this.bubbles,composed:true});return request;},_handleResponse:function(request){if(request===this.lastRequest){this._setLastResponse(request.response);this._setLastError(null);this._setLoading(false);}this.fire('response',request,{bubbles:this.bubbles,composed:true});this.fire('iron-ajax-response',request,{bubbles:this.bubbles,composed:true});},_handleError:function(request,error){if(this.verbose){Base._error(error);}if(request===this.lastRequest){this._setLastError({request:request,error:error,status:request.xhr.status,statusText:request.xhr.statusText,response:request.xhr.response});this._setLastResponse(null);this._setLoading(false);}// Tests fail if this goes after the normal this.fire('error', ...)
this.fire('iron-ajax-error',{request:request,error:error},{bubbles:this.bubbles,composed:true});this.fire('error',{request:request,error:error},{bubbles:this.bubbles,composed:true});},_discardRequest:function(request){var requestIndex=this.activeRequests.indexOf(request);if(requestIndex>-1){this.splice('activeRequests',requestIndex,1);}},_requestOptionsChanged:function(){this.debounce('generate-request',function(){if(this.url==null){return;}if(this.auto){this.generateRequest();}},this.debounceDuration);}});const IronControlState={properties:{/**
     * If true, the element currently has focus.
     */focused:{type:Boolean,value:false,notify:true,readOnly:true,reflectToAttribute:true},/**
     * If true, the user cannot interact with this element.
     */disabled:{type:Boolean,value:false,notify:true,observer:'_disabledChanged',reflectToAttribute:true},/**
     * Value of the `tabindex` attribute before `disabled` was activated.
     * `null` means the attribute was not present.
     * @type {?string|undefined}
     */_oldTabIndex:{type:String},_boundFocusBlurHandler:{type:Function,value:function(){return this._focusBlurHandler.bind(this);}},__handleEventRetargeting:{type:Boolean,value:function(){return!this.shadowRoot&&!Element$1;}}},observers:['_changedControlState(focused, disabled)'],/**
   * @return {void}
   */ready:function(){this.addEventListener('focus',this._boundFocusBlurHandler,true);this.addEventListener('blur',this._boundFocusBlurHandler,true);},_focusBlurHandler:function(event){// In Polymer 2.0, the library takes care of retargeting events.
if(Element$1){this._setFocused(event.type==='focus');return;}// NOTE(cdata):  if we are in ShadowDOM land, `event.target` will
// eventually become `this` due to retargeting; if we are not in
// ShadowDOM land, `event.target` will eventually become `this` due
// to the second conditional which fires a synthetic event (that is also
// handled). In either case, we can disregard `event.path`.
if(event.target===this){this._setFocused(event.type==='focus');}else if(this.__handleEventRetargeting){var target=/** @type {Node} */dom(event).localTarget;if(!this.isLightDescendant(target)){this.fire(event.type,{sourceEvent:event},{node:this,bubbles:event.bubbles,cancelable:event.cancelable});}}},_disabledChanged:function(disabled,old){this.setAttribute('aria-disabled',disabled?'true':'false');this.style.pointerEvents=disabled?'none':'';if(disabled){// Read the `tabindex` attribute instead of the `tabIndex` property.
// The property returns `-1` if there is no `tabindex` attribute.
// This distinction is important when restoring the value because
// leaving `-1` hides shadow root children from the tab order.
this._oldTabIndex=this.getAttribute('tabindex');this._setFocused(false);this.tabIndex=-1;this.blur();}else if(this._oldTabIndex!==undefined){if(this._oldTabIndex===null){this.removeAttribute('tabindex');}else{this.setAttribute('tabindex',this._oldTabIndex);}}},_changedControlState:function(){// _controlStateChanged is abstract, follow-on behaviors may implement it
if(this._controlStateChanged){this._controlStateChanged();}}};var ironControlState={IronControlState:IronControlState};const IronButtonStateImpl={properties:{/**
     * If true, the user is currently holding down the button.
     */pressed:{type:Boolean,readOnly:true,value:false,reflectToAttribute:true,observer:'_pressedChanged'},/**
     * If true, the button toggles the active state with each tap or press
     * of the spacebar.
     */toggles:{type:Boolean,value:false,reflectToAttribute:true},/**
     * If true, the button is a toggle and is currently in the active state.
     */active:{type:Boolean,value:false,notify:true,reflectToAttribute:true},/**
     * True if the element is currently being pressed by a "pointer," which
     * is loosely defined as mouse or touch input (but specifically excluding
     * keyboard input).
     */pointerDown:{type:Boolean,readOnly:true,value:false},/**
     * True if the input device that caused the element to receive focus
     * was a keyboard.
     */receivedFocusFromKeyboard:{type:Boolean,readOnly:true},/**
     * The aria attribute to be set if the button is a toggle and in the
     * active state.
     */ariaActiveAttribute:{type:String,value:'aria-pressed',observer:'_ariaActiveAttributeChanged'}},listeners:{down:'_downHandler',up:'_upHandler',tap:'_tapHandler'},observers:['_focusChanged(focused)','_activeChanged(active, ariaActiveAttribute)'],/**
   * @type {!Object}
   */keyBindings:{'enter:keydown':'_asyncClick','space:keydown':'_spaceKeyDownHandler','space:keyup':'_spaceKeyUpHandler'},_mouseEventRe:/^mouse/,_tapHandler:function(){if(this.toggles){// a tap is needed to toggle the active state
this._userActivate(!this.active);}else{this.active=false;}},_focusChanged:function(focused){this._detectKeyboardFocus(focused);if(!focused){this._setPressed(false);}},_detectKeyboardFocus:function(focused){this._setReceivedFocusFromKeyboard(!this.pointerDown&&focused);},// to emulate native checkbox, (de-)activations from a user interaction fire
// 'change' events
_userActivate:function(active){if(this.active!==active){this.active=active;this.fire('change');}},_downHandler:function(event){this._setPointerDown(true);this._setPressed(true);this._setReceivedFocusFromKeyboard(false);},_upHandler:function(){this._setPointerDown(false);this._setPressed(false);},/**
   * @param {!KeyboardEvent} event .
   */_spaceKeyDownHandler:function(event){var keyboardEvent=event.detail.keyboardEvent;var target=dom(keyboardEvent).localTarget;// Ignore the event if this is coming from a focused light child, since that
// element will deal with it.
if(this.isLightDescendant(/** @type {Node} */target))return;keyboardEvent.preventDefault();keyboardEvent.stopImmediatePropagation();this._setPressed(true);},/**
   * @param {!KeyboardEvent} event .
   */_spaceKeyUpHandler:function(event){var keyboardEvent=event.detail.keyboardEvent;var target=dom(keyboardEvent).localTarget;// Ignore the event if this is coming from a focused light child, since that
// element will deal with it.
if(this.isLightDescendant(/** @type {Node} */target))return;if(this.pressed){this._asyncClick();}this._setPressed(false);},// trigger click asynchronously, the asynchrony is useful to allow one
// event handler to unwind before triggering another event
_asyncClick:function(){this.async(function(){this.click();},1);},// any of these changes are considered a change to button state
_pressedChanged:function(pressed){this._changedButtonState();},_ariaActiveAttributeChanged:function(value,oldValue){if(oldValue&&oldValue!=value&&this.hasAttribute(oldValue)){this.removeAttribute(oldValue);}},_activeChanged:function(active,ariaActiveAttribute){if(this.toggles){this.setAttribute(this.ariaActiveAttribute,active?'true':'false');}else{this.removeAttribute(this.ariaActiveAttribute);}this._changedButtonState();},_controlStateChanged:function(){if(this.disabled){this._setPressed(false);}else{this._changedButtonState();}},// provide hook for follow-on behaviors to react to button-state
_changedButtonState:function(){if(this._buttonStateChanged){this._buttonStateChanged();// abstract
}}};const IronButtonState=[IronA11yKeysBehavior,IronButtonStateImpl];var ironButtonState={IronButtonStateImpl:IronButtonStateImpl,IronButtonState:IronButtonState};const $_documentContainer=document.createElement('div');$_documentContainer.setAttribute('style','display: none;');$_documentContainer.innerHTML=`<custom-style>
  <style is="custom-style">
    [hidden] {
      display: none !important;
    }
  </style>
</custom-style><custom-style>
  <style is="custom-style">
    html {

      --layout: {
        display: -ms-flexbox;
        display: -webkit-flex;
        display: flex;
      };

      --layout-inline: {
        display: -ms-inline-flexbox;
        display: -webkit-inline-flex;
        display: inline-flex;
      };

      --layout-horizontal: {
        @apply --layout;

        -ms-flex-direction: row;
        -webkit-flex-direction: row;
        flex-direction: row;
      };

      --layout-horizontal-reverse: {
        @apply --layout;

        -ms-flex-direction: row-reverse;
        -webkit-flex-direction: row-reverse;
        flex-direction: row-reverse;
      };

      --layout-vertical: {
        @apply --layout;

        -ms-flex-direction: column;
        -webkit-flex-direction: column;
        flex-direction: column;
      };

      --layout-vertical-reverse: {
        @apply --layout;

        -ms-flex-direction: column-reverse;
        -webkit-flex-direction: column-reverse;
        flex-direction: column-reverse;
      };

      --layout-wrap: {
        -ms-flex-wrap: wrap;
        -webkit-flex-wrap: wrap;
        flex-wrap: wrap;
      };

      --layout-wrap-reverse: {
        -ms-flex-wrap: wrap-reverse;
        -webkit-flex-wrap: wrap-reverse;
        flex-wrap: wrap-reverse;
      };

      --layout-flex-auto: {
        -ms-flex: 1 1 auto;
        -webkit-flex: 1 1 auto;
        flex: 1 1 auto;
      };

      --layout-flex-none: {
        -ms-flex: none;
        -webkit-flex: none;
        flex: none;
      };

      --layout-flex: {
        -ms-flex: 1 1 0.000000001px;
        -webkit-flex: 1;
        flex: 1;
        -webkit-flex-basis: 0.000000001px;
        flex-basis: 0.000000001px;
      };

      --layout-flex-2: {
        -ms-flex: 2;
        -webkit-flex: 2;
        flex: 2;
      };

      --layout-flex-3: {
        -ms-flex: 3;
        -webkit-flex: 3;
        flex: 3;
      };

      --layout-flex-4: {
        -ms-flex: 4;
        -webkit-flex: 4;
        flex: 4;
      };

      --layout-flex-5: {
        -ms-flex: 5;
        -webkit-flex: 5;
        flex: 5;
      };

      --layout-flex-6: {
        -ms-flex: 6;
        -webkit-flex: 6;
        flex: 6;
      };

      --layout-flex-7: {
        -ms-flex: 7;
        -webkit-flex: 7;
        flex: 7;
      };

      --layout-flex-8: {
        -ms-flex: 8;
        -webkit-flex: 8;
        flex: 8;
      };

      --layout-flex-9: {
        -ms-flex: 9;
        -webkit-flex: 9;
        flex: 9;
      };

      --layout-flex-10: {
        -ms-flex: 10;
        -webkit-flex: 10;
        flex: 10;
      };

      --layout-flex-11: {
        -ms-flex: 11;
        -webkit-flex: 11;
        flex: 11;
      };

      --layout-flex-12: {
        -ms-flex: 12;
        -webkit-flex: 12;
        flex: 12;
      };

      /* alignment in cross axis */

      --layout-start: {
        -ms-flex-align: start;
        -webkit-align-items: flex-start;
        align-items: flex-start;
      };

      --layout-center: {
        -ms-flex-align: center;
        -webkit-align-items: center;
        align-items: center;
      };

      --layout-end: {
        -ms-flex-align: end;
        -webkit-align-items: flex-end;
        align-items: flex-end;
      };

      --layout-baseline: {
        -ms-flex-align: baseline;
        -webkit-align-items: baseline;
        align-items: baseline;
      };

      /* alignment in main axis */

      --layout-start-justified: {
        -ms-flex-pack: start;
        -webkit-justify-content: flex-start;
        justify-content: flex-start;
      };

      --layout-center-justified: {
        -ms-flex-pack: center;
        -webkit-justify-content: center;
        justify-content: center;
      };

      --layout-end-justified: {
        -ms-flex-pack: end;
        -webkit-justify-content: flex-end;
        justify-content: flex-end;
      };

      --layout-around-justified: {
        -ms-flex-pack: distribute;
        -webkit-justify-content: space-around;
        justify-content: space-around;
      };

      --layout-justified: {
        -ms-flex-pack: justify;
        -webkit-justify-content: space-between;
        justify-content: space-between;
      };

      --layout-center-center: {
        @apply --layout-center;
        @apply --layout-center-justified;
      };

      /* self alignment */

      --layout-self-start: {
        -ms-align-self: flex-start;
        -webkit-align-self: flex-start;
        align-self: flex-start;
      };

      --layout-self-center: {
        -ms-align-self: center;
        -webkit-align-self: center;
        align-self: center;
      };

      --layout-self-end: {
        -ms-align-self: flex-end;
        -webkit-align-self: flex-end;
        align-self: flex-end;
      };

      --layout-self-stretch: {
        -ms-align-self: stretch;
        -webkit-align-self: stretch;
        align-self: stretch;
      };

      --layout-self-baseline: {
        -ms-align-self: baseline;
        -webkit-align-self: baseline;
        align-self: baseline;
      };

      /* multi-line alignment in main axis */

      --layout-start-aligned: {
        -ms-flex-line-pack: start;  /* IE10 */
        -ms-align-content: flex-start;
        -webkit-align-content: flex-start;
        align-content: flex-start;
      };

      --layout-end-aligned: {
        -ms-flex-line-pack: end;  /* IE10 */
        -ms-align-content: flex-end;
        -webkit-align-content: flex-end;
        align-content: flex-end;
      };

      --layout-center-aligned: {
        -ms-flex-line-pack: center;  /* IE10 */
        -ms-align-content: center;
        -webkit-align-content: center;
        align-content: center;
      };

      --layout-between-aligned: {
        -ms-flex-line-pack: justify;  /* IE10 */
        -ms-align-content: space-between;
        -webkit-align-content: space-between;
        align-content: space-between;
      };

      --layout-around-aligned: {
        -ms-flex-line-pack: distribute;  /* IE10 */
        -ms-align-content: space-around;
        -webkit-align-content: space-around;
        align-content: space-around;
      };

      /*******************************
                Other Layout
      *******************************/

      --layout-block: {
        display: block;
      };

      --layout-invisible: {
        visibility: hidden !important;
      };

      --layout-relative: {
        position: relative;
      };

      --layout-fit: {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
      };

      --layout-scroll: {
        -webkit-overflow-scrolling: touch;
        overflow: auto;
      };

      --layout-fullbleed: {
        margin: 0;
        height: 100vh;
      };

      /* fixed position */

      --layout-fixed-top: {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
      };

      --layout-fixed-right: {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
      };

      --layout-fixed-bottom: {
        position: fixed;
        right: 0;
        bottom: 0;
        left: 0;
      };

      --layout-fixed-left: {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
      };

    }
  </style>
</custom-style>`;document.head.appendChild($_documentContainer);var style=document.createElement('style');style.textContent='[hidden] { display: none !important; }';document.head.appendChild(style);const IronFormElementBehavior={properties:{/**
     * Fired when the element is added to an `iron-form`.
     *
     * @event iron-form-element-register
     */ /**
         * Fired when the element is removed from an `iron-form`.
         *
         * @event iron-form-element-unregister
         */ /**
             * The name of this element.
             */name:{type:String},/**
     * The value for this element.
     */value:{notify:true,type:String},/**
     * Set to true to mark the input as required. If used in a form, a
     * custom element that uses this behavior should also use
     * Polymer.IronValidatableBehavior and define a custom validation method.
     * Otherwise, a `required` element will always be considered valid.
     * It's also strongly recommended to provide a visual style for the element
     * when its value is invalid.
     */required:{type:Boolean,value:false},/**
     * The form that the element is registered to.
     */_parentForm:{type:Object}},attached(){if(!Element$1){// Note: the iron-form that this element belongs to will set this
// element's _parentForm property when handling this event.
this.fire('iron-form-element-register');}},detached(){if(!Element$1&&this._parentForm){this._parentForm.fire('iron-form-element-unregister',{target:this});}}};var ironFormElementBehavior={IronFormElementBehavior:IronFormElementBehavior};Polymer({_template:html`
    <style>
      :host {
        display: block;
      }
    </style>

    <!-- This form is used to collect the elements that should be submitted -->
    <slot></slot>

    <!-- This form is used for submission -->
    <form id="helper" action\$="[[action]]" method\$="[[method]]" enctype\$="[[enctype]]"></form>
`,is:'iron-form',properties:{/*
     * Set this to true if you don't want the form to be submitted through an
     * ajax request, and you want the page to redirect to the action URL
     * after the form has been submitted.
     */allowRedirect:{type:Boolean,value:false},/**
    * HTTP request headers to send. See PolymerElements/iron-ajax for
    * more details. Only works when `allowRedirect` is false.
    */headers:{type:Object,value:function(){return{};}},/**
    * Set the `withCredentials` flag on the request. See PolymerElements/iron-ajax for
    * more details. Only works when `allowRedirect` is false.
    */withCredentials:{type:Boolean,value:false}},/**
   * Fired if the form cannot be submitted because it's invalid.
   *
   * @event iron-form-invalid
   */ /**
       * Fired after the form is submitted.
       *
       * @event iron-form-submit
       */ /**
           * Fired before the form is submitted.
           *
           * @event iron-form-presubmit
           */ /**
               * Fired after the form is reset.
               *
               * @event iron-form-reset
               */ /**
                   * Fired after the form is submitted and a response is received. An
                   * IronRequestElement is included as the event.detail object.
                   *
                   * @event iron-form-response
                   */ /**
                       * Fired after the form is submitted and an error is received. An
                       * error message is included in event.detail.error and an
                       * IronRequestElement is included in event.detail.request.
                       *
                       * @event iron-form-error
                       */ /**
                           * @return {void}
                           */attached:function(){// We might have been detached then re-attached.
// Avoid searching again for the <form> if we already found it.
if(this._form){return;}// Search for the `<form>`, if we don't find it, observe for
// mutations.
this._form=dom(this).querySelector('form');if(this._form){this._init();// Since some elements might not be upgraded yet at this time,
// we won't be able to look into their shadowRoots for submittables.
// We wait a tick and check again for any missing submittable default
// values.
this.async(this._saveInitialValues.bind(this));}else{this._nodeObserver=dom(this).observeNodes(function(mutations){for(var i=0;i<mutations.addedNodes.length;i++){if(mutations.addedNodes[i].tagName==='FORM'){this._form=mutations.addedNodes[i];// At this point in time, all custom elements are expected
// to be upgraded, hence we'll be able to traverse their
// shadowRoots.
this._init();dom(this).unobserveNodes(this._nodeObserver);this._nodeObserver=null;}}}.bind(this));}},/**
   * @return {void}
   */detached:function(){if(this._nodeObserver){dom(this).unobserveNodes(this._nodeObserver);this._nodeObserver=null;}},_init:function(){this._form.addEventListener('submit',this.submit.bind(this));this._form.addEventListener('reset',this.reset.bind(this));// Save the initial values.
this._defaults=this._defaults||new WeakMap();this._saveInitialValues();},_saveInitialValues:function(){var nodes=this._getSubmittableElements();for(var i=0;i<nodes.length;i++){var node=nodes[i];if(!this._defaults.has(node)){// Submittables are expected to have `value` property,
// that's what gets serialized.
var defaults={value:node.value};if('checked'in node){defaults.checked=node.checked;}// In 1.x iron-form would reset `invalid`, so
// keep it here for backwards compat.
if('invalid'in node){defaults.invalid=node.invalid;}this._defaults.set(node,defaults);}}},/**
   * Validates all the required elements (custom and native) in the form.
   * @return {boolean} True if all the elements are valid.
   */validate:function(){// If you've called this before distribution happened, bail out.
if(!this._form){return false;}if(this._form.getAttribute('novalidate')==='')return true;// Start by making the form check the native elements it knows about.
var valid=this._form.checkValidity();var elements=this._getValidatableElements();// Go through all the elements, and validate the custom ones.
for(var el,i=0;el=elements[i],i<elements.length;i++){// This is weird to appease the compiler. We assume the custom element
// has a validate() method, otherwise we can't check it.
var validatable=/** @type {{validate: (function() : boolean)}} */el;if(validatable.validate){valid=!!validatable.validate()&&valid;}}return valid;},/**
   * Submits the form.
   *
   * @param {Event=} event
   * @return {void}
   */submit:function(event){// We are not using this form for submission, so always cancel its event.
if(event){event.preventDefault();}// If you've called this before distribution happened, bail out.
if(!this._form){return;}if(!this.validate()){this.fire('iron-form-invalid');return;}// Remove any existing children in the submission form (from a previous submit).
this.$.helper.textContent='';var json=this.serializeForm();// If we want a redirect, submit the form natively.
if(this.allowRedirect){// If we're submitting the form natively, then create a hidden element for
// each of the values.
for(var element in json){this.$.helper.appendChild(this._createHiddenElement(element,json[element]));}// Copy the original form attributes.
this.$.helper.action=this._form.getAttribute('action');this.$.helper.method=this._form.getAttribute('method')||'GET';this.$.helper.contentType=this._form.getAttribute('enctype')||'application/x-www-form-urlencoded';this.$.helper.submit();this.fire('iron-form-submit');}else{this._makeAjaxRequest(json);}},/**
   * Resets the form to the default values.
   *
   * @param {Event=} event
   * @return {void}
   */reset:function(event){// We are not using this form for submission, so always cancel its event.
if(event)event.preventDefault();// If you've called this before distribution happened, bail out.
if(!this._form){return;}// Ensure the native form fired the `reset` event.
// User might have bound `<button on-click="_resetIronForm">`, or directly called
// `ironForm.reset()`. In these cases we want to first reset the native form.
if(!event||event.type!=='reset'||event.target!==this._form){this._form.reset();return;}// Load the initial values.
var nodes=this._getSubmittableElements();for(var i=0;i<nodes.length;i++){var node=nodes[i];if(this._defaults.has(node)){var defaults=this._defaults.get(node);for(var propName in defaults){node[propName]=defaults[propName];}}}this.fire('iron-form-reset');},/**
   * Serializes the form as will be used in submission. Note that `serialize`
   * is a Polymer reserved keyword, so calling `someIronForm`.serialize()`
   * will give you unexpected results.
   * @return {!Object<string, *>} An object containing name-value pairs for elements that
   *                  would be submitted.
   */serializeForm:function(){// Only elements that have a `name` and are not disabled are submittable.
var elements=this._getSubmittableElements();var json={};for(var i=0;i<elements.length;i++){var values=this._serializeElementValues(elements[i]);for(var v=0;v<values.length;v++){this._addSerializedElement(json,elements[i].name,values[v]);}}return json;},_handleFormResponse:function(event){this.fire('iron-form-response',event.detail);},_handleFormError:function(event){this.fire('iron-form-error',event.detail);},_makeAjaxRequest:function(json){// Initialize the iron-ajax element if we haven't already.
if(!this.request){this.request=document.createElement('iron-ajax');this.request.addEventListener('response',this._handleFormResponse.bind(this));this.request.addEventListener('error',this._handleFormError.bind(this));}// Native forms can also index elements magically by their name (can't make
// this up if I tried) so we need to get the correct attributes, not the
// elements with those names.
this.request.url=this._form.getAttribute('action');this.request.method=this._form.getAttribute('method')||'GET';this.request.contentType=this._form.getAttribute('enctype')||'application/x-www-form-urlencoded';this.request.withCredentials=this.withCredentials;this.request.headers=this.headers;if(this._form.method.toUpperCase()==='POST'){this.request.body=json;}else{this.request.params=json;}// Allow for a presubmit hook
var event=this.fire('iron-form-presubmit',{},{cancelable:true});if(!event.defaultPrevented){this.request.generateRequest();this.fire('iron-form-submit',json);}},_getValidatableElements:function(){return this._findElements(this._form,true/* ignoreName */,false/* skipSlots */);},_getSubmittableElements:function(){return this._findElements(this._form,false/* ignoreName */,false/* skipSlots */);},/**
   * Traverse the parent element to find and add all submittable nodes to `submittable`.
   * @param  {!Node} parent The parent node
   * @param  {!boolean} ignoreName  Whether the name of the submittable nodes should be disregarded
   * @param  {!boolean} skipSlots  Whether to skip traversing of slot elements
   * @param  {!Array<!Node>=} submittable Reference to the array of submittables
   * @return {!Array<!Node>}
   * @private
   */_findElements:function(parent,ignoreName,skipSlots,submittable){submittable=submittable||[];var nodes=dom(parent).querySelectorAll('*');for(var i=0;i<nodes.length;i++){// An element is submittable if it is not disabled, and if it has a
// name attribute.
if(!skipSlots&&(nodes[i].localName==='slot'||nodes[i].localName==='content')){this._searchSubmittableInSlot(submittable,nodes[i],ignoreName);}else{this._searchSubmittable(submittable,nodes[i],ignoreName);}}return submittable;},/**
   * Traverse the distributed nodes of a slot or content element
   * and add all submittable nodes to `submittable`.
   * @param  {!Array<!Node>} submittable Reference to the array of submittables
   * @param  {!Node} node The slot or content node
   * @param  {!boolean} ignoreName  Whether the name of the submittable nodes should be disregarded
   * @return {void}
   * @private
   */_searchSubmittableInSlot:function(submittable,node,ignoreName){var assignedNodes=dom(node).getDistributedNodes();for(var i=0;i<assignedNodes.length;i++){if(assignedNodes[i].nodeType===Node.TEXT_NODE){continue;}// Note: assignedNodes does not contain <slot> or <content> because 
// getDistributedNodes flattens the tree.
this._searchSubmittable(submittable,assignedNodes[i],ignoreName);var nestedAssignedNodes=dom(assignedNodes[i]).querySelectorAll('*');for(var j=0;j<nestedAssignedNodes.length;j++){this._searchSubmittable(submittable,nestedAssignedNodes[j],ignoreName);}}},/**
   * Traverse the distributed nodes of a slot or content element
   * and add all submittable nodes to `submittable`.
   * @param  {!Array<!Node>} submittable Reference to the array of submittables
   * @param  {!Node} node The node to be
   * @param  {!boolean} ignoreName  Whether the name of the submittable nodes should be disregarded
   * @return {void}
   * @private
   */_searchSubmittable:function(submittable,node,ignoreName){if(this._isSubmittable(node,ignoreName)){submittable.push(node);}else if(node.root){this._findElements(node.root,ignoreName,true/* skipSlots */,submittable);}},/**
   * An element is submittable if it is not disabled, and if it has a
   * 'name' attribute. If we ignore the name, check if is validatable.
   * This allows `_findElements` to decide if to explore an element's shadowRoot or not:
   * an element implementing `validate()` is considered validatable, and we don't
   * search for validatables in its shadowRoot.
   * @param {!Node} node
   * @param {!boolean} ignoreName
   * @return {boolean}
   * @private
   */_isSubmittable:function(node,ignoreName){return!node.disabled&&(ignoreName?typeof node.validate==='function':node.name);},_serializeElementValues:function(element){// We will assume that every custom element that needs to be serialized
// has a `value` property, and it contains the correct value.
// The only weird one is an element that implements IronCheckedElementBehaviour,
// in which case like the native checkbox/radio button, it's only used
// when checked.
// For native elements, from https://www.w3.org/TR/html5/forms.html#the-form-element.
// Native submittable elements: button, input, keygen, object, select, textarea;
// 1. We will skip `keygen and `object` for this iteration, and deal with
// them if they're actually required.
// 2. <button> and <textarea> have a `value` property, so they behave like
//    the custom elements.
// 3. <select> can have multiple options selected, in which case its
//    `value` is incorrect, and we must use the values of each of its
//    `selectedOptions`
// 4. <input> can have a whole bunch of behaviours, so it's handled separately.
// 5. Buttons are hard. The button that was clicked to submit the form
//    is the one who's name/value gets sent to the server.
var tag=element.tagName.toLowerCase();if(tag==='button'||tag==='input'&&(element.type==='submit'||element.type==='reset')){return[];}if(tag==='select'){return this._serializeSelectValues(element);}else if(tag==='input'){return this._serializeInputValues(element);}else{if(element['_hasIronCheckedElementBehavior']&&!element.checked)return[];return[element.value];}},_serializeSelectValues:function(element){var values=[];// A <select multiple> has an array of options, some of which can be selected.
for(var i=0;i<element.options.length;i++){if(element.options[i].selected){values.push(element.options[i].value);}}return values;},_serializeInputValues:function(element){// Most of the inputs use their 'value' attribute, with the exception
// of radio buttons, checkboxes and file.
var type=element.type.toLowerCase();// Don't do anything for unchecked checkboxes/radio buttons.
// Don't do anything for file, since that requires a different request.
if((type==='checkbox'||type==='radio')&&!element.checked||type==='file'){return[];}return[element.value];},_createHiddenElement:function(name,value){var input=document.createElement("input");input.setAttribute("type","hidden");input.setAttribute("name",name);input.setAttribute("value",value);return input;},_addSerializedElement:function(json,name,value){// If the name doesn't exist, add it. Otherwise, serialize it to
// an array,
if(json[name]===undefined){json[name]=value;}else{if(!Array.isArray(json[name])){json[name]=[json[name]];}json[name].push(value);}}});const IronMeta=function(options){IronMeta[' '](options);this.type=options&&options.type||'default';this.key=options&&options.key;if(options&&'value'in options){this.value=options.value;}};// This function is used to convince Closure not to remove constructor calls
// for instances that are not held anywhere. For example, when
// `new Polymer.IronMeta({...})` is used only for the side effect of adding
// a value.
IronMeta[' ']=function(){};IronMeta.types={};IronMeta.prototype={get value(){var type=this.type;var key=this.key;if(type&&key){return IronMeta.types[type]&&IronMeta.types[type][key];}},set value(value){var type=this.type;var key=this.key;if(type&&key){type=IronMeta.types[type]=IronMeta.types[type]||{};if(value==null){delete type[key];}else{type[key]=value;}}},get list(){var type=this.type;if(type){var items=IronMeta.types[this.type];if(!items){return[];}return Object.keys(items).map(function(key){return metaDatas[this.type][key];},this);}},byKey:function(key){this.key=key;return this.value;}};var metaDatas=IronMeta.types;Polymer({is:'iron-meta',properties:{/**
     * The type of meta-data.  All meta-data of the same type is stored
     * together.
     * @type {string}
     */type:{type:String,value:'default'},/**
     * The key used to store `value` under the `type` namespace.
     * @type {?string}
     */key:{type:String},/**
     * The meta-data to store or retrieve.
     * @type {*}
     */value:{type:String,notify:true},/**
     * If true, `value` is set to the iron-meta instance itself.
     */self:{type:Boolean,observer:'_selfChanged'},__meta:{type:Boolean,computed:'__computeMeta(type, key, value)'}},hostAttributes:{hidden:true},__computeMeta:function(type,key,value){var meta=new IronMeta({type:type,key:key});if(value!==undefined&&value!==meta.value){meta.value=value;}else if(this.value!==meta.value){this.value=meta.value;}return meta;},get list(){return this.__meta&&this.__meta.list;},_selfChanged:function(self){if(self){this.value=this;}},/**
   * Retrieves meta data value by key.
   *
   * @method byKey
   * @param {string} key The key of the meta-data to be returned.
   * @return {*}
   */byKey:function(key){return new IronMeta({type:this.type,key:key}).value;}});var ironMeta={IronMeta:IronMeta};/**
   @license
   Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */ /**
      
      The `iron-icon` element displays an icon. By default an icon renders as a 24px square.
      
      Example using src:
      
          <iron-icon src="star.png"></iron-icon>
      
      Example setting size to 32px x 32px:
      
          <iron-icon class="big" src="big_star.png"></iron-icon>
      
          <style is="custom-style">
            .big {
              --iron-icon-height: 32px;
              --iron-icon-width: 32px;
            }
          </style>
      
      The iron elements include several sets of icons.
      To use the default set of icons, import `iron-icons.html` and use the `icon` attribute to specify an icon:
      
          <link rel="import" href="/components/iron-icons/iron-icons.html">
      
          <iron-icon icon="menu"></iron-icon>
      
      To use a different built-in set of icons, import the specific `iron-icons/<iconset>-icons.html`, and
      specify the icon as `<iconset>:<icon>`. For example, to use a communication icon, you would
      use:
      
          <link rel="import" href="/components/iron-icons/communication-icons.html">
      
          <iron-icon icon="communication:email"></iron-icon>
      
      You can also create custom icon sets of bitmap or SVG icons.
      
      Example of using an icon named `cherry` from a custom iconset with the ID `fruit`:
      
          <iron-icon icon="fruit:cherry"></iron-icon>
      
      See [iron-iconset](iron-iconset) and [iron-iconset-svg](iron-iconset-svg) for more information about
      how to create a custom iconset.
      
      See the [iron-icons demo](iron-icons?view=demo:demo/index.html) to see the icons available
      in the various iconsets.
      
      To load a subset of icons from one of the default `iron-icons` sets, you can
      use the [poly-icon](https://poly-icon.appspot.com/) tool. It allows you
      to select individual icons, and creates an iconset from them that you can
      use directly in your elements.
      
      ### Styling
      
      The following custom properties are available for styling:
      
      Custom property | Description | Default
      ----------------|-------------|----------
      `--iron-icon` | Mixin applied to the icon | {}
      `--iron-icon-width` | Width of the icon | `24px`
      `--iron-icon-height` | Height of the icon | `24px`
      `--iron-icon-fill-color` | Fill color of the svg icon | `currentcolor`
      `--iron-icon-stroke-color` | Stroke color of the svg icon | none
      
      @group Iron Elements
      @element iron-icon
      @demo demo/index.html
      @hero hero.svg
      @homepage polymer.github.io
      */Polymer({_template:html`
    <style>
      :host {
        @apply --layout-inline;
        @apply --layout-center-center;
        position: relative;

        vertical-align: middle;

        fill: var(--iron-icon-fill-color, currentcolor);
        stroke: var(--iron-icon-stroke-color, none);

        width: var(--iron-icon-width, 24px);
        height: var(--iron-icon-height, 24px);
        @apply --iron-icon;
      }

      :host([hidden]) {
        display: none;
      }
    </style>
`,is:'iron-icon',properties:{/**
     * The name of the icon to use. The name should be of the form:
     * `iconset_name:icon_name`.
     */icon:{type:String},/**
     * The name of the theme to used, if one is specified by the
     * iconset.
     */theme:{type:String},/**
     * If using iron-icon without an iconset, you can set the src to be
     * the URL of an individual icon image file. Note that this will take
     * precedence over a given icon attribute.
     */src:{type:String},/**
     * @type {!Polymer.IronMeta}
     */_meta:{value:Base.create('iron-meta',{type:'iconset'})}},observers:['_updateIcon(_meta, isAttached)','_updateIcon(theme, isAttached)','_srcChanged(src, isAttached)','_iconChanged(icon, isAttached)'],_DEFAULT_ICONSET:'icons',_iconChanged:function(icon){var parts=(icon||'').split(':');this._iconName=parts.pop();this._iconsetName=parts.pop()||this._DEFAULT_ICONSET;this._updateIcon();},_srcChanged:function(src){this._updateIcon();},_usesIconset:function(){return this.icon||!this.src;},/** @suppress {visibility} */_updateIcon:function(){if(this._usesIconset()){if(this._img&&this._img.parentNode){dom(this.root).removeChild(this._img);}if(this._iconName===""){if(this._iconset){this._iconset.removeIcon(this);}}else if(this._iconsetName&&this._meta){this._iconset=/** @type {?Polymer.Iconset} */this._meta.byKey(this._iconsetName);if(this._iconset){this._iconset.applyIcon(this,this._iconName,this.theme);this.unlisten(window,'iron-iconset-added','_updateIcon');}else{this.listen(window,'iron-iconset-added','_updateIcon');}}}else{if(this._iconset){this._iconset.removeIcon(this);}if(!this._img){this._img=document.createElement('img');this._img.style.width='100%';this._img.style.height='100%';this._img.draggable=false;}this._img.src=this.src;dom(this.root).appendChild(this._img);}}});/**
     * The `iron-iconset-svg` element allows users to define their own icon sets
     * that contain svg icons. The svg icon elements should be children of the
     * `iron-iconset-svg` element. Multiple icons should be given distinct id's.
     *
     * Using svg elements to create icons has a few advantages over traditional
     * bitmap graphics like jpg or png. Icons that use svg are vector based so
     * they are resolution independent and should look good on any device. They
     * are stylable via css. Icons can be themed, colorized, and even animated.
     *
     * Example:
     *
     *     <iron-iconset-svg name="my-svg-icons" size="24">
     *       <svg>
     *         <defs>
     *           <g id="shape">
     *             <rect x="12" y="0" width="12" height="24" />
     *             <circle cx="12" cy="12" r="12" />
     *           </g>
     *         </defs>
     *       </svg>
     *     </iron-iconset-svg>
     *
     * This will automatically register the icon set "my-svg-icons" to the iconset
     * database.  To use these icons from within another element, make a
     * `iron-iconset` element and call the `byId` method
     * to retrieve a given iconset. To apply a particular icon inside an
     * element use the `applyIcon` method. For example:
     *
     *     iconset.applyIcon(iconNode, 'car');
     *
     * @element iron-iconset-svg
     * @demo demo/index.html
     * @implements {Polymer.Iconset}
     */ /**
        @license
        Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
        This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
        The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
        The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
        Code distributed by Google as part of the polymer project is also
        subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
        */Polymer({is:'iron-iconset-svg',properties:{/**
     * The name of the iconset.
     */name:{type:String,observer:'_nameChanged'},/**
     * The size of an individual icon. Note that icons must be square.
     */size:{type:Number,value:24},/**
     * Set to true to enable mirroring of icons where specified when they are
     * stamped. Icons that should be mirrored should be decorated with a
     * `mirror-in-rtl` attribute.
     *
     * NOTE: For performance reasons, direction will be resolved once per
     * document per iconset, so moving icons in and out of RTL subtrees will
     * not cause their mirrored state to change.
     */rtlMirroring:{type:Boolean,value:false},/**
     * Set to true to measure RTL based on the dir attribute on the body or
     * html elements (measured on document.body or document.documentElement as
     * available).
     */useGlobalRtlAttribute:{type:Boolean,value:false}},created:function(){this._meta=new IronMeta({type:'iconset',key:null,value:null});},attached:function(){this.style.display='none';},/**
   * Construct an array of all icon names in this iconset.
   *
   * @return {!Array} Array of icon names.
   */getIconNames:function(){this._icons=this._createIconMap();return Object.keys(this._icons).map(function(n){return this.name+':'+n;},this);},/**
   * Applies an icon to the given element.
   *
   * An svg icon is prepended to the element's shadowRoot if it exists,
   * otherwise to the element itself.
   *
   * If RTL mirroring is enabled, and the icon is marked to be mirrored in
   * RTL, the element will be tested (once and only once ever for each
   * iconset) to determine the direction of the subtree the element is in.
   * This direction will apply to all future icon applications, although only
   * icons marked to be mirrored will be affected.
   *
   * @method applyIcon
   * @param {Element} element Element to which the icon is applied.
   * @param {string} iconName Name of the icon to apply.
   * @return {?Element} The svg element which renders the icon.
   */applyIcon:function(element,iconName){// Remove old svg element
this.removeIcon(element);// install new svg element
var svg=this._cloneIcon(iconName,this.rtlMirroring&&this._targetIsRTL(element));if(svg){// insert svg element into shadow root, if it exists
var pde=dom(element.root||element);pde.insertBefore(svg,pde.childNodes[0]);return element._svgIcon=svg;}return null;},/**
   * Remove an icon from the given element by undoing the changes effected
   * by `applyIcon`.
   *
   * @param {Element} element The element from which the icon is removed.
   */removeIcon:function(element){// Remove old svg element
if(element._svgIcon){dom(element.root||element).removeChild(element._svgIcon);element._svgIcon=null;}},/**
   * Measures and memoizes the direction of the element. Note that this
   * measurement is only done once and the result is memoized for future
   * invocations.
   */_targetIsRTL:function(target){if(this.__targetIsRTL==null){if(this.useGlobalRtlAttribute){var globalElement=document.body&&document.body.hasAttribute('dir')?document.body:document.documentElement;this.__targetIsRTL=globalElement.getAttribute('dir')==='rtl';}else{if(target&&target.nodeType!==Node.ELEMENT_NODE){target=target.host;}this.__targetIsRTL=target&&window.getComputedStyle(target)['direction']==='rtl';}}return this.__targetIsRTL;},/**
   *
   * When name is changed, register iconset metadata
   *
   */_nameChanged:function(){this._meta.value=null;this._meta.key=this.name;this._meta.value=this;this.async(function(){this.fire('iron-iconset-added',this,{node:window});});},/**
   * Create a map of child SVG elements by id.
   *
   * @return {!Object} Map of id's to SVG elements.
   */_createIconMap:function(){// Objects chained to Object.prototype (`{}`) have members. Specifically,
// on FF there is a `watch` method that confuses the icon map, so we
// need to use a null-based object here.
var icons=Object.create(null);dom(this).querySelectorAll('[id]').forEach(function(icon){icons[icon.id]=icon;});return icons;},/**
   * Produce installable clone of the SVG element matching `id` in this
   * iconset, or `undefined` if there is no matching element.
   *
   * @return {Element} Returns an installable clone of the SVG element
   * matching `id`.
   */_cloneIcon:function(id,mirrorAllowed){// create the icon map on-demand, since the iconset itself has no discrete
// signal to know when it's children are fully parsed
this._icons=this._icons||this._createIconMap();return this._prepareSvgClone(this._icons[id],this.size,mirrorAllowed);},/**
   * @param {Element} sourceSvg
   * @param {number} size
   * @param {Boolean} mirrorAllowed
   * @return {Element}
   */_prepareSvgClone:function(sourceSvg,size,mirrorAllowed){if(sourceSvg){var content=sourceSvg.cloneNode(true),svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),viewBox=content.getAttribute('viewBox')||'0 0 '+size+' '+size,cssText='pointer-events: none; display: block; width: 100%; height: 100%;';if(mirrorAllowed&&content.hasAttribute('mirror-in-rtl')){cssText+='-webkit-transform:scale(-1,1);transform:scale(-1,1);transform-origin:center;';}svg.setAttribute('viewBox',viewBox);svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.setAttribute('focusable','false');// TODO(dfreedm): `pointer-events: none` works around https://crbug.com/370136
// TODO(sjmiles): inline style may not be ideal, but avoids requiring a shadow-root
svg.style.cssText=cssText;svg.appendChild(content).removeAttribute('id');return svg;}return null;}});const $_documentContainer$1=document.createElement('div');$_documentContainer$1.setAttribute('style','display: none;');$_documentContainer$1.innerHTML=`<iron-iconset-svg name="icons" size="24">
<svg><defs>
<g id="3d-rotation"><path d="M7.52 21.48C4.25 19.94 1.91 16.76 1.55 13H.05C.56 19.16 5.71 24 12 24l.66-.03-3.81-3.81-1.33 1.32zm.89-6.52c-.19 0-.37-.03-.52-.08-.16-.06-.29-.13-.4-.24-.11-.1-.2-.22-.26-.37-.06-.14-.09-.3-.09-.47h-1.3c0 .36.07.68.21.95.14.27.33.5.56.69.24.18.51.32.82.41.3.1.62.15.96.15.37 0 .72-.05 1.03-.15.32-.1.6-.25.83-.44s.42-.43.55-.72c.13-.29.2-.61.2-.97 0-.19-.02-.38-.07-.56-.05-.18-.12-.35-.23-.51-.1-.16-.24-.3-.4-.43-.17-.13-.37-.23-.61-.31.2-.09.37-.2.52-.33.15-.13.27-.27.37-.42.1-.15.17-.3.22-.46.05-.16.07-.32.07-.48 0-.36-.06-.68-.18-.96-.12-.28-.29-.51-.51-.69-.2-.19-.47-.33-.77-.43C9.1 8.05 8.76 8 8.39 8c-.36 0-.69.05-1 .16-.3.11-.57.26-.79.45-.21.19-.38.41-.51.67-.12.26-.18.54-.18.85h1.3c0-.17.03-.32.09-.45s.14-.25.25-.34c.11-.09.23-.17.38-.22.15-.05.3-.08.48-.08.4 0 .7.1.89.31.19.2.29.49.29.86 0 .18-.03.34-.08.49-.05.15-.14.27-.25.37-.11.1-.25.18-.41.24-.16.06-.36.09-.58.09H7.5v1.03h.77c.22 0 .42.02.6.07s.33.13.45.23c.12.11.22.24.29.4.07.16.1.35.1.57 0 .41-.12.72-.35.93-.23.23-.55.33-.95.33zm8.55-5.92c-.32-.33-.7-.59-1.14-.77-.43-.18-.92-.27-1.46-.27H12v8h2.3c.55 0 1.06-.09 1.51-.27.45-.18.84-.43 1.16-.76.32-.33.57-.73.74-1.19.17-.47.26-.99.26-1.57v-.4c0-.58-.09-1.1-.26-1.57-.18-.47-.43-.87-.75-1.2zm-.39 3.16c0 .42-.05.79-.14 1.13-.1.33-.24.62-.43.85-.19.23-.43.41-.71.53-.29.12-.62.18-.99.18h-.91V9.12h.97c.72 0 1.27.23 1.64.69.38.46.57 1.12.57 1.99v.4zM12 0l-.66.03 3.81 3.81 1.33-1.33c3.27 1.55 5.61 4.72 5.96 8.48h1.5C23.44 4.84 18.29 0 12 0z"></path></g>
<g id="accessibility"><path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"></path></g>
<g id="accessible"><circle cx="12" cy="4" r="2"></circle><path d="M19 13v-2c-1.54.02-3.09-.75-4.07-1.83l-1.29-1.43c-.17-.19-.38-.34-.61-.45-.01 0-.01-.01-.02-.01H13c-.35-.2-.75-.3-1.19-.26C10.76 7.11 10 8.04 10 9.09V15c0 1.1.9 2 2 2h5v5h2v-5.5c0-1.1-.9-2-2-2h-3v-3.45c1.29 1.07 3.25 1.94 5 1.95zm-6.17 5c-.41 1.16-1.52 2-2.83 2-1.66 0-3-1.34-3-3 0-1.31.84-2.41 2-2.83V12.1c-2.28.46-4 2.48-4 4.9 0 2.76 2.24 5 5 5 2.42 0 4.44-1.72 4.9-4h-2.07z"></path></g>
<g id="account-balance"><path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"></path></g>
<g id="account-balance-wallet"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path></g>
<g id="account-box"><path d="M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2zm12 4c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z"></path></g>
<g id="account-circle"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path></g>
<g id="add"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></g>
<g id="add-alert"><path d="M10.01 21.01c0 1.1.89 1.99 1.99 1.99s1.99-.89 1.99-1.99h-3.98zm8.87-4.19V11c0-3.25-2.25-5.97-5.29-6.69v-.72C13.59 2.71 12.88 2 12 2s-1.59.71-1.59 1.59v.72C7.37 5.03 5.12 7.75 5.12 11v5.82L3 18.94V20h18v-1.06l-2.12-2.12zM16 13.01h-3v3h-2v-3H8V11h3V8h2v3h3v2.01z"></path></g>
<g id="add-box"><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path></g>
<g id="add-circle"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path></g>
<g id="add-circle-outline"><path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></g>
<g id="add-shopping-cart"><path d="M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-9.83-3.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4h-.01l-1.1 2-2.76 5H8.53l-.13-.27L6.16 6l-.95-2-.94-2H1v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.13 0-.25-.11-.25-.25z"></path></g>
<g id="alarm"><path d="M22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM12.5 8H11v6l4.75 2.85.75-1.23-4-2.37V8zM12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"></path></g>
<g id="alarm-add"><path d="M7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7zm1-11h-2v3H8v2h3v3h2v-3h3v-2h-3V9z"></path></g>
<g id="alarm-off"><path d="M12 6c3.87 0 7 3.13 7 7 0 .84-.16 1.65-.43 2.4l1.52 1.52c.58-1.19.91-2.51.91-3.92 0-4.97-4.03-9-9-9-1.41 0-2.73.33-3.92.91L9.6 6.43C10.35 6.16 11.16 6 12 6zm10-.28l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM2.92 2.29L1.65 3.57 2.98 4.9l-1.11.93 1.42 1.42 1.11-.94.8.8C3.83 8.69 3 10.75 3 13c0 4.97 4.02 9 9 9 2.25 0 4.31-.83 5.89-2.2l2.2 2.2 1.27-1.27L3.89 3.27l-.97-.98zm13.55 16.1C15.26 19.39 13.7 20 12 20c-3.87 0-7-3.13-7-7 0-1.7.61-3.26 1.61-4.47l9.86 9.86zM8.02 3.28L6.6 1.86l-.86.71 1.42 1.42.86-.71z"></path></g>
<g id="alarm-on"><path d="M22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7zm-1.46-5.47L8.41 12.4l-1.06 1.06 3.18 3.18 6-6-1.06-1.06-4.93 4.95z"></path></g>
<g id="all-out"><path d="M16.21 4.16l4 4v-4zm4 12l-4 4h4zm-12 4l-4-4v4zm-4-12l4-4h-4zm12.95-.95c-2.73-2.73-7.17-2.73-9.9 0s-2.73 7.17 0 9.9 7.17 2.73 9.9 0 2.73-7.16 0-9.9zm-1.1 8.8c-2.13 2.13-5.57 2.13-7.7 0s-2.13-5.57 0-7.7 5.57-2.13 7.7 0 2.13 5.57 0 7.7z"></path></g>
<g id="android"><path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"></path></g>
<g id="announcement"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z"></path></g>
<g id="apps"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"></path></g>
<g id="archive"><path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"></path></g>
<g id="arrow-back"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></g>
<g id="arrow-downward"><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"></path></g>
<g id="arrow-drop-down"><path d="M7 10l5 5 5-5z"></path></g>
<g id="arrow-drop-down-circle"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 12l-4-4h8l-4 4z"></path></g>
<g id="arrow-drop-up"><path d="M7 14l5-5 5 5z"></path></g>
<g id="arrow-forward"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path></g>
<g id="arrow-upward"><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"></path></g>
<g id="aspect-ratio"><path d="M19 12h-2v3h-3v2h5v-5zM7 9h3V7H5v5h2V9zm14-6H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z"></path></g>
<g id="assessment"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"></path></g>
<g id="assignment"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"></path></g>
<g id="assignment-ind"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V19z"></path></g>
<g id="assignment-late"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 15h-2v-2h2v2zm0-4h-2V8h2v6zm-1-9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"></path></g>
<g id="assignment-return"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 12h-4v3l-5-5 5-5v3h4v4z"></path></g>
<g id="assignment-returned"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 15l-5-5h3V9h4v4h3l-5 5z"></path></g>
<g id="assignment-turned-in"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path></g>
<g id="attachment"><path d="M2 12.5C2 9.46 4.46 7 7.5 7H18c2.21 0 4 1.79 4 4s-1.79 4-4 4H9.5C8.12 15 7 13.88 7 12.5S8.12 10 9.5 10H17v2H9.41c-.55 0-.55 1 0 1H18c1.1 0 2-.9 2-2s-.9-2-2-2H7.5C5.57 9 4 10.57 4 12.5S5.57 16 7.5 16H17v2H7.5C4.46 18 2 15.54 2 12.5z"></path></g>
<g id="autorenew"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"></path></g>
<g id="backspace"><path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"></path></g>
<g id="backup"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"></path></g>
<g id="block"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"></path></g>
<g id="book"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"></path></g>
<g id="bookmark"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"></path></g>
<g id="bookmark-border"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"></path></g>
<g id="bug-report"><path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"></path></g>
<g id="build"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"></path></g>
<g id="cached"><path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"></path></g>
<g id="camera-enhance"><path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-1l1.25-2.75L16 13l-2.75-1.25L12 9l-1.25 2.75L8 13l2.75 1.25z"></path></g>
<g id="cancel"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"></path></g>
<g id="card-giftcard"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"></path></g>
<g id="card-membership"><path d="M20 2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h4v5l4-2 4 2v-5h4c1.11 0 2-.89 2-2V4c0-1.11-.89-2-2-2zm0 13H4v-2h16v2zm0-5H4V4h16v6z"></path></g>
<g id="card-travel"><path d="M20 6h-3V4c0-1.11-.89-2-2-2H9c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM9 4h6v2H9V4zm11 15H4v-2h16v2zm0-5H4V8h3v2h2V8h6v2h2V8h3v6z"></path></g>
<g id="change-history"><path d="M12 7.77L18.39 18H5.61L12 7.77M12 4L2 20h20L12 4z"></path></g>
<g id="check"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></g>
<g id="check-box"><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></g>
<g id="check-box-outline-blank"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></g>
<g id="check-circle"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></g>
<g id="chevron-left"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></g>
<g id="chevron-right"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path></g>
<g id="chrome-reader-mode"><path d="M13 12h7v1.5h-7zm0-2.5h7V11h-7zm0 5h7V16h-7zM21 4H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 15h-9V6h9v13z"></path></g>
<g id="class"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"></path></g>
<g id="clear"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></g>
<g id="close"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></g>
<g id="cloud"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"></path></g>
<g id="cloud-circle"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14H8c-1.66 0-3-1.34-3-3s1.34-3 3-3l.14.01C8.58 8.28 10.13 7 12 7c2.21 0 4 1.79 4 4h.5c1.38 0 2.5 1.12 2.5 2.5S17.88 16 16.5 16z"></path></g>
<g id="cloud-done"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM10 17l-3.5-3.5 1.41-1.41L10 14.17 15.18 9l1.41 1.41L10 17z"></path></g>
<g id="cloud-download"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"></path></g>
<g id="cloud-off"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z"></path></g>
<g id="cloud-queue"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h.71C7.37 7.69 9.48 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3s-1.34 3-3 3z"></path></g>
<g id="cloud-upload"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"></path></g>
<g id="code"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"></path></g>
<g id="compare-arrows"><path d="M9.01 14H2v2h7.01v3L13 15l-3.99-4v3zm5.98-1v-3H22V8h-7.01V5L11 9l3.99 4z"></path></g>
<g id="content-copy"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></g>
<g id="content-cut"><path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3z"></path></g>
<g id="content-paste"><path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"></path></g>
<g id="copyright"><path d="M10.08 10.86c.05-.33.16-.62.3-.87s.34-.46.59-.62c.24-.15.54-.22.91-.23.23.01.44.05.63.13.2.09.38.21.52.36s.25.33.34.53.13.42.14.64h1.79c-.02-.47-.11-.9-.28-1.29s-.4-.73-.7-1.01-.66-.5-1.08-.66-.88-.23-1.39-.23c-.65 0-1.22.11-1.7.34s-.88.53-1.2.92-.56.84-.71 1.36S8 11.29 8 11.87v.27c0 .58.08 1.12.23 1.64s.39.97.71 1.35.72.69 1.2.91 1.05.34 1.7.34c.47 0 .91-.08 1.32-.23s.77-.36 1.08-.63.56-.58.74-.94.29-.74.3-1.15h-1.79c-.01.21-.06.4-.15.58s-.21.33-.36.46-.32.23-.52.3c-.19.07-.39.09-.6.1-.36-.01-.66-.08-.89-.23-.25-.16-.45-.37-.59-.62s-.25-.55-.3-.88-.08-.67-.08-1v-.27c0-.35.03-.68.08-1.01zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></g>
<g id="create"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></g>
<g id="create-new-folder"><path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z"></path></g>
<g id="credit-card"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"></path></g>
<g id="dashboard"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"></path></g>
<g id="date-range"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"></path></g>
<g id="delete"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></g>
<g id="delete-forever"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"></path></g>
<g id="delete-sweep"><path d="M15 16h4v2h-4zm0-8h7v2h-7zm0 4h6v2h-6zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8H3v10zM14 5h-3l-1-1H6L5 5H2v2h12z"></path></g>
<g id="description"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></g>
<g id="dns"><path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 3H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path></g>
<g id="done"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path></g>
<g id="done-all"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"></path></g>
<g id="donut-large"><path d="M11 5.08V2c-5 .5-9 4.81-9 10s4 9.5 9 10v-3.08c-3-.48-6-3.4-6-6.92s3-6.44 6-6.92zM18.97 11H22c-.47-5-4-8.53-9-9v3.08C16 5.51 18.54 8 18.97 11zM13 18.92V22c5-.47 8.53-4 9-9h-3.03c-.43 3-2.97 5.49-5.97 5.92z"></path></g>
<g id="donut-small"><path d="M11 9.16V2c-5 .5-9 4.79-9 10s4 9.5 9 10v-7.16c-1-.41-2-1.52-2-2.84s1-2.43 2-2.84zM14.86 11H22c-.48-4.75-4-8.53-9-9v7.16c1 .3 1.52.98 1.86 1.84zM13 14.84V22c5-.47 8.52-4.25 9-9h-7.14c-.34.86-.86 1.54-1.86 1.84z"></path></g>
<g id="drafts"><path d="M21.99 8c0-.72-.37-1.35-.94-1.7L12 1 2.95 6.3C2.38 6.65 2 7.28 2 8v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2l-.01-10zM12 13L3.74 7.84 12 3l8.26 4.84L12 13z"></path></g>
<g id="eject"><path d="M5 17h14v2H5zm7-12L5.33 15h13.34z"></path></g>
<g id="error"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></g>
<g id="error-outline"><path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path></g>
<g id="euro-symbol"><path d="M15 18.5c-2.51 0-4.68-1.42-5.76-3.5H15v-2H8.58c-.05-.33-.08-.66-.08-1s.03-.67.08-1H15V9H9.24C10.32 6.92 12.5 5.5 15 5.5c1.61 0 3.09.59 4.23 1.57L21 5.3C19.41 3.87 17.3 3 15 3c-3.92 0-7.24 2.51-8.48 6H3v2h3.06c-.04.33-.06.66-.06 1 0 .34.02.67.06 1H3v2h3.52c1.24 3.49 4.56 6 8.48 6 2.31 0 4.41-.87 6-2.3l-1.78-1.77c-1.13.98-2.6 1.57-4.22 1.57z"></path></g>
<g id="event"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"></path></g>
<g id="event-seat"><path d="M4 18v3h3v-3h10v3h3v-6H4zm15-8h3v3h-3zM2 10h3v3H2zm15 3H7V5c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v8z"></path></g>
<g id="exit-to-app"><path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></g>
<g id="expand-less"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"></path></g>
<g id="expand-more"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></g>
<g id="explore"><path d="M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z"></path></g>
<g id="extension"><path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"></path></g>
<g id="face"><path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z"></path></g>
<g id="favorite"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></g>
<g id="favorite-border"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"></path></g>
<g id="feedback"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"></path></g>
<g id="file-download"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></g>
<g id="file-upload"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path></g>
<g id="filter-list"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"></path></g>
<g id="find-in-page"><path d="M20 19.59V8l-6-6H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c.45 0 .85-.15 1.19-.4l-4.43-4.43c-.8.52-1.74.83-2.76.83-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5c0 1.02-.31 1.96-.83 2.75L20 19.59zM9 13c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3-3 1.34-3 3z"></path></g>
<g id="find-replace"><path d="M11 6c1.38 0 2.63.56 3.54 1.46L12 10h6V4l-2.05 2.05C14.68 4.78 12.93 4 11 4c-3.53 0-6.43 2.61-6.92 6H6.1c.46-2.28 2.48-4 4.9-4zm5.64 9.14c.66-.9 1.12-1.97 1.28-3.14H15.9c-.46 2.28-2.48 4-4.9 4-1.38 0-2.63-.56-3.54-1.46L10 12H4v6l2.05-2.05C7.32 17.22 9.07 18 11 18c1.55 0 2.98-.51 4.14-1.36L20 21.49 21.49 20l-4.85-4.86z"></path></g>
<g id="fingerprint"><path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28zM3.5 9.72c-.1 0-.2-.03-.29-.09-.23-.16-.28-.47-.12-.7.99-1.4 2.25-2.5 3.75-3.27C9.98 4.04 14 4.03 17.15 5.65c1.5.77 2.76 1.86 3.75 3.25.16.22.11.54-.12.7-.23.16-.54.11-.7-.12-.9-1.26-2.04-2.25-3.39-2.94-2.87-1.47-6.54-1.47-9.4.01-1.36.7-2.5 1.7-3.4 2.96-.08.14-.23.21-.39.21zm6.25 12.07c-.13 0-.26-.05-.35-.15-.87-.87-1.34-1.43-2.01-2.64-.69-1.23-1.05-2.73-1.05-4.34 0-2.97 2.54-5.39 5.66-5.39s5.66 2.42 5.66 5.39c0 .28-.22.5-.5.5s-.5-.22-.5-.5c0-2.42-2.09-4.39-4.66-4.39-2.57 0-4.66 1.97-4.66 4.39 0 1.44.32 2.77.93 3.85.64 1.15 1.08 1.64 1.85 2.42.19.2.19.51 0 .71-.11.1-.24.15-.37.15zm7.17-1.85c-1.19 0-2.24-.3-3.1-.89-1.49-1.01-2.38-2.65-2.38-4.39 0-.28.22-.5.5-.5s.5.22.5.5c0 1.41.72 2.74 1.94 3.56.71.48 1.54.71 2.54.71.24 0 .64-.03 1.04-.1.27-.05.53.13.58.41.05.27-.13.53-.41.58-.57.11-1.07.12-1.21.12zM14.91 22c-.04 0-.09-.01-.13-.02-1.59-.44-2.63-1.03-3.72-2.1-1.4-1.39-2.17-3.24-2.17-5.22 0-1.62 1.38-2.94 3.08-2.94 1.7 0 3.08 1.32 3.08 2.94 0 1.07.93 1.94 2.08 1.94s2.08-.87 2.08-1.94c0-3.77-3.25-6.83-7.25-6.83-2.84 0-5.44 1.58-6.61 4.03-.39.81-.59 1.76-.59 2.8 0 .78.07 2.01.67 3.61.1.26-.03.55-.29.64-.26.1-.55-.04-.64-.29-.49-1.31-.73-2.61-.73-3.96 0-1.2.23-2.29.68-3.24 1.33-2.79 4.28-4.6 7.51-4.6 4.55 0 8.25 3.51 8.25 7.83 0 1.62-1.38 2.94-3.08 2.94s-3.08-1.32-3.08-2.94c0-1.07-.93-1.94-2.08-1.94s-2.08.87-2.08 1.94c0 1.71.66 3.31 1.87 4.51.95.94 1.86 1.46 3.27 1.85.27.07.42.35.35.61-.05.23-.26.38-.47.38z"></path></g>
<g id="first-page"><path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z"></path></g>
<g id="flag"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"></path></g>
<g id="flight-land"><path d="M2.5 19h19v2h-19zm7.18-5.73l4.35 1.16 5.31 1.42c.8.21 1.62-.26 1.84-1.06.21-.8-.26-1.62-1.06-1.84l-5.31-1.42-2.76-9.02L10.12 2v8.28L5.15 8.95l-.93-2.32-1.45-.39v5.17l1.6.43 5.31 1.43z"></path></g>
<g id="flight-takeoff"><path d="M2.5 19h19v2h-19zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06L14.92 10l-6.9-6.43-1.93.51 4.14 7.17-4.97 1.33-1.97-1.54-1.45.39 1.82 3.16.77 1.33 1.6-.43 5.31-1.42 4.35-1.16L21 11.49c.81-.23 1.28-1.05 1.07-1.85z"></path></g>
<g id="flip-to-back"><path d="M9 7H7v2h2V7zm0 4H7v2h2v-2zm0-8c-1.11 0-2 .9-2 2h2V3zm4 12h-2v2h2v-2zm6-12v2h2c0-1.1-.9-2-2-2zm-6 0h-2v2h2V3zM9 17v-2H7c0 1.1.89 2 2 2zm10-4h2v-2h-2v2zm0-4h2V7h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zM5 7H3v12c0 1.1.89 2 2 2h12v-2H5V7zm10-2h2V3h-2v2zm0 12h2v-2h-2v2z"></path></g>
<g id="flip-to-front"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm2 4v-2H3c0 1.1.89 2 2 2zM3 9h2V7H3v2zm12 12h2v-2h-2v2zm4-18H9c-1.11 0-2 .9-2 2v10c0 1.1.89 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12H9V5h10v10zm-8 6h2v-2h-2v2zm-4 0h2v-2H7v2z"></path></g>
<g id="folder"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></g>
<g id="folder-open"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"></path></g>
<g id="folder-shared"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 8h-8v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1z"></path></g>
<g id="font-download"><path d="M9.93 13.5h4.14L12 7.98zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.17l-1.12 3H5.96l5.11-13h1.86l5.11 13h-2.09z"></path></g>
<g id="forward"><path d="M12 8V4l8 8-8 8v-4H4V8z"></path></g>
<g id="fullscreen"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path></g>
<g id="fullscreen-exit"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"></path></g>
<g id="g-translate"><path d="M20 5h-9.12L10 2H4c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h7l1 3h8c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zM7.17 14.59c-2.25 0-4.09-1.83-4.09-4.09s1.83-4.09 4.09-4.09c1.04 0 1.99.37 2.74 1.07l.07.06-1.23 1.18-.06-.05c-.29-.27-.78-.59-1.52-.59-1.31 0-2.38 1.09-2.38 2.42s1.07 2.42 2.38 2.42c1.37 0 1.96-.87 2.12-1.46H7.08V9.91h3.95l.01.07c.04.21.05.4.05.61 0 2.35-1.61 4-3.92 4zm6.03-1.71c.33.6.74 1.18 1.19 1.7l-.54.53-.65-2.23zm.77-.76h-.99l-.31-1.04h3.99s-.34 1.31-1.56 2.74c-.52-.62-.89-1.23-1.13-1.7zM21 20c0 .55-.45 1-1 1h-7l2-2-.81-2.77.92-.92L17.79 18l.73-.73-2.71-2.68c.9-1.03 1.6-2.25 1.92-3.51H19v-1.04h-3.64V9h-1.04v1.04h-1.96L11.18 6H20c.55 0 1 .45 1 1v13z"></path></g>
<g id="gavel"><path d="M1 21h12v2H1zM5.245 8.07l2.83-2.827 14.14 14.142-2.828 2.828zM12.317 1l5.657 5.656-2.83 2.83-5.654-5.66zM3.825 9.485l5.657 5.657-2.828 2.828-5.657-5.657z"></path></g>
<g id="gesture"><path d="M4.59 6.89c.7-.71 1.4-1.35 1.71-1.22.5.2 0 1.03-.3 1.52-.25.42-2.86 3.89-2.86 6.31 0 1.28.48 2.34 1.34 2.98.75.56 1.74.73 2.64.46 1.07-.31 1.95-1.4 3.06-2.77 1.21-1.49 2.83-3.44 4.08-3.44 1.63 0 1.65 1.01 1.76 1.79-3.78.64-5.38 3.67-5.38 5.37 0 1.7 1.44 3.09 3.21 3.09 1.63 0 4.29-1.33 4.69-6.1H21v-2.5h-2.47c-.15-1.65-1.09-4.2-4.03-4.2-2.25 0-4.18 1.91-4.94 2.84-.58.73-2.06 2.48-2.29 2.72-.25.3-.68.84-1.11.84-.45 0-.72-.83-.36-1.92.35-1.09 1.4-2.86 1.85-3.52.78-1.14 1.3-1.92 1.3-3.28C8.95 3.69 7.31 3 6.44 3 5.12 3 3.97 4 3.72 4.25c-.36.36-.66.66-.88.93l1.75 1.71zm9.29 11.66c-.31 0-.74-.26-.74-.72 0-.6.73-2.2 2.87-2.76-.3 2.69-1.43 3.48-2.13 3.48z"></path></g>
<g id="get-app"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></g>
<g id="gif"><path d="M11.5 9H13v6h-1.5zM9 9H6c-.6 0-1 .5-1 1v4c0 .5.4 1 1 1h3c.6 0 1-.5 1-1v-2H8.5v1.5h-2v-3H10V10c0-.5-.4-1-1-1zm10 1.5V9h-4.5v6H16v-2h2v-1.5h-2v-1z"></path></g>
<g id="grade"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></g>
<g id="group-work"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8 17.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM9.5 8c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5S9.5 9.38 9.5 8zm6.5 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path></g>
<g id="help"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"></path></g>
<g id="help-outline"><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"></path></g>
<g id="highlight-off"><path d="M14.59 8L12 10.59 9.41 8 8 9.41 10.59 12 8 14.59 9.41 16 12 13.41 14.59 16 16 14.59 13.41 12 16 9.41 14.59 8zM12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></g>
<g id="history"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"></path></g>
<g id="home"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"></path></g>
<g id="hourglass-empty"><path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z"></path></g>
<g id="hourglass-full"><path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z"></path></g>
<g id="http"><path d="M4.5 11h-2V9H1v6h1.5v-2.5h2V15H6V9H4.5v2zm2.5-.5h1.5V15H10v-4.5h1.5V9H7v1.5zm5.5 0H14V15h1.5v-4.5H17V9h-4.5v1.5zm9-1.5H18v6h1.5v-2h2c.8 0 1.5-.7 1.5-1.5v-1c0-.8-.7-1.5-1.5-1.5zm0 2.5h-2v-1h2v1z"></path></g>
<g id="https"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"></path></g>
<g id="important-devices"><path d="M23 11.01L18 11c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h5c.55 0 1-.45 1-1v-9c0-.55-.45-.99-1-.99zM23 20h-5v-7h5v7zM20 2H2C.89 2 0 2.89 0 4v12c0 1.1.89 2 2 2h7v2H7v2h8v-2h-2v-2h2v-2H2V4h18v5h2V4c0-1.11-.9-2-2-2zm-8.03 7L11 6l-.97 3H7l2.47 1.76-.94 2.91 2.47-1.8 2.47 1.8-.94-2.91L15 9h-3.03z"></path></g>
<g id="inbox"><path d="M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z"></path></g>
<g id="indeterminate-check-box"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z"></path></g>
<g id="info"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path></g>
<g id="info-outline"><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"></path></g>
<g id="input"><path d="M21 3.01H3c-1.1 0-2 .9-2 2V9h2V4.99h18v14.03H3V15H1v4.01c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98v-14c0-1.11-.9-2-2-2zM11 16l4-4-4-4v3H1v2h10v3z"></path></g>
<g id="invert-colors"><path d="M17.66 7.93L12 2.27 6.34 7.93c-3.12 3.12-3.12 8.19 0 11.31C7.9 20.8 9.95 21.58 12 21.58c2.05 0 4.1-.78 5.66-2.34 3.12-3.12 3.12-8.19 0-11.31zM12 19.59c-1.6 0-3.11-.62-4.24-1.76C6.62 16.69 6 15.19 6 13.59s.62-3.11 1.76-4.24L12 5.1v14.49z"></path></g>
<g id="label"><path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"></path></g>
<g id="label-outline"><path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM16 17H5V7h11l3.55 5L16 17z"></path></g>
<g id="language"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"></path></g>
<g id="last-page"><path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"></path></g>
<g id="launch"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"></path></g>
<g id="lightbulb-outline"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"></path></g>
<g id="line-style"><path d="M3 16h5v-2H3v2zm6.5 0h5v-2h-5v2zm6.5 0h5v-2h-5v2zM3 20h2v-2H3v2zm4 0h2v-2H7v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2zM3 12h8v-2H3v2zm10 0h8v-2h-8v2zM3 4v4h18V4H3z"></path></g>
<g id="line-weight"><path d="M3 17h18v-2H3v2zm0 3h18v-1H3v1zm0-7h18v-3H3v3zm0-9v4h18V4H3z"></path></g>
<g id="link"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"></path></g>
<g id="list"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"></path></g>
<g id="lock"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"></path></g>
<g id="lock-open"><path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"></path></g>
<g id="lock-outline"><path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H8.9V6zM18 20H6V10h12v10z"></path></g>
<g id="low-priority"><path d="M14 5h8v2h-8zm0 5.5h8v2h-8zm0 5.5h8v2h-8zM2 11.5C2 15.08 4.92 18 8.5 18H9v2l3-3-3-3v2h-.5C6.02 16 4 13.98 4 11.5S6.02 7 8.5 7H12V5H8.5C4.92 5 2 7.92 2 11.5z"></path></g>
<g id="loyalty"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7zm11.77 8.27L13 19.54l-4.27-4.27C8.28 14.81 8 14.19 8 13.5c0-1.38 1.12-2.5 2.5-2.5.69 0 1.32.28 1.77.74l.73.72.73-.73c.45-.45 1.08-.73 1.77-.73 1.38 0 2.5 1.12 2.5 2.5 0 .69-.28 1.32-.73 1.77z"></path></g>
<g id="mail"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"></path></g>
<g id="markunread"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"></path></g>
<g id="markunread-mailbox"><path d="M20 6H10v6H8V4h6V0H6v6H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"></path></g>
<g id="menu"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path></g>
<g id="more-horiz"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></g>
<g id="more-vert"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></g>
<g id="motorcycle"><path d="M19.44 9.03L15.41 5H11v2h3.59l2 2H5c-2.8 0-5 2.2-5 5s2.2 5 5 5c2.46 0 4.45-1.69 4.9-4h1.65l2.77-2.77c-.21.54-.32 1.14-.32 1.77 0 2.8 2.2 5 5 5s5-2.2 5-5c0-2.65-1.97-4.77-4.56-4.97zM7.82 15C7.4 16.15 6.28 17 5 17c-1.63 0-3-1.37-3-3s1.37-3 3-3c1.28 0 2.4.85 2.82 2H5v2h2.82zM19 17c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"></path></g>
<g id="move-to-inbox"><path d="M19 3H4.99c-1.11 0-1.98.9-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10zm-3-5h-2V7h-4v3H8l4 4 4-4z"></path></g>
<g id="next-week"><path d="M20 7h-4V5c0-.55-.22-1.05-.59-1.41C15.05 3.22 14.55 3 14 3h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 5h4v2h-4V5zm1 13.5l-1-1 3-3-3-3 1-1 4 4-4 4z"></path></g>
<g id="note-add"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L18.5 9H13z"></path></g>
<g id="offline-pin"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm5 16H7v-2h10v2zm-6.7-4L7 10.7l1.4-1.4 1.9 1.9 5.3-5.3L17 7.3 10.3 14z"></path></g>
<g id="opacity"><path d="M17.66 8L12 2.35 6.34 8C4.78 9.56 4 11.64 4 13.64s.78 4.11 2.34 5.67 3.61 2.35 5.66 2.35 4.1-.79 5.66-2.35S20 15.64 20 13.64 19.22 9.56 17.66 8zM6 14c.01-2 .62-3.27 1.76-4.4L12 5.27l4.24 4.38C17.38 10.77 17.99 12 18 14H6z"></path></g>
<g id="open-in-browser"><path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h4v-2H5V8h14v10h-4v2h4c1.1 0 2-.9 2-2V6c0-1.1-.89-2-2-2zm-7 6l-4 4h3v6h2v-6h3l-4-4z"></path></g>
<g id="open-in-new"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"></path></g>
<g id="open-with"><path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"></path></g>
<g id="pageview"><path d="M11.5 9C10.12 9 9 10.12 9 11.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5S12.88 9 11.5 9zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-3.21 14.21l-2.91-2.91c-.69.44-1.51.7-2.39.7C9.01 16 7 13.99 7 11.5S9.01 7 11.5 7 16 9.01 16 11.5c0 .88-.26 1.69-.7 2.39l2.91 2.9-1.42 1.42z"></path></g>
<g id="pan-tool"><path d="M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z"></path></g>
<g id="payment"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"></path></g>
<g id="perm-camera-mic"><path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v-2.09c-2.83-.48-5-2.94-5-5.91h2c0 2.21 1.79 4 4 4s4-1.79 4-4h2c0 2.97-2.17 5.43-5 5.91V21h7c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-6 8c0 1.1-.9 2-2 2s-2-.9-2-2V9c0-1.1.9-2 2-2s2 .9 2 2v4z"></path></g>
<g id="perm-contact-calendar"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z"></path></g>
<g id="perm-data-setting"><path d="M18.99 11.5c.34 0 .67.03 1 .07L20 0 0 20h11.56c-.04-.33-.07-.66-.07-1 0-4.14 3.36-7.5 7.5-7.5zm3.71 7.99c.02-.16.04-.32.04-.49 0-.17-.01-.33-.04-.49l1.06-.83c.09-.08.12-.21.06-.32l-1-1.73c-.06-.11-.19-.15-.31-.11l-1.24.5c-.26-.2-.54-.37-.85-.49l-.19-1.32c-.01-.12-.12-.21-.24-.21h-2c-.12 0-.23.09-.25.21l-.19 1.32c-.3.13-.59.29-.85.49l-1.24-.5c-.11-.04-.24 0-.31.11l-1 1.73c-.06.11-.04.24.06.32l1.06.83c-.02.16-.03.32-.03.49 0 .17.01.33.03.49l-1.06.83c-.09.08-.12.21-.06.32l1 1.73c.06.11.19.15.31.11l1.24-.5c.26.2.54.37.85.49l.19 1.32c.02.12.12.21.25.21h2c.12 0 .23-.09.25-.21l.19-1.32c.3-.13.59-.29.84-.49l1.25.5c.11.04.24 0 .31-.11l1-1.73c.06-.11.03-.24-.06-.32l-1.07-.83zm-3.71 1.01c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path></g>
<g id="perm-device-information"><path d="M13 7h-2v2h2V7zm0 4h-2v6h2v-6zm4-9.99L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"></path></g>
<g id="perm-identity"><path d="M12 5.9c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1S9.9 9.16 9.9 8s.94-2.1 2.1-2.1m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"></path></g>
<g id="perm-media"><path d="M2 6H0v5h.01L0 20c0 1.1.9 2 2 2h18v-2H2V6zm20-2h-8l-2-2H6c-1.1 0-1.99.9-1.99 2L4 16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM7 15l4.5-6 3.5 4.51 2.5-3.01L21 15H7z"></path></g>
<g id="perm-phone-msg"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.58l2.2-2.21c.28-.27.36-.66.25-1.01C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM12 3v10l3-3h6V3h-9z"></path></g>
<g id="perm-scan-wifi"><path d="M12 3C6.95 3 3.15 4.85 0 7.23L12 22 24 7.25C20.85 4.87 17.05 3 12 3zm1 13h-2v-6h2v6zm-2-8V6h2v2h-2z"></path></g>
<g id="pets"><circle cx="4.5" cy="9.5" r="2.5"></circle><circle cx="9" cy="5.5" r="2.5"></circle><circle cx="15" cy="5.5" r="2.5"></circle><circle cx="19.5" cy="9.5" r="2.5"></circle><path d="M17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02 1.02 2.03 2.33 2.32.73.15 3.06-.44 5.54-.44h.18c2.48 0 4.81.58 5.54.44 1.31-.29 2.04-1.31 2.33-2.32.31-2.04-1.3-3.49-2.61-4.8z"></path></g>
<g id="picture-in-picture"><path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z"></path></g>
<g id="picture-in-picture-alt"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"></path></g>
<g id="play-for-work"><path d="M11 5v5.59H7.5l4.5 4.5 4.5-4.5H13V5h-2zm-5 9c0 3.31 2.69 6 6 6s6-2.69 6-6h-2c0 2.21-1.79 4-4 4s-4-1.79-4-4H6z"></path></g>
<g id="polymer"><path d="M19 4h-4L7.11 16.63 4.5 12 9 4H5L.5 12 5 20h4l7.89-12.63L19.5 12 15 20h4l4.5-8z"></path></g>
<g id="power-settings-new"><path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"></path></g>
<g id="pregnant-woman"><path d="M9 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm7 9c-.01-1.34-.83-2.51-2-3 0-1.66-1.34-3-3-3s-3 1.34-3 3v7h2v5h3v-5h3v-4z"></path></g>
<g id="print"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"></path></g>
<g id="query-builder"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"></path></g>
<g id="question-answer"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"></path></g>
<g id="radio-button-checked"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path></g>
<g id="radio-button-unchecked"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path></g>
<g id="receipt"><path d="M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20z"></path></g>
<g id="record-voice-over"><circle cx="9" cy="9" r="4"></circle><path d="M9 15c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm7.76-9.64l-1.68 1.69c.84 1.18.84 2.71 0 3.89l1.68 1.69c2.02-2.02 2.02-5.07 0-7.27zM20.07 2l-1.63 1.63c2.77 3.02 2.77 7.56 0 10.74L20.07 16c3.9-3.89 3.91-9.95 0-14z"></path></g>
<g id="redeem"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"></path></g>
<g id="redo"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"></path></g>
<g id="refresh"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></g>
<g id="remove"><path d="M19 13H5v-2h14v2z"></path></g>
<g id="remove-circle"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"></path></g>
<g id="remove-circle-outline"><path d="M7 11v2h10v-2H7zm5-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></g>
<g id="remove-shopping-cart"><path d="M22.73 22.73L2.77 2.77 2 2l-.73-.73L0 2.54l4.39 4.39 2.21 4.66-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h7.46l1.38 1.38c-.5.36-.83.95-.83 1.62 0 1.1.89 2 1.99 2 .67 0 1.26-.33 1.62-.84L21.46 24l1.27-1.27zM7.42 15c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h2.36l2 2H7.42zm8.13-2c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H6.54l9.01 9zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2z"></path></g>
<g id="reorder"><path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"></path></g>
<g id="reply"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"></path></g>
<g id="reply-all"><path d="M7 8V5l-7 7 7 7v-3l-4-4 4-4zm6 1V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"></path></g>
<g id="report"><path d="M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM12 17.3c-.72 0-1.3-.58-1.3-1.3 0-.72.58-1.3 1.3-1.3.72 0 1.3.58 1.3 1.3 0 .72-.58 1.3-1.3 1.3zm1-4.3h-2V7h2v6z"></path></g>
<g id="report-problem"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"></path></g>
<g id="restore"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"></path></g>
<g id="restore-page"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-2 16c-2.05 0-3.81-1.24-4.58-3h1.71c.63.9 1.68 1.5 2.87 1.5 1.93 0 3.5-1.57 3.5-3.5S13.93 9.5 12 9.5c-1.35 0-2.52.78-3.1 1.9l1.6 1.6h-4V9l1.3 1.3C8.69 8.92 10.23 8 12 8c2.76 0 5 2.24 5 5s-2.24 5-5 5z"></path></g>
<g id="room"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path></g>
<g id="rounded-corner"><path d="M19 19h2v2h-2v-2zm0-2h2v-2h-2v2zM3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm0-4h2V3H3v2zm4 0h2V3H7v2zm8 16h2v-2h-2v2zm-4 0h2v-2h-2v2zm4 0h2v-2h-2v2zm-8 0h2v-2H7v2zm-4 0h2v-2H3v2zM21 8c0-2.76-2.24-5-5-5h-5v2h5c1.65 0 3 1.35 3 3v5h2V8z"></path></g>
<g id="rowing"><path d="M8.5 14.5L4 19l1.5 1.5L9 17h2l-2.5-2.5zM15 1c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 20.01L18 24l-2.99-3.01V19.5l-7.1-7.09c-.31.05-.61.07-.91.07v-2.16c1.66.03 3.61-.87 4.67-2.04l1.4-1.55c.19-.21.43-.38.69-.5.29-.14.62-.23.96-.23h.03C15.99 6.01 17 7.02 17 8.26v5.75c0 .84-.35 1.61-.92 2.16l-3.58-3.58v-2.27c-.63.52-1.43 1.02-2.29 1.39L16.5 18H18l3 3.01z"></path></g>
<g id="save"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"></path></g>
<g id="schedule"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"></path></g>
<g id="search"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></g>
<g id="select-all"><path d="M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2zM7 17h10V7H7v10zm2-8h6v6H9V9z"></path></g>
<g id="send"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></g>
<g id="settings"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"></path></g>
<g id="settings-applications"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm7-7H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-1.75 9c0 .23-.02.46-.05.68l1.48 1.16c.13.11.17.3.08.45l-1.4 2.42c-.09.15-.27.21-.43.15l-1.74-.7c-.36.28-.76.51-1.18.69l-.26 1.85c-.03.17-.18.3-.35.3h-2.8c-.17 0-.32-.13-.35-.29l-.26-1.85c-.43-.18-.82-.41-1.18-.69l-1.74.7c-.16.06-.34 0-.43-.15l-1.4-2.42c-.09-.15-.05-.34.08-.45l1.48-1.16c-.03-.23-.05-.46-.05-.69 0-.23.02-.46.05-.68l-1.48-1.16c-.13-.11-.17-.3-.08-.45l1.4-2.42c.09-.15.27-.21.43-.15l1.74.7c.36-.28.76-.51 1.18-.69l.26-1.85c.03-.17.18-.3.35-.3h2.8c.17 0 .32.13.35.29l.26 1.85c.43.18.82.41 1.18.69l1.74-.7c.16-.06.34 0 .43.15l1.4 2.42c.09.15.05.34-.08.45l-1.48 1.16c.03.23.05.46.05.69z"></path></g>
<g id="settings-backup-restore"><path d="M14 12c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-2-9c-4.97 0-9 4.03-9 9H0l4 4 4-4H5c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.51 0-2.91-.49-4.06-1.3l-1.42 1.44C8.04 20.3 9.94 21 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"></path></g>
<g id="settings-bluetooth"><path d="M11 24h2v-2h-2v2zm-4 0h2v-2H7v2zm8 0h2v-2h-2v2zm2.71-18.29L12 0h-1v7.59L6.41 3 5 4.41 10.59 10 5 15.59 6.41 17 11 12.41V20h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 3.83l1.88 1.88L13 7.59V3.83zm1.88 10.46L13 16.17v-3.76l1.88 1.88z"></path></g>
<g id="settings-brightness"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02zM8 16h2.5l1.5 1.5 1.5-1.5H16v-2.5l1.5-1.5-1.5-1.5V8h-2.5L12 6.5 10.5 8H8v2.5L6.5 12 8 13.5V16zm4-7c1.66 0 3 1.34 3 3s-1.34 3-3 3V9z"></path></g>
<g id="settings-cell"><path d="M7 24h2v-2H7v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2zM16 .01L8 0C6.9 0 6 .9 6 2v16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V2c0-1.1-.9-1.99-2-1.99zM16 16H8V4h8v12z"></path></g>
<g id="settings-ethernet"><path d="M7.77 6.76L6.23 5.48.82 12l5.41 6.52 1.54-1.28L3.42 12l4.35-5.24zM7 13h2v-2H7v2zm10-2h-2v2h2v-2zm-6 2h2v-2h-2v2zm6.77-7.52l-1.54 1.28L20.58 12l-4.35 5.24 1.54 1.28L23.18 12l-5.41-6.52z"></path></g>
<g id="settings-input-antenna"><path d="M12 5c-3.87 0-7 3.13-7 7h2c0-2.76 2.24-5 5-5s5 2.24 5 5h2c0-3.87-3.13-7-7-7zm1 9.29c.88-.39 1.5-1.26 1.5-2.29 0-1.38-1.12-2.5-2.5-2.5S9.5 10.62 9.5 12c0 1.02.62 1.9 1.5 2.29v3.3L7.59 21 9 22.41l3-3 3 3L16.41 21 13 17.59v-3.3zM12 1C5.93 1 1 5.93 1 12h2c0-4.97 4.03-9 9-9s9 4.03 9 9h2c0-6.07-4.93-11-11-11z"></path></g>
<g id="settings-input-component"><path d="M5 2c0-.55-.45-1-1-1s-1 .45-1 1v4H1v6h6V6H5V2zm4 14c0 1.3.84 2.4 2 2.82V23h2v-4.18c1.16-.41 2-1.51 2-2.82v-2H9v2zm-8 0c0 1.3.84 2.4 2 2.82V23h2v-4.18C6.16 18.4 7 17.3 7 16v-2H1v2zM21 6V2c0-.55-.45-1-1-1s-1 .45-1 1v4h-2v6h6V6h-2zm-8-4c0-.55-.45-1-1-1s-1 .45-1 1v4H9v6h6V6h-2V2zm4 14c0 1.3.84 2.4 2 2.82V23h2v-4.18c1.16-.41 2-1.51 2-2.82v-2h-6v2z"></path></g>
<g id="settings-input-composite"><path d="M5 2c0-.55-.45-1-1-1s-1 .45-1 1v4H1v6h6V6H5V2zm4 14c0 1.3.84 2.4 2 2.82V23h2v-4.18c1.16-.41 2-1.51 2-2.82v-2H9v2zm-8 0c0 1.3.84 2.4 2 2.82V23h2v-4.18C6.16 18.4 7 17.3 7 16v-2H1v2zM21 6V2c0-.55-.45-1-1-1s-1 .45-1 1v4h-2v6h6V6h-2zm-8-4c0-.55-.45-1-1-1s-1 .45-1 1v4H9v6h6V6h-2V2zm4 14c0 1.3.84 2.4 2 2.82V23h2v-4.18c1.16-.41 2-1.51 2-2.82v-2h-6v2z"></path></g>
<g id="settings-input-hdmi"><path d="M18 7V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v3H5v6l3 6v3h8v-3l3-6V7h-1zM8 4h8v3h-2V5h-1v2h-2V5h-1v2H8V4z"></path></g>
<g id="settings-input-svideo"><path d="M8 11.5c0-.83-.67-1.5-1.5-1.5S5 10.67 5 11.5 5.67 13 6.5 13 8 12.33 8 11.5zm7-5c0-.83-.67-1.5-1.5-1.5h-3C9.67 5 9 5.67 9 6.5S9.67 8 10.5 8h3c.83 0 1.5-.67 1.5-1.5zM8.5 15c-.83 0-1.5.67-1.5 1.5S7.67 18 8.5 18s1.5-.67 1.5-1.5S9.33 15 8.5 15zM12 1C5.93 1 1 5.93 1 12s4.93 11 11 11 11-4.93 11-11S18.07 1 12 1zm0 20c-4.96 0-9-4.04-9-9s4.04-9 9-9 9 4.04 9 9-4.04 9-9 9zm5.5-11c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-2 5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"></path></g>
<g id="settings-overscan"><path d="M12.01 5.5L10 8h4l-1.99-2.5zM18 10v4l2.5-1.99L18 10zM6 10l-2.5 2.01L6 14v-4zm8 6h-4l2.01 2.5L14 16zm7-13H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z"></path></g>
<g id="settings-phone"><path d="M13 9h-2v2h2V9zm4 0h-2v2h2V9zm3 6.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.58l2.2-2.21c.28-.27.36-.66.25-1.01C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 9v2h2V9h-2z"></path></g>
<g id="settings-power"><path d="M7 24h2v-2H7v2zm4 0h2v-2h-2v2zm2-22h-2v10h2V2zm3.56 2.44l-1.45 1.45C16.84 6.94 18 8.83 18 11c0 3.31-2.69 6-6 6s-6-2.69-6-6c0-2.17 1.16-4.06 2.88-5.12L7.44 4.44C5.36 5.88 4 8.28 4 11c0 4.42 3.58 8 8 8s8-3.58 8-8c0-2.72-1.36-5.12-3.44-6.56zM15 24h2v-2h-2v2z"></path></g>
<g id="settings-remote"><path d="M15 9H9c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V10c0-.55-.45-1-1-1zm-3 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM7.05 6.05l1.41 1.41C9.37 6.56 10.62 6 12 6s2.63.56 3.54 1.46l1.41-1.41C15.68 4.78 13.93 4 12 4s-3.68.78-4.95 2.05zM12 0C8.96 0 6.21 1.23 4.22 3.22l1.41 1.41C7.26 3.01 9.51 2 12 2s4.74 1.01 6.36 2.64l1.41-1.41C17.79 1.23 15.04 0 12 0z"></path></g>
<g id="settings-voice"><path d="M7 24h2v-2H7v2zm5-11c1.66 0 2.99-1.34 2.99-3L15 4c0-1.66-1.34-3-3-3S9 2.34 9 4v6c0 1.66 1.34 3 3 3zm-1 11h2v-2h-2v2zm4 0h2v-2h-2v2zm4-14h-1.7c0 3-2.54 5.1-5.3 5.1S6.7 13 6.7 10H5c0 3.41 2.72 6.23 6 6.72V20h2v-3.28c3.28-.49 6-3.31 6-6.72z"></path></g>
<g id="shop"><path d="M16 6V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H2v13c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6h-6zm-6-2h4v2h-4V4zM9 18V9l7.5 4L9 18z"></path></g>
<g id="shop-two"><path d="M3 9H1v11c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2H3V9zm15-4V3c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H5v11c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2V5h-5zm-6-2h4v2h-4V3zm0 12V8l5.5 3-5.5 4z"></path></g>
<g id="shopping-basket"><path d="M17.21 9l-4.38-6.56c-.19-.28-.51-.42-.83-.42-.32 0-.64.14-.83.43L6.79 9H2c-.55 0-1 .45-1 1 0 .09.01.18.04.27l2.54 9.27c.23.84 1 1.46 1.92 1.46h13c.92 0 1.69-.62 1.93-1.46l2.54-9.27L23 10c0-.55-.45-1-1-1h-4.79zM9 9l3-4.4L15 9H9zm3 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path></g>
<g id="shopping-cart"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"></path></g>
<g id="sort"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"></path></g>
<g id="speaker-notes"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 14H6v-2h2v2zm0-3H6V9h2v2zm0-3H6V6h2v2zm7 6h-5v-2h5v2zm3-3h-8V9h8v2zm0-3h-8V6h8v2z"></path></g>
<g id="speaker-notes-off"><path d="M10.54 11l-.54-.54L7.54 8 6 6.46 2.38 2.84 1.27 1.73 0 3l2.01 2.01L2 22l4-4h9l5.73 5.73L22 22.46 17.54 18l-7-7zM8 14H6v-2h2v2zm-2-3V9l2 2H6zm14-9H4.08L10 7.92V6h8v2h-7.92l1 1H18v2h-4.92l6.99 6.99C21.14 17.95 22 17.08 22 16V4c0-1.1-.9-2-2-2z"></path></g>
<g id="spellcheck"><path d="M12.45 16h2.09L9.43 3H7.57L2.46 16h2.09l1.12-3h5.64l1.14 3zm-6.02-5L8.5 5.48 10.57 11H6.43zm15.16.59l-8.09 8.09L9.83 16l-1.41 1.41 5.09 5.09L23 13l-1.41-1.41z"></path></g>
<g id="star"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></g>
<g id="star-border"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"></path></g>
<g id="star-half"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4V6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"></path></g>
<g id="stars"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z"></path></g>
<g id="store"><path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"></path></g>
<g id="subdirectory-arrow-left"><path d="M11 9l1.42 1.42L8.83 14H18V4h2v12H8.83l3.59 3.58L11 21l-6-6 6-6z"></path></g>
<g id="subdirectory-arrow-right"><path d="M19 15l-6 6-1.42-1.42L15.17 16H4V4h2v10h9.17l-3.59-3.58L13 9l6 6z"></path></g>
<g id="subject"><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"></path></g>
<g id="supervisor-account"><path d="M16.5 12c1.38 0 2.49-1.12 2.49-2.5S17.88 7 16.5 7C15.12 7 14 8.12 14 9.5s1.12 2.5 2.5 2.5zM9 11c1.66 0 2.99-1.34 2.99-3S10.66 5 9 5C7.34 5 6 6.34 6 8s1.34 3 3 3zm7.5 3c-1.83 0-5.5.92-5.5 2.75V19h11v-2.25c0-1.83-3.67-2.75-5.5-2.75zM9 13c-2.33 0-7 1.17-7 3.5V19h7v-2.25c0-.85.33-2.34 2.37-3.47C10.5 13.1 9.66 13 9 13z"></path></g>
<g id="swap-horiz"><path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"></path></g>
<g id="swap-vert"><path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"></path></g>
<g id="swap-vertical-circle"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM6.5 9L10 5.5 13.5 9H11v4H9V9H6.5zm11 6L14 18.5 10.5 15H13v-4h2v4h2.5z"></path></g>
<g id="system-update-alt"><path d="M12 16.5l4-4h-3v-9h-2v9H8l4 4zm9-13h-6v1.99h6v14.03H3V5.49h6V3.5H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2v-14c0-1.1-.9-2-2-2z"></path></g>
<g id="tab"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h10v4h8v10z"></path></g>
<g id="tab-unselected"><path d="M1 9h2V7H1v2zm0 4h2v-2H1v2zm0-8h2V3c-1.1 0-2 .9-2 2zm8 16h2v-2H9v2zm-8-4h2v-2H1v2zm2 4v-2H1c0 1.1.9 2 2 2zM21 3h-8v6h10V5c0-1.1-.9-2-2-2zm0 14h2v-2h-2v2zM9 5h2V3H9v2zM5 21h2v-2H5v2zM5 5h2V3H5v2zm16 16c1.1 0 2-.9 2-2h-2v2zm0-8h2v-2h-2v2zm-8 8h2v-2h-2v2zm4 0h2v-2h-2v2z"></path></g>
<g id="text-format"><path d="M5 17v2h14v-2H5zm4.5-4.2h5l.9 2.2h2.1L12.75 4h-1.5L6.5 15h2.1l.9-2.2zM12 5.98L13.87 11h-3.74L12 5.98z"></path></g>
<g id="theaters"><path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"></path></g>
<g id="thumb-down"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"></path></g>
<g id="thumb-up"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"></path></g>
<g id="thumbs-up-down"><path d="M12 6c0-.55-.45-1-1-1H5.82l.66-3.18.02-.23c0-.31-.13-.59-.33-.8L5.38 0 .44 4.94C.17 5.21 0 5.59 0 6v6.5c0 .83.67 1.5 1.5 1.5h6.75c.62 0 1.15-.38 1.38-.91l2.26-5.29c.07-.17.11-.36.11-.55V6zm10.5 4h-6.75c-.62 0-1.15.38-1.38.91l-2.26 5.29c-.07.17-.11.36-.11.55V18c0 .55.45 1 1 1h5.18l-.66 3.18-.02.24c0 .31.13.59.33.8l.79.78 4.94-4.94c.27-.27.44-.65.44-1.06v-6.5c0-.83-.67-1.5-1.5-1.5z"></path></g>
<g id="timeline"><path d="M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-.51-.07l-3.56 3.55c.05.16.07.34.07.52 0 1.1-.9 2-2 2s-2-.9-2-2c0-.18.02-.36.07-.52l-2.55-2.55c-.16.05-.34.07-.52.07s-.36-.02-.52-.07l-4.55 4.56c.05.16.07.33.07.51 0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.18 0 .35.02.51.07l4.56-4.55C8.02 9.36 8 9.18 8 9c0-1.1.9-2 2-2s2 .9 2 2c0 .18-.02.36-.07.52l2.55 2.55c.16-.05.34-.07.52-.07s.36.02.52.07l3.55-3.56C19.02 8.35 19 8.18 19 8c0-1.1.9-2 2-2s2 .9 2 2z"></path></g>
<g id="toc"><path d="M3 9h14V7H3v2zm0 4h14v-2H3v2zm0 4h14v-2H3v2zm16 0h2v-2h-2v2zm0-10v2h2V7h-2zm0 6h2v-2h-2v2z"></path></g>
<g id="today"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"></path></g>
<g id="toll"><path d="M15 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zM3 12c0-2.61 1.67-4.83 4-5.65V4.26C3.55 5.15 1 8.27 1 12s2.55 6.85 6 7.74v-2.09c-2.33-.82-4-3.04-4-5.65z"></path></g>
<g id="touch-app"><path d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"></path></g>
<g id="track-changes"><path d="M19.07 4.93l-1.41 1.41C19.1 7.79 20 9.79 20 12c0 4.42-3.58 8-8 8s-8-3.58-8-8c0-4.08 3.05-7.44 7-7.93v2.02C8.16 6.57 6 9.03 6 12c0 3.31 2.69 6 6 6s6-2.69 6-6c0-1.66-.67-3.16-1.76-4.24l-1.41 1.41C15.55 9.9 16 10.9 16 12c0 2.21-1.79 4-4 4s-4-1.79-4-4c0-1.86 1.28-3.41 3-3.86v2.14c-.6.35-1 .98-1 1.72 0 1.1.9 2 2 2s2-.9 2-2c0-.74-.4-1.38-1-1.72V2h-1C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10c0-2.76-1.12-5.26-2.93-7.07z"></path></g>
<g id="translate"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"></path></g>
<g id="trending-down"><path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z"></path></g>
<g id="trending-flat"><path d="M22 12l-4-4v3H3v2h15v3z"></path></g>
<g id="trending-up"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"></path></g>
<g id="turned-in"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"></path></g>
<g id="turned-in-not"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"></path></g>
<g id="unarchive"><path d="M20.55 5.22l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.15.55L3.46 5.22C3.17 5.57 3 6.01 3 6.5V19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.49-.17-.93-.45-1.28zM12 9.5l5.5 5.5H14v2h-4v-2H6.5L12 9.5zM5.12 5l.82-1h12l.93 1H5.12z"></path></g>
<g id="undo"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"></path></g>
<g id="unfold-less"><path d="M7.41 18.59L8.83 20 12 16.83 15.17 20l1.41-1.41L12 14l-4.59 4.59zm9.18-13.18L15.17 4 12 7.17 8.83 4 7.41 5.41 12 10l4.59-4.59z"></path></g>
<g id="unfold-more"><path d="M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z"></path></g>
<g id="update"><path d="M21 10.12h-6.78l2.74-2.82c-2.73-2.7-7.15-2.8-9.88-.1-2.73 2.71-2.73 7.08 0 9.79 2.73 2.71 7.15 2.71 9.88 0C18.32 15.65 19 14.08 19 12.1h2c0 1.98-.88 4.55-2.64 6.29-3.51 3.48-9.21 3.48-12.72 0-3.5-3.47-3.53-9.11-.02-12.58 3.51-3.47 9.14-3.47 12.65 0L21 3v7.12zM12.5 8v4.25l3.5 2.08-.72 1.21L11 13V8h1.5z"></path></g>
<g id="verified-user"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path></g>
<g id="view-agenda"><path d="M20 13H3c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h17c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zm0-10H3c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h17c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1z"></path></g>
<g id="view-array"><path d="M4 18h3V5H4v13zM18 5v13h3V5h-3zM8 18h9V5H8v13z"></path></g>
<g id="view-carousel"><path d="M7 19h10V4H7v15zm-5-2h4V6H2v11zM18 6v11h4V6h-4z"></path></g>
<g id="view-column"><path d="M10 18h5V5h-5v13zm-6 0h5V5H4v13zM16 5v13h5V5h-5z"></path></g>
<g id="view-day"><path d="M2 21h19v-3H2v3zM20 8H3c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h17c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zM2 3v3h19V3H2z"></path></g>
<g id="view-headline"><path d="M4 15h16v-2H4v2zm0 4h16v-2H4v2zm0-8h16V9H4v2zm0-6v2h16V5H4z"></path></g>
<g id="view-list"><path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z"></path></g>
<g id="view-module"><path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z"></path></g>
<g id="view-quilt"><path d="M10 18h5v-6h-5v6zm-6 0h5V5H4v13zm12 0h5v-6h-5v6zM10 5v6h11V5H10z"></path></g>
<g id="view-stream"><path d="M4 18h17v-6H4v6zM4 5v6h17V5H4z"></path></g>
<g id="view-week"><path d="M6 5H3c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h3c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1zm14 0h-3c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h3c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1zm-7 0h-3c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h3c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1z"></path></g>
<g id="visibility"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></g>
<g id="visibility-off"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"></path></g>
<g id="warning"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"></path></g>
<g id="watch-later"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"></path></g>
<g id="weekend"><path d="M21 10c-1.1 0-2 .9-2 2v3H5v-3c0-1.1-.9-2-2-2s-2 .9-2 2v5c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2zm-3-5H6c-1.1 0-2 .9-2 2v2.15c1.16.41 2 1.51 2 2.82V14h12v-2.03c0-1.3.84-2.4 2-2.82V7c0-1.1-.9-2-2-2z"></path></g>
<g id="work"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"></path></g>
<g id="youtube-searched-for"><path d="M17.01 14h-.8l-.27-.27c.98-1.14 1.57-2.61 1.57-4.23 0-3.59-2.91-6.5-6.5-6.5s-6.5 3-6.5 6.5H2l3.84 4 4.16-4H6.51C6.51 7 8.53 5 11.01 5s4.5 2.01 4.5 4.5c0 2.48-2.02 4.5-4.5 4.5-.65 0-1.26-.14-1.82-.38L7.71 15.1c.97.57 2.09.9 3.3.9 1.61 0 3.08-.59 4.22-1.57l.27.27v.79l5.01 4.99L22 19l-4.99-5z"></path></g>
<g id="zoom-in"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm2.5-4h-2v2H9v-2H7V9h2V7h1v2h2v1z"></path></g>
<g id="zoom-out"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z"></path></g>
</defs></svg>
</iron-iconset-svg>`;document.head.appendChild($_documentContainer$1);/**
                                                  @license
                                                  Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
                                                  This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
                                                  The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
                                                  The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
                                                  Code distributed by Google as part of the polymer project is also
                                                  subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
                                                  */ /**
                                                     
                                                     `iron-icons` is a utility import that includes the definition for the `iron-icon` element, `iron-iconset-svg` element, as well as an import for the default icon set.
                                                     
                                                     The `iron-icons` directory also includes imports for additional icon sets that can be loaded into your project.
                                                     
                                                     Example loading icon set:
                                                     
                                                         <link rel="import" href="../iron-icons/maps-icons.html">
                                                     
                                                     To use an icon from one of these sets, first prefix your `iron-icon` with the icon set name, followed by a colon, ":", and then the icon id.
                                                     
                                                     Example using the directions-bus icon from the maps icon set:
                                                     
                                                         <iron-icon icon="maps:directions-bus"></iron-icon>
                                                     
                                                         To load a subset of icons from one of the default `iron-icons` sets, you can
                                                         use the [poly-icon](https://poly-icon.appspot.com/) tool. It allows you
                                                         to select individual icons, and creates an iconset from them that you can
                                                         use directly in your elements.
                                                     
                                                     See [iron-icon](#iron-icon) for more information about working with icons.
                                                     
                                                     See [iron-iconset](#iron-iconset) and [iron-iconset-svg](#iron-iconset-svg) for more information about how to create a custom iconset.
                                                     
                                                     @group Iron Elements
                                                     @pseudoElement iron-icons
                                                     @demo demo/index.html
                                                     */let IronValidatableBehaviorMeta=null;const IronValidatableBehavior={properties:{/**
     * Name of the validator to use.
     */validator:{type:String},/**
     * True if the last call to `validate` is invalid.
     */invalid:{notify:true,reflectToAttribute:true,type:Boolean,value:false,observer:'_invalidChanged'}},registered:function(){IronValidatableBehaviorMeta=new IronMeta({type:'validator'});},_invalidChanged:function(){if(this.invalid){this.setAttribute('aria-invalid','true');}else{this.removeAttribute('aria-invalid');}},/* Recompute this every time it's needed, because we don't know if the
   * underlying IronValidatableBehaviorMeta has changed. */get _validator(){return IronValidatableBehaviorMeta&&IronValidatableBehaviorMeta.byKey(this.validator);},/**
   * @return {boolean} True if the validator `validator` exists.
   */hasValidator:function(){return this._validator!=null;},/**
   * Returns true if the `value` is valid, and updates `invalid`. If you want
   * your element to have custom validation logic, do not override this method;
   * override `_getValidity(value)` instead.
    * @param {Object} value Deprecated: The value to be validated. By default,
   * it is passed to the validator's `validate()` function, if a validator is set.
   * If this argument is not specified, then the element's `value` property
   * is used, if it exists.
   * @return {boolean} True if `value` is valid.
   */validate:function(value){// If this is an element that also has a value property, and there was
// no explicit value argument passed, use the element's property instead.
if(value===undefined&&this.value!==undefined)this.invalid=!this._getValidity(this.value);else this.invalid=!this._getValidity(value);return!this.invalid;},/**
   * Returns true if `value` is valid.  By default, it is passed
   * to the validator's `validate()` function, if a validator is set. You
   * should override this method if you want to implement custom validity
   * logic for your element.
   *
   * @param {Object} value The value to be validated.
   * @return {boolean} True if `value` is valid.
   */_getValidity:function(value){if(this.hasValidator()){return this._validator.validate(value);}return true;}};var ironValidatableBehavior={get IronValidatableBehaviorMeta(){return IronValidatableBehaviorMeta;},IronValidatableBehavior:IronValidatableBehavior};/**
   @license
   Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */ /**
      `<iron-input>` is a wrapper to a native `<input>` element, that adds two-way binding
      and prevention of invalid input. To use it, you must distribute a native `<input>`
      yourself. You can continue to use the native `input` as you would normally:
      
          <iron-input>
            <input>
          </iron-input>
      
          <iron-input>
            <input type="email" disabled>
          </iron-input>
      
      ### Two-way binding
      
      By default you can only get notified of changes to a native `<input>`'s `value`
      due to user input:
      
          <input value="{{myValue::input}}">
      
      This means that if you imperatively set the value (i.e. `someNativeInput.value = 'foo'`),
      no events will be fired and this change cannot be observed.
      
      `iron-input` adds the `bind-value` property that mirrors the native `input`'s '`value` property; this
      property can be used for two-way data binding.
      `bind-value` will notify if it is changed either by user input or by script.
      
          <iron-input bind-value="{{myValue}}">
            <input>
          </iron-input>
      
      Note: this means that if you want to imperatively set the native `input`'s, you _must_
      set `bind-value` instead, so that the wrapper `iron-input` can be notified.
      
      ### Validation
      
      `iron-input` uses the native `input`'s validation. For simplicity, `iron-input`
      has a `validate()` method (which internally just checks the distributed `input`'s
      validity), which sets an `invalid` attribute that can also be used for styling.
      
      To validate automatically as you type, you can use the `auto-validate` attribute.
      
      `iron-input` also fires an `iron-input-validate` event after `validate()` is
      called. You can use it to implement a custom validator:
      
          var CatsOnlyValidator = {
            validate: function(ironInput) {
              var valid = !ironInput.bindValue || ironInput.bindValue === 'cat';
              ironInput.invalid = !valid;
              return valid;
            }
          }
          ironInput.addEventListener('iron-input-validate', function() {
            CatsOnly.validate(input2);
          });
      
      You can also use an element implementing an [`IronValidatorBehavior`](/element/PolymerElements/iron-validatable-behavior).
      This example can also be found in the demo for this element:
      
          <iron-input validator="cats-only">
            <input>
          </iron-input>
      
      ### Preventing invalid input
      
      It may be desirable to only allow users to enter certain characters. You can use the
      `allowed-pattern` attribute to accomplish this. This feature
      is separate from validation, and `allowed-pattern` does not affect how the input is validated.
      
          // Only allow typing digits, but a valid input has exactly 5 digits.
          <iron-input allowed-pattern="[0-9]">
            <input pattern="\d{5}">
          </iron-input>
      
      @hero hero.svg
      @demo demo/index.html
      */Polymer({_template:html`
    <style>
      :host {
        display: inline-block;
      }
    </style>
    <slot id="content"></slot>
`,is:'iron-input',behaviors:[IronValidatableBehavior],/**
   * Fired whenever `validate()` is called.
   *
   * @event iron-input-validate
   */properties:{/**
     * Use this property instead of `value` for two-way data binding, or to
     * set a default value for the input. **Do not** use the distributed
     * input's `value` property to set a default value.
     */bindValue:{type:String},/**
     * Computed property that echoes `bindValue` (mostly used for Polymer 1.0
     * backcompatibility, if you were one-way binding to the Polymer 1.0
     * `input is="iron-input"` value attribute).
     */value:{type:String,computed:'_computeValue(bindValue)'},/**
     * Regex-like list of characters allowed as input; all characters not in the list
     * will be rejected. The recommended format should be a list of allowed characters,
     * for example, `[a-zA-Z0-9.+-!;:]`.
     *
     * This pattern represents the allowed characters for the field; as the user inputs text,
     * each individual character will be checked against the pattern (rather than checking
     * the entire value as a whole). If a character is not a match, it will be rejected.
     *
     * Pasted input will have each character checked individually; if any character
     * doesn't match `allowedPattern`, the entire pasted string will be rejected.
     *
     * Note: if you were using `iron-input` in 1.0, you were also required to
     * set `prevent-invalid-input`. This is no longer needed as of Polymer 2.0,
     * and will be set automatically for you if an `allowedPattern` is provided.
     *
     */allowedPattern:{type:String},/**
     * Set to true to auto-validate the input value as you type.
     */autoValidate:{type:Boolean,value:false},/**
     * The native input element.
     */_inputElement:Object},observers:['_bindValueChanged(bindValue, _inputElement)'],listeners:{'input':'_onInput','keypress':'_onKeypress'},created:function(){IronA11yAnnouncer.requestAvailability();this._previousValidInput='';this._patternAlreadyChecked=false;},attached:function(){// If the input is added at a later time, update the internal reference.
this._observer=dom(this).observeNodes(function(info){this._initSlottedInput();}.bind(this));},detached:function(){if(this._observer){dom(this).unobserveNodes(this._observer);this._observer=null;}},/**
   * Returns the distributed input element.
   */get inputElement(){return this._inputElement;},_initSlottedInput:function(){this._inputElement=this.getEffectiveChildren()[0];if(this.inputElement&&this.inputElement.value){this.bindValue=this.inputElement.value;}this.fire('iron-input-ready');},get _patternRegExp(){var pattern;if(this.allowedPattern){pattern=new RegExp(this.allowedPattern);}else{switch(this.inputElement.type){case'number':pattern=/[0-9.,e-]/;break;}}return pattern;},/**
   * @suppress {checkTypes}
   */_bindValueChanged:function(bindValue,inputElement){// The observer could have run before attached() when we have actually initialized
// this property.
if(!inputElement){return;}if(bindValue===undefined){inputElement.value=null;}else if(bindValue!==inputElement.value){this.inputElement.value=bindValue;}if(this.autoValidate){this.validate();}// manually notify because we don't want to notify until after setting value
this.fire('bind-value-changed',{value:bindValue});},_onInput:function(){// Need to validate each of the characters pasted if they haven't
// been validated inside `_onKeypress` already.
if(this.allowedPattern&&!this._patternAlreadyChecked){var valid=this._checkPatternValidity();if(!valid){this._announceInvalidCharacter('Invalid string of characters not entered.');this.inputElement.value=this._previousValidInput;}}this.bindValue=this._previousValidInput=this.inputElement.value;this._patternAlreadyChecked=false;},_isPrintable:function(event){// What a control/printable character is varies wildly based on the browser.
// - most control characters (arrows, backspace) do not send a `keypress` event
//   in Chrome, but the *do* on Firefox
// - in Firefox, when they do send a `keypress` event, control chars have
//   a charCode = 0, keyCode = xx (for ex. 40 for down arrow)
// - printable characters always send a keypress event.
// - in Firefox, printable chars always have a keyCode = 0. In Chrome, the keyCode
//   always matches the charCode.
// None of this makes any sense.
// For these keys, ASCII code == browser keycode.
var anyNonPrintable=event.keyCode==8||// backspace
event.keyCode==9||// tab
event.keyCode==13||// enter
event.keyCode==27;// escape
// For these keys, make sure it's a browser keycode and not an ASCII code.
var mozNonPrintable=event.keyCode==19||// pause
event.keyCode==20||// caps lock
event.keyCode==45||// insert
event.keyCode==46||// delete
event.keyCode==144||// num lock
event.keyCode==145||// scroll lock
event.keyCode>32&&event.keyCode<41||// page up/down, end, home, arrows
event.keyCode>111&&event.keyCode<124;// fn keys
return!anyNonPrintable&&!(event.charCode==0&&mozNonPrintable);},_onKeypress:function(event){if(!this.allowedPattern&&this.inputElement.type!=='number'){return;}var regexp=this._patternRegExp;if(!regexp){return;}// Handle special keys and backspace
if(event.metaKey||event.ctrlKey||event.altKey){return;}// Check the pattern either here or in `_onInput`, but not in both.
this._patternAlreadyChecked=true;var thisChar=String.fromCharCode(event.charCode);if(this._isPrintable(event)&&!regexp.test(thisChar)){event.preventDefault();this._announceInvalidCharacter('Invalid character '+thisChar+' not entered.');}},_checkPatternValidity:function(){var regexp=this._patternRegExp;if(!regexp){return true;}for(var i=0;i<this.inputElement.value.length;i++){if(!regexp.test(this.inputElement.value[i])){return false;}}return true;},/**
   * Returns true if `value` is valid. The validator provided in `validator` will be used first,
   * then any constraints.
   * @return {boolean} True if the value is valid.
   */validate:function(){if(!this.inputElement){this.invalid=false;return true;}// Use the nested input's native validity.
var valid=this.inputElement.checkValidity();// Only do extra checking if the browser thought this was valid.
if(valid){// Empty, required input is invalid
if(this.required&&this.bindValue===''){valid=false;}else if(this.hasValidator()){valid=IronValidatableBehavior.validate.call(this,this.bindValue);}}this.invalid=!valid;this.fire('iron-input-validate');return valid;},_announceInvalidCharacter:function(message){this.fire('iron-announce',{text:message});},_computeValue:function(bindValue){return bindValue;}});var Utility={distance:function(x1,y1,x2,y2){var xDelta=x1-x2;var yDelta=y1-y2;return Math.sqrt(xDelta*xDelta+yDelta*yDelta);},now:window.performance&&window.performance.now?window.performance.now.bind(window.performance):Date.now};/**
    * @param {HTMLElement} element
    * @constructor
    */function ElementMetrics(element){this.element=element;this.width=this.boundingRect.width;this.height=this.boundingRect.height;this.size=Math.max(this.width,this.height);}ElementMetrics.prototype={get boundingRect(){return this.element.getBoundingClientRect();},furthestCornerDistanceFrom:function(x,y){var topLeft=Utility.distance(x,y,0,0);var topRight=Utility.distance(x,y,this.width,0);var bottomLeft=Utility.distance(x,y,0,this.height);var bottomRight=Utility.distance(x,y,this.width,this.height);return Math.max(topLeft,topRight,bottomLeft,bottomRight);}};/**
    * @param {HTMLElement} element
    * @constructor
    */function Ripple(element){this.element=element;this.color=window.getComputedStyle(element).color;this.wave=document.createElement('div');this.waveContainer=document.createElement('div');this.wave.style.backgroundColor=this.color;this.wave.classList.add('wave');this.waveContainer.classList.add('wave-container');dom(this.waveContainer).appendChild(this.wave);this.resetInteractionState();}Ripple.MAX_RADIUS=300;Ripple.prototype={get recenters(){return this.element.recenters;},get center(){return this.element.center;},get mouseDownElapsed(){var elapsed;if(!this.mouseDownStart){return 0;}elapsed=Utility.now()-this.mouseDownStart;if(this.mouseUpStart){elapsed-=this.mouseUpElapsed;}return elapsed;},get mouseUpElapsed(){return this.mouseUpStart?Utility.now()-this.mouseUpStart:0;},get mouseDownElapsedSeconds(){return this.mouseDownElapsed/1000;},get mouseUpElapsedSeconds(){return this.mouseUpElapsed/1000;},get mouseInteractionSeconds(){return this.mouseDownElapsedSeconds+this.mouseUpElapsedSeconds;},get initialOpacity(){return this.element.initialOpacity;},get opacityDecayVelocity(){return this.element.opacityDecayVelocity;},get radius(){var width2=this.containerMetrics.width*this.containerMetrics.width;var height2=this.containerMetrics.height*this.containerMetrics.height;var waveRadius=Math.min(Math.sqrt(width2+height2),Ripple.MAX_RADIUS)*1.1+5;var duration=1.1-0.2*(waveRadius/Ripple.MAX_RADIUS);var timeNow=this.mouseInteractionSeconds/duration;var size=waveRadius*(1-Math.pow(80,-timeNow));return Math.abs(size);},get opacity(){if(!this.mouseUpStart){return this.initialOpacity;}return Math.max(0,this.initialOpacity-this.mouseUpElapsedSeconds*this.opacityDecayVelocity);},get outerOpacity(){// Linear increase in background opacity, capped at the opacity
// of the wavefront (waveOpacity).
var outerOpacity=this.mouseUpElapsedSeconds*0.3;var waveOpacity=this.opacity;return Math.max(0,Math.min(outerOpacity,waveOpacity));},get isOpacityFullyDecayed(){return this.opacity<0.01&&this.radius>=Math.min(this.maxRadius,Ripple.MAX_RADIUS);},get isRestingAtMaxRadius(){return this.opacity>=this.initialOpacity&&this.radius>=Math.min(this.maxRadius,Ripple.MAX_RADIUS);},get isAnimationComplete(){return this.mouseUpStart?this.isOpacityFullyDecayed:this.isRestingAtMaxRadius;},get translationFraction(){return Math.min(1,this.radius/this.containerMetrics.size*2/Math.sqrt(2));},get xNow(){if(this.xEnd){return this.xStart+this.translationFraction*(this.xEnd-this.xStart);}return this.xStart;},get yNow(){if(this.yEnd){return this.yStart+this.translationFraction*(this.yEnd-this.yStart);}return this.yStart;},get isMouseDown(){return this.mouseDownStart&&!this.mouseUpStart;},resetInteractionState:function(){this.maxRadius=0;this.mouseDownStart=0;this.mouseUpStart=0;this.xStart=0;this.yStart=0;this.xEnd=0;this.yEnd=0;this.slideDistance=0;this.containerMetrics=new ElementMetrics(this.element);},draw:function(){var scale;var translateString;var dx;var dy;this.wave.style.opacity=this.opacity;scale=this.radius/(this.containerMetrics.size/2);dx=this.xNow-this.containerMetrics.width/2;dy=this.yNow-this.containerMetrics.height/2;// 2d transform for safari because of border-radius and overflow:hidden clipping bug.
// https://bugs.webkit.org/show_bug.cgi?id=98538
this.waveContainer.style.webkitTransform='translate('+dx+'px, '+dy+'px)';this.waveContainer.style.transform='translate3d('+dx+'px, '+dy+'px, 0)';this.wave.style.webkitTransform='scale('+scale+','+scale+')';this.wave.style.transform='scale3d('+scale+','+scale+',1)';},/** @param {Event=} event */downAction:function(event){var xCenter=this.containerMetrics.width/2;var yCenter=this.containerMetrics.height/2;this.resetInteractionState();this.mouseDownStart=Utility.now();if(this.center){this.xStart=xCenter;this.yStart=yCenter;this.slideDistance=Utility.distance(this.xStart,this.yStart,this.xEnd,this.yEnd);}else{this.xStart=event?event.detail.x-this.containerMetrics.boundingRect.left:this.containerMetrics.width/2;this.yStart=event?event.detail.y-this.containerMetrics.boundingRect.top:this.containerMetrics.height/2;}if(this.recenters){this.xEnd=xCenter;this.yEnd=yCenter;this.slideDistance=Utility.distance(this.xStart,this.yStart,this.xEnd,this.yEnd);}this.maxRadius=this.containerMetrics.furthestCornerDistanceFrom(this.xStart,this.yStart);this.waveContainer.style.top=(this.containerMetrics.height-this.containerMetrics.size)/2+'px';this.waveContainer.style.left=(this.containerMetrics.width-this.containerMetrics.size)/2+'px';this.waveContainer.style.width=this.containerMetrics.size+'px';this.waveContainer.style.height=this.containerMetrics.size+'px';},/** @param {Event=} event */upAction:function(event){if(!this.isMouseDown){return;}this.mouseUpStart=Utility.now();},remove:function(){dom(this.waveContainer.parentNode).removeChild(this.waveContainer);}};Polymer({_template:html`
    <style>
      :host {
        display: block;
        position: absolute;
        border-radius: inherit;
        overflow: hidden;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;

        /* See PolymerElements/paper-behaviors/issues/34. On non-Chrome browsers,
         * creating a node (with a position:absolute) in the middle of an event
         * handler "interrupts" that event handler (which happens when the
         * ripple is created on demand) */
        pointer-events: none;
      }

      :host([animating]) {
        /* This resolves a rendering issue in Chrome (as of 40) where the
           ripple is not properly clipped by its parent (which may have
           rounded corners). See: http://jsbin.com/temexa/4

           Note: We only apply this style conditionally. Otherwise, the browser
           will create a new compositing layer for every ripple element on the
           page, and that would be bad. */
        -webkit-transform: translate(0, 0);
        transform: translate3d(0, 0, 0);
      }

      #background,
      #waves,
      .wave-container,
      .wave {
        pointer-events: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      #background,
      .wave {
        opacity: 0;
      }

      #waves,
      .wave {
        overflow: hidden;
      }

      .wave-container,
      .wave {
        border-radius: 50%;
      }

      :host(.circle) #background,
      :host(.circle) #waves {
        border-radius: 50%;
      }

      :host(.circle) .wave-container {
        overflow: hidden;
      }
    </style>

    <div id="background"></div>
    <div id="waves"></div>
`,is:'paper-ripple',behaviors:[IronA11yKeysBehavior],properties:{/**
     * The initial opacity set on the wave.
     *
     * @attribute initialOpacity
     * @type number
     * @default 0.25
     */initialOpacity:{type:Number,value:0.25},/**
     * How fast (opacity per second) the wave fades out.
     *
     * @attribute opacityDecayVelocity
     * @type number
     * @default 0.8
     */opacityDecayVelocity:{type:Number,value:0.8},/**
     * If true, ripples will exhibit a gravitational pull towards
     * the center of their container as they fade away.
     *
     * @attribute recenters
     * @type boolean
     * @default false
     */recenters:{type:Boolean,value:false},/**
     * If true, ripples will center inside its container
     *
     * @attribute recenters
     * @type boolean
     * @default false
     */center:{type:Boolean,value:false},/**
     * A list of the visual ripples.
     *
     * @attribute ripples
     * @type Array
     * @default []
     */ripples:{type:Array,value:function(){return[];}},/**
     * True when there are visible ripples animating within the
     * element.
     */animating:{type:Boolean,readOnly:true,reflectToAttribute:true,value:false},/**
     * If true, the ripple will remain in the "down" state until `holdDown`
     * is set to false again.
     */holdDown:{type:Boolean,value:false,observer:'_holdDownChanged'},/**
     * If true, the ripple will not generate a ripple effect
     * via pointer interaction.
     * Calling ripple's imperative api like `simulatedRipple` will
     * still generate the ripple effect.
     */noink:{type:Boolean,value:false},_animating:{type:Boolean},_boundAnimate:{type:Function,value:function(){return this.animate.bind(this);}}},get target(){return this.keyEventTarget;},/**
   * @type {!Object}
   */keyBindings:{'enter:keydown':'_onEnterKeydown','space:keydown':'_onSpaceKeydown','space:keyup':'_onSpaceKeyup'},attached:function(){// Set up a11yKeysBehavior to listen to key events on the target,
// so that space and enter activate the ripple even if the target doesn't
// handle key events. The key handlers deal with `noink` themselves.
if(this.parentNode.nodeType==11){// DOCUMENT_FRAGMENT_NODE
this.keyEventTarget=dom(this).getOwnerRoot().host;}else{this.keyEventTarget=this.parentNode;}var keyEventTarget=/** @type {!EventTarget} */this.keyEventTarget;this.listen(keyEventTarget,'up','uiUpAction');this.listen(keyEventTarget,'down','uiDownAction');},detached:function(){this.unlisten(this.keyEventTarget,'up','uiUpAction');this.unlisten(this.keyEventTarget,'down','uiDownAction');this.keyEventTarget=null;},get shouldKeepAnimating(){for(var index=0;index<this.ripples.length;++index){if(!this.ripples[index].isAnimationComplete){return true;}}return false;},simulatedRipple:function(){this.downAction(null);// Please see polymer/polymer#1305
this.async(function(){this.upAction();},1);},/**
   * Provokes a ripple down effect via a UI event,
   * respecting the `noink` property.
   * @param {Event=} event
   */uiDownAction:function(event){if(!this.noink){this.downAction(event);}},/**
   * Provokes a ripple down effect via a UI event,
   * *not* respecting the `noink` property.
   * @param {Event=} event
   */downAction:function(event){if(this.holdDown&&this.ripples.length>0){return;}var ripple=this.addRipple();ripple.downAction(event);if(!this._animating){this._animating=true;this.animate();}},/**
   * Provokes a ripple up effect via a UI event,
   * respecting the `noink` property.
   * @param {Event=} event
   */uiUpAction:function(event){if(!this.noink){this.upAction(event);}},/**
   * Provokes a ripple up effect via a UI event,
   * *not* respecting the `noink` property.
   * @param {Event=} event
   */upAction:function(event){if(this.holdDown){return;}this.ripples.forEach(function(ripple){ripple.upAction(event);});this._animating=true;this.animate();},onAnimationComplete:function(){this._animating=false;this.$.background.style.backgroundColor=null;this.fire('transitionend');},addRipple:function(){var ripple=new Ripple(this);dom(this.$.waves).appendChild(ripple.waveContainer);this.$.background.style.backgroundColor=ripple.color;this.ripples.push(ripple);this._setAnimating(true);return ripple;},removeRipple:function(ripple){var rippleIndex=this.ripples.indexOf(ripple);if(rippleIndex<0){return;}this.ripples.splice(rippleIndex,1);ripple.remove();if(!this.ripples.length){this._setAnimating(false);}},/**
   * This conflicts with Element#antimate().
   * https://developer.mozilla.org/en-US/docs/Web/API/Element/animate
   * @suppress {checkTypes}
   */animate:function(){if(!this._animating){return;}var index;var ripple;for(index=0;index<this.ripples.length;++index){ripple=this.ripples[index];ripple.draw();this.$.background.style.opacity=ripple.outerOpacity;if(ripple.isOpacityFullyDecayed&&!ripple.isRestingAtMaxRadius){this.removeRipple(ripple);}}if(!this.shouldKeepAnimating&&this.ripples.length===0){this.onAnimationComplete();}else{window.requestAnimationFrame(this._boundAnimate);}},_onEnterKeydown:function(){this.uiDownAction();this.async(this.uiUpAction,1);},_onSpaceKeydown:function(){this.uiDownAction();},_onSpaceKeyup:function(){this.uiUpAction();},// note: holdDown does not respect noink since it can be a focus based
// effect.
_holdDownChanged:function(newVal,oldVal){if(oldVal===undefined){return;}if(newVal){this.downAction();}else{this.upAction();}}/**
    Fired when the animation finishes.
    This is useful if you want to wait until
    the ripple animation finishes to perform some action.
     @event transitionend
    @param {{node: Object}} detail Contains the animated node.
    */});const PaperRippleBehavior={properties:{/**
     * If true, the element will not produce a ripple effect when interacted
     * with via the pointer.
     */noink:{type:Boolean,observer:'_noinkChanged'},/**
     * @type {Element|undefined}
     */_rippleContainer:{type:Object}},/**
   * Ensures a `<paper-ripple>` element is available when the element is
   * focused.
   */_buttonStateChanged:function(){if(this.focused){this.ensureRipple();}},/**
   * In addition to the functionality provided in `IronButtonState`, ensures
   * a ripple effect is created when the element is in a `pressed` state.
   */_downHandler:function(event){IronButtonStateImpl._downHandler.call(this,event);if(this.pressed){this.ensureRipple(event);}},/**
   * Ensures this element contains a ripple effect. For startup efficiency
   * the ripple effect is dynamically on demand when needed.
   * @param {!Event=} optTriggeringEvent (optional) event that triggered the
   * ripple.
   */ensureRipple:function(optTriggeringEvent){if(!this.hasRipple()){this._ripple=this._createRipple();this._ripple.noink=this.noink;var rippleContainer=this._rippleContainer||this.root;if(rippleContainer){dom(rippleContainer).appendChild(this._ripple);}if(optTriggeringEvent){// Check if the event happened inside of the ripple container
// Fall back to host instead of the root because distributed text
// nodes are not valid event targets
var domContainer=dom(this._rippleContainer||this);var target=dom(optTriggeringEvent).rootTarget;if(domContainer.deepContains(/** @type {Node} */target)){this._ripple.uiDownAction(optTriggeringEvent);}}}},/**
   * Returns the `<paper-ripple>` element used by this element to create
   * ripple effects. The element's ripple is created on demand, when
   * necessary, and calling this method will force the
   * ripple to be created.
   */getRipple:function(){this.ensureRipple();return this._ripple;},/**
   * Returns true if this element currently contains a ripple effect.
   * @return {boolean}
   */hasRipple:function(){return Boolean(this._ripple);},/**
   * Create the element's ripple effect via creating a `<paper-ripple>`.
   * Override this method to customize the ripple element.
   * @return {!PaperRippleElement} Returns a `<paper-ripple>` element.
   */_createRipple:function(){var element=/** @type {!PaperRippleElement} */document.createElement('paper-ripple');return element;},_noinkChanged:function(noink){if(this.hasRipple()){this._ripple.noink=noink;}}};var paperRippleBehavior={PaperRippleBehavior:PaperRippleBehavior};const PaperInkyFocusBehaviorImpl={observers:['_focusedChanged(receivedFocusFromKeyboard)'],_focusedChanged:function(receivedFocusFromKeyboard){if(receivedFocusFromKeyboard){this.ensureRipple();}if(this.hasRipple()){this._ripple.holdDown=receivedFocusFromKeyboard;}},_createRipple:function(){var ripple=PaperRippleBehavior._createRipple();ripple.id='ink';ripple.setAttribute('center','');ripple.classList.add('circle');return ripple;}};const PaperInkyFocusBehavior=[IronButtonState,IronControlState,PaperRippleBehavior,PaperInkyFocusBehaviorImpl];var paperInkyFocusBehavior={PaperInkyFocusBehaviorImpl:PaperInkyFocusBehaviorImpl,PaperInkyFocusBehavior:PaperInkyFocusBehavior};const $_documentContainer$2=document.createElement('div');$_documentContainer$2.setAttribute('style','display: none;');$_documentContainer$2.innerHTML=`<custom-style>
  <style is="custom-style">
    html {

      /* Material Design color palette for Google products */

      --google-red-100: #f4c7c3;
      --google-red-300: #e67c73;
      --google-red-500: #db4437;
      --google-red-700: #c53929;

      --google-blue-100: #c6dafc;
      --google-blue-300: #7baaf7;
      --google-blue-500: #4285f4;
      --google-blue-700: #3367d6;

      --google-green-100: #b7e1cd;
      --google-green-300: #57bb8a;
      --google-green-500: #0f9d58;
      --google-green-700: #0b8043;

      --google-yellow-100: #fce8b2;
      --google-yellow-300: #f7cb4d;
      --google-yellow-500: #f4b400;
      --google-yellow-700: #f09300;

      --google-grey-100: #f5f5f5;
      --google-grey-300: #e0e0e0;
      --google-grey-500: #9e9e9e;
      --google-grey-700: #616161;

      /* Material Design color palette from online spec document */

      --paper-red-50: #ffebee;
      --paper-red-100: #ffcdd2;
      --paper-red-200: #ef9a9a;
      --paper-red-300: #e57373;
      --paper-red-400: #ef5350;
      --paper-red-500: #f44336;
      --paper-red-600: #e53935;
      --paper-red-700: #d32f2f;
      --paper-red-800: #c62828;
      --paper-red-900: #b71c1c;
      --paper-red-a100: #ff8a80;
      --paper-red-a200: #ff5252;
      --paper-red-a400: #ff1744;
      --paper-red-a700: #d50000;

      --paper-pink-50: #fce4ec;
      --paper-pink-100: #f8bbd0;
      --paper-pink-200: #f48fb1;
      --paper-pink-300: #f06292;
      --paper-pink-400: #ec407a;
      --paper-pink-500: #e91e63;
      --paper-pink-600: #d81b60;
      --paper-pink-700: #c2185b;
      --paper-pink-800: #ad1457;
      --paper-pink-900: #880e4f;
      --paper-pink-a100: #ff80ab;
      --paper-pink-a200: #ff4081;
      --paper-pink-a400: #f50057;
      --paper-pink-a700: #c51162;

      --paper-purple-50: #f3e5f5;
      --paper-purple-100: #e1bee7;
      --paper-purple-200: #ce93d8;
      --paper-purple-300: #ba68c8;
      --paper-purple-400: #ab47bc;
      --paper-purple-500: #9c27b0;
      --paper-purple-600: #8e24aa;
      --paper-purple-700: #7b1fa2;
      --paper-purple-800: #6a1b9a;
      --paper-purple-900: #4a148c;
      --paper-purple-a100: #ea80fc;
      --paper-purple-a200: #e040fb;
      --paper-purple-a400: #d500f9;
      --paper-purple-a700: #aa00ff;

      --paper-deep-purple-50: #ede7f6;
      --paper-deep-purple-100: #d1c4e9;
      --paper-deep-purple-200: #b39ddb;
      --paper-deep-purple-300: #9575cd;
      --paper-deep-purple-400: #7e57c2;
      --paper-deep-purple-500: #673ab7;
      --paper-deep-purple-600: #5e35b1;
      --paper-deep-purple-700: #512da8;
      --paper-deep-purple-800: #4527a0;
      --paper-deep-purple-900: #311b92;
      --paper-deep-purple-a100: #b388ff;
      --paper-deep-purple-a200: #7c4dff;
      --paper-deep-purple-a400: #651fff;
      --paper-deep-purple-a700: #6200ea;

      --paper-indigo-50: #e8eaf6;
      --paper-indigo-100: #c5cae9;
      --paper-indigo-200: #9fa8da;
      --paper-indigo-300: #7986cb;
      --paper-indigo-400: #5c6bc0;
      --paper-indigo-500: #3f51b5;
      --paper-indigo-600: #3949ab;
      --paper-indigo-700: #303f9f;
      --paper-indigo-800: #283593;
      --paper-indigo-900: #1a237e;
      --paper-indigo-a100: #8c9eff;
      --paper-indigo-a200: #536dfe;
      --paper-indigo-a400: #3d5afe;
      --paper-indigo-a700: #304ffe;

      --paper-blue-50: #e3f2fd;
      --paper-blue-100: #bbdefb;
      --paper-blue-200: #90caf9;
      --paper-blue-300: #64b5f6;
      --paper-blue-400: #42a5f5;
      --paper-blue-500: #2196f3;
      --paper-blue-600: #1e88e5;
      --paper-blue-700: #1976d2;
      --paper-blue-800: #1565c0;
      --paper-blue-900: #0d47a1;
      --paper-blue-a100: #82b1ff;
      --paper-blue-a200: #448aff;
      --paper-blue-a400: #2979ff;
      --paper-blue-a700: #2962ff;

      --paper-light-blue-50: #e1f5fe;
      --paper-light-blue-100: #b3e5fc;
      --paper-light-blue-200: #81d4fa;
      --paper-light-blue-300: #4fc3f7;
      --paper-light-blue-400: #29b6f6;
      --paper-light-blue-500: #03a9f4;
      --paper-light-blue-600: #039be5;
      --paper-light-blue-700: #0288d1;
      --paper-light-blue-800: #0277bd;
      --paper-light-blue-900: #01579b;
      --paper-light-blue-a100: #80d8ff;
      --paper-light-blue-a200: #40c4ff;
      --paper-light-blue-a400: #00b0ff;
      --paper-light-blue-a700: #0091ea;

      --paper-cyan-50: #e0f7fa;
      --paper-cyan-100: #b2ebf2;
      --paper-cyan-200: #80deea;
      --paper-cyan-300: #4dd0e1;
      --paper-cyan-400: #26c6da;
      --paper-cyan-500: #00bcd4;
      --paper-cyan-600: #00acc1;
      --paper-cyan-700: #0097a7;
      --paper-cyan-800: #00838f;
      --paper-cyan-900: #006064;
      --paper-cyan-a100: #84ffff;
      --paper-cyan-a200: #18ffff;
      --paper-cyan-a400: #00e5ff;
      --paper-cyan-a700: #00b8d4;

      --paper-teal-50: #e0f2f1;
      --paper-teal-100: #b2dfdb;
      --paper-teal-200: #80cbc4;
      --paper-teal-300: #4db6ac;
      --paper-teal-400: #26a69a;
      --paper-teal-500: #009688;
      --paper-teal-600: #00897b;
      --paper-teal-700: #00796b;
      --paper-teal-800: #00695c;
      --paper-teal-900: #004d40;
      --paper-teal-a100: #a7ffeb;
      --paper-teal-a200: #64ffda;
      --paper-teal-a400: #1de9b6;
      --paper-teal-a700: #00bfa5;

      --paper-green-50: #e8f5e9;
      --paper-green-100: #c8e6c9;
      --paper-green-200: #a5d6a7;
      --paper-green-300: #81c784;
      --paper-green-400: #66bb6a;
      --paper-green-500: #4caf50;
      --paper-green-600: #43a047;
      --paper-green-700: #388e3c;
      --paper-green-800: #2e7d32;
      --paper-green-900: #1b5e20;
      --paper-green-a100: #b9f6ca;
      --paper-green-a200: #69f0ae;
      --paper-green-a400: #00e676;
      --paper-green-a700: #00c853;

      --paper-light-green-50: #f1f8e9;
      --paper-light-green-100: #dcedc8;
      --paper-light-green-200: #c5e1a5;
      --paper-light-green-300: #aed581;
      --paper-light-green-400: #9ccc65;
      --paper-light-green-500: #8bc34a;
      --paper-light-green-600: #7cb342;
      --paper-light-green-700: #689f38;
      --paper-light-green-800: #558b2f;
      --paper-light-green-900: #33691e;
      --paper-light-green-a100: #ccff90;
      --paper-light-green-a200: #b2ff59;
      --paper-light-green-a400: #76ff03;
      --paper-light-green-a700: #64dd17;

      --paper-lime-50: #f9fbe7;
      --paper-lime-100: #f0f4c3;
      --paper-lime-200: #e6ee9c;
      --paper-lime-300: #dce775;
      --paper-lime-400: #d4e157;
      --paper-lime-500: #cddc39;
      --paper-lime-600: #c0ca33;
      --paper-lime-700: #afb42b;
      --paper-lime-800: #9e9d24;
      --paper-lime-900: #827717;
      --paper-lime-a100: #f4ff81;
      --paper-lime-a200: #eeff41;
      --paper-lime-a400: #c6ff00;
      --paper-lime-a700: #aeea00;

      --paper-yellow-50: #fffde7;
      --paper-yellow-100: #fff9c4;
      --paper-yellow-200: #fff59d;
      --paper-yellow-300: #fff176;
      --paper-yellow-400: #ffee58;
      --paper-yellow-500: #ffeb3b;
      --paper-yellow-600: #fdd835;
      --paper-yellow-700: #fbc02d;
      --paper-yellow-800: #f9a825;
      --paper-yellow-900: #f57f17;
      --paper-yellow-a100: #ffff8d;
      --paper-yellow-a200: #ffff00;
      --paper-yellow-a400: #ffea00;
      --paper-yellow-a700: #ffd600;

      --paper-amber-50: #fff8e1;
      --paper-amber-100: #ffecb3;
      --paper-amber-200: #ffe082;
      --paper-amber-300: #ffd54f;
      --paper-amber-400: #ffca28;
      --paper-amber-500: #ffc107;
      --paper-amber-600: #ffb300;
      --paper-amber-700: #ffa000;
      --paper-amber-800: #ff8f00;
      --paper-amber-900: #ff6f00;
      --paper-amber-a100: #ffe57f;
      --paper-amber-a200: #ffd740;
      --paper-amber-a400: #ffc400;
      --paper-amber-a700: #ffab00;

      --paper-orange-50: #fff3e0;
      --paper-orange-100: #ffe0b2;
      --paper-orange-200: #ffcc80;
      --paper-orange-300: #ffb74d;
      --paper-orange-400: #ffa726;
      --paper-orange-500: #ff9800;
      --paper-orange-600: #fb8c00;
      --paper-orange-700: #f57c00;
      --paper-orange-800: #ef6c00;
      --paper-orange-900: #e65100;
      --paper-orange-a100: #ffd180;
      --paper-orange-a200: #ffab40;
      --paper-orange-a400: #ff9100;
      --paper-orange-a700: #ff6500;

      --paper-deep-orange-50: #fbe9e7;
      --paper-deep-orange-100: #ffccbc;
      --paper-deep-orange-200: #ffab91;
      --paper-deep-orange-300: #ff8a65;
      --paper-deep-orange-400: #ff7043;
      --paper-deep-orange-500: #ff5722;
      --paper-deep-orange-600: #f4511e;
      --paper-deep-orange-700: #e64a19;
      --paper-deep-orange-800: #d84315;
      --paper-deep-orange-900: #bf360c;
      --paper-deep-orange-a100: #ff9e80;
      --paper-deep-orange-a200: #ff6e40;
      --paper-deep-orange-a400: #ff3d00;
      --paper-deep-orange-a700: #dd2c00;

      --paper-brown-50: #efebe9;
      --paper-brown-100: #d7ccc8;
      --paper-brown-200: #bcaaa4;
      --paper-brown-300: #a1887f;
      --paper-brown-400: #8d6e63;
      --paper-brown-500: #795548;
      --paper-brown-600: #6d4c41;
      --paper-brown-700: #5d4037;
      --paper-brown-800: #4e342e;
      --paper-brown-900: #3e2723;

      --paper-grey-50: #fafafa;
      --paper-grey-100: #f5f5f5;
      --paper-grey-200: #eeeeee;
      --paper-grey-300: #e0e0e0;
      --paper-grey-400: #bdbdbd;
      --paper-grey-500: #9e9e9e;
      --paper-grey-600: #757575;
      --paper-grey-700: #616161;
      --paper-grey-800: #424242;
      --paper-grey-900: #212121;

      --paper-blue-grey-50: #eceff1;
      --paper-blue-grey-100: #cfd8dc;
      --paper-blue-grey-200: #b0bec5;
      --paper-blue-grey-300: #90a4ae;
      --paper-blue-grey-400: #78909c;
      --paper-blue-grey-500: #607d8b;
      --paper-blue-grey-600: #546e7a;
      --paper-blue-grey-700: #455a64;
      --paper-blue-grey-800: #37474f;
      --paper-blue-grey-900: #263238;

      /* opacity for dark text on a light background */
      --dark-divider-opacity: 0.12;
      --dark-disabled-opacity: 0.38; /* or hint text or icon */
      --dark-secondary-opacity: 0.54;
      --dark-primary-opacity: 0.87;

      /* opacity for light text on a dark background */
      --light-divider-opacity: 0.12;
      --light-disabled-opacity: 0.3; /* or hint text or icon */
      --light-secondary-opacity: 0.7;
      --light-primary-opacity: 1.0;

    }

  </style>
</custom-style>`;document.head.appendChild($_documentContainer$2);/**
                                                  @license
                                                  Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
                                                  This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
                                                  The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
                                                  The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
                                                  Code distributed by Google as part of the polymer project is also
                                                  subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
                                                  */const $_documentContainer$3=document.createElement('div');$_documentContainer$3.setAttribute('style','display: none;');$_documentContainer$3.innerHTML=`<custom-style>
  <style is="custom-style">
    html {
      /*
       * You can use these generic variables in your elements for easy theming.
       * For example, if all your elements use \`--primary-text-color\` as its main
       * color, then switching from a light to a dark theme is just a matter of
       * changing the value of \`--primary-text-color\` in your application.
       */
      --primary-text-color: var(--light-theme-text-color);
      --primary-background-color: var(--light-theme-background-color);
      --secondary-text-color: var(--light-theme-secondary-color);
      --disabled-text-color: var(--light-theme-disabled-color);
      --divider-color: var(--light-theme-divider-color);
      --error-color: var(--paper-deep-orange-a700);

      /*
       * Primary and accent colors. Also see color.html for more colors.
       */
      --primary-color: var(--paper-indigo-500);
      --light-primary-color: var(--paper-indigo-100);
      --dark-primary-color: var(--paper-indigo-700);

      --accent-color: var(--paper-pink-a200);
      --light-accent-color: var(--paper-pink-a100);
      --dark-accent-color: var(--paper-pink-a400);


      /*
       * Material Design Light background theme
       */
      --light-theme-background-color: #ffffff;
      --light-theme-base-color: #000000;
      --light-theme-text-color: var(--paper-grey-900);
      --light-theme-secondary-color: #737373;  /* for secondary text and icons */
      --light-theme-disabled-color: #9b9b9b;  /* disabled/hint text */
      --light-theme-divider-color: #dbdbdb;

      /*
       * Material Design Dark background theme
       */
      --dark-theme-background-color: var(--paper-grey-900);
      --dark-theme-base-color: #ffffff;
      --dark-theme-text-color: #ffffff;
      --dark-theme-secondary-color: #bcbcbc;  /* for secondary text and icons */
      --dark-theme-disabled-color: #646464;  /* disabled/hint text */
      --dark-theme-divider-color: #3c3c3c;

      /*
       * Deprecated values because of their confusing names.
       */
      --text-primary-color: var(--dark-theme-text-color);
      --default-primary-color: var(--primary-color);
    }
  </style>
</custom-style>`;document.head.appendChild($_documentContainer$3);/**
                                                  @license
                                                  Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
                                                  This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
                                                  The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
                                                  The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
                                                  Code distributed by Google as part of the polymer project is also
                                                  subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
                                                  */ /* Taken from https://www.google.com/design/spec/style/color.html#color-ui-color-application */const $_documentContainer$4=document.createElement('div');$_documentContainer$4.setAttribute('style','display: none;');$_documentContainer$4.innerHTML=`<dom-module id="paper-icon-button">
  <template strip-whitespace="">
    <style>
      :host {
        display: inline-block;
        position: relative;
        padding: 8px;
        outline: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        cursor: pointer;
        z-index: 0;
        line-height: 1;

        width: 40px;
        height: 40px;

        /* NOTE: Both values are needed, since some phones require the value to be \`transparent\`. */
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        -webkit-tap-highlight-color: transparent;

        /* Because of polymer/2558, this style has lower specificity than * */
        box-sizing: border-box !important;

        @apply --paper-icon-button;
      }

      :host #ink {
        color: var(--paper-icon-button-ink-color, var(--primary-text-color));
        opacity: 0.6;
      }

      :host([disabled]) {
        color: var(--paper-icon-button-disabled-text, var(--disabled-text-color));
        pointer-events: none;
        cursor: auto;

        @apply --paper-icon-button-disabled;
      }

      :host([hidden]) {
        display: none !important;
      }

      :host(:hover) {
        @apply --paper-icon-button-hover;
      }

      iron-icon {
        --iron-icon-width: 100%;
        --iron-icon-height: 100%;
      }
    </style>

    <iron-icon id="icon" src="[[src]]" icon="[[icon]]" alt\$="[[alt]]"></iron-icon>
  </template>

  
</dom-module>`;document.head.appendChild($_documentContainer$4);/**
                                                  @license
                                                  Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
                                                  This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
                                                  The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
                                                  The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
                                                  Code distributed by Google as part of the polymer project is also
                                                  subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
                                                  */ /**
                                                     Material design: [Icon toggles](https://www.google.com/design/spec/components/buttons.html#buttons-toggle-buttons)
                                                     
                                                     `paper-icon-button` is a button with an image placed at the center. When the user touches
                                                     the button, a ripple effect emanates from the center of the button.
                                                     
                                                     `paper-icon-button` does not include a default icon set. To use icons from the default
                                                     set, include `PolymerElements/iron-icons/iron-icons.html`, and use the `icon` attribute to specify which icon
                                                     from the icon set to use.
                                                     
                                                         <paper-icon-button icon="menu"></paper-icon-button>
                                                     
                                                     See [`iron-iconset`](iron-iconset) for more information about
                                                     how to use a custom icon set.
                                                     
                                                     Example:
                                                     
                                                         <link href="path/to/iron-icons/iron-icons.html" rel="import">
                                                     
                                                         <paper-icon-button icon="favorite"></paper-icon-button>
                                                         <paper-icon-button src="star.png"></paper-icon-button>
                                                     
                                                     To use `paper-icon-button` as a link, wrap it in an anchor tag. Since `paper-icon-button`
                                                     will already receive focus, you may want to prevent the anchor tag from receiving focus
                                                     as well by setting its tabindex to -1.
                                                     
                                                         <a href="https://www.polymer-project.org" tabindex="-1">
                                                           <paper-icon-button icon="polymer"></paper-icon-button>
                                                         </a>
                                                     
                                                     ### Styling
                                                     
                                                     Style the button with CSS as you would a normal DOM element. If you are using the icons
                                                     provided by `iron-icons`, they will inherit the foreground color of the button.
                                                     
                                                         /* make a red "favorite" button *\/
                                                         <paper-icon-button icon="favorite" style="color: red;"></paper-icon-button>
                                                     
                                                     By default, the ripple is the same color as the foreground at 25% opacity. You may
                                                     customize the color using the `--paper-icon-button-ink-color` custom property.
                                                     
                                                     The following custom properties and mixins are available for styling:
                                                     
                                                     Custom property | Description | Default
                                                     ----------------|-------------|----------
                                                     `--paper-icon-button-disabled-text` | The color of the disabled button | `--disabled-text-color`
                                                     `--paper-icon-button-ink-color` | Selected/focus ripple color | `--primary-text-color`
                                                     `--paper-icon-button` | Mixin for a button | `{}`
                                                     `--paper-icon-button-disabled` | Mixin for a disabled button | `{}`
                                                     `--paper-icon-button-hover` | Mixin for button on hover | `{}`
                                                     
                                                     @group Paper Elements
                                                     @element paper-icon-button
                                                     @demo demo/index.html
                                                     */Polymer({is:'paper-icon-button',hostAttributes:{role:'button',tabindex:'0'},behaviors:[PaperInkyFocusBehavior],properties:{/**
     * The URL of an image for the icon. If the src property is specified,
     * the icon property should not be.
     */src:{type:String},/**
     * Specifies the icon name or index in the set of icons available in
     * the icon's icon set. If the icon property is specified,
     * the src property should not be.
     */icon:{type:String},/**
     * Specifies the alternate text for the button, for accessibility.
     */alt:{type:String,observer:"_altChanged"}},_altChanged:function(newValue,oldValue){var label=this.getAttribute('aria-label');// Don't stomp over a user-set aria-label.
if(!label||oldValue==label){this.setAttribute('aria-label',newValue);}}});const PaperInputAddonBehavior={attached:function(){// Workaround for https://github.com/webcomponents/shadydom/issues/96
flush$1();this.fire('addon-attached');},/**
   * The function called by `<paper-input-container>` when the input value or validity changes.
   * @param {{
   *   invalid: boolean,
   *   inputElement: (Element|undefined),
   *   value: (string|undefined)
   * }} state -
   *     inputElement: The input element.
   *     value: The input value.
   *     invalid: True if the input value is invalid.
   */update:function(state){}};var paperInputAddonBehavior={PaperInputAddonBehavior:PaperInputAddonBehavior};const PaperInputHelper={};PaperInputHelper.NextLabelID=1;PaperInputHelper.NextAddonID=1;PaperInputHelper.NextInputID=1;const PaperInputBehaviorImpl={properties:{/**
     * Fired when the input changes due to user interaction.
     *
     * @event change
     */ /**
         * The label for this input. If you're using PaperInputBehavior to
         * implement your own paper-input-like element, bind this to
         * `<label>`'s content and `hidden` property, e.g.
         * `<label hidden$="[[!label]]">[[label]]</label>` in your `template`
         */label:{type:String},/**
     * The value for this input. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<iron-input>`'s `bindValue`
     * property, or the value property of your input that is `notify:true`.
     */value:{notify:true,type:String},/**
     * Set to true to disable this input. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * both the `<paper-input-container>`'s and the input's `disabled` property.
     */disabled:{type:Boolean,value:false},/**
     * Returns true if the value is invalid. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to both the
     * `<paper-input-container>`'s and the input's `invalid` property.
     *
     * If `autoValidate` is true, the `invalid` attribute is managed automatically,
     * which can clobber attempts to manage it manually.
     */invalid:{type:Boolean,value:false,notify:true},/**
     * Set this to specify the pattern allowed by `preventInvalidInput`. If
     * you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `allowedPattern`
     * property.
     */allowedPattern:{type:String},/**
     * The type of the input. The supported types are the
     * [native input's types](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#Form_<input>_types).
     * If you're using PaperInputBehavior to implement your own paper-input-like element,
     * bind this to the (Polymer 1) `<input is="iron-input">`'s or (Polymer 2)
     * `<iron-input>`'s `type` property.
     */type:{type:String},/**
     * The datalist of the input (if any). This should match the id of an existing `<datalist>`.
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `list` property.
     */list:{type:String},/**
     * A pattern to validate the `input` with. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<input is="iron-input">`'s `pattern` property.
     */pattern:{type:String},/**
     * Set to true to mark the input as required. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<input is="iron-input">`'s `required` property.
     */required:{type:Boolean,value:false},/**
     * The error message to display when the input is invalid. If you're using
     * PaperInputBehavior to implement your own paper-input-like element,
     * bind this to the `<paper-input-error>`'s content, if using.
     */errorMessage:{type:String},/**
     * Set to true to show a character counter.
     */charCounter:{type:Boolean,value:false},/**
     * Set to true to disable the floating label. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<paper-input-container>`'s `noLabelFloat` property.
     */noLabelFloat:{type:Boolean,value:false},/**
     * Set to true to always float the label. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<paper-input-container>`'s `alwaysFloatLabel` property.
     */alwaysFloatLabel:{type:Boolean,value:false},/**
     * Set to true to auto-validate the input value. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<paper-input-container>`'s `autoValidate` property.
     */autoValidate:{type:Boolean,value:false},/**
     * Name of the validator to use. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<input is="iron-input">`'s `validator` property.
     */validator:{type:String},// HTMLInputElement attributes for binding if needed
/**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `autocomplete` property.
     */autocomplete:{type:String,value:'off'},/**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `autofocus` property.
     */autofocus:{type:Boolean,observer:'_autofocusChanged'},/**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `inputmode` property.
     */inputmode:{type:String},/**
     * The minimum length of the input value.
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `minlength` property.
     */minlength:{type:Number},/**
     * The maximum length of the input value.
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `maxlength` property.
     */maxlength:{type:Number},/**
     * The minimum (numeric or date-time) input value.
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `min` property.
     */min:{type:String},/**
     * The maximum (numeric or date-time) input value.
     * Can be a String (e.g. `"2000-01-01"`) or a Number (e.g. `2`).
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `max` property.
     */max:{type:String},/**
     * Limits the numeric or date-time increments.
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `step` property.
     */step:{type:String},/**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `name` property.
     */name:{type:String},/**
     * A placeholder string in addition to the label. If this is set, the label will always float.
     */placeholder:{type:String,// need to set a default so _computeAlwaysFloatLabel is run
value:''},/**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `readonly` property.
     */readonly:{type:Boolean,value:false},/**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `size` property.
     */size:{type:Number},// Nonstandard attributes for binding if needed
/**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `autocapitalize` property.
     */autocapitalize:{type:String,value:'none'},/**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `autocorrect` property.
     */autocorrect:{type:String,value:'off'},/**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `autosave` property,
     * used with type=search.
     */autosave:{type:String},/**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `results` property,
     * used with type=search.
     */results:{type:Number},/**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `accept` property,
     * used with type=file.
     */accept:{type:String},/**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the`<input is="iron-input">`'s `multiple` property,
     * used with type=file.
     */multiple:{type:Boolean},/** @private */_ariaDescribedBy:{type:String,value:''},/** @private */_ariaLabelledBy:{type:String,value:''},/** @private */_inputId:{type:String,value:''}},listeners:{'addon-attached':'_onAddonAttached'},/**
   * @type {!Object}
   */keyBindings:{'shift+tab:keydown':'_onShiftTabDown'},/** @private */hostAttributes:{tabindex:0},/**
   * Returns a reference to the input element.
   * @return {!HTMLElement}
   */get inputElement(){// Chrome generates audit errors if an <input type="password"> has a
// duplicate ID, which is almost always true in Shady DOM. Generate
// a unique ID instead.
if(!this.$){this.$={};}if(!this.$.input){this._generateInputId();this.$.input=this.$$('#'+this._inputId);}return this.$.input;},/**
   * Returns a reference to the focusable element.
   * @return {!HTMLElement}
   */get _focusableElement(){return this.inputElement;},created:function(){// These types have some default placeholder text; overlapping
// the label on top of it looks terrible. Auto-float the label in this case.
this._typesThatHaveText=["date","datetime","datetime-local","month","time","week","file"];},attached:function(){this._updateAriaLabelledBy();// In the 2.0 version of the element, this is handled in `onIronInputReady`,
// i.e. after the native input has finished distributing. In the 1.0 version,
// the input is in the shadow tree, so it's already available.
if(!Element$1&&this.inputElement&&this._typesThatHaveText.indexOf(this.inputElement.type)!==-1){this.alwaysFloatLabel=true;}},_appendStringWithSpace:function(str,more){if(str){str=str+' '+more;}else{str=more;}return str;},_onAddonAttached:function(event){var target=dom(event).rootTarget;if(target.id){this._ariaDescribedBy=this._appendStringWithSpace(this._ariaDescribedBy,target.id);}else{var id='paper-input-add-on-'+PaperInputHelper.NextAddonID++;target.id=id;this._ariaDescribedBy=this._appendStringWithSpace(this._ariaDescribedBy,id);}},/**
   * Validates the input element and sets an error style if needed.
   *
   * @return {boolean}
   */validate:function(){return this.inputElement.validate();},/**
   * Forward focus to inputElement. Overriden from IronControlState.
   */_focusBlurHandler:function(event){IronControlState._focusBlurHandler.call(this,event);// Forward the focus to the nested input.
if(this.focused&&!this._shiftTabPressed&&this._focusableElement){this._focusableElement.focus();}},/**
   * Handler that is called when a shift+tab keypress is detected by the menu.
   *
   * @param {CustomEvent} event A key combination event.
   */_onShiftTabDown:function(event){var oldTabIndex=this.getAttribute('tabindex');this._shiftTabPressed=true;this.setAttribute('tabindex','-1');this.async(function(){this.setAttribute('tabindex',oldTabIndex);this._shiftTabPressed=false;},1);},/**
   * If `autoValidate` is true, then validates the element.
   */_handleAutoValidate:function(){if(this.autoValidate)this.validate();},/**
   * Restores the cursor to its original position after updating the value.
   * @param {string} newValue The value that should be saved.
   */updateValueAndPreserveCaret:function(newValue){// Not all elements might have selection, and even if they have the
// right properties, accessing them might throw an exception (like for
// <input type=number>)
try{var start=this.inputElement.selectionStart;this.value=newValue;// The cursor automatically jumps to the end after re-setting the value,
// so restore it to its original position.
this.inputElement.selectionStart=start;this.inputElement.selectionEnd=start;}catch(e){// Just set the value and give up on the caret.
this.value=newValue;}},_computeAlwaysFloatLabel:function(alwaysFloatLabel,placeholder){return placeholder||alwaysFloatLabel;},_updateAriaLabelledBy:function(){var label=dom(this.root).querySelector('label');if(!label){this._ariaLabelledBy='';return;}var labelledBy;if(label.id){labelledBy=label.id;}else{labelledBy='paper-input-label-'+PaperInputHelper.NextLabelID++;label.id=labelledBy;}this._ariaLabelledBy=labelledBy;},_generateInputId:function(){if(!this._inputId||this._inputId===''){this._inputId='input-'+PaperInputHelper.NextInputID++;}},_onChange:function(event){// In the Shadow DOM, the `change` event is not leaked into the
// ancestor tree, so we must do this manually.
// See https://w3c.github.io/webcomponents/spec/shadow/#events-that-are-not-leaked-into-ancestor-trees.
if(this.shadowRoot){this.fire(event.type,{sourceEvent:event},{node:this,bubbles:event.bubbles,cancelable:event.cancelable});}},_autofocusChanged:function(){// Firefox doesn't respect the autofocus attribute if it's applied after
// the page is loaded (Chrome/WebKit do respect it), preventing an
// autofocus attribute specified in markup from taking effect when the
// element is upgraded. As a workaround, if the autofocus property is set,
// and the focus hasn't already been moved elsewhere, we take focus.
if(this.autofocus&&this._focusableElement){// In IE 11, the default document.activeElement can be the page's
// outermost html element, but there are also cases (under the
// polyfill?) in which the activeElement is not a real HTMLElement, but
// just a plain object. We identify the latter case as having no valid
// activeElement.
var activeElement=document.activeElement;var isActiveElementValid=activeElement instanceof HTMLElement;// Has some other element has already taken the focus?
var isSomeElementActive=isActiveElementValid&&activeElement!==document.body&&activeElement!==document.documentElement;/* IE 11 */if(!isSomeElementActive){// No specific element has taken the focus yet, so we can take it.
this._focusableElement.focus();}}}};const PaperInputBehavior=[IronControlState,IronA11yKeysBehavior,PaperInputBehaviorImpl];var paperInputBehavior={PaperInputHelper:PaperInputHelper,PaperInputBehaviorImpl:PaperInputBehaviorImpl,PaperInputBehavior:PaperInputBehavior};const $_documentContainer$5=document.createElement('div');$_documentContainer$5.setAttribute('style','display: none;');$_documentContainer$5.innerHTML=`<custom-style>
  <style is="custom-style">
    html {

      /* Shared Styles */
      --paper-font-common-base: {
        font-family: 'Roboto', 'Noto', sans-serif;
        -webkit-font-smoothing: antialiased;
      };

      --paper-font-common-code: {
        font-family: 'Roboto Mono', 'Consolas', 'Menlo', monospace;
        -webkit-font-smoothing: antialiased;
      };

      --paper-font-common-expensive-kerning: {
        text-rendering: optimizeLegibility;
      };

      --paper-font-common-nowrap: {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      };

      /* Material Font Styles */

      --paper-font-display4: {
        @apply --paper-font-common-base;
        @apply --paper-font-common-nowrap;

        font-size: 112px;
        font-weight: 300;
        letter-spacing: -.044em;
        line-height: 120px;
      };

      --paper-font-display3: {
        @apply --paper-font-common-base;
        @apply --paper-font-common-nowrap;

        font-size: 56px;
        font-weight: 400;
        letter-spacing: -.026em;
        line-height: 60px;
      };

      --paper-font-display2: {
        @apply --paper-font-common-base;

        font-size: 45px;
        font-weight: 400;
        letter-spacing: -.018em;
        line-height: 48px;
      };

      --paper-font-display1: {
        @apply --paper-font-common-base;

        font-size: 34px;
        font-weight: 400;
        letter-spacing: -.01em;
        line-height: 40px;
      };

      --paper-font-headline: {
        @apply --paper-font-common-base;

        font-size: 24px;
        font-weight: 400;
        letter-spacing: -.012em;
        line-height: 32px;
      };

      --paper-font-title: {
        @apply --paper-font-common-base;
        @apply --paper-font-common-nowrap;

        font-size: 20px;
        font-weight: 500;
        line-height: 28px;
      };

      --paper-font-subhead: {
        @apply --paper-font-common-base;

        font-size: 16px;
        font-weight: 400;
        line-height: 24px;
      };

      --paper-font-body2: {
        @apply --paper-font-common-base;

        font-size: 14px;
        font-weight: 500;
        line-height: 24px;
      };

      --paper-font-body1: {
        @apply --paper-font-common-base;

        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
      };

      --paper-font-caption: {
        @apply --paper-font-common-base;
        @apply --paper-font-common-nowrap;

        font-size: 12px;
        font-weight: 400;
        letter-spacing: 0.011em;
        line-height: 20px;
      };

      --paper-font-menu: {
        @apply --paper-font-common-base;
        @apply --paper-font-common-nowrap;

        font-size: 13px;
        font-weight: 500;
        line-height: 24px;
      };

      --paper-font-button: {
        @apply --paper-font-common-base;
        @apply --paper-font-common-nowrap;

        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.018em;
        line-height: 24px;
        text-transform: uppercase;
      };

      --paper-font-code2: {
        @apply --paper-font-common-code;

        font-size: 14px;
        font-weight: 700;
        line-height: 20px;
      };

      --paper-font-code1: {
        @apply --paper-font-common-code;

        font-size: 14px;
        font-weight: 500;
        line-height: 20px;
      };

    }

  </style>
</custom-style>`;document.head.appendChild($_documentContainer$5);/**
                                                  @license
                                                  Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
                                                  This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
                                                  The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
                                                  The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
                                                  Code distributed by Google as part of the polymer project is also
                                                  subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
                                                  */ /*
                                                     Typographic styles are provided matching the Material Design standard styles:
                                                     http://www.google.com/design/spec/style/typography.html#typography-standard-styles
                                                     
                                                     Note that these are English/Latin centric styles. You may need to further adjust
                                                     line heights and weights for CJK typesetting. See the notes in the Material
                                                     Design typography section.
                                                     */ /**
                                                        @license
                                                        Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
                                                        This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
                                                        The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
                                                        The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
                                                        Code distributed by Google as part of the polymer project is also
                                                        subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
                                                        */ /*
                                                           `<paper-input-char-counter>` is a character counter for use with `<paper-input-container>`. It
                                                           shows the number of characters entered in the input and the max length if it is specified.
                                                           
                                                               <paper-input-container>
                                                                 <input maxlength="20">
                                                                 <paper-input-char-counter></paper-input-char-counter>
                                                               </paper-input-container>
                                                           
                                                           ### Styling
                                                           
                                                           The following mixin is available for styling:
                                                           
                                                           Custom property | Description | Default
                                                           ----------------|-------------|----------
                                                           `--paper-input-char-counter` | Mixin applied to the element | `{}`
                                                           */Polymer({_template:html`
    <style>
      :host {
        display: inline-block;
        float: right;

        @apply --paper-font-caption;
        @apply --paper-input-char-counter;
      }

      :host([hidden]) {
        display: none !important;
      }

      :host(:dir(rtl)) {
        float: left;
      }
    </style>

    <span>[[_charCounterStr]]</span>
`,is:'paper-input-char-counter',behaviors:[PaperInputAddonBehavior],properties:{_charCounterStr:{type:String,value:'0'}},/**
   * This overrides the update function in PaperInputAddonBehavior.
   * @param {{
   *   inputElement: (Element|undefined),
   *   value: (string|undefined),
   *   invalid: boolean
   * }} state -
   *     inputElement: The input element.
   *     value: The input value.
   *     invalid: True if the input value is invalid.
   */update:function(state){if(!state.inputElement){return;}state.value=state.value||'';var counter=state.value.toString().length.toString();if(state.inputElement.hasAttribute('maxlength')){counter+='/'+state.inputElement.getAttribute('maxlength');}this._charCounterStr=counter;}});const $_documentContainer$6=document.createElement('div');$_documentContainer$6.setAttribute('style','display: none;');$_documentContainer$6.innerHTML=`<custom-style>
  <style is="custom-style">
    html {
      --paper-input-container-shared-input-style: {
        position: relative; /* to make a stacking context */
        outline: none;
        box-shadow: none;
        padding: 0;
        width: 100%;
        max-width: 100%;
        background: transparent;
        border: none;
        color: var(--paper-input-container-input-color, var(--primary-text-color));
        -webkit-appearance: none;
        text-align: inherit;
        vertical-align: bottom;

        @apply --paper-font-subhead;
      };
    }
  </style>
</custom-style>`;document.head.appendChild($_documentContainer$6);/**
                                                  @license
                                                  Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
                                                  This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
                                                  The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
                                                  The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
                                                  Code distributed by Google as part of the polymer project is also
                                                  subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
                                                  */ /*
                                                     `<paper-input-container>` is a container for a `<label>`, an `<iron-input>` or
                                                     `<textarea>` and optional add-on elements such as an error message or character
                                                     counter, used to implement Material Design text fields.
                                                     
                                                     For example:
                                                     
                                                         <paper-input-container>
                                                           <label slot="label">Your name</label>
                                                           <iron-input slot="input">
                                                             <input>
                                                           </iron-input>
                                                           // In Polymer 1.0, you would use `<input is="iron-input" slot="input">` instead of the above.
                                                         </paper-input-container>
                                                     
                                                     You can style the nested `<input>` however you want; if you want it to look like a
                                                     Material Design input, you can style it with the --paper-input-container-shared-input-style mixin.
                                                     
                                                     Do not wrap `<paper-input-container>` around elements that already include it, such as `<paper-input>`.
                                                     Doing so may cause events to bounce infinitely between the container and its contained element.
                                                     
                                                     ### Listening for input changes
                                                     
                                                     By default, it listens for changes on the `bind-value` attribute on its children nodes and perform
                                                     tasks such as auto-validating and label styling when the `bind-value` changes. You can configure
                                                     the attribute it listens to with the `attr-for-value` attribute.
                                                     
                                                     ### Using a custom input element
                                                     
                                                     You can use a custom input element in a `<paper-input-container>`, for example to implement a
                                                     compound input field like a social security number input. The custom input element should have the
                                                     `paper-input-input` class, have a `notify:true` value property and optionally implements
                                                     `Polymer.IronValidatableBehavior` if it is validatable.
                                                     
                                                         <paper-input-container attr-for-value="ssn-value">
                                                           <label slot="label">Social security number</label>
                                                           <ssn-input slot="input" class="paper-input-input"></ssn-input>
                                                         </paper-input-container>
                                                     
                                                     
                                                     If you're using a `<paper-input-container>` imperatively, it's important to make sure
                                                     that you attach its children (the `iron-input` and the optional `label`) before you
                                                     attach the `<paper-input-container>` itself, so that it can be set up correctly.
                                                     
                                                     ### Validation
                                                     
                                                     If the `auto-validate` attribute is set, the input container will validate the input and update
                                                     the container styling when the input value changes.
                                                     
                                                     ### Add-ons
                                                     
                                                     Add-ons are child elements of a `<paper-input-container>` with the `add-on` attribute and
                                                     implements the `Polymer.PaperInputAddonBehavior` behavior. They are notified when the input value
                                                     or validity changes, and may implement functionality such as error messages or character counters.
                                                     They appear at the bottom of the input.
                                                     
                                                     ### Prefixes and suffixes
                                                     These are child elements of a `<paper-input-container>` with the `prefix`
                                                     or `suffix` attribute, and are displayed inline with the input, before or after.
                                                     
                                                         <paper-input-container>
                                                           <div slot="prefix">$</div>
                                                           <label slot="label">Total</label>
                                                           <iron-input slot="input">
                                                             <input>
                                                           </iron-input>
                                                           // In Polymer 1.0, you would use `<input is="iron-input" slot="input">` instead of the above.
                                                           <paper-icon-button slot="suffix" icon="clear"></paper-icon-button>
                                                         </paper-input-container>
                                                     
                                                     ### Styling
                                                     
                                                     The following custom properties and mixins are available for styling:
                                                     
                                                     Custom property | Description | Default
                                                     ----------------|-------------|----------
                                                     `--paper-input-container-color` | Label and underline color when the input is not focused | `--secondary-text-color`
                                                     `--paper-input-container-focus-color` | Label and underline color when the input is focused | `--primary-color`
                                                     `--paper-input-container-invalid-color` | Label and underline color when the input is is invalid | `--error-color`
                                                     `--paper-input-container-input-color` | Input foreground color | `--primary-text-color`
                                                     `--paper-input-container` | Mixin applied to the container | `{}`
                                                     `--paper-input-container-disabled` | Mixin applied to the container when it's disabled | `{}`
                                                     `--paper-input-container-label` | Mixin applied to the label | `{}`
                                                     `--paper-input-container-label-focus` | Mixin applied to the label when the input is focused | `{}`
                                                     `--paper-input-container-label-floating` | Mixin applied to the label when floating | `{}`
                                                     `--paper-input-container-input` | Mixin applied to the input | `{}`
                                                     `--paper-input-container-input-disabled` | Mixin applied to the input when the component is disabled | `{}`
                                                     `--paper-input-container-input-focus` | Mixin applied to the input when focused | `{}`
                                                     `--paper-input-container-input-invalid` | Mixin applied to the input when invalid | `{}`
                                                     `--paper-input-container-input-webkit-spinner` | Mixin applied to the webkit spinner | `{}`
                                                     `--paper-input-container-input-webkit-clear` | Mixin applied to the webkit clear button | `{}`
                                                     `--paper-input-container-input-webkit-calendar-picker-indicator` | Mixin applied to the webkit calendar picker indicator | `{}`
                                                     `--paper-input-container-ms-clear` | Mixin applied to the Internet Explorer clear button | `{}`
                                                     `--paper-input-container-underline` | Mixin applied to the underline | `{}`
                                                     `--paper-input-container-underline-focus` | Mixin applied to the underline when the input is focused | `{}`
                                                     `--paper-input-container-underline-disabled` | Mixin applied to the underline when the input is disabled | `{}`
                                                     `--paper-input-prefix` | Mixin applied to the input prefix | `{}`
                                                     `--paper-input-suffix` | Mixin applied to the input suffix | `{}`
                                                     
                                                     This element is `display:block` by default, but you can set the `inline` attribute to make it
                                                     `display:inline-block`.
                                                     */Polymer({_template:html`
    <style>
      :host {
        display: block;
        padding: 8px 0;
        @apply --paper-input-container;
      }

      :host([inline]) {
        display: inline-block;
      }

      :host([disabled]) {
        pointer-events: none;
        opacity: 0.33;

        @apply --paper-input-container-disabled;
      }

      :host([hidden]) {
        display: none !important;
      }

      [hidden] {
        display: none !important;
      }

      .floated-label-placeholder {
        @apply --paper-font-caption;
      }

      .underline {
        height: 2px;
        position: relative;
      }

      .focused-line {
        @apply --layout-fit;
        border-bottom: 2px solid var(--paper-input-container-focus-color, var(--primary-color));

        -webkit-transform-origin: center center;
        transform-origin: center center;
        -webkit-transform: scale3d(0,1,1);
        transform: scale3d(0,1,1);

        @apply --paper-input-container-underline-focus;
      }

      .underline.is-highlighted .focused-line {
        -webkit-transform: none;
        transform: none;
        -webkit-transition: -webkit-transform 0.25s;
        transition: transform 0.25s;

        @apply --paper-transition-easing;
      }

      .underline.is-invalid .focused-line {
        border-color: var(--paper-input-container-invalid-color, var(--error-color));
        -webkit-transform: none;
        transform: none;
        -webkit-transition: -webkit-transform 0.25s;
        transition: transform 0.25s;

        @apply --paper-transition-easing;
      }

      .unfocused-line {
        @apply --layout-fit;
        border-bottom: 1px solid var(--paper-input-container-color, var(--secondary-text-color));
        @apply --paper-input-container-underline;
      }

      :host([disabled]) .unfocused-line {
        border-bottom: 1px dashed;
        border-color: var(--paper-input-container-color, var(--secondary-text-color));
        @apply --paper-input-container-underline-disabled;
      }

      .input-wrapper {
        @apply --layout-horizontal;
        @apply --layout-center;
        position: relative;
      }

      .input-content {
        @apply --layout-flex-auto;
        @apply --layout-relative;
        max-width: 100%;
      }

      .input-content ::slotted(label),
      .input-content ::slotted(.paper-input-label) {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        font: inherit;
        color: var(--paper-input-container-color, var(--secondary-text-color));
        -webkit-transition: -webkit-transform 0.25s, width 0.25s;
        transition: transform 0.25s, width 0.25s;
        -webkit-transform-origin: left top;
        transform-origin: left top;
        /* Fix for safari not focusing 0-height date/time inputs with -webkit-apperance: none; */
        min-height: 1px;

        @apply --paper-font-common-nowrap;
        @apply --paper-font-subhead;
        @apply --paper-input-container-label;
        @apply --paper-transition-easing;
      }

      .input-content.label-is-floating ::slotted(label),
      .input-content.label-is-floating ::slotted(.paper-input-label) {
        -webkit-transform: translateY(-75%) scale(0.75);
        transform: translateY(-75%) scale(0.75);

        /* Since we scale to 75/100 of the size, we actually have 100/75 of the
        original space now available */
        width: 133%;

        @apply --paper-input-container-label-floating;
      }

      :host(:dir(rtl)) .input-content.label-is-floating ::slotted(label),
      :host(:dir(rtl)) .input-content.label-is-floating ::slotted(.paper-input-label) {
        right: 0;
        left: auto;
        -webkit-transform-origin: right top;
        transform-origin: right top;
      }

      .input-content.label-is-highlighted ::slotted(label),
      .input-content.label-is-highlighted ::slotted(.paper-input-label) {
        color: var(--paper-input-container-focus-color, var(--primary-color));

        @apply --paper-input-container-label-focus;
      }

      .input-content.is-invalid ::slotted(label),
      .input-content.is-invalid ::slotted(.paper-input-label) {
        color: var(--paper-input-container-invalid-color, var(--error-color));
      }

      .input-content.label-is-hidden ::slotted(label),
      .input-content.label-is-hidden ::slotted(.paper-input-label) {
        visibility: hidden;
      }

      .input-content ::slotted(iron-input) {
        @apply --paper-input-container-shared-input-style;
      }

      .input-content ::slotted(input),
      .input-content ::slotted(textarea),
      .input-content ::slotted(iron-autogrow-textarea),
      .input-content ::slotted(.paper-input-input) {
        @apply --paper-input-container-shared-input-style;
        @apply --paper-input-container-input;
      }

      .input-content ::slotted(input)::-webkit-outer-spin-button,
      .input-content ::slotted(input)::-webkit-inner-spin-button {
        @apply --paper-input-container-input-webkit-spinner;
      }

      .input-content.focused ::slotted(input),
      .input-content.focused ::slotted(textarea),
      .input-content.focused ::slotted(iron-autogrow-textarea),
      .input-content.focused ::slotted(.paper-input-input) {
        @apply --paper-input-container-input-focus;
      }

      .input-content.is-invalid ::slotted(input),
      .input-content.is-invalid ::slotted(textarea),
      .input-content.is-invalid ::slotted(iron-autogrow-textarea),
      .input-content.is-invalid ::slotted(.paper-input-input) {
        @apply --paper-input-container-input-invalid;
      }

      .prefix ::slotted(*) {
        display: inline-block;
        @apply --paper-font-subhead;
        @apply --layout-flex-none;
        @apply --paper-input-prefix;
      }

      .suffix ::slotted(*) {
        display: inline-block;
        @apply --paper-font-subhead;
        @apply --layout-flex-none;

        @apply --paper-input-suffix;
      }

      /* Firefox sets a min-width on the input, which can cause layout issues */
      .input-content ::slotted(input) {
        min-width: 0;
      }

      .input-content ::slotted(textarea) {
        resize: none;
      }

      .add-on-content {
        position: relative;
      }

      .add-on-content.is-invalid ::slotted(*) {
        color: var(--paper-input-container-invalid-color, var(--error-color));
      }

      .add-on-content.is-highlighted ::slotted(*) {
        color: var(--paper-input-container-focus-color, var(--primary-color));
      }
    </style>

    <div class="floated-label-placeholder" aria-hidden="true" hidden="[[noLabelFloat]]">&nbsp;</div>

    <div class="input-wrapper">
      <span class="prefix"><slot name="prefix"></slot></span>

      <div class\$="[[_computeInputContentClass(noLabelFloat,alwaysFloatLabel,focused,invalid,_inputHasContent)]]" id="labelAndInputContainer">
        <slot name="label"></slot>
        <slot name="input"></slot>
      </div>

      <span class="suffix"><slot name="suffix"></slot></span>
    </div>

    <div class\$="[[_computeUnderlineClass(focused,invalid)]]">
      <div class="unfocused-line"></div>
      <div class="focused-line"></div>
    </div>

    <div class\$="[[_computeAddOnContentClass(focused,invalid)]]">
      <slot name="add-on"></slot>
    </div>
`,is:'paper-input-container',properties:{/**
     * Set to true to disable the floating label. The label disappears when the input value is
     * not null.
     */noLabelFloat:{type:Boolean,value:false},/**
     * Set to true to always float the floating label.
     */alwaysFloatLabel:{type:Boolean,value:false},/**
     * The attribute to listen for value changes on.
     */attrForValue:{type:String,value:'bind-value'},/**
     * Set to true to auto-validate the input value when it changes.
     */autoValidate:{type:Boolean,value:false},/**
     * True if the input is invalid. This property is set automatically when the input value
     * changes if auto-validating, or when the `iron-input-validate` event is heard from a child.
     */invalid:{observer:'_invalidChanged',type:Boolean,value:false},/**
     * True if the input has focus.
     */focused:{readOnly:true,type:Boolean,value:false,notify:true},_addons:{type:Array// do not set a default value here intentionally - it will be initialized lazily when a
// distributed child is attached, which may occur before configuration for this element
// in polyfill.
},_inputHasContent:{type:Boolean,value:false},_inputSelector:{type:String,value:'input,iron-input,textarea,.paper-input-input'},_boundOnFocus:{type:Function,value:function(){return this._onFocus.bind(this);}},_boundOnBlur:{type:Function,value:function(){return this._onBlur.bind(this);}},_boundOnInput:{type:Function,value:function(){return this._onInput.bind(this);}},_boundValueChanged:{type:Function,value:function(){return this._onValueChanged.bind(this);}}},listeners:{'addon-attached':'_onAddonAttached','iron-input-validate':'_onIronInputValidate'},get _valueChangedEvent(){return this.attrForValue+'-changed';},get _propertyForValue(){return dashToCamelCase(this.attrForValue);},get _inputElement(){return dom(this).querySelector(this._inputSelector);},get _inputElementValue(){return this._inputElement[this._propertyForValue]||this._inputElement.value;},ready:function(){// Paper-input treats a value of undefined differently at startup than
// the rest of the time (specifically: it does not validate it at startup, but
// it does after that. We need to track whether the first time we encounter
// the value is basically this first time, so that we can validate it
// correctly the rest of the time. See https://github.com/PolymerElements/paper-input/issues/605
this.__isFirstValueUpdate=true;if(!this._addons){this._addons=[];}this.addEventListener('focus',this._boundOnFocus,true);this.addEventListener('blur',this._boundOnBlur,true);},attached:function(){if(this.attrForValue){this._inputElement.addEventListener(this._valueChangedEvent,this._boundValueChanged);}else{this.addEventListener('input',this._onInput);}// Only validate when attached if the input already has a value.
if(this._inputElementValue&&this._inputElementValue!=''){this._handleValueAndAutoValidate(this._inputElement);}else{this._handleValue(this._inputElement);}},/** @private */_onAddonAttached:function(event){if(!this._addons){this._addons=[];}var target=event.target;if(this._addons.indexOf(target)===-1){this._addons.push(target);if(this.isAttached){this._handleValue(this._inputElement);}}},/** @private */_onFocus:function(){this._setFocused(true);},/** @private */_onBlur:function(){this._setFocused(false);this._handleValueAndAutoValidate(this._inputElement);},/** @private */_onInput:function(event){this._handleValueAndAutoValidate(event.target);},/** @private */_onValueChanged:function(event){var input=event.target;// Paper-input treats a value of undefined differently at startup than
// the rest of the time (specifically: it does not validate it at startup, but
// it does after that. If this is in fact the bootup case, ignore validation,
// just this once.
if(this.__isFirstValueUpdate){this.__isFirstValueUpdate=false;if(input.value===undefined){return;}}this._handleValueAndAutoValidate(event.target);},/** @private */_handleValue:function(inputElement){var value=this._inputElementValue;// type="number" hack needed because this.value is empty until it's valid
if(value||value===0||inputElement.type==='number'&&!inputElement.checkValidity()){this._inputHasContent=true;}else{this._inputHasContent=false;}this.updateAddons({inputElement:inputElement,value:value,invalid:this.invalid});},/** @private */_handleValueAndAutoValidate:function(inputElement){if(this.autoValidate&&inputElement){var valid;if(inputElement.validate){valid=inputElement.validate(this._inputElementValue);}else{valid=inputElement.checkValidity();}this.invalid=!valid;}// Call this last to notify the add-ons.
this._handleValue(inputElement);},/** @private */_onIronInputValidate:function(event){this.invalid=this._inputElement.invalid;},/** @private */_invalidChanged:function(){if(this._addons){this.updateAddons({invalid:this.invalid});}},/**
   * Call this to update the state of add-ons.
   * @param {Object} state Add-on state.
   */updateAddons:function(state){for(var addon,index=0;addon=this._addons[index];index++){addon.update(state);}},/** @private */_computeInputContentClass:function(noLabelFloat,alwaysFloatLabel,focused,invalid,_inputHasContent){var cls='input-content';if(!noLabelFloat){var label=this.querySelector('label');if(alwaysFloatLabel||_inputHasContent){cls+=' label-is-floating';// If the label is floating, ignore any offsets that may have been
// applied from a prefix element.
this.$.labelAndInputContainer.style.position='static';if(invalid){cls+=' is-invalid';}else if(focused){cls+=" label-is-highlighted";}}else{// When the label is not floating, it should overlap the input element.
if(label){this.$.labelAndInputContainer.style.position='relative';}if(invalid){cls+=' is-invalid';}}}else{if(_inputHasContent){cls+=' label-is-hidden';}if(invalid){cls+=' is-invalid';}}if(focused){cls+=' focused';}return cls;},/** @private */_computeUnderlineClass:function(focused,invalid){var cls='underline';if(invalid){cls+=' is-invalid';}else if(focused){cls+=' is-highlighted';}return cls;},/** @private */_computeAddOnContentClass:function(focused,invalid){var cls='add-on-content';if(invalid){cls+=' is-invalid';}else if(focused){cls+=' is-highlighted';}return cls;}});/**
    @license
    Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
    This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
    The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
    The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
    Code distributed by Google as part of the polymer project is also
    subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
    */ /*
       `<paper-input-error>` is an error message for use with `<paper-input-container>`. The error is
       displayed when the `<paper-input-container>` is `invalid`.
       
           <paper-input-container>
             <input pattern="[0-9]*">
             <paper-input-error slot="add-on">Only numbers are allowed!</paper-input-error>
           </paper-input-container>
       
       ### Styling
       
       The following custom properties and mixins are available for styling:
       
       Custom property | Description | Default
       ----------------|-------------|----------
       `--paper-input-container-invalid-color` | The foreground color of the error | `--error-color`
       `--paper-input-error`                   | Mixin applied to the error        | `{}`
       */Polymer({_template:html`
    <style>
      :host {
        display: inline-block;
        visibility: hidden;

        color: var(--paper-input-container-invalid-color, var(--error-color));

        @apply --paper-font-caption;
        @apply --paper-input-error;
        position: absolute;
        left:0;
        right:0;
      }

      :host([invalid]) {
        visibility: visible;
      };
    </style>

    <slot></slot>
`,is:'paper-input-error',behaviors:[PaperInputAddonBehavior],properties:{/**
     * True if the error is showing.
     */invalid:{readOnly:true,reflectToAttribute:true,type:Boolean}},/**
   * This overrides the update function in PaperInputAddonBehavior.
   * @param {{
   *   inputElement: (Element|undefined),
   *   value: (string|undefined),
   *   invalid: boolean
   * }} state -
   *     inputElement: The input element.
   *     value: The input value.
   *     invalid: True if the input value is invalid.
   */update:function(state){this._setInvalid(state.invalid);}});const $_documentContainer$7=document.createElement('div');$_documentContainer$7.setAttribute('style','display: none;');$_documentContainer$7.innerHTML=`<dom-module id="paper-input">
  <template>
    <style>
      :host {
        display: block;
      }

      :host([focused]) {
        outline: none;
      }

      :host([hidden]) {
        display: none !important;
      }

      input {
        position: relative; /* to make a stacking context */
        outline: none;
        box-shadow: none;
        margin: 0;
        padding: 0;
        width: 100%;
        max-width: 100%;
        background: transparent;
        border: none;
        color: var(--paper-input-container-input-color, var(--primary-text-color));
        -webkit-appearance: none;
        text-align: inherit;
        vertical-align: bottom;

        /* Firefox sets a min-width on the input, which can cause layout issues */
        min-width: 0;

        @apply --paper-font-subhead;
        @apply --paper-input-container-input;
      }

      input:disabled {
        @apply --paper-input-container-input-disabled;
      }

      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        @apply --paper-input-container-input-webkit-spinner;
      }

      input::-webkit-clear-button {
        @apply --paper-input-container-input-webkit-clear;
      }

      input::-webkit-calendar-picker-indicator {
        @apply --paper-input-container-input-webkit-calendar-picker-indicator;
      }

      input::-webkit-input-placeholder {
        color: var(--paper-input-container-color, var(--secondary-text-color));
      }

      input:-moz-placeholder {
        color: var(--paper-input-container-color, var(--secondary-text-color));
      }

      input::-moz-placeholder {
        color: var(--paper-input-container-color, var(--secondary-text-color));
      }

      input::-ms-clear {
        @apply --paper-input-container-ms-clear;
      }

      input::-ms-reveal {
        @apply --paper-input-container-ms-reveal;
      }

      input:-ms-input-placeholder {
        color: var(--paper-input-container-color, var(--secondary-text-color));
      }

      label {
        pointer-events: none;
      }
    </style>

    <paper-input-container id="container" no-label-float="[[noLabelFloat]]" always-float-label="[[_computeAlwaysFloatLabel(alwaysFloatLabel,placeholder)]]" auto-validate\$="[[autoValidate]]" disabled\$="[[disabled]]" invalid="[[invalid]]">

      <slot name="prefix" slot="prefix"></slot>

      <label hidden\$="[[!label]]" aria-hidden="true" for\$="[[_inputId]]" slot="label">[[label]]</label>

      <span id="template-placeholder"></span>

      <slot name="suffix" slot="suffix"></slot>

      <template is="dom-if" if="[[errorMessage]]">
        <paper-input-error aria-live="assertive" slot="add-on">[[errorMessage]]</paper-input-error>
      </template>

      <template is="dom-if" if="[[charCounter]]">
        <paper-input-char-counter slot="add-on"></paper-input-char-counter>
      </template>

    </paper-input-container>
  </template>

  <!-- This is a fresh new hell to make this element hybrid. Basically, in 2.0
    we lost is=, so the example same template can't be used with iron-input 1.0 and 2.0.
    Expect some conditional code (especially in the tests).
   -->
  <template id="v0">
    <input is="iron-input" slot="input" class="input-element" id\$="[[_inputId]]" aria-labelledby\$="[[_ariaLabelledBy]]" aria-describedby\$="[[_ariaDescribedBy]]" disabled\$="[[disabled]]" title\$="[[title]]" bind-value="{{value}}" invalid="{{invalid}}" prevent-invalid-input="[[preventInvalidInput]]" allowed-pattern="[[allowedPattern]]" validator="[[validator]]" type\$="[[type]]" pattern\$="[[pattern]]" required\$="[[required]]" autocomplete\$="[[autocomplete]]" autofocus\$="[[autofocus]]" inputmode\$="[[inputmode]]" minlength\$="[[minlength]]" maxlength\$="[[maxlength]]" min\$="[[min]]" max\$="[[max]]" step\$="[[step]]" name\$="[[name]]" placeholder\$="[[placeholder]]" readonly\$="[[readonly]]" list\$="[[list]]" size\$="[[size]]" autocapitalize\$="[[autocapitalize]]" autocorrect\$="[[autocorrect]]" on-change="_onChange" tabindex\$="[[tabIndex]]" autosave\$="[[autosave]]" results\$="[[results]]" accept\$="[[accept]]" multiple\$="[[multiple]]">
  </template>

  <template id="v1">
    <!-- Need to bind maxlength so that the paper-input-char-counter works correctly -->
    <iron-input bind-value="{{value}}" slot="input" class="input-element" id\$="[[_inputId]]" maxlength\$="[[maxlength]]" allowed-pattern="[[allowedPattern]]" invalid="{{invalid}}" validator="[[validator]]">
      <input aria-labelledby\$="[[_ariaLabelledBy]]" aria-describedby\$="[[_ariaDescribedBy]]" disabled\$="[[disabled]]" title\$="[[title]]" type\$="[[type]]" pattern\$="[[pattern]]" required\$="[[required]]" autocomplete\$="[[autocomplete]]" autofocus\$="[[autofocus]]" inputmode\$="[[inputmode]]" minlength\$="[[minlength]]" maxlength\$="[[maxlength]]" min\$="[[min]]" max\$="[[max]]" step\$="[[step]]" name\$="[[name]]" placeholder\$="[[placeholder]]" readonly\$="[[readonly]]" list\$="[[list]]" size\$="[[size]]" autocapitalize\$="[[autocapitalize]]" autocorrect\$="[[autocorrect]]" on-change="_onChange" tabindex\$="[[tabIndex]]" autosave\$="[[autosave]]" results\$="[[results]]" accept\$="[[accept]]" multiple\$="[[multiple]]">
    </iron-input>
  </template>

</dom-module>`;document.head.appendChild($_documentContainer$7);/**
                                                  @license
                                                  Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
                                                  This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
                                                  The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
                                                  The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
                                                  Code distributed by Google as part of the polymer project is also
                                                  subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
                                                  */ /**
                                                     Material design: [Text fields](https://www.google.com/design/spec/components/text-fields.html)
                                                     
                                                     `<paper-input>` is a single-line text field with Material Design styling.
                                                     
                                                         <paper-input label="Input label"></paper-input>
                                                     
                                                     It may include an optional error message or character counter.
                                                     
                                                         <paper-input error-message="Invalid input!" label="Input label"></paper-input>
                                                         <paper-input char-counter label="Input label"></paper-input>
                                                     
                                                     It can also include custom prefix or suffix elements, which are displayed
                                                     before or after the text input itself. In order for an element to be
                                                     considered as a prefix, it must have the `prefix` attribute (and similarly
                                                     for `suffix`).
                                                     
                                                         <paper-input label="total">
                                                           <div prefix>$</div>
                                                           <paper-icon-button slot="suffix" icon="clear"></paper-icon-button>
                                                         </paper-input>
                                                     
                                                     A `paper-input` can use the native `type=search` or `type=file` features.
                                                     However, since we can't control the native styling of the input (search icon,
                                                     file button, date placeholder, etc.), in these cases the label will be
                                                     automatically floated. The `placeholder` attribute can still be used for
                                                     additional informational text.
                                                     
                                                         <paper-input label="search!" type="search"
                                                             placeholder="search for cats" autosave="test" results="5">
                                                         </paper-input>
                                                     
                                                     See `Polymer.PaperInputBehavior` for more API docs.
                                                     
                                                     ### Focus
                                                     
                                                     To focus a paper-input, you can call the native `focus()` method as long as the
                                                     paper input has a tab index. Similarly, `blur()` will blur the element.
                                                     
                                                     ### Styling
                                                     
                                                     See `Polymer.PaperInputContainer` for a list of custom properties used to
                                                     style this element.
                                                     
                                                     The following custom properties and mixins are available for styling:
                                                     
                                                     Custom property | Description | Default
                                                     ----------------|-------------|----------
                                                     `--paper-input-container-ms-clear` | Mixin applied to the Internet Explorer reveal button (the eyeball) | {}
                                                     
                                                     @group Paper Elements
                                                     @element paper-input
                                                     @hero hero.svg
                                                     @demo demo/index.html
                                                     
                                                     */ /* This is a fresh new hell to make this element hybrid. Basically, in 2.0
                                                            we lost is=, so the example same template can't be used with iron-input 1.0 and 2.0.
                                                            Expect some conditional code (especially in the tests).
                                                           */Polymer({is:'paper-input',behaviors:[PaperInputBehavior,IronFormElementBehavior],beforeRegister:function(){// We need to tell which kind of of template to stamp based on
// what kind of `iron-input` we got, but because of polyfills and
// custom elements differences between v0 and v1, the safest bet is
// to check a particular method we know the iron-input#2.x can have.
// If it doesn't have it, then it's an iron-input#1.x.
var ironInput=document.createElement('iron-input');var version=typeof ironInput._initSlottedInput=='function'?'v1':'v0';var template=DomModule.import('paper-input','template');var inputTemplate=DomModule.import('paper-input','template#'+version);var inputPlaceholder=template.content.querySelector('#template-placeholder');if(inputPlaceholder){inputPlaceholder.parentNode.replaceChild(inputTemplate.content,inputPlaceholder);}// else it's already been processed, probably in superclass
},/**
   * Returns a reference to the focusable element. Overridden from PaperInputBehavior
   * to correctly focus the native input.
   *
   * @return {!HTMLElement}
   */get _focusableElement(){return Element$1?this.inputElement._inputElement:this.inputElement;},// Note: This event is only available in the 1.0 version of this element.
// In 2.0, the functionality of `_onIronInputReady` is done in
// PaperInputBehavior::attached.
listeners:{'iron-input-ready':'_onIronInputReady'},_onIronInputReady:function(){// Even though this is only used in the next line, save this for
// backwards compatibility, since the native input had this ID until 2.0.5.
if(!this.$.nativeInput){this.$.nativeInput=this.$$('input');}if(this.inputElement&&this._typesThatHaveText.indexOf(this.$.nativeInput.type)!==-1){this.alwaysFloatLabel=true;}// Only validate when attached if the input already has a value.
if(!!this.inputElement.bindValue){this.$.container._handleValueAndAutoValidate(this.inputElement);}}});/**
     * @customElement
     * @polymer
     */class BunsenDats extends Element$1{static get template(){return`
    <style>
      :host {
        display: block;
      }
      a:link,
      a:visited,
      a:hover,
      a:focus,
      a:active {
        color: white;
        font-size: 1.5em;
      }
    </style>

    <table style="width: 100%">
      <template is="dom-repeat" items="{{items}}">
      <tr>
        <td style="width: 100%">
          <a href="{{item.address}}">{{item.address}}</a>
        </td>
      </tr>
      </template>
    </table>
`;}static get is(){return'bunsen-dats';}static get properties(){return{items:{type:Array,value:[]}};}async connectedCallback(){super.connectedCallback();}}window.customElements.define(BunsenDats.is,BunsenDats);!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var t;t="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,t.websocketStream=e();}}(function(){return function e(t,r,n){function i(s,a){if(!r[s]){if(!t[s]){var u="function"==typeof require&&require;if(!a&&u)return u(s,!0);if(o)return o(s,!0);var f=new Error("Cannot find module '"+s+"'");throw f.code="MODULE_NOT_FOUND",f;}var h=r[s]={exports:{}};t[s][0].call(h.exports,function(e){var r=t[s][1][e];return i(r?r:e);},h,h.exports,e,t,r,n);}return r[s].exports;}for(var o="function"==typeof require&&require,s=0;s<n.length;s++)i(n[s]);return i;}({1:[function(e,t,r){},{}],2:[function(e,t,r){(function(t){"use strict";function n(){try{var e=new Uint8Array(1);return e.__proto__={__proto__:Uint8Array.prototype,foo:function(){return 42;}},42===e.foo()&&"function"==typeof e.subarray&&0===e.subarray(1,1).byteLength;}catch(e){return!1;}}function i(){return s.TYPED_ARRAY_SUPPORT?2147483647:1073741823;}function o(e,t){if(i()<t)throw new RangeError("Invalid typed array length");return s.TYPED_ARRAY_SUPPORT?(e=new Uint8Array(t),e.__proto__=s.prototype):(null===e&&(e=new s(t)),e.length=t),e;}function s(e,t,r){if(!(s.TYPED_ARRAY_SUPPORT||this instanceof s))return new s(e,t,r);if("number"==typeof e){if("string"==typeof t)throw new Error("If encoding is specified then the first argument must be a string");return h(this,e);}return a(this,e,t,r);}function a(e,t,r,n){if("number"==typeof t)throw new TypeError('"value" argument must not be a number');return"undefined"!=typeof ArrayBuffer&&t instanceof ArrayBuffer?d(e,t,r,n):"string"==typeof t?l(e,t,r):p(e,t);}function u(e){if("number"!=typeof e)throw new TypeError('"size" argument must be a number');if(e<0)throw new RangeError('"size" argument must not be negative');}function f(e,t,r,n){return u(t),t<=0?o(e,t):void 0!==r?"string"==typeof n?o(e,t).fill(r,n):o(e,t).fill(r):o(e,t);}function h(e,t){if(u(t),e=o(e,t<0?0:0|g(t)),!s.TYPED_ARRAY_SUPPORT)for(var r=0;r<t;++r)e[r]=0;return e;}function l(e,t,r){if("string"==typeof r&&""!==r||(r="utf8"),!s.isEncoding(r))throw new TypeError('"encoding" must be a valid string encoding');var n=0|b(t,r);e=o(e,n);var i=e.write(t,r);return i!==n&&(e=e.slice(0,i)),e;}function c(e,t){var r=t.length<0?0:0|g(t.length);e=o(e,r);for(var n=0;n<r;n+=1)e[n]=255&t[n];return e;}function d(e,t,r,n){if(t.byteLength,r<0||t.byteLength<r)throw new RangeError("'offset' is out of bounds");if(t.byteLength<r+(n||0))throw new RangeError("'length' is out of bounds");return t=void 0===r&&void 0===n?new Uint8Array(t):void 0===n?new Uint8Array(t,r):new Uint8Array(t,r,n),s.TYPED_ARRAY_SUPPORT?(e=t,e.__proto__=s.prototype):e=c(e,t),e;}function p(e,t){if(s.isBuffer(t)){var r=0|g(t.length);return e=o(e,r),0===e.length?e:(t.copy(e,0,0,r),e);}if(t){if("undefined"!=typeof ArrayBuffer&&t.buffer instanceof ArrayBuffer||"length"in t)return"number"!=typeof t.length||G(t.length)?o(e,0):c(e,t);if("Buffer"===t.type&&$(t.data))return c(e,t.data);}throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");}function g(e){if(e>=i())throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+i().toString(16)+" bytes");return 0|e;}function y(e){return+e!=e&&(e=0),s.alloc(+e);}function b(e,t){if(s.isBuffer(e))return e.length;if("undefined"!=typeof ArrayBuffer&&"function"==typeof ArrayBuffer.isView&&(ArrayBuffer.isView(e)||e instanceof ArrayBuffer))return e.byteLength;"string"!=typeof e&&(e=""+e);var r=e.length;if(0===r)return 0;for(var n=!1;;)switch(t){case"ascii":case"latin1":case"binary":return r;case"utf8":case"utf-8":case void 0:return H(e).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return 2*r;case"hex":return r>>>1;case"base64":return J(e).length;default:if(n)return H(e).length;t=(""+t).toLowerCase(),n=!0;}}function w(e,t,r){var n=!1;if((void 0===t||t<0)&&(t=0),t>this.length)return"";if((void 0===r||r>this.length)&&(r=this.length),r<=0)return"";if(r>>>=0,t>>>=0,r<=t)return"";for(e||(e="utf8");;)switch(e){case"hex":return j(this,t,r);case"utf8":case"utf-8":return M(this,t,r);case"ascii":return B(this,t,r);case"latin1":case"binary":return P(this,t,r);case"base64":return A(this,t,r);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return C(this,t,r);default:if(n)throw new TypeError("Unknown encoding: "+e);e=(e+"").toLowerCase(),n=!0;}}function v(e,t,r){var n=e[t];e[t]=e[r],e[r]=n;}function _(e,t,r,n,i){if(0===e.length)return-1;if("string"==typeof r?(n=r,r=0):r>2147483647?r=2147483647:r<-2147483648&&(r=-2147483648),r=+r,isNaN(r)&&(r=i?0:e.length-1),r<0&&(r=e.length+r),r>=e.length){if(i)return-1;r=e.length-1;}else if(r<0){if(!i)return-1;r=0;}if("string"==typeof t&&(t=s.from(t,n)),s.isBuffer(t))return 0===t.length?-1:m(e,t,r,n,i);if("number"==typeof t)return t=255&t,s.TYPED_ARRAY_SUPPORT&&"function"==typeof Uint8Array.prototype.indexOf?i?Uint8Array.prototype.indexOf.call(e,t,r):Uint8Array.prototype.lastIndexOf.call(e,t,r):m(e,[t],r,n,i);throw new TypeError("val must be string, number or Buffer");}function m(e,t,r,n,i){function o(e,t){return 1===s?e[t]:e.readUInt16BE(t*s);}var s=1,a=e.length,u=t.length;if(void 0!==n&&(n=String(n).toLowerCase(),"ucs2"===n||"ucs-2"===n||"utf16le"===n||"utf-16le"===n)){if(e.length<2||t.length<2)return-1;s=2,a/=2,u/=2,r/=2;}var f;if(i){var h=-1;for(f=r;f<a;f++)if(o(e,f)===o(t,h===-1?0:f-h)){if(h===-1&&(h=f),f-h+1===u)return h*s;}else h!==-1&&(f-=f-h),h=-1;}else for(r+u>a&&(r=a-u),f=r;f>=0;f--){for(var l=!0,c=0;c<u;c++)if(o(e,f+c)!==o(t,c)){l=!1;break;}if(l)return f;}return-1;}function S(e,t,r,n){r=Number(r)||0;var i=e.length-r;n?(n=Number(n),n>i&&(n=i)):n=i;var o=t.length;if(o%2!==0)throw new TypeError("Invalid hex string");n>o/2&&(n=o/2);for(var s=0;s<n;++s){var a=parseInt(t.substr(2*s,2),16);if(isNaN(a))return s;e[r+s]=a;}return s;}function E(e,t,r,n){return Z(H(t,e.length-r),e,r,n);}function k(e,t,r,n){return Z(V(t),e,r,n);}function x(e,t,r,n){return k(e,t,r,n);}function T(e,t,r,n){return Z(J(t),e,r,n);}function R(e,t,r,n){return Z(X(t,e.length-r),e,r,n);}function A(e,t,r){return 0===t&&r===e.length?K.fromByteArray(e):K.fromByteArray(e.slice(t,r));}function M(e,t,r){r=Math.min(e.length,r);for(var n=[],i=t;i<r;){var o=e[i],s=null,a=o>239?4:o>223?3:o>191?2:1;if(i+a<=r){var u,f,h,l;switch(a){case 1:o<128&&(s=o);break;case 2:u=e[i+1],128===(192&u)&&(l=(31&o)<<6|63&u,l>127&&(s=l));break;case 3:u=e[i+1],f=e[i+2],128===(192&u)&&128===(192&f)&&(l=(15&o)<<12|(63&u)<<6|63&f,l>2047&&(l<55296||l>57343)&&(s=l));break;case 4:u=e[i+1],f=e[i+2],h=e[i+3],128===(192&u)&&128===(192&f)&&128===(192&h)&&(l=(15&o)<<18|(63&u)<<12|(63&f)<<6|63&h,l>65535&&l<1114112&&(s=l));}}null===s?(s=65533,a=1):s>65535&&(s-=65536,n.push(s>>>10&1023|55296),s=56320|1023&s),n.push(s),i+=a;}return L(n);}function L(e){var t=e.length;if(t<=ee)return String.fromCharCode.apply(String,e);for(var r="",n=0;n<t;)r+=String.fromCharCode.apply(String,e.slice(n,n+=ee));return r;}function B(e,t,r){var n="";r=Math.min(e.length,r);for(var i=t;i<r;++i)n+=String.fromCharCode(127&e[i]);return n;}function P(e,t,r){var n="";r=Math.min(e.length,r);for(var i=t;i<r;++i)n+=String.fromCharCode(e[i]);return n;}function j(e,t,r){var n=e.length;(!t||t<0)&&(t=0),(!r||r<0||r>n)&&(r=n);for(var i="",o=t;o<r;++o)i+=z(e[o]);return i;}function C(e,t,r){for(var n=e.slice(t,r),i="",o=0;o<n.length;o+=2)i+=String.fromCharCode(n[o]+256*n[o+1]);return i;}function U(e,t,r){if(e%1!==0||e<0)throw new RangeError("offset is not uint");if(e+t>r)throw new RangeError("Trying to access beyond buffer length");}function O(e,t,r,n,i,o){if(!s.isBuffer(e))throw new TypeError('"buffer" argument must be a Buffer instance');if(t>i||t<o)throw new RangeError('"value" argument is out of bounds');if(r+n>e.length)throw new RangeError("Index out of range");}function D(e,t,r,n){t<0&&(t=65535+t+1);for(var i=0,o=Math.min(e.length-r,2);i<o;++i)e[r+i]=(t&255<<8*(n?i:1-i))>>>8*(n?i:1-i);}function N(e,t,r,n){t<0&&(t=4294967295+t+1);for(var i=0,o=Math.min(e.length-r,4);i<o;++i)e[r+i]=t>>>8*(n?i:3-i)&255;}function I(e,t,r,n,i,o){if(r+n>e.length)throw new RangeError("Index out of range");if(r<0)throw new RangeError("Index out of range");}function W(e,t,r,n,i){return i||I(e,t,r,4,3.4028234663852886e38,-3.4028234663852886e38),Q.write(e,t,r,n,23,4),r+4;}function Y(e,t,r,n,i){return i||I(e,t,r,8,1.7976931348623157e308,-1.7976931348623157e308),Q.write(e,t,r,n,52,8),r+8;}function q(e){if(e=F(e).replace(te,""),e.length<2)return"";for(;e.length%4!==0;)e+="=";return e;}function F(e){return e.trim?e.trim():e.replace(/^\s+|\s+$/g,"");}function z(e){return e<16?"0"+e.toString(16):e.toString(16);}function H(e,t){t=t||1/0;for(var r,n=e.length,i=null,o=[],s=0;s<n;++s){if(r=e.charCodeAt(s),r>55295&&r<57344){if(!i){if(r>56319){(t-=3)>-1&&o.push(239,191,189);continue;}if(s+1===n){(t-=3)>-1&&o.push(239,191,189);continue;}i=r;continue;}if(r<56320){(t-=3)>-1&&o.push(239,191,189),i=r;continue;}r=(i-55296<<10|r-56320)+65536;}else i&&(t-=3)>-1&&o.push(239,191,189);if(i=null,r<128){if((t-=1)<0)break;o.push(r);}else if(r<2048){if((t-=2)<0)break;o.push(r>>6|192,63&r|128);}else if(r<65536){if((t-=3)<0)break;o.push(r>>12|224,r>>6&63|128,63&r|128);}else{if(!(r<1114112))throw new Error("Invalid code point");if((t-=4)<0)break;o.push(r>>18|240,r>>12&63|128,r>>6&63|128,63&r|128);}}return o;}function V(e){for(var t=[],r=0;r<e.length;++r)t.push(255&e.charCodeAt(r));return t;}function X(e,t){for(var r,n,i,o=[],s=0;s<e.length&&!((t-=2)<0);++s)r=e.charCodeAt(s),n=r>>8,i=r%256,o.push(i),o.push(n);return o;}function J(e){return K.toByteArray(q(e));}function Z(e,t,r,n){for(var i=0;i<n&&!(i+r>=t.length||i>=e.length);++i)t[i+r]=e[i];return i;}function G(e){return e!==e;}var K=e("base64-js"),Q=e("ieee754"),$=e("isarray");r.Buffer=s,r.SlowBuffer=y,r.INSPECT_MAX_BYTES=50,s.TYPED_ARRAY_SUPPORT=void 0!==t.TYPED_ARRAY_SUPPORT?t.TYPED_ARRAY_SUPPORT:n(),r.kMaxLength=i(),s.poolSize=8192,s._augment=function(e){return e.__proto__=s.prototype,e;},s.from=function(e,t,r){return a(null,e,t,r);},s.TYPED_ARRAY_SUPPORT&&(s.prototype.__proto__=Uint8Array.prototype,s.__proto__=Uint8Array,"undefined"!=typeof Symbol&&Symbol.species&&s[Symbol.species]===s&&Object.defineProperty(s,Symbol.species,{value:null,configurable:!0})),s.alloc=function(e,t,r){return f(null,e,t,r);},s.allocUnsafe=function(e){return h(null,e);},s.allocUnsafeSlow=function(e){return h(null,e);},s.isBuffer=function(e){return!(null==e||!e._isBuffer);},s.compare=function(e,t){if(!s.isBuffer(e)||!s.isBuffer(t))throw new TypeError("Arguments must be Buffers");if(e===t)return 0;for(var r=e.length,n=t.length,i=0,o=Math.min(r,n);i<o;++i)if(e[i]!==t[i]){r=e[i],n=t[i];break;}return r<n?-1:n<r?1:0;},s.isEncoding=function(e){switch(String(e).toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"latin1":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return!0;default:return!1;}},s.concat=function(e,t){if(!$(e))throw new TypeError('"list" argument must be an Array of Buffers');if(0===e.length)return s.alloc(0);var r;if(void 0===t)for(t=0,r=0;r<e.length;++r)t+=e[r].length;var n=s.allocUnsafe(t),i=0;for(r=0;r<e.length;++r){var o=e[r];if(!s.isBuffer(o))throw new TypeError('"list" argument must be an Array of Buffers');o.copy(n,i),i+=o.length;}return n;},s.byteLength=b,s.prototype._isBuffer=!0,s.prototype.swap16=function(){var e=this.length;if(e%2!==0)throw new RangeError("Buffer size must be a multiple of 16-bits");for(var t=0;t<e;t+=2)v(this,t,t+1);return this;},s.prototype.swap32=function(){var e=this.length;if(e%4!==0)throw new RangeError("Buffer size must be a multiple of 32-bits");for(var t=0;t<e;t+=4)v(this,t,t+3),v(this,t+1,t+2);return this;},s.prototype.swap64=function(){var e=this.length;if(e%8!==0)throw new RangeError("Buffer size must be a multiple of 64-bits");for(var t=0;t<e;t+=8)v(this,t,t+7),v(this,t+1,t+6),v(this,t+2,t+5),v(this,t+3,t+4);return this;},s.prototype.toString=function(){var e=0|this.length;return 0===e?"":0===arguments.length?M(this,0,e):w.apply(this,arguments);},s.prototype.equals=function(e){if(!s.isBuffer(e))throw new TypeError("Argument must be a Buffer");return this===e||0===s.compare(this,e);},s.prototype.inspect=function(){var e="",t=r.INSPECT_MAX_BYTES;return this.length>0&&(e=this.toString("hex",0,t).match(/.{2}/g).join(" "),this.length>t&&(e+=" ... ")),"<Buffer "+e+">";},s.prototype.compare=function(e,t,r,n,i){if(!s.isBuffer(e))throw new TypeError("Argument must be a Buffer");if(void 0===t&&(t=0),void 0===r&&(r=e?e.length:0),void 0===n&&(n=0),void 0===i&&(i=this.length),t<0||r>e.length||n<0||i>this.length)throw new RangeError("out of range index");if(n>=i&&t>=r)return 0;if(n>=i)return-1;if(t>=r)return 1;if(t>>>=0,r>>>=0,n>>>=0,i>>>=0,this===e)return 0;for(var o=i-n,a=r-t,u=Math.min(o,a),f=this.slice(n,i),h=e.slice(t,r),l=0;l<u;++l)if(f[l]!==h[l]){o=f[l],a=h[l];break;}return o<a?-1:a<o?1:0;},s.prototype.includes=function(e,t,r){return this.indexOf(e,t,r)!==-1;},s.prototype.indexOf=function(e,t,r){return _(this,e,t,r,!0);},s.prototype.lastIndexOf=function(e,t,r){return _(this,e,t,r,!1);},s.prototype.write=function(e,t,r,n){if(void 0===t)n="utf8",r=this.length,t=0;else if(void 0===r&&"string"==typeof t)n=t,r=this.length,t=0;else{if(!isFinite(t))throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");t=0|t,isFinite(r)?(r=0|r,void 0===n&&(n="utf8")):(n=r,r=void 0);}var i=this.length-t;if((void 0===r||r>i)&&(r=i),e.length>0&&(r<0||t<0)||t>this.length)throw new RangeError("Attempt to write outside buffer bounds");n||(n="utf8");for(var o=!1;;)switch(n){case"hex":return S(this,e,t,r);case"utf8":case"utf-8":return E(this,e,t,r);case"ascii":return k(this,e,t,r);case"latin1":case"binary":return x(this,e,t,r);case"base64":return T(this,e,t,r);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return R(this,e,t,r);default:if(o)throw new TypeError("Unknown encoding: "+n);n=(""+n).toLowerCase(),o=!0;}},s.prototype.toJSON=function(){return{type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)};};var ee=4096;s.prototype.slice=function(e,t){var r=this.length;e=~~e,t=void 0===t?r:~~t,e<0?(e+=r,e<0&&(e=0)):e>r&&(e=r),t<0?(t+=r,t<0&&(t=0)):t>r&&(t=r),t<e&&(t=e);var n;if(s.TYPED_ARRAY_SUPPORT)n=this.subarray(e,t),n.__proto__=s.prototype;else{var i=t-e;n=new s(i,void 0);for(var o=0;o<i;++o)n[o]=this[o+e];}return n;},s.prototype.readUIntLE=function(e,t,r){e=0|e,t=0|t,r||U(e,t,this.length);for(var n=this[e],i=1,o=0;++o<t&&(i*=256);)n+=this[e+o]*i;return n;},s.prototype.readUIntBE=function(e,t,r){e=0|e,t=0|t,r||U(e,t,this.length);for(var n=this[e+--t],i=1;t>0&&(i*=256);)n+=this[e+--t]*i;return n;},s.prototype.readUInt8=function(e,t){return t||U(e,1,this.length),this[e];},s.prototype.readUInt16LE=function(e,t){return t||U(e,2,this.length),this[e]|this[e+1]<<8;},s.prototype.readUInt16BE=function(e,t){return t||U(e,2,this.length),this[e]<<8|this[e+1];},s.prototype.readUInt32LE=function(e,t){return t||U(e,4,this.length),(this[e]|this[e+1]<<8|this[e+2]<<16)+16777216*this[e+3];},s.prototype.readUInt32BE=function(e,t){return t||U(e,4,this.length),16777216*this[e]+(this[e+1]<<16|this[e+2]<<8|this[e+3]);},s.prototype.readIntLE=function(e,t,r){e=0|e,t=0|t,r||U(e,t,this.length);for(var n=this[e],i=1,o=0;++o<t&&(i*=256);)n+=this[e+o]*i;return i*=128,n>=i&&(n-=Math.pow(2,8*t)),n;},s.prototype.readIntBE=function(e,t,r){e=0|e,t=0|t,r||U(e,t,this.length);for(var n=t,i=1,o=this[e+--n];n>0&&(i*=256);)o+=this[e+--n]*i;return i*=128,o>=i&&(o-=Math.pow(2,8*t)),o;},s.prototype.readInt8=function(e,t){return t||U(e,1,this.length),128&this[e]?(255-this[e]+1)*-1:this[e];},s.prototype.readInt16LE=function(e,t){t||U(e,2,this.length);var r=this[e]|this[e+1]<<8;return 32768&r?4294901760|r:r;},s.prototype.readInt16BE=function(e,t){t||U(e,2,this.length);var r=this[e+1]|this[e]<<8;return 32768&r?4294901760|r:r;},s.prototype.readInt32LE=function(e,t){return t||U(e,4,this.length),this[e]|this[e+1]<<8|this[e+2]<<16|this[e+3]<<24;},s.prototype.readInt32BE=function(e,t){return t||U(e,4,this.length),this[e]<<24|this[e+1]<<16|this[e+2]<<8|this[e+3];},s.prototype.readFloatLE=function(e,t){return t||U(e,4,this.length),Q.read(this,e,!0,23,4);},s.prototype.readFloatBE=function(e,t){return t||U(e,4,this.length),Q.read(this,e,!1,23,4);},s.prototype.readDoubleLE=function(e,t){return t||U(e,8,this.length),Q.read(this,e,!0,52,8);},s.prototype.readDoubleBE=function(e,t){return t||U(e,8,this.length),Q.read(this,e,!1,52,8);},s.prototype.writeUIntLE=function(e,t,r,n){if(e=+e,t=0|t,r=0|r,!n){var i=Math.pow(2,8*r)-1;O(this,e,t,r,i,0);}var o=1,s=0;for(this[t]=255&e;++s<r&&(o*=256);)this[t+s]=e/o&255;return t+r;},s.prototype.writeUIntBE=function(e,t,r,n){if(e=+e,t=0|t,r=0|r,!n){var i=Math.pow(2,8*r)-1;O(this,e,t,r,i,0);}var o=r-1,s=1;for(this[t+o]=255&e;--o>=0&&(s*=256);)this[t+o]=e/s&255;return t+r;},s.prototype.writeUInt8=function(e,t,r){return e=+e,t=0|t,r||O(this,e,t,1,255,0),s.TYPED_ARRAY_SUPPORT||(e=Math.floor(e)),this[t]=255&e,t+1;},s.prototype.writeUInt16LE=function(e,t,r){return e=+e,t=0|t,r||O(this,e,t,2,65535,0),s.TYPED_ARRAY_SUPPORT?(this[t]=255&e,this[t+1]=e>>>8):D(this,e,t,!0),t+2;},s.prototype.writeUInt16BE=function(e,t,r){return e=+e,t=0|t,r||O(this,e,t,2,65535,0),s.TYPED_ARRAY_SUPPORT?(this[t]=e>>>8,this[t+1]=255&e):D(this,e,t,!1),t+2;},s.prototype.writeUInt32LE=function(e,t,r){return e=+e,t=0|t,r||O(this,e,t,4,4294967295,0),s.TYPED_ARRAY_SUPPORT?(this[t+3]=e>>>24,this[t+2]=e>>>16,this[t+1]=e>>>8,this[t]=255&e):N(this,e,t,!0),t+4;},s.prototype.writeUInt32BE=function(e,t,r){return e=+e,t=0|t,r||O(this,e,t,4,4294967295,0),s.TYPED_ARRAY_SUPPORT?(this[t]=e>>>24,this[t+1]=e>>>16,this[t+2]=e>>>8,this[t+3]=255&e):N(this,e,t,!1),t+4;},s.prototype.writeIntLE=function(e,t,r,n){if(e=+e,t=0|t,!n){var i=Math.pow(2,8*r-1);O(this,e,t,r,i-1,-i);}var o=0,s=1,a=0;for(this[t]=255&e;++o<r&&(s*=256);)e<0&&0===a&&0!==this[t+o-1]&&(a=1),this[t+o]=(e/s>>0)-a&255;return t+r;},s.prototype.writeIntBE=function(e,t,r,n){if(e=+e,t=0|t,!n){var i=Math.pow(2,8*r-1);O(this,e,t,r,i-1,-i);}var o=r-1,s=1,a=0;for(this[t+o]=255&e;--o>=0&&(s*=256);)e<0&&0===a&&0!==this[t+o+1]&&(a=1),this[t+o]=(e/s>>0)-a&255;return t+r;},s.prototype.writeInt8=function(e,t,r){return e=+e,t=0|t,r||O(this,e,t,1,127,-128),s.TYPED_ARRAY_SUPPORT||(e=Math.floor(e)),e<0&&(e=255+e+1),this[t]=255&e,t+1;},s.prototype.writeInt16LE=function(e,t,r){return e=+e,t=0|t,r||O(this,e,t,2,32767,-32768),s.TYPED_ARRAY_SUPPORT?(this[t]=255&e,this[t+1]=e>>>8):D(this,e,t,!0),t+2;},s.prototype.writeInt16BE=function(e,t,r){return e=+e,t=0|t,r||O(this,e,t,2,32767,-32768),s.TYPED_ARRAY_SUPPORT?(this[t]=e>>>8,this[t+1]=255&e):D(this,e,t,!1),t+2;},s.prototype.writeInt32LE=function(e,t,r){return e=+e,t=0|t,r||O(this,e,t,4,2147483647,-2147483648),s.TYPED_ARRAY_SUPPORT?(this[t]=255&e,this[t+1]=e>>>8,this[t+2]=e>>>16,this[t+3]=e>>>24):N(this,e,t,!0),t+4;},s.prototype.writeInt32BE=function(e,t,r){return e=+e,t=0|t,r||O(this,e,t,4,2147483647,-2147483648),e<0&&(e=4294967295+e+1),s.TYPED_ARRAY_SUPPORT?(this[t]=e>>>24,this[t+1]=e>>>16,this[t+2]=e>>>8,this[t+3]=255&e):N(this,e,t,!1),t+4;},s.prototype.writeFloatLE=function(e,t,r){return W(this,e,t,!0,r);},s.prototype.writeFloatBE=function(e,t,r){return W(this,e,t,!1,r);},s.prototype.writeDoubleLE=function(e,t,r){return Y(this,e,t,!0,r);},s.prototype.writeDoubleBE=function(e,t,r){return Y(this,e,t,!1,r);},s.prototype.copy=function(e,t,r,n){if(r||(r=0),n||0===n||(n=this.length),t>=e.length&&(t=e.length),t||(t=0),n>0&&n<r&&(n=r),n===r)return 0;if(0===e.length||0===this.length)return 0;if(t<0)throw new RangeError("targetStart out of bounds");if(r<0||r>=this.length)throw new RangeError("sourceStart out of bounds");if(n<0)throw new RangeError("sourceEnd out of bounds");n>this.length&&(n=this.length),e.length-t<n-r&&(n=e.length-t+r);var i,o=n-r;if(this===e&&r<t&&t<n)for(i=o-1;i>=0;--i)e[i+t]=this[i+r];else if(o<1e3||!s.TYPED_ARRAY_SUPPORT)for(i=0;i<o;++i)e[i+t]=this[i+r];else Uint8Array.prototype.set.call(e,this.subarray(r,r+o),t);return o;},s.prototype.fill=function(e,t,r,n){if("string"==typeof e){if("string"==typeof t?(n=t,t=0,r=this.length):"string"==typeof r&&(n=r,r=this.length),1===e.length){var i=e.charCodeAt(0);i<256&&(e=i);}if(void 0!==n&&"string"!=typeof n)throw new TypeError("encoding must be a string");if("string"==typeof n&&!s.isEncoding(n))throw new TypeError("Unknown encoding: "+n);}else"number"==typeof e&&(e=255&e);if(t<0||this.length<t||this.length<r)throw new RangeError("Out of range index");if(r<=t)return this;t>>>=0,r=void 0===r?this.length:r>>>0,e||(e=0);var o;if("number"==typeof e)for(o=t;o<r;++o)this[o]=e;else{var a=s.isBuffer(e)?e:H(new s(e,n).toString()),u=a.length;for(o=0;o<r-t;++o)this[o+t]=a[o%u];}return this;};var te=/[^+\/0-9A-Za-z-_]/g;}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});},{"base64-js":3,ieee754:4,isarray:5}],3:[function(e,t,r){"use strict";function n(e){var t=e.length;if(t%4>0)throw new Error("Invalid string. Length must be a multiple of 4");return"="===e[t-2]?2:"="===e[t-1]?1:0;}function i(e){return 3*e.length/4-n(e);}function o(e){var t,r,i,o,s,a,u=e.length;s=n(e),a=new l(3*u/4-s),i=s>0?u-4:u;var f=0;for(t=0,r=0;t<i;t+=4,r+=3)o=h[e.charCodeAt(t)]<<18|h[e.charCodeAt(t+1)]<<12|h[e.charCodeAt(t+2)]<<6|h[e.charCodeAt(t+3)],a[f++]=o>>16&255,a[f++]=o>>8&255,a[f++]=255&o;return 2===s?(o=h[e.charCodeAt(t)]<<2|h[e.charCodeAt(t+1)]>>4,a[f++]=255&o):1===s&&(o=h[e.charCodeAt(t)]<<10|h[e.charCodeAt(t+1)]<<4|h[e.charCodeAt(t+2)]>>2,a[f++]=o>>8&255,a[f++]=255&o),a;}function s(e){return f[e>>18&63]+f[e>>12&63]+f[e>>6&63]+f[63&e];}function a(e,t,r){for(var n,i=[],o=t;o<r;o+=3)n=(e[o]<<16)+(e[o+1]<<8)+e[o+2],i.push(s(n));return i.join("");}function u(e){for(var t,r=e.length,n=r%3,i="",o=[],s=16383,u=0,h=r-n;u<h;u+=s)o.push(a(e,u,u+s>h?h:u+s));return 1===n?(t=e[r-1],i+=f[t>>2],i+=f[t<<4&63],i+="=="):2===n&&(t=(e[r-2]<<8)+e[r-1],i+=f[t>>10],i+=f[t>>4&63],i+=f[t<<2&63],i+="="),o.push(i),o.join("");}r.byteLength=i,r.toByteArray=o,r.fromByteArray=u;for(var f=[],h=[],l="undefined"!=typeof Uint8Array?Uint8Array:Array,c="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",d=0,p=c.length;d<p;++d)f[d]=c[d],h[c.charCodeAt(d)]=d;h["-".charCodeAt(0)]=62,h["_".charCodeAt(0)]=63;},{}],4:[function(e,t,r){r.read=function(e,t,r,n,i){var o,s,a=8*i-n-1,u=(1<<a)-1,f=u>>1,h=-7,l=r?i-1:0,c=r?-1:1,d=e[t+l];for(l+=c,o=d&(1<<-h)-1,d>>=-h,h+=a;h>0;o=256*o+e[t+l],l+=c,h-=8);for(s=o&(1<<-h)-1,o>>=-h,h+=n;h>0;s=256*s+e[t+l],l+=c,h-=8);if(0===o)o=1-f;else{if(o===u)return s?NaN:(d?-1:1)*(1/0);s+=Math.pow(2,n),o-=f;}return(d?-1:1)*s*Math.pow(2,o-n);},r.write=function(e,t,r,n,i,o){var s,a,u,f=8*o-i-1,h=(1<<f)-1,l=h>>1,c=23===i?Math.pow(2,-24)-Math.pow(2,-77):0,d=n?0:o-1,p=n?1:-1,g=t<0||0===t&&1/t<0?1:0;for(t=Math.abs(t),isNaN(t)||t===1/0?(a=isNaN(t)?1:0,s=h):(s=Math.floor(Math.log(t)/Math.LN2),t*(u=Math.pow(2,-s))<1&&(s--,u*=2),t+=s+l>=1?c/u:c*Math.pow(2,1-l),t*u>=2&&(s++,u/=2),s+l>=h?(a=0,s=h):s+l>=1?(a=(t*u-1)*Math.pow(2,i),s+=l):(a=t*Math.pow(2,l-1)*Math.pow(2,i),s=0));i>=8;e[r+d]=255&a,d+=p,a/=256,i-=8);for(s=s<<i|a,f+=i;f>0;e[r+d]=255&s,d+=p,s/=256,f-=8);e[r+d-p]|=128*g;};},{}],5:[function(e,t,r){var n={}.toString;t.exports=Array.isArray||function(e){return"[object Array]"==n.call(e);};},{}],6:[function(e,t,r){function n(){this._events=this._events||{},this._maxListeners=this._maxListeners||void 0;}function i(e){return"function"==typeof e;}function o(e){return"number"==typeof e;}function s(e){return"object"==typeof e&&null!==e;}function a(e){return void 0===e;}t.exports=n,n.EventEmitter=n,n.prototype._events=void 0,n.prototype._maxListeners=void 0,n.defaultMaxListeners=10,n.prototype.setMaxListeners=function(e){if(!o(e)||e<0||isNaN(e))throw TypeError("n must be a positive number");return this._maxListeners=e,this;},n.prototype.emit=function(e){var t,r,n,o,u,f;if(this._events||(this._events={}),"error"===e&&(!this._events.error||s(this._events.error)&&!this._events.error.length)){if(t=arguments[1],t instanceof Error)throw t;var h=new Error('Uncaught, unspecified "error" event. ('+t+")");throw h.context=t,h;}if(r=this._events[e],a(r))return!1;if(i(r))switch(arguments.length){case 1:r.call(this);break;case 2:r.call(this,arguments[1]);break;case 3:r.call(this,arguments[1],arguments[2]);break;default:o=Array.prototype.slice.call(arguments,1),r.apply(this,o);}else if(s(r))for(o=Array.prototype.slice.call(arguments,1),f=r.slice(),n=f.length,u=0;u<n;u++)f[u].apply(this,o);return!0;},n.prototype.addListener=function(e,t){var r;if(!i(t))throw TypeError("listener must be a function");return this._events||(this._events={}),this._events.newListener&&this.emit("newListener",e,i(t.listener)?t.listener:t),this._events[e]?s(this._events[e])?this._events[e].push(t):this._events[e]=[this._events[e],t]:this._events[e]=t,s(this._events[e])&&!this._events[e].warned&&(r=a(this._maxListeners)?n.defaultMaxListeners:this._maxListeners,r&&r>0&&this._events[e].length>r&&(this._events[e].warned=!0,console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.",this._events[e].length),"function"==typeof console.trace&&console.trace())),this;},n.prototype.on=n.prototype.addListener,n.prototype.once=function(e,t){function r(){this.removeListener(e,r),n||(n=!0,t.apply(this,arguments));}if(!i(t))throw TypeError("listener must be a function");var n=!1;return r.listener=t,this.on(e,r),this;},n.prototype.removeListener=function(e,t){var r,n,o,a;if(!i(t))throw TypeError("listener must be a function");if(!this._events||!this._events[e])return this;if(r=this._events[e],o=r.length,n=-1,r===t||i(r.listener)&&r.listener===t)delete this._events[e],this._events.removeListener&&this.emit("removeListener",e,t);else if(s(r)){for(a=o;a-->0;)if(r[a]===t||r[a].listener&&r[a].listener===t){n=a;break;}if(n<0)return this;1===r.length?(r.length=0,delete this._events[e]):r.splice(n,1),this._events.removeListener&&this.emit("removeListener",e,t);}return this;},n.prototype.removeAllListeners=function(e){var t,r;if(!this._events)return this;if(!this._events.removeListener)return 0===arguments.length?this._events={}:this._events[e]&&delete this._events[e],this;if(0===arguments.length){for(t in this._events)"removeListener"!==t&&this.removeAllListeners(t);return this.removeAllListeners("removeListener"),this._events={},this;}if(r=this._events[e],i(r))this.removeListener(e,r);else if(r)for(;r.length;)this.removeListener(e,r[r.length-1]);return delete this._events[e],this;},n.prototype.listeners=function(e){var t;return t=this._events&&this._events[e]?i(this._events[e])?[this._events[e]]:this._events[e].slice():[];},n.prototype.listenerCount=function(e){if(this._events){var t=this._events[e];if(i(t))return 1;if(t)return t.length;}return 0;},n.listenerCount=function(e,t){return e.listenerCount(t);};},{}],7:[function(e,t,r){function n(e){return!!e.constructor&&"function"==typeof e.constructor.isBuffer&&e.constructor.isBuffer(e);}function i(e){return"function"==typeof e.readFloatLE&&"function"==typeof e.slice&&n(e.slice(0,0));}t.exports=function(e){return null!=e&&(n(e)||i(e)||!!e._isBuffer);};},{}],8:[function(e,t,r){function n(){throw new Error("setTimeout has not been defined");}function i(){throw new Error("clearTimeout has not been defined");}function o(e){if(l===setTimeout)return setTimeout(e,0);if((l===n||!l)&&setTimeout)return l=setTimeout,setTimeout(e,0);try{return l(e,0);}catch(t){try{return l.call(null,e,0);}catch(t){return l.call(this,e,0);}}}function s(e){if(c===clearTimeout)return clearTimeout(e);if((c===i||!c)&&clearTimeout)return c=clearTimeout,clearTimeout(e);try{return c(e);}catch(t){try{return c.call(null,e);}catch(t){return c.call(this,e);}}}function a(){y&&p&&(y=!1,p.length?g=p.concat(g):b=-1,g.length&&u());}function u(){if(!y){var e=o(a);y=!0;for(var t=g.length;t;){for(p=g,g=[];++b<t;)p&&p[b].run();b=-1,t=g.length;}p=null,y=!1,s(e);}}function f(e,t){this.fun=e,this.array=t;}function h(){}var l,c,d=t.exports={};!function(){try{l="function"==typeof setTimeout?setTimeout:n;}catch(e){l=n;}try{c="function"==typeof clearTimeout?clearTimeout:i;}catch(e){c=i;}}();var p,g=[],y=!1,b=-1;d.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)t[r-1]=arguments[r];g.push(new f(e,t)),1!==g.length||y||o(u);},f.prototype.run=function(){this.fun.apply(null,this.array);},d.title="browser",d.browser=!0,d.env={},d.argv=[],d.version="",d.versions={},d.on=h,d.addListener=h,d.once=h,d.off=h,d.removeListener=h,d.removeAllListeners=h,d.emit=h,d.binding=function(e){throw new Error("process.binding is not supported");},d.cwd=function(){return"/";},d.chdir=function(e){throw new Error("process.chdir is not supported");},d.umask=function(){return 0;};},{}],9:[function(e,t,r){(function(r,n){"use strict";function i(e,t,r){var n=new s({objectMode:e.objectMode});return n._write=t,n._flush=r,n;}function o(e,t,o){function s(e,t,r){return v.readyState!==v.OPEN?void r():(T&&"string"==typeof e&&(e=f.from(e,"utf8")),void v.send(e,r));}function h(e,t,r){if(v.bufferedAmount>k)return void setTimeout(h,x,e,t,r);T&&"string"==typeof e&&(e=f.from(e,"utf8"));try{v.send(e);}catch(e){return r(e);}r();}function l(e){v.close(),e();}function c(){w.setReadable(E),w.setWritable(E),w.emit("connect");}function d(){w.end(),w.destroy();}function p(e){w.destroy(e);}function g(e){var t=e.data;t=t instanceof ArrayBuffer?f.from(t):f.from(t,"utf8"),E.push(t);}function y(){v.close();}function b(e,t){for(var r=new Array(e.length),n=0;n<e.length;n++)"string"==typeof e[n].chunk?r[n]=f.from(e[n],"utf8"):r[n]=e[n].chunk;this._write(f.concat(r),"binary",t);}var w,v,_="browser"===r.title,m=!!n.WebSocket,S=_?h:s;t&&!Array.isArray(t)&&"object"==typeof t&&(o=t,t=null,("string"==typeof o.protocol||Array.isArray(o.protocol))&&(t=o.protocol)),o||(o={}),void 0===o.objectMode&&(o.objectMode=!(o.binary===!0||void 0===o.binary));var E=i(o,S,l);o.objectMode||(E._writev=b);var k=o.browserBufferSize||524288,x=o.browserBufferTimeout||1e3;"object"==typeof e?v=e:(v=m&&_?new u(e,t):new u(e,t,o),v.binaryType="arraybuffer"),v.readyState===v.OPEN?w=E:(w=a.obj(),v.onopen=c),w.socket=v,v.onclose=d,v.onerror=p,v.onmessage=g,E.on("close",y);var T=!o.objectMode;return w;}var s=e("readable-stream").Transform,a=e("duplexify"),u=e("ws"),f=e("safe-buffer").Buffer;t.exports=o;}).call(this,e("_process"),"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});},{_process:8,duplexify:10,"readable-stream":29,"safe-buffer":30,ws:31}],10:[function(e,t,r){(function(r,n){var i=e("readable-stream"),o=e("end-of-stream"),s=e("inherits"),a=e("stream-shift"),u=n.from&&n.from!==Uint8Array.from?n.from([0]):new n([0]),f=function(e,t){e._corked?e.once("uncork",t):t();},h=function(e,t){return function(r){r?e._destroyInterval(r):t&&!e._ended&&e.end();};},l=function(e,t){return e?e._writableState&&e._writableState.finished?t():e._writableState?e.end(t):(e.end(),void t()):t();},c=function(e){return new i.Readable({objectMode:!0,highWaterMark:16}).wrap(e);},d=function(e,t,r){return this instanceof d?(i.Duplex.call(this,r),this._writable=null,this._readable=null,this._readable2=null,this._forwardDestroy=!r||r.destroy!==!1,this._forwardEnd=!r||r.end!==!1,this._corked=1,this._ondrain=null,this._drained=!1,this._forwarding=!1,this._unwrite=null,this._unread=null,this._ended=!1,this._error=null,this._preferError=!1,this.destroyed=!1,e&&this.setWritable(e),void(t&&this.setReadable(t))):new d(e,t,r);};s(d,i.Duplex),d.obj=function(e,t,r){return r||(r={}),r.objectMode=!0,r.highWaterMark=16,new d(e,t,r);},d.prototype.cork=function(){1===++this._corked&&this.emit("cork");},d.prototype.uncork=function(){this._corked&&0===--this._corked&&this.emit("uncork");},d.prototype.setWritable=function(e){if(this._unwrite&&this._unwrite(),this.destroyed)return void(e&&e.destroy&&e.destroy());if(null===e||e===!1)return void this.end();var t=this,n=o(e,{writable:!0,readable:!1},h(this,this._forwardEnd)),i=function(){var e=t._ondrain;t._ondrain=null,e&&e();},s=function(){t._writable.removeListener("drain",i),n();};this._unwrite&&r.nextTick(i),this._writable=e,this._writable.on("drain",i),this._unwrite=s,this.uncork();},d.prototype.setReadable=function(e){if(this._unread&&this._unread(),this.destroyed)return void(e&&e.destroy&&e.destroy());if(null===e||e===!1)return this.push(null),void this.resume();var t=this,r=o(e,{writable:!1,readable:!0},h(this)),n=function(){t._forward();},i=function(){t.push(null);},s=function(){t._readable2.removeListener("readable",n),t._readable2.removeListener("end",i),r();};this._drained=!0,this._readable=e,this._readable2=e._readableState?e:c(e),this._readable2.on("readable",n),this._readable2.on("end",i),this._unread=s,this._forward();},d.prototype._read=function(){this._drained=!0,this._forward();},d.prototype._forward=function(){if(!this._forwarding&&this._readable2&&this._drained){this._forwarding=!0;for(var e;this._drained&&null!==(e=a(this._readable2));)this.destroyed||(this._drained=this.push(e));this._forwarding=!1;}},d.prototype.destroy=function(e){if(this._preferError&&!this._error&&e&&(this._error=e),!this.destroyed){this.destroyed=!0;var t=this;r.nextTick(function(){t._destroy(t._preferError?t._error:e);});}},d.prototype._destroyInterval=function(e){if(!this.destroyed){if("premature close"!==e.message)return this.destroy(e);this._preferError=!0,this.destroy(null);}},d.prototype._destroy=function(e){if(e){var t=this._ondrain;this._ondrain=null,t?t(e):this.emit("error",e);}this._forwardDestroy&&(this._readable&&this._readable.destroy&&this._readable.destroy(),this._writable&&this._writable.destroy&&this._writable.destroy()),this.emit("close");},d.prototype._write=function(e,t,r){return this.destroyed?r():this._corked?f(this,this._write.bind(this,e,t,r)):e===u?this._finish(r):this._writable?void(this._writable.write(e)===!1?this._ondrain=r:r()):r();},d.prototype._finish=function(e){var t=this;this.emit("preend"),f(this,function(){l(t._forwardEnd&&t._writable,function(){t._writableState.prefinished===!1&&(t._writableState.prefinished=!0),t.emit("prefinish"),f(t,e);});});},d.prototype.end=function(e,t,r){return"function"==typeof e?this.end(null,null,e):"function"==typeof t?this.end(e,null,t):(this._ended=!0,e&&this.write(e),this._writableState.ending||this.write(u),i.Writable.prototype.end.call(this,r));},t.exports=d;}).call(this,e("_process"),e("buffer").Buffer);},{_process:8,buffer:2,"end-of-stream":11,inherits:15,"readable-stream":29,"stream-shift":14}],11:[function(e,t,r){var n=e("once"),i=function(){},o=function(e){return e.setHeader&&"function"==typeof e.abort;},s=function(e){return e.stdio&&Array.isArray(e.stdio)&&3===e.stdio.length;},a=function(e,t,r){if("function"==typeof t)return a(e,null,t);t||(t={}),r=n(r||i);var u=e._writableState,f=e._readableState,h=t.readable||t.readable!==!1&&e.readable,l=t.writable||t.writable!==!1&&e.writable,c=function(){e.writable||d();},d=function(){l=!1,h||r.call(e);},p=function(){h=!1,l||r.call(e);},g=function(t){r.call(e,t?new Error("exited with error code: "+t):null);},y=function(t){r.call(e,t);},b=function(){return(!h||f&&f.ended)&&(!l||u&&u.ended)?void 0:r.call(e,new Error("premature close"));},w=function(){e.req.on("finish",d);};return o(e)?(e.on("complete",d),e.on("abort",b),e.req?w():e.on("request",w)):l&&!u&&(e.on("end",c),e.on("close",c)),s(e)&&e.on("exit",g),e.on("end",p),e.on("finish",d),t.error!==!1&&e.on("error",y),e.on("close",b),function(){e.removeListener("complete",d),e.removeListener("abort",b),e.removeListener("request",w),e.req&&e.req.removeListener("finish",d),e.removeListener("end",c),e.removeListener("close",c),e.removeListener("finish",d),e.removeListener("exit",g),e.removeListener("end",p),e.removeListener("error",y),e.removeListener("close",b);};};t.exports=a;},{once:13}],12:[function(e,t,r){function n(e,t){function r(){for(var t=new Array(arguments.length),r=0;r<t.length;r++)t[r]=arguments[r];var n=e.apply(this,t),i=t[t.length-1];return"function"==typeof n&&n!==i&&Object.keys(i).forEach(function(e){n[e]=i[e];}),n;}if(e&&t)return n(e)(t);if("function"!=typeof e)throw new TypeError("need wrapper function");return Object.keys(e).forEach(function(t){r[t]=e[t];}),r;}t.exports=n;},{}],13:[function(e,t,r){function n(e){var t=function(){return t.called?t.value:(t.called=!0,t.value=e.apply(this,arguments));};return t.called=!1,t;}function i(e){var t=function(){if(t.called)throw new Error(t.onceError);return t.called=!0,t.value=e.apply(this,arguments);},r=e.name||"Function wrapped with `once`";return t.onceError=r+" shouldn't be called more than once",t.called=!1,t;}var o=e("wrappy");t.exports=o(n),t.exports.strict=o(i),n.proto=n(function(){Object.defineProperty(Function.prototype,"once",{value:function(){return n(this);},configurable:!0}),Object.defineProperty(Function.prototype,"onceStrict",{value:function(){return i(this);},configurable:!0});});},{wrappy:12}],14:[function(e,t,r){function n(e){var t=e._readableState;return t?t.objectMode?e.read():e.read(i(t)):null;}function i(e){return e.buffer.length?e.buffer.head?e.buffer.head.data.length:e.buffer[0].length:e.length;}t.exports=n;},{}],15:[function(e,t,r){"function"==typeof Object.create?t.exports=function(e,t){e.super_=t,e.prototype=Object.create(t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}});}:t.exports=function(e,t){e.super_=t;var r=function(){};r.prototype=t.prototype,e.prototype=new r(),e.prototype.constructor=e;};},{}],16:[function(e,t,r){"use strict";function n(e){return this instanceof n?(f.call(this,e),h.call(this,e),e&&e.readable===!1&&(this.readable=!1),e&&e.writable===!1&&(this.writable=!1),this.allowHalfOpen=!0,e&&e.allowHalfOpen===!1&&(this.allowHalfOpen=!1),void this.once("end",i)):new n(e);}function i(){this.allowHalfOpen||this._writableState.ended||s.nextTick(o,this);}function o(e){e.end();}var s=e("process-nextick-args"),a=Object.keys||function(e){var t=[];for(var r in e)t.push(r);return t;};t.exports=n;var u=e("core-util-is");u.inherits=e("inherits");var f=e("./_stream_readable"),h=e("./_stream_writable");u.inherits(n,f);for(var l=a(h.prototype),c=0;c<l.length;c++){var d=l[c];n.prototype[d]||(n.prototype[d]=h.prototype[d]);}Object.defineProperty(n.prototype,"writableHighWaterMark",{enumerable:!1,get:function(){return this._writableState.highWaterMark;}}),Object.defineProperty(n.prototype,"destroyed",{get:function(){return void 0!==this._readableState&&void 0!==this._writableState&&this._readableState.destroyed&&this._writableState.destroyed;},set:function(e){void 0!==this._readableState&&void 0!==this._writableState&&(this._readableState.destroyed=e,this._writableState.destroyed=e);}}),n.prototype._destroy=function(e,t){this.push(null),this.end(),s.nextTick(t,e);};},{"./_stream_readable":18,"./_stream_writable":20,"core-util-is":24,inherits:15,"process-nextick-args":26}],17:[function(e,t,r){"use strict";function n(e){return this instanceof n?void i.call(this,e):new n(e);}t.exports=n;var i=e("./_stream_transform"),o=e("core-util-is");o.inherits=e("inherits"),o.inherits(n,i),n.prototype._transform=function(e,t,r){r(null,e);};},{"./_stream_transform":19,"core-util-is":24,inherits:15}],18:[function(e,t,r){(function(r,n){"use strict";function i(e){return D.from(e);}function o(e){return D.isBuffer(e)||e instanceof N;}function s(e,t,r){return"function"==typeof e.prependListener?e.prependListener(t,r):void(e._events&&e._events[t]?C(e._events[t])?e._events[t].unshift(r):e._events[t]=[r,e._events[t]]:e.on(t,r));}function a(t,r){j=j||e("./_stream_duplex"),t=t||{};var n=r instanceof j;this.objectMode=!!t.objectMode,n&&(this.objectMode=this.objectMode||!!t.readableObjectMode);var i=t.highWaterMark,o=t.readableHighWaterMark,s=this.objectMode?16:16384;i||0===i?this.highWaterMark=i:n&&(o||0===o)?this.highWaterMark=o:this.highWaterMark=s,this.highWaterMark=Math.floor(this.highWaterMark),this.buffer=new F(),this.length=0,this.pipes=null,this.pipesCount=0,this.flowing=null,this.ended=!1,this.endEmitted=!1,this.reading=!1,this.sync=!0,this.needReadable=!1,this.emittedReadable=!1,this.readableListening=!1,this.resumeScheduled=!1,this.destroyed=!1,this.defaultEncoding=t.defaultEncoding||"utf8",this.awaitDrain=0,this.readingMore=!1,this.decoder=null,this.encoding=null,t.encoding&&(q||(q=e("string_decoder/").StringDecoder),this.decoder=new q(t.encoding),this.encoding=t.encoding);}function u(t){return j=j||e("./_stream_duplex"),this instanceof u?(this._readableState=new a(t,this),this.readable=!0,t&&("function"==typeof t.read&&(this._read=t.read),"function"==typeof t.destroy&&(this._destroy=t.destroy)),void O.call(this)):new u(t);}function f(e,t,r,n,o){var s=e._readableState;if(null===t)s.reading=!1,g(e,s);else{var a;o||(a=l(s,t)),a?e.emit("error",a):s.objectMode||t&&t.length>0?("string"==typeof t||s.objectMode||Object.getPrototypeOf(t)===D.prototype||(t=i(t)),n?s.endEmitted?e.emit("error",new Error("stream.unshift() after end event")):h(e,s,t,!0):s.ended?e.emit("error",new Error("stream.push() after EOF")):(s.reading=!1,s.decoder&&!r?(t=s.decoder.write(t),s.objectMode||0!==t.length?h(e,s,t,!1):w(e,s)):h(e,s,t,!1))):n||(s.reading=!1);}return c(s);}function h(e,t,r,n){t.flowing&&0===t.length&&!t.sync?(e.emit("data",r),e.read(0)):(t.length+=t.objectMode?1:r.length,n?t.buffer.unshift(r):t.buffer.push(r),t.needReadable&&y(e)),w(e,t);}function l(e,t){var r;return o(t)||"string"==typeof t||void 0===t||e.objectMode||(r=new TypeError("Invalid non-string/buffer chunk")),r;}function c(e){return!e.ended&&(e.needReadable||e.length<e.highWaterMark||0===e.length);}function d(e){return e>=V?e=V:(e--,e|=e>>>1,e|=e>>>2,e|=e>>>4,e|=e>>>8,e|=e>>>16,e++),e;}function p(e,t){return e<=0||0===t.length&&t.ended?0:t.objectMode?1:e!==e?t.flowing&&t.length?t.buffer.head.data.length:t.length:(e>t.highWaterMark&&(t.highWaterMark=d(e)),e<=t.length?e:t.ended?t.length:(t.needReadable=!0,0));}function g(e,t){if(!t.ended){if(t.decoder){var r=t.decoder.end();r&&r.length&&(t.buffer.push(r),t.length+=t.objectMode?1:r.length);}t.ended=!0,y(e);}}function y(e){var t=e._readableState;t.needReadable=!1,t.emittedReadable||(Y("emitReadable",t.flowing),t.emittedReadable=!0,t.sync?P.nextTick(b,e):b(e));}function b(e){Y("emit readable"),e.emit("readable"),k(e);}function w(e,t){t.readingMore||(t.readingMore=!0,P.nextTick(v,e,t));}function v(e,t){for(var r=t.length;!t.reading&&!t.flowing&&!t.ended&&t.length<t.highWaterMark&&(Y("maybeReadMore read 0"),e.read(0),r!==t.length);)r=t.length;t.readingMore=!1;}function _(e){return function(){var t=e._readableState;Y("pipeOnDrain",t.awaitDrain),t.awaitDrain&&t.awaitDrain--,0===t.awaitDrain&&U(e,"data")&&(t.flowing=!0,k(e));};}function m(e){Y("readable nexttick read 0"),e.read(0);}function S(e,t){t.resumeScheduled||(t.resumeScheduled=!0,P.nextTick(E,e,t));}function E(e,t){t.reading||(Y("resume read 0"),e.read(0)),t.resumeScheduled=!1,t.awaitDrain=0,e.emit("resume"),k(e),t.flowing&&!t.reading&&e.read(0);}function k(e){var t=e._readableState;for(Y("flow",t.flowing);t.flowing&&null!==e.read(););}function x(e,t){if(0===t.length)return null;var r;return t.objectMode?r=t.buffer.shift():!e||e>=t.length?(r=t.decoder?t.buffer.join(""):1===t.buffer.length?t.buffer.head.data:t.buffer.concat(t.length),t.buffer.clear()):r=T(e,t.buffer,t.decoder),r;}function T(e,t,r){var n;return e<t.head.data.length?(n=t.head.data.slice(0,e),t.head.data=t.head.data.slice(e)):n=e===t.head.data.length?t.shift():r?R(e,t):A(e,t),n;}function R(e,t){var r=t.head,n=1,i=r.data;for(e-=i.length;r=r.next;){var o=r.data,s=e>o.length?o.length:e;if(i+=s===o.length?o:o.slice(0,e),e-=s,0===e){s===o.length?(++n,r.next?t.head=r.next:t.head=t.tail=null):(t.head=r,r.data=o.slice(s));break;}++n;}return t.length-=n,i;}function A(e,t){var r=D.allocUnsafe(e),n=t.head,i=1;for(n.data.copy(r),e-=n.data.length;n=n.next;){var o=n.data,s=e>o.length?o.length:e;if(o.copy(r,r.length-e,0,s),e-=s,0===e){s===o.length?(++i,n.next?t.head=n.next:t.head=t.tail=null):(t.head=n,n.data=o.slice(s));break;}++i;}return t.length-=i,r;}function M(e){var t=e._readableState;if(t.length>0)throw new Error('"endReadable()" called on non-empty stream');t.endEmitted||(t.ended=!0,P.nextTick(L,t,e));}function L(e,t){e.endEmitted||0!==e.length||(e.endEmitted=!0,t.readable=!1,t.emit("end"));}function B(e,t){for(var r=0,n=e.length;r<n;r++)if(e[r]===t)return r;return-1;}var P=e("process-nextick-args");t.exports=u;var j,C=e("isarray");u.ReadableState=a;var U=(e("events").EventEmitter,function(e,t){return e.listeners(t).length;}),O=e("./internal/streams/stream"),D=e("safe-buffer").Buffer,N=n.Uint8Array||function(){},I=e("core-util-is");I.inherits=e("inherits");var W=e("util"),Y=void 0;Y=W&&W.debuglog?W.debuglog("stream"):function(){};var q,F=e("./internal/streams/BufferList"),z=e("./internal/streams/destroy");I.inherits(u,O);var H=["error","close","destroy","pause","resume"];Object.defineProperty(u.prototype,"destroyed",{get:function(){return void 0!==this._readableState&&this._readableState.destroyed;},set:function(e){this._readableState&&(this._readableState.destroyed=e);}}),u.prototype.destroy=z.destroy,u.prototype._undestroy=z.undestroy,u.prototype._destroy=function(e,t){this.push(null),t(e);},u.prototype.push=function(e,t){var r,n=this._readableState;return n.objectMode?r=!0:"string"==typeof e&&(t=t||n.defaultEncoding,t!==n.encoding&&(e=D.from(e,t),t=""),r=!0),f(this,e,t,!1,r);},u.prototype.unshift=function(e){return f(this,e,null,!0,!1);},u.prototype.isPaused=function(){return this._readableState.flowing===!1;},u.prototype.setEncoding=function(t){return q||(q=e("string_decoder/").StringDecoder),this._readableState.decoder=new q(t),this._readableState.encoding=t,this;};var V=8388608;u.prototype.read=function(e){Y("read",e),e=parseInt(e,10);var t=this._readableState,r=e;if(0!==e&&(t.emittedReadable=!1),0===e&&t.needReadable&&(t.length>=t.highWaterMark||t.ended))return Y("read: emitReadable",t.length,t.ended),0===t.length&&t.ended?M(this):y(this),null;if(e=p(e,t),0===e&&t.ended)return 0===t.length&&M(this),null;var n=t.needReadable;Y("need readable",n),(0===t.length||t.length-e<t.highWaterMark)&&(n=!0,Y("length less than watermark",n)),t.ended||t.reading?(n=!1,Y("reading or ended",n)):n&&(Y("do read"),t.reading=!0,t.sync=!0,0===t.length&&(t.needReadable=!0),this._read(t.highWaterMark),t.sync=!1,t.reading||(e=p(r,t)));var i;return i=e>0?x(e,t):null,null===i?(t.needReadable=!0,e=0):t.length-=e,0===t.length&&(t.ended||(t.needReadable=!0),r!==e&&t.ended&&M(this)),null!==i&&this.emit("data",i),i;},u.prototype._read=function(e){this.emit("error",new Error("_read() is not implemented"));},u.prototype.pipe=function(e,t){function n(e,t){Y("onunpipe"),e===c&&t&&t.hasUnpiped===!1&&(t.hasUnpiped=!0,o());}function i(){Y("onend"),e.end();}function o(){Y("cleanup"),e.removeListener("close",f),e.removeListener("finish",h),e.removeListener("drain",y),e.removeListener("error",u),e.removeListener("unpipe",n),c.removeListener("end",i),c.removeListener("end",l),c.removeListener("data",a),b=!0,!d.awaitDrain||e._writableState&&!e._writableState.needDrain||y();}function a(t){Y("ondata"),w=!1;var r=e.write(t);!1!==r||w||((1===d.pipesCount&&d.pipes===e||d.pipesCount>1&&B(d.pipes,e)!==-1)&&!b&&(Y("false write response, pause",c._readableState.awaitDrain),c._readableState.awaitDrain++,w=!0),c.pause());}function u(t){Y("onerror",t),l(),e.removeListener("error",u),0===U(e,"error")&&e.emit("error",t);}function f(){e.removeListener("finish",h),l();}function h(){Y("onfinish"),e.removeListener("close",f),l();}function l(){Y("unpipe"),c.unpipe(e);}var c=this,d=this._readableState;switch(d.pipesCount){case 0:d.pipes=e;break;case 1:d.pipes=[d.pipes,e];break;default:d.pipes.push(e);}d.pipesCount+=1,Y("pipe count=%d opts=%j",d.pipesCount,t);var p=(!t||t.end!==!1)&&e!==r.stdout&&e!==r.stderr,g=p?i:l;d.endEmitted?P.nextTick(g):c.once("end",g),e.on("unpipe",n);var y=_(c);e.on("drain",y);var b=!1,w=!1;return c.on("data",a),s(e,"error",u),e.once("close",f),e.once("finish",h),e.emit("pipe",c),d.flowing||(Y("pipe resume"),c.resume()),e;},u.prototype.unpipe=function(e){var t=this._readableState,r={hasUnpiped:!1};if(0===t.pipesCount)return this;if(1===t.pipesCount)return e&&e!==t.pipes?this:(e||(e=t.pipes),t.pipes=null,t.pipesCount=0,t.flowing=!1,e&&e.emit("unpipe",this,r),this);if(!e){var n=t.pipes,i=t.pipesCount;t.pipes=null,t.pipesCount=0,t.flowing=!1;for(var o=0;o<i;o++)n[o].emit("unpipe",this,r);return this;}var s=B(t.pipes,e);return s===-1?this:(t.pipes.splice(s,1),t.pipesCount-=1,1===t.pipesCount&&(t.pipes=t.pipes[0]),e.emit("unpipe",this,r),this);},u.prototype.on=function(e,t){var r=O.prototype.on.call(this,e,t);if("data"===e)this._readableState.flowing!==!1&&this.resume();else if("readable"===e){var n=this._readableState;n.endEmitted||n.readableListening||(n.readableListening=n.needReadable=!0,n.emittedReadable=!1,n.reading?n.length&&y(this):P.nextTick(m,this));}return r;},u.prototype.addListener=u.prototype.on,u.prototype.resume=function(){var e=this._readableState;return e.flowing||(Y("resume"),e.flowing=!0,S(this,e)),this;},u.prototype.pause=function(){return Y("call pause flowing=%j",this._readableState.flowing),!1!==this._readableState.flowing&&(Y("pause"),this._readableState.flowing=!1,this.emit("pause")),this;},u.prototype.wrap=function(e){var t=this,r=this._readableState,n=!1;e.on("end",function(){if(Y("wrapped end"),r.decoder&&!r.ended){var e=r.decoder.end();e&&e.length&&t.push(e);}t.push(null);}),e.on("data",function(i){if(Y("wrapped data"),r.decoder&&(i=r.decoder.write(i)),(!r.objectMode||null!==i&&void 0!==i)&&(r.objectMode||i&&i.length)){var o=t.push(i);o||(n=!0,e.pause());}});for(var i in e)void 0===this[i]&&"function"==typeof e[i]&&(this[i]=function(t){return function(){return e[t].apply(e,arguments);};}(i));for(var o=0;o<H.length;o++)e.on(H[o],this.emit.bind(this,H[o]));return this._read=function(t){Y("wrapped _read",t),n&&(n=!1,e.resume());},this;},Object.defineProperty(u.prototype,"readableHighWaterMark",{enumerable:!1,get:function(){return this._readableState.highWaterMark;}}),u._fromList=x;}).call(this,e("_process"),"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});},{"./_stream_duplex":16,"./internal/streams/BufferList":21,"./internal/streams/destroy":22,"./internal/streams/stream":23,_process:8,"core-util-is":24,events:6,inherits:15,isarray:25,"process-nextick-args":26,"safe-buffer":30,"string_decoder/":27,util:1}],19:[function(e,t,r){"use strict";function n(e,t){var r=this._transformState;r.transforming=!1;var n=r.writecb;if(!n)return this.emit("error",new Error("write callback called multiple times"));r.writechunk=null,r.writecb=null,null!=t&&this.push(t),n(e);var i=this._readableState;i.reading=!1,(i.needReadable||i.length<i.highWaterMark)&&this._read(i.highWaterMark);}function i(e){return this instanceof i?(a.call(this,e),this._transformState={afterTransform:n.bind(this),needTransform:!1,transforming:!1,writecb:null,writechunk:null,writeencoding:null},this._readableState.needReadable=!0,this._readableState.sync=!1,e&&("function"==typeof e.transform&&(this._transform=e.transform),"function"==typeof e.flush&&(this._flush=e.flush)),void this.on("prefinish",o)):new i(e);}function o(){var e=this;"function"==typeof this._flush?this._flush(function(t,r){s(e,t,r);}):s(this,null,null);}function s(e,t,r){if(t)return e.emit("error",t);if(null!=r&&e.push(r),e._writableState.length)throw new Error("Calling transform done when ws.length != 0");if(e._transformState.transforming)throw new Error("Calling transform done when still transforming");return e.push(null);}t.exports=i;var a=e("./_stream_duplex"),u=e("core-util-is");u.inherits=e("inherits"),u.inherits(i,a),i.prototype.push=function(e,t){return this._transformState.needTransform=!1,a.prototype.push.call(this,e,t);},i.prototype._transform=function(e,t,r){throw new Error("_transform() is not implemented");},i.prototype._write=function(e,t,r){var n=this._transformState;if(n.writecb=r,n.writechunk=e,n.writeencoding=t,!n.transforming){var i=this._readableState;(n.needTransform||i.needReadable||i.length<i.highWaterMark)&&this._read(i.highWaterMark);}},i.prototype._read=function(e){var t=this._transformState;null!==t.writechunk&&t.writecb&&!t.transforming?(t.transforming=!0,this._transform(t.writechunk,t.writeencoding,t.afterTransform)):t.needTransform=!0;},i.prototype._destroy=function(e,t){var r=this;a.prototype._destroy.call(this,e,function(e){t(e),r.emit("close");});};},{"./_stream_duplex":16,"core-util-is":24,inherits:15}],20:[function(e,t,r){(function(r,n){"use strict";function i(e){var t=this;this.next=null,this.entry=null,this.finish=function(){T(t,e);};}function o(e){return j.from(e);}function s(e){return j.isBuffer(e)||e instanceof C;}function a(){}function u(t,r){A=A||e("./_stream_duplex"),t=t||{};var n=r instanceof A;this.objectMode=!!t.objectMode,n&&(this.objectMode=this.objectMode||!!t.writableObjectMode);var o=t.highWaterMark,s=t.writableHighWaterMark,a=this.objectMode?16:16384;o||0===o?this.highWaterMark=o:n&&(s||0===s)?this.highWaterMark=s:this.highWaterMark=a,this.highWaterMark=Math.floor(this.highWaterMark),this.finalCalled=!1,this.needDrain=!1,this.ending=!1,this.ended=!1,this.finished=!1,this.destroyed=!1;var u=t.decodeStrings===!1;this.decodeStrings=!u,this.defaultEncoding=t.defaultEncoding||"utf8",this.length=0,this.writing=!1,this.corked=0,this.sync=!0,this.bufferProcessing=!1,this.onwrite=function(e){b(r,e);},this.writecb=null,this.writelen=0,this.bufferedRequest=null,this.lastBufferedRequest=null,this.pendingcb=0,this.prefinished=!1,this.errorEmitted=!1,this.bufferedRequestCount=0,this.corkedRequestsFree=new i(this);}function f(t){return A=A||e("./_stream_duplex"),O.call(f,this)||this instanceof A?(this._writableState=new u(t,this),this.writable=!0,t&&("function"==typeof t.write&&(this._write=t.write),"function"==typeof t.writev&&(this._writev=t.writev),"function"==typeof t.destroy&&(this._destroy=t.destroy),"function"==typeof t.final&&(this._final=t.final)),void P.call(this)):new f(t);}function h(e,t){var r=new Error("write after end");e.emit("error",r),R.nextTick(t,r);}function l(e,t,r,n){var i=!0,o=!1;return null===r?o=new TypeError("May not write null values to stream"):"string"==typeof r||void 0===r||t.objectMode||(o=new TypeError("Invalid non-string/buffer chunk")),o&&(e.emit("error",o),R.nextTick(n,o),i=!1),i;}function c(e,t,r){return e.objectMode||e.decodeStrings===!1||"string"!=typeof t||(t=j.from(t,r)),t;}function d(e,t,r,n,i,o){if(!r){var s=c(t,n,i);n!==s&&(r=!0,i="buffer",n=s);}var a=t.objectMode?1:n.length;t.length+=a;var u=t.length<t.highWaterMark;if(u||(t.needDrain=!0),t.writing||t.corked){var f=t.lastBufferedRequest;t.lastBufferedRequest={chunk:n,encoding:i,isBuf:r,callback:o,next:null},f?f.next=t.lastBufferedRequest:t.bufferedRequest=t.lastBufferedRequest,t.bufferedRequestCount+=1;}else p(e,t,!1,a,n,i,o);return u;}function p(e,t,r,n,i,o,s){t.writelen=n,t.writecb=s,t.writing=!0,t.sync=!0,r?e._writev(i,t.onwrite):e._write(i,o,t.onwrite),t.sync=!1;}function g(e,t,r,n,i){--t.pendingcb,r?(R.nextTick(i,n),R.nextTick(k,e,t),e._writableState.errorEmitted=!0,e.emit("error",n)):(i(n),e._writableState.errorEmitted=!0,e.emit("error",n),k(e,t));}function y(e){e.writing=!1,e.writecb=null,e.length-=e.writelen,e.writelen=0;}function b(e,t){var r=e._writableState,n=r.sync,i=r.writecb;if(y(r),t)g(e,r,n,t,i);else{var o=m(r);o||r.corked||r.bufferProcessing||!r.bufferedRequest||_(e,r),n?M(w,e,r,o,i):w(e,r,o,i);}}function w(e,t,r,n){r||v(e,t),t.pendingcb--,n(),k(e,t);}function v(e,t){0===t.length&&t.needDrain&&(t.needDrain=!1,e.emit("drain"));}function _(e,t){t.bufferProcessing=!0;var r=t.bufferedRequest;if(e._writev&&r&&r.next){var n=t.bufferedRequestCount,o=new Array(n),s=t.corkedRequestsFree;s.entry=r;for(var a=0,u=!0;r;)o[a]=r,r.isBuf||(u=!1),r=r.next,a+=1;o.allBuffers=u,p(e,t,!0,t.length,o,"",s.finish),t.pendingcb++,t.lastBufferedRequest=null,s.next?(t.corkedRequestsFree=s.next,s.next=null):t.corkedRequestsFree=new i(t),t.bufferedRequestCount=0;}else{for(;r;){var f=r.chunk,h=r.encoding,l=r.callback,c=t.objectMode?1:f.length;if(p(e,t,!1,c,f,h,l),r=r.next,t.bufferedRequestCount--,t.writing)break;}null===r&&(t.lastBufferedRequest=null);}t.bufferedRequest=r,t.bufferProcessing=!1;}function m(e){return e.ending&&0===e.length&&null===e.bufferedRequest&&!e.finished&&!e.writing;}function S(e,t){e._final(function(r){t.pendingcb--,r&&e.emit("error",r),t.prefinished=!0,e.emit("prefinish"),k(e,t);});}function E(e,t){t.prefinished||t.finalCalled||("function"==typeof e._final?(t.pendingcb++,t.finalCalled=!0,R.nextTick(S,e,t)):(t.prefinished=!0,e.emit("prefinish")));}function k(e,t){var r=m(t);return r&&(E(e,t),0===t.pendingcb&&(t.finished=!0,e.emit("finish"))),r;}function x(e,t,r){t.ending=!0,k(e,t),r&&(t.finished?R.nextTick(r):e.once("finish",r)),t.ended=!0,e.writable=!1;}function T(e,t,r){var n=e.entry;for(e.entry=null;n;){var i=n.callback;t.pendingcb--,i(r),n=n.next;}t.corkedRequestsFree?t.corkedRequestsFree.next=e:t.corkedRequestsFree=e;}var R=e("process-nextick-args");t.exports=f;var A,M=!r.browser&&["v0.10","v0.9."].indexOf(r.version.slice(0,5))>-1?setImmediate:R.nextTick;f.WritableState=u;var L=e("core-util-is");L.inherits=e("inherits");var B={deprecate:e("util-deprecate")},P=e("./internal/streams/stream"),j=e("safe-buffer").Buffer,C=n.Uint8Array||function(){},U=e("./internal/streams/destroy");L.inherits(f,P),u.prototype.getBuffer=function(){for(var e=this.bufferedRequest,t=[];e;)t.push(e),e=e.next;return t;},function(){try{Object.defineProperty(u.prototype,"buffer",{get:B.deprecate(function(){return this.getBuffer();},"_writableState.buffer is deprecated. Use _writableState.getBuffer instead.","DEP0003")});}catch(e){}}();var O;"function"==typeof Symbol&&Symbol.hasInstance&&"function"==typeof Function.prototype[Symbol.hasInstance]?(O=Function.prototype[Symbol.hasInstance],Object.defineProperty(f,Symbol.hasInstance,{value:function(e){return!!O.call(this,e)||this===f&&e&&e._writableState instanceof u;}})):O=function(e){return e instanceof this;},f.prototype.pipe=function(){this.emit("error",new Error("Cannot pipe, not readable"));},f.prototype.write=function(e,t,r){var n=this._writableState,i=!1,u=!n.objectMode&&s(e);return u&&!j.isBuffer(e)&&(e=o(e)),"function"==typeof t&&(r=t,t=null),u?t="buffer":t||(t=n.defaultEncoding),"function"!=typeof r&&(r=a),n.ended?h(this,r):(u||l(this,n,e,r))&&(n.pendingcb++,i=d(this,n,u,e,t,r)),i;},f.prototype.cork=function(){var e=this._writableState;e.corked++;},f.prototype.uncork=function(){var e=this._writableState;e.corked&&(e.corked--,e.writing||e.corked||e.finished||e.bufferProcessing||!e.bufferedRequest||_(this,e));},f.prototype.setDefaultEncoding=function(e){if("string"==typeof e&&(e=e.toLowerCase()),!(["hex","utf8","utf-8","ascii","binary","base64","ucs2","ucs-2","utf16le","utf-16le","raw"].indexOf((e+"").toLowerCase())>-1))throw new TypeError("Unknown encoding: "+e);return this._writableState.defaultEncoding=e,this;},Object.defineProperty(f.prototype,"writableHighWaterMark",{enumerable:!1,get:function(){return this._writableState.highWaterMark;}}),f.prototype._write=function(e,t,r){r(new Error("_write() is not implemented"));},f.prototype._writev=null,f.prototype.end=function(e,t,r){var n=this._writableState;"function"==typeof e?(r=e,e=null,t=null):"function"==typeof t&&(r=t,t=null),null!==e&&void 0!==e&&this.write(e,t),n.corked&&(n.corked=1,this.uncork()),n.ending||n.finished||x(this,n,r);},Object.defineProperty(f.prototype,"destroyed",{get:function(){return void 0!==this._writableState&&this._writableState.destroyed;},set:function(e){this._writableState&&(this._writableState.destroyed=e);}}),f.prototype.destroy=U.destroy,f.prototype._undestroy=U.undestroy,f.prototype._destroy=function(e,t){this.end(),t(e);};}).call(this,e("_process"),"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});},{"./_stream_duplex":16,"./internal/streams/destroy":22,"./internal/streams/stream":23,_process:8,"core-util-is":24,inherits:15,"process-nextick-args":26,"safe-buffer":30,"util-deprecate":28}],21:[function(e,t,r){"use strict";function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function");}function i(e,t,r){e.copy(t,r);}var o=e("safe-buffer").Buffer,s=e("util");t.exports=function(){function e(){n(this,e),this.head=null,this.tail=null,this.length=0;}return e.prototype.push=function(e){var t={data:e,next:null};this.length>0?this.tail.next=t:this.head=t,this.tail=t,++this.length;},e.prototype.unshift=function(e){var t={data:e,next:this.head};0===this.length&&(this.tail=t),this.head=t,++this.length;},e.prototype.shift=function(){if(0!==this.length){var e=this.head.data;return 1===this.length?this.head=this.tail=null:this.head=this.head.next,--this.length,e;}},e.prototype.clear=function(){this.head=this.tail=null,this.length=0;},e.prototype.join=function(e){if(0===this.length)return"";for(var t=this.head,r=""+t.data;t=t.next;)r+=e+t.data;return r;},e.prototype.concat=function(e){if(0===this.length)return o.alloc(0);if(1===this.length)return this.head.data;for(var t=o.allocUnsafe(e>>>0),r=this.head,n=0;r;)i(r.data,t,n),n+=r.data.length,r=r.next;return t;},e;}(),s&&s.inspect&&s.inspect.custom&&(t.exports.prototype[s.inspect.custom]=function(){var e=s.inspect({length:this.length});return this.constructor.name+" "+e;});},{"safe-buffer":30,util:1}],22:[function(e,t,r){"use strict";function n(e,t){var r=this,n=this._readableState&&this._readableState.destroyed,i=this._writableState&&this._writableState.destroyed;return n||i?(t?t(e):!e||this._writableState&&this._writableState.errorEmitted||s.nextTick(o,this,e),this):(this._readableState&&(this._readableState.destroyed=!0),this._writableState&&(this._writableState.destroyed=!0),this._destroy(e||null,function(e){!t&&e?(s.nextTick(o,r,e),r._writableState&&(r._writableState.errorEmitted=!0)):t&&t(e);}),this);}function i(){this._readableState&&(this._readableState.destroyed=!1,this._readableState.reading=!1,this._readableState.ended=!1,this._readableState.endEmitted=!1),this._writableState&&(this._writableState.destroyed=!1,this._writableState.ended=!1,this._writableState.ending=!1,this._writableState.finished=!1,this._writableState.errorEmitted=!1);}function o(e,t){e.emit("error",t);}var s=e("process-nextick-args");t.exports={destroy:n,undestroy:i};},{"process-nextick-args":26}],23:[function(e,t,r){t.exports=e("events").EventEmitter;},{events:6}],24:[function(e,t,r){(function(e){function t(e){return Array.isArray?Array.isArray(e):"[object Array]"===y(e);}function n(e){return"boolean"==typeof e;}function i(e){return null===e;}function o(e){return null==e;}function s(e){return"number"==typeof e;}function a(e){return"string"==typeof e;}function u(e){return"symbol"==typeof e;}function f(e){return void 0===e;}function h(e){return"[object RegExp]"===y(e);}function l(e){return"object"==typeof e&&null!==e;}function c(e){return"[object Date]"===y(e);}function d(e){return"[object Error]"===y(e)||e instanceof Error;}function p(e){return"function"==typeof e;}function g(e){return null===e||"boolean"==typeof e||"number"==typeof e||"string"==typeof e||"symbol"==typeof e||"undefined"==typeof e;}function y(e){return Object.prototype.toString.call(e);}r.isArray=t,r.isBoolean=n,r.isNull=i,r.isNullOrUndefined=o,r.isNumber=s,r.isString=a,r.isSymbol=u,r.isUndefined=f,r.isRegExp=h,r.isObject=l,r.isDate=c,r.isError=d,r.isFunction=p,r.isPrimitive=g,r.isBuffer=e.isBuffer;}).call(this,{isBuffer:e("../../../../../../../../../home/admin/browserify-cdn/node_modules/browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js")});},{"../../../../../../../../../home/admin/browserify-cdn/node_modules/browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js":7}],25:[function(e,t,r){arguments[4][5][0].apply(r,arguments);},{dup:5}],26:[function(e,t,r){(function(e){"use strict";function r(t,r,n,i){if("function"!=typeof t)throw new TypeError('"callback" argument must be a function');var o,s,a=arguments.length;switch(a){case 0:case 1:return e.nextTick(t);case 2:return e.nextTick(function(){t.call(null,r);});case 3:return e.nextTick(function(){t.call(null,r,n);});case 4:return e.nextTick(function(){t.call(null,r,n,i);});default:for(o=new Array(a-1),s=0;s<o.length;)o[s++]=arguments[s];return e.nextTick(function(){t.apply(null,o);});}}!e.version||0===e.version.indexOf("v0.")||0===e.version.indexOf("v1.")&&0!==e.version.indexOf("v1.8.")?t.exports={nextTick:r}:t.exports=e;}).call(this,e("_process"));},{_process:8}],27:[function(e,t,r){"use strict";function n(e){if(!e)return"utf8";for(var t;;)switch(e){case"utf8":case"utf-8":return"utf8";case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return"utf16le";case"latin1":case"binary":return"latin1";case"base64":case"ascii":case"hex":return e;default:if(t)return;e=(""+e).toLowerCase(),t=!0;}}function i(e){var t=n(e);if("string"!=typeof t&&(w.isEncoding===v||!v(e)))throw new Error("Unknown encoding: "+e);return t||e;}function o(e){this.encoding=i(e);var t;switch(this.encoding){case"utf16le":this.text=c,this.end=d,t=4;break;case"utf8":this.fillLast=f,t=4;break;case"base64":this.text=p,this.end=g,t=3;break;default:return this.write=y,void(this.end=b);}this.lastNeed=0,this.lastTotal=0,this.lastChar=w.allocUnsafe(t);}function s(e){return e<=127?0:e>>5===6?2:e>>4===14?3:e>>3===30?4:e>>6===2?-1:-2;}function a(e,t,r){var n=t.length-1;if(n<r)return 0;var i=s(t[n]);return i>=0?(i>0&&(e.lastNeed=i-1),i):--n<r||i===-2?0:(i=s(t[n]),i>=0?(i>0&&(e.lastNeed=i-2),i):--n<r||i===-2?0:(i=s(t[n]),i>=0?(i>0&&(2===i?i=0:e.lastNeed=i-3),i):0));}function u(e,t,r){if(128!==(192&t[0]))return e.lastNeed=0,"�";if(e.lastNeed>1&&t.length>1){if(128!==(192&t[1]))return e.lastNeed=1,"�";if(e.lastNeed>2&&t.length>2&&128!==(192&t[2]))return e.lastNeed=2,"�";}}function f(e){var t=this.lastTotal-this.lastNeed,r=u(this,e,t);return void 0!==r?r:this.lastNeed<=e.length?(e.copy(this.lastChar,t,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal)):(e.copy(this.lastChar,t,0,e.length),void(this.lastNeed-=e.length));}function h(e,t){var r=a(this,e,t);if(!this.lastNeed)return e.toString("utf8",t);this.lastTotal=r;var n=e.length-(r-this.lastNeed);return e.copy(this.lastChar,0,n),e.toString("utf8",t,n);}function l(e){var t=e&&e.length?this.write(e):"";return this.lastNeed?t+"�":t;}function c(e,t){if((e.length-t)%2===0){var r=e.toString("utf16le",t);if(r){var n=r.charCodeAt(r.length-1);if(n>=55296&&n<=56319)return this.lastNeed=2,this.lastTotal=4,this.lastChar[0]=e[e.length-2],this.lastChar[1]=e[e.length-1],r.slice(0,-1);}return r;}return this.lastNeed=1,this.lastTotal=2,this.lastChar[0]=e[e.length-1],e.toString("utf16le",t,e.length-1);}function d(e){var t=e&&e.length?this.write(e):"";if(this.lastNeed){var r=this.lastTotal-this.lastNeed;return t+this.lastChar.toString("utf16le",0,r);}return t;}function p(e,t){var r=(e.length-t)%3;return 0===r?e.toString("base64",t):(this.lastNeed=3-r,this.lastTotal=3,1===r?this.lastChar[0]=e[e.length-1]:(this.lastChar[0]=e[e.length-2],this.lastChar[1]=e[e.length-1]),e.toString("base64",t,e.length-r));}function g(e){var t=e&&e.length?this.write(e):"";return this.lastNeed?t+this.lastChar.toString("base64",0,3-this.lastNeed):t;}function y(e){return e.toString(this.encoding);}function b(e){return e&&e.length?this.write(e):"";}var w=e("safe-buffer").Buffer,v=w.isEncoding||function(e){switch(e=""+e,e&&e.toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":case"raw":return!0;default:return!1;}};r.StringDecoder=o,o.prototype.write=function(e){if(0===e.length)return"";var t,r;if(this.lastNeed){if(t=this.fillLast(e),void 0===t)return"";r=this.lastNeed,this.lastNeed=0;}else r=0;return r<e.length?t?t+this.text(e,r):this.text(e,r):t||"";},o.prototype.end=l,o.prototype.text=h,o.prototype.fillLast=function(e){return this.lastNeed<=e.length?(e.copy(this.lastChar,this.lastTotal-this.lastNeed,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal)):(e.copy(this.lastChar,this.lastTotal-this.lastNeed,0,e.length),void(this.lastNeed-=e.length));};},{"safe-buffer":30}],28:[function(e,t,r){(function(e){function r(e,t){function r(){if(!i){if(n("throwDeprecation"))throw new Error(t);n("traceDeprecation")?console.trace(t):console.warn(t),i=!0;}return e.apply(this,arguments);}if(n("noDeprecation"))return e;var i=!1;return r;}function n(t){try{if(!e.localStorage)return!1;}catch(e){return!1;}var r=e.localStorage[t];return null!=r&&"true"===String(r).toLowerCase();}t.exports=r;}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});},{}],29:[function(e,t,r){r=t.exports=e("./lib/_stream_readable.js"),r.Stream=r,r.Readable=r,r.Writable=e("./lib/_stream_writable.js"),r.Duplex=e("./lib/_stream_duplex.js"),r.Transform=e("./lib/_stream_transform.js"),r.PassThrough=e("./lib/_stream_passthrough.js");},{"./lib/_stream_duplex.js":16,"./lib/_stream_passthrough.js":17,"./lib/_stream_readable.js":18,"./lib/_stream_transform.js":19,"./lib/_stream_writable.js":20}],30:[function(e,t,r){function n(e,t){for(var r in e)t[r]=e[r];}function i(e,t,r){return s(e,t,r);}var o=e("buffer"),s=o.Buffer;s.from&&s.alloc&&s.allocUnsafe&&s.allocUnsafeSlow?t.exports=o:(n(o,r),r.Buffer=i),n(s,i),i.from=function(e,t,r){if("number"==typeof e)throw new TypeError("Argument must not be a number");return s(e,t,r);},i.alloc=function(e,t,r){if("number"!=typeof e)throw new TypeError("Argument must be a number");var n=s(e);return void 0!==t?"string"==typeof r?n.fill(t,r):n.fill(t):n.fill(0),n;},i.allocUnsafe=function(e){if("number"!=typeof e)throw new TypeError("Argument must be a number");return s(e);},i.allocUnsafeSlow=function(e){if("number"!=typeof e)throw new TypeError("Argument must be a number");return o.SlowBuffer(e);};},{buffer:2}],31:[function(e,t,r){var n=null;"undefined"!=typeof WebSocket?n=WebSocket:"undefined"!=typeof MozWebSocket?n=MozWebSocket:"undefined"!=typeof window&&(n=window.WebSocket||window.MozWebSocket),t.exports=n;},{}]},{},[9])(9);});/**
     * @customElement
     * @polymer
     */class BunsenApp extends Element$1{static get template(){return`
    <style>
      :host {
        display: block;
      }
      paper-input {
        position: relative;
        bottom: 25px;
        height: 40px;
        width: 100%;
        background: #673ab7;
        color: #FFF;
        font-size: 1.5em;
        --paper-input-container-color: #DDD;
        --paper-input-container-focus-color: #FFF;
        --paper-input-container-input-color: #FFF;
      }
      paper-button {
        font-size: 1em;
      }
      iframe {
        width: 100%;
        border: none;
      }
      #peers {
        color: #FFF;
      }
      #peerage {
        color: #FFF;
        margin-top: 10px;
      }
    </style>
      <table style="width: 100%">
        <tbody><tr>
          <td style="width: 100%">
            <paper-input id="address" name="address" placeholder="dat://"></paper-input> 
          </td>
          <template is="dom-if" if="{{isFocused}}">
          <td>
            <paper-icon-button id="clear-address" on-tap="clearAddress" style="color: #FFF" icon="backspace"></paper-icon-button> 
          </td>
          </template>
        </tr>
      </tbody></table>
      <iframe id="view"></iframe>
      <bunsen-dats id="datSites"></bunsen-dats>
      <div id="peerage">
      <p>Peers</p>
      <div id="peers"></div>
    </div>

`;}static get is(){return'bunsen-app';}static get properties(){return{isFocused:{type:Boolean,value:false}};}async connectedCallback(){super.connectedCallback();// Handle focus on dat url input.
this.$.address.addEventListener('focusin',()=>{console.log("focusin");this.showDatSites();});this.$.address.addEventListener('focusout',()=>{// Delay so we can registe a tap to a historical link.
setTimeout(()=>{this.isFocused=false;this.$.view.style.display='block';this.$.datSites.style.display='none';},500);});// Remove spaces that keyboards add after `.` character.
this.$.address.addEventListener('keyup',async event=>{event.target.value=event.target.value.replace(' ','');});// Listen for submit of new URL.
this.$.address.addEventListener('keyup',async event=>{if(event.keyCode!==13)return;this.openAddress(this.$.address.value);});if(window.location.hash!==''){this.hashHasChanged();}window.addEventListener('hashchange',()=>this.hashHasChanged());this.socket2me();}showDatSites(){const datSites=localStorage.getItem('datSites');if(datSites){const datSiteItems=JSON.parse(datSites);this.$.datSites.items=datSiteItems;}else{localStorage.setItem('datSites','[]');}this.isFocused=true;this.$.view.style.display='none';this.$.datSites.style.display='block';}hashHasChanged(){let address=window.location.hash.substr(1,window.location.hash.length);this.$.address.value=address;this.openAddress(address);}async openAddress(address){let gatewayAddress='';// Allow fallback to online gateway.
try{// Make sure local dat gateway is available.
let response=await fetch('http://localhost:3000');let body=await response.text();if(body.indexOf('dat-gateway')!==-1){gatewayAddress=`http://localhost:3000/${address.replace('dat://','')}/`;}else{throw Error('localhost:3000 is not a dat gateway');}}catch(e){gatewayAddress=`http://gateway.mauve.moe:3000/${address.replace('dat://','')}/`;}this.$.datSites.style.display='none';this.$.view.style.display='block';this.$.view.style.background=`white`;this.$.view.src=gatewayAddress;// Fit iframe to window.
this.$.view.style.height=`${window.innerHeight-30}px`;const datSites=localStorage.getItem('datSites');if(datSites){const datSiteItems=JSON.parse(datSites);let hasAddress=false;for(var key in datSiteItems){if(datSiteItems.hasOwnProperty(key)){console.log(key+" -> "+JSON.stringify(datSiteItems[key]));if(datSiteItems[key].address===address){hasAddress=true;}}}if(!hasAddress){datSiteItems.unshift({address:address});this.$.datSites.items=datSiteItems;localStorage.setItem('datSites',JSON.stringify(datSiteItems));}}else{localStorage.setItem('datSites',`[{"address": "${address}"}]`);}}clearAddress(){this.$.address.value='';// Focus back after 200 milliseconds. Delay is a quirk of animations in paper-input.
setTimeout(()=>this.$.address.focus(),200);}socket2me(){const wsUrl=`ws://localhost:3000/peers`;const socket=websocketStream(wsUrl,null,null);// var stream = ws('ws://localhost:8343')
let that=this;socket.on('data',function(rawMsg){console.log("got message: "+rawMsg);var str=String.fromCharCode.apply(null,rawMsg);let msgArray=str.split(":");let uuid=msgArray[0].substring(0,6);let count=msgArray[msgArray.length-1];let formattedMsg=uuid+": "+count+" peers";// let ws = document.querySelector('#peers');
let ws=that.$.peers;ws.innerHTML=formattedMsg;socket.destroy();});socket.write('hello');}}window.customElements.define(BunsenApp.is,BunsenApp);export{ironA11yAnnouncer as $ironA11yAnnouncer,ironA11yKeysBehavior as $ironA11yKeysBehavior,ironButtonState as $ironButtonState,ironControlState as $ironControlState,ironFormElementBehavior as $ironFormElementBehavior,ironMeta as $ironMeta,ironValidatableBehavior as $ironValidatableBehavior,paperInkyFocusBehavior as $paperInkyFocusBehavior,paperRippleBehavior as $paperRippleBehavior,paperInputAddonBehavior as $paperInputAddonBehavior,paperInputBehavior as $paperInputBehavior,arraySelector as $arraySelector,customStyle as $customStyle,domBind as $domBind,domIf as $domIf,domModule as $domModule,domRepeat as $domRepeat,_class as $class,legacyElementMixin as $legacyElementMixin,mutableDataBehavior as $mutableDataBehavior,polymerFn as $polymerFn,polymer_dom as $polymerDom,templatizerBehavior as $templatizerBehavior,dirMixin as $dirMixin,elementMixin as $elementMixin,gestureEventListeners as $gestureEventListeners,mutableData as $mutableData,propertiesChanged as $propertiesChanged,propertiesMixin as $propertiesMixin,propertyAccessors as $propertyAccessors,propertyEffects as $propertyEffects,templateStamp as $templateStamp,arraySplice as $arraySplice,async as $async,caseMap$0 as $caseMap,debounce as $debounce,flattenedNodesObserver as $flattenedNodesObserver,flush$2 as $flush,gestures$0 as $gestures,htmlTag as $htmlTag,importHref$1 as $importHref,mixin as $mixin,path as $path,renderStatus as $renderStatus,resolveUrl$1 as $resolveUrl,settings as $settings,styleGather as $styleGather,templatize$1 as $templatize,polymerElement as $polymerElement,polymerLegacy as $polymerLegacy,applyShimUtils as $applyShimUtils,applyShim as $applyShim$1,commonRegex as $commonRegex,commonUtils as $commonUtils,cssParse as $cssParse,customStyleInterface as $customStyleInterface$1,documentWait$1 as $documentWait,styleSettings as $styleSettings,styleUtil as $styleUtil,templateMap$1 as $templateMap,unscopedStyleHandler as $unscopedStyleHandler,IronA11yAnnouncer,IronA11yKeysBehavior,IronButtonStateImpl,IronButtonState,IronControlState,IronFormElementBehavior,IronMeta,IronValidatableBehaviorMeta,IronValidatableBehavior,PaperInkyFocusBehaviorImpl,PaperInkyFocusBehavior,PaperRippleBehavior,PaperInputAddonBehavior,PaperInputHelper,PaperInputBehaviorImpl,PaperInputBehavior,ArraySelectorMixin,ArraySelector,CustomStyle,DomBind,DomIf,DomModule,DomRepeat,Class,mixinBehaviors,LegacyElementMixin,MutableDataBehavior,OptionalMutableDataBehavior,Polymer,DomApi,dom,matchesSelector,flush$1 as flush,enqueueDebouncer as addDebouncer,Templatizer,DirMixin,ElementMixin,instanceCount,registrations,_regLog,register,dumpRegistrations,updateStyles,GestureEventListeners,MutableData,OptionalMutableData,PropertiesChanged,PropertiesMixin,PropertyAccessors,PropertyEffects,TemplateStamp,calculateSplices,timeOut,animationFrame,idlePeriod,microTask,dashToCamelCase,camelToDashCase,Debouncer,FlattenedNodesObserver,enqueueDebouncer,flush$1,gestures,recognizers,deepTargetFind,_findOriginalTarget,_handleNative,_handleTouchAction,addListener,removeListener,_add,_remove,register$1,_findRecognizerByEvent,setTouchAction,_fire,prevent,resetMouseCanceller,findOriginalTarget,add,remove,html,htmlLiteral,importHref,dedupingMixin,isPath,root,isAncestor,isDescendant,translate,matches,normalize,split,get,set,isDeep,beforeNextRender,afterNextRender,flush as flush$2,resolveCss,resolveUrl,pathFromUrl,useShadow,useNativeCSSProperties,useNativeCustomElements,rootPath,setRootPath,sanitizeDOMValue,setSanitizeDOMValue,passiveTouchGestures,setPassiveTouchGestures,stylesFromModules,stylesFromModule,stylesFromTemplate,stylesFromModuleImports,_stylesFromModuleImports,cssFromModules,cssFromModule,cssFromTemplate,cssFromModuleImports,_cssFromModuleImports,templatize,modelForElement,TemplateInstanceBase,Element$1 as PolymerElement,html as html$1,Base,html as html$2,invalidate,invalidateTemplate,isValid,templateIsValid,isValidating,templateIsValidating,startValidating,startValidatingTemplate,elementsAreInvalid,ApplyShim as $applyShimDefault,VAR_ASSIGN,MIXIN_MATCH,VAR_CONSUMED,ANIMATION_MATCH,MEDIA_MATCH,IS_VAR,BRACKETED,HOST_PREFIX,HOST_SUFFIX,updateNativeProperties,getComputedStyleValue,detectMixin,StyleNode,parse,stringify,removeCustomPropAssignment,types,CustomStyleProvider,CustomStyleInterface as $customStyleInterfaceDefault,CustomStyleInterfaceInterface,documentWait as $documentWaitDefault,nativeShadow,nativeCssVariables,toCssText,rulesForStyle,isKeyframesSelector,forEachRule,applyCss,createScopeStyle,applyStylePlaceHolder,applyStyle,isTargetedBuild,getCssBuildType,processVariableAndFallback,setElementClassRaw,getIsExtends,gatherStyleText,templateMap as $templateMapDefault,scopingAttribute,processUnscopedStyle,isUnscopedStyle};