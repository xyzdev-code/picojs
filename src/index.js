import {app, useEach, state, html, bindClick} from "./pico.js"
function App(){
  const arr = state.from([1,2,3,4])
  return html`
  <ol data-pico-list=${arr.id}>
    ${useEach(arr, (x)=>{
      return x.toString()
    }, "li")}
    </ol>
  <button ${bindClick(()=>arr.push(1))}>push</button>
    <button ${bindClick(()=>arr.pop())}>pop</button>
  `
}
app.init(App)
