# Picojs

A minimal javascript framework written in plain js with jsdoc for type safety. Did this in my free time, expect bugs. 

## Features
- Small bundle size
- Probably fast (idk, still trying to test this)
- No compile step, just include the pico.js file in the src/ directory

## Getting started
Just put the pico.js file in your directory. Or you could download it from npm (or whatever the new shiny tool is):
```bash
npm install @xyzdev-code/picojs
```
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
## Contributing
Pull requests and issues are welcome, just clone this repo and do the standard stuff. Please indicate if AI is used in any capacity. I am fine with AI assisted contributions as long as you are honest.


