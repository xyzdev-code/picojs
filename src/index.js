import {app,state,ref, html, useEach, useFuture, bindClick} from "./pico.js"
function checkList(arr, ref) {
  const parent = ref._element

  console.assert(
    parent.children.length === arr.length,
    `DOM length ${parent.children.length} != array length ${arr.length}`
  )

  for (let i = 0; i < arr.length; i++) {
    console.assert(
      parent.children[i].textContent === String(arr[i]),
      `index ${i}: DOM=${parent.children[i].textContent}, array=${arr[i]}`
    )
  }
}
const arr = state.from(["A", "B", "C"])
const list = new ref("list")
const list2 = new ref('list2')
app.init(() => html`
  <div ${list}>
    ${useFuture(async ()=>useEach(arr, list, x => `<div>${x}</div>`))}
  </div>
  <div ${list2}>
    ${useEach(arr, list2, (x)=>`${x.charCodeAt(0)}`)}
  </div>
  <button ${bindClick(()=>{arr.push("z")})}>Click</button>
`)

// checkList(arr, list)
//
// arr[1] = "X"
// checkList(arr, list)
//
// arr.push("D")
// checkList(arr, list)
//
// arr.splice(1, 1, "Y")
// checkList(arr, list)
//
// arr.splice(2)
// checkList(arr, list)
// console.log(arr)
