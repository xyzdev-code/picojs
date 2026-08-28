import {app, bindClick, bindValue, effect, html, onMount, state, useEach, useFuture} from "./pico.js"
/**
 * @param {number} ms 
 */
const delay = ms => new Promise(res => setTimeout(res, ms));
async function WidgetA() {
  await delay(2000)
  onMount(() => {
    document.querySelector("#btn-a").addEventListener("click", () => console.log("A clicked"))
  })
  return html`<button id="btn-a">Button A</button>`
}

async function WidgetB() {
  await delay(2000) // Exact same delay
  onMount(() => {
    document.querySelector("#btn-b").addEventListener("click", () => console.log("B clicked"))
  })
  return html`<button id="btn-b">Button B</button>`
}

function App() {
  return html`
    ${useFuture(WidgetA)}
    ${useFuture(WidgetB)}
  `
}
app.init(App)

