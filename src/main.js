import {app, html, state, bind_click, bind_value, use_future} from "./pico.js"
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
    <button id="button" ${bind_click(increment)}>Click</button>
    <p>${number} hello ${use_future(profile,()=>"loading",(err)=>`${err}`)}</p>
    <input ${bind_value(number)}></input>
  `
}
await app.from_async(App) 
