import {app, bindClick, html, state, useEach} from "./pico.js"
function App(){
  const fruits = state.from(["apples", "bananas", "oranges"])
  const flavours = ["chocolate", "strawberry"]
  function addfruit(){
    fruits.pop()
    console.log(fruits)
  }
  return html`
  <ol>
    ${useEach(fruits, (x)=>{
      return x + "2"
    })}
    </ol>
    <button ${bindClick(addfruit)}>Click</button>
  `
}
new app(App)
