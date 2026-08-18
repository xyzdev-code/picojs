import { app, html, state, bindClick, useEach, effect } from "./pico.js"
// async function App(){
//   // const values = state.from([0,1,2,3])
//   // values.push(4)
//   // const names = state.from(["sean"])
//   // effect(()=>{
//   //   names.push(`${values[values.length-1]}`)
//   // })
//   const c = state.from([1,2])
//   const b = state.from([1,5,3])
//   effect(()=>{
//     c.push(b[2])
//     console.log(c)
//   })
//   function onClick(){
//     b[2] = Date.now()
//   } 
//   console.log(c)
//   return html`
//   <ul>${useEach(c)}</ul>
//   <button ${bindClick(onClick)}>Click</button>
//     `
// }
// await app.fromAsync(App) 
// const a = state.from([1, 2, 3])
// const b = state.from([2, 3, 4])
// const c = state.from([0])
// effect(() => {
//   a.push(b[2])
//   console.log(a)
//   a.push(c[0])
// })
// b[2] = 3
// c[0] = 1
const a = new state(1)
const b = new state(10)
const c = new state(11)
effect(()=>{
  a.value += b.value
  console.log(a.value)
  a.value += c.value
})
b.value = 10
c.value = 11
// effect(()=>{
//   a.push(a.length)
// })
console.log(a)
