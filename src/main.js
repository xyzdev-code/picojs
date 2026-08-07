import {app, html, state, bind_click, bind_value, use_future} from "./pico.js"
/**
 * @param {number} ms 
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function profile(){
  await delay(5000)
  console.log("done looping")
  return html`done executing`
}
async function App(){
  const number = new state(1)
  function increment(){
    number.value += 1
  }
  return html`
    <button id="button" ${bind_click(increment)}>Click</button>
    <p>${number} hello ${use_future(profile,()=>"loading",()=>"an error occured")}</p>
    <input ${bind_value(number)}></input>
  `
}
await app.from_async(App)
