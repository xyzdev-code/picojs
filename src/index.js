import {app, useEach, state, html, bindClick, listId, effect} from "./pico.js"
function App(){
  const arr = state.from([1,2,3,4])
  effect(()=>{
    console.log(`This is changed ${arr[arr.length-1]}`)
  })
  return html`
  <ol ${listId(arr)}>
    ${useEach(arr, (x)=>{
      return html`<button ${bindClick(()=>console.log(x))}>${x}</button>`
    }, "li")}
    </ol>
  <button ${bindClick(()=>arr.push(Date.now()))}>push</button>
    <button ${bindClick(()=>arr.pop())}>pop</button>
    <button ${bindClick(()=>{
      arr.value = [Date.now()]
    })}>Click</button>
  `
}
app.init(App)
