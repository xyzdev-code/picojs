import {app, html, state, bindClick, bindValue, useFuture} from "./pico.js"
async function profile(){
  const res = await fetch("https://code.jquery.com/jquery-2.2.4.min.js")
  const txt = await res.text()
  return html`${txt}`
}
async function App(){
  const number = new state(1)
  function increment(){
    number.value += 1
  }
  return html`
    <button id="button" ${bindClick(increment)}>Click</button>
    <p>${number} hello ${useFuture(profile,()=>"loading",(err)=>`${err}`)}</p>
    <input ${bindValue(number)}></input>
  `
}

await app.fromAsync(App) 
Intl.DurationFormat()
