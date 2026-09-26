import {
  app,
  html,
  ref,
  useFuture
} from "./pico.js"

const delay = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms))

const results = []

function record(name, condition, details = "") {
  const result = condition ? "PASS" : "FAIL"

  results.push(
    `${result}: ${name}${details ? ` — ${details}` : ""}`
  )

  console.log(
    `${result}: ${name}`,
    details
  )

  const el = document.querySelector("#results")

  if (el) {
    el.textContent = results.join("\n")
  }
}

/*
 * ---------------------------------------------------------
 * TEST 1
 * Multiple async components resolving out of order.
 *
 * Both refs are created AFTER an await.
 * ---------------------------------------------------------
 */

async function SlowSibling() {
  await delay(100)

  const r = new ref("slow-sibling")

  let derefCount = 0

  r.deref((el) => {
    derefCount++

    record(
      "slow sibling ref resolves",
      el !== null &&
      el.getAttribute("data-pico-ref") === "slow-sibling",
      `element=${el?.outerHTML}`
    )

    setTimeout(() => {
      record(
        "slow sibling ref resolves exactly once",
        derefCount === 1,
        `count=${derefCount}`
      )
    }, 0)
  })

  await delay(150)

  return html`
    <div ${r}>
      SLOW SIBLING
    </div>
  `
}

async function FastSibling() {
  await delay(30)

  const r = new ref("fast-sibling")

  let derefCount = 0

  r.deref((el) => {
    derefCount++

    record(
      "fast sibling ref resolves",
      el !== null &&
      el.getAttribute("data-pico-ref") === "fast-sibling",
      `element=${el?.outerHTML}`
    )

    setTimeout(() => {
      record(
        "fast sibling ref resolves exactly once",
        derefCount === 1,
        `count=${derefCount}`
      )
    }, 0)
  })

  return html`
    <div ${r}>
      FAST SIBLING
    </div>
  `
}

/*
 * ---------------------------------------------------------
 * TEST 2
 * Nested async component.
 *
 * Child starts BEFORE Parent's HTML is inserted.
 * Child's ref is created AFTER an await.
 * Child also resolves AFTER Parent.
 * ---------------------------------------------------------
 */

async function NestedChild() {
  await delay(100)

  const r = new ref("nested-child")

  r.deref((el) => {
    record(
      "nested child ref resolves",
      el !== null &&
      el.getAttribute("data-pico-ref") === "nested-child",
      `element=${el?.outerHTML}`
    )

    record(
      "nested child is actually mounted",
      document.querySelector(
        '[data-pico-ref="nested-child"]'
      ) === el
    )
  })

  await delay(100)

  return html`
    <div ${r}>NESTED CHILD</div>
  `
}

async function NestedParent() {
  await delay(40)

  const r = new ref("nested-parent")

  r.deref((el) => {
    record(
      "nested parent ref resolves",
      el !== null &&
      el.getAttribute("data-pico-ref") === "nested-parent",
      `element=${el?.outerHTML}`
    )
  })

  /*
   * Child starts now, even though Parent's HTML
   * has not been inserted yet.
   */
  const child = useFuture(NestedChild)

  await delay(100)

  return html`
    <section ${r}>
      NESTED PARENT
      ${child}
    </section>
  `
}

/*
 * ---------------------------------------------------------
 * TEST 3
 * Two nested children resolving independently.
 * ---------------------------------------------------------
 */

async function ChildA() {
  await delay(80)

  const r = new ref("child-a")

  r.deref((el) => {
    record(
      "child A resolves",
      el !== null &&
      el.getAttribute("data-pico-ref") === "child-a",
      `element=${el?.outerHTML}`
    )
  })

  await delay(80)

  return html`
    <div ${r}>CHILD A</div>
  `
}

async function ChildB() {
  await delay(20)

  const r = new ref("child-b")

  r.deref((el) => {
    record(
      "child B resolves",
      el !== null &&
      el.getAttribute("data-pico-ref") === "child-b",
      `element=${el?.outerHTML}`
    )
  })

  await delay(120)

  return html`
    <div ${r}>CHILD B</div>
  `
}

async function MultiChildParent() {
  const parentRef = new ref("multi-parent")

  parentRef.deref((el) => {
    record(
      "multi parent resolves",
      el !== null &&
      el.getAttribute("data-pico-ref") === "multi-parent",
      `element=${el?.outerHTML}`
    )
  })

  /*
   * Both children start immediately.
   */
  const a = useFuture(ChildA)
  const b = useFuture(ChildB)

  await delay(60)

  return html`
    <section ${parentRef}>
      MULTI PARENT
      ${useFuture(ChildA)}
      ${useFuture(ChildB)}
    </section>
  `
}

/*
 * ---------------------------------------------------------
 * APP
 * ---------------------------------------------------------
 */

function App() {
  return html`
    <h2>Async ref tests</h2>

    <pre id="results">Running...</pre>

    ${useFuture(SlowSibling)}
    ${useFuture(FastSibling)}
    ${useFuture(NestedParent)}
    ${useFuture(MultiChildParent)}
  `
}

app.init(App)
