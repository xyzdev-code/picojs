import {app, useEach, state, html, bindClick, listId, effect, useFuture} from "./pico.js"
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function lazy(){
  const a = new state(9)
  await sleep(2000)
  return html`<button ${bindClick(()=>{a.value+=1})}>${a}</button>`
}
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
  ${useFuture(lazy)}
  `
}
app.init(App)
