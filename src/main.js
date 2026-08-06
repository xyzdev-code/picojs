import {app, html, state, click, computed} from "./pico.js"
function App(){
  const number = new state(0)
  function increment(){
    number.value+=1
  }
  const square = computed(()=>number.value**2)
  return html`
    <button id="button" ${click(increment)}>Click</button>
    <p>${number}</p>
    <p>${square}</p>
  `
}
const page = new app(App)
