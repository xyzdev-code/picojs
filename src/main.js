import {app, bindClick, bindValue, effect, html, state, useEach} from "./pico.js"
function App(){
  const number = new state("0")
  const fruits = state.from(["strawberry", "banana"])
  function pushFruit(){
    alert("pushed")
    fruits.push("apple", "watermelon")
  }
  effect(()=>{
    alert(`You clicked ${fruits[1]}`)
  })
  return html`
  <p>The count is ${number}</p>
    <textarea name="" id="" ${bindValue(number)}>Type here</textarea>  
    <ol>
    ${useEach(fruits)}
    </ol>
    <button ${bindClick(pushFruit)}>Click</button>
  `
}
new app(App)
// const a = state.from([1,2,3])
// const b = state.from([1,2])
// effect(()=>{
//   a.push(b[1])
//   console.log(a)
//   a.push(a.length)
// })
// b[1] = 3
// console.log(a)
