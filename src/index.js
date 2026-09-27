import {
  app,
  html,
  ref,
  useFuture,
  useIf,
  state,
  bindClick,
  computed,
  bindValue,
  effect,
  useEach,
  useRef
} from "./pico.js"

function App() {
  const input = new state("")
  const validated = computed(() => input.value === "123456")
  const seconddValidate = computed(() => input.value.includes("12345"))
  const objs = state.from([0])
  const r = ref.unique()
  effect(() => {
    console.log(validated.value, seconddValidate.value)
  })
  return html`
  <input type="Type here" ${bindValue(input)}>
    <button ${bindClick(()=>{objs.push(Date.now())})}>Click</button>
  <div ${useRef(r)}>${useEach(objs, r, (i)=>{return html`Time: ${i} is ${useIf(()=>i%2===0, ()=>"even").else(()=>"odd")}`})}
  </div>
  ${useIf(validated, () => "yes")
      .elif(seconddValidate, ()=>"ok")
      .elif(()=>input.value==="1", ()=>"might be ok")
      .else(() => "no")
    } 
  `
}

app.init(App)
