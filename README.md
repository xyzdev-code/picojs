# Picojs
A minimal Javascript framework written in plain js with jsdoc for type safety. Did this in my free time, expect bugs. 
## Features
- Small bundle size (~2.6kb minified and gzipped)
- Probably fast (at least on my computer, not a serious metric)
- No build step, just include the pico.js file in the src/ directory
- I test this against the js framework benchmark every release on my computer, so should be stable and performant enough for a hobby project
- I did my best to try to build it against ES2020 and browsers from 2020 onwards should be able to support it. If not, just run it through babel or something.
## Getting started
Just put the pico.js file in your directory. Or you could download it from npm (or whatever the new shiny tool is):
```bash
npm install @xyzdev-code/picojs
```
If you are not using a build tool, a minified and gzipped version can be found in the dist/src folder.
## Usage
Should be quite simple, most of the primitives provided should be natural to the average web developer.
```javascript
function component(){
  const number = new state(0)
  return html`<button ${bindClick(()=>{number.value++})}>${number}</button>`
}
app.init(component)
```
## Note
Certain primitives like state are **not** signals technically, for example, I did not do any dirty/clean state tracking because I thought that is quite overpowered for a simple framework, the current code for state is messy enough. In addition, there really may be bugs, please report them if you have found any. When interpolating state in the html, please do not access the .value because that would break the reactivity of the html.

At least before 1.0, expect breaking changes as I may not follow semver. Please be warned.
## Contributing
Pull requests and issues are welcome, just clone this repo and do the standard stuff. Please indicate if AI is used in any capacity. I am fine with AI assisted contributions as long as you are being honest.


