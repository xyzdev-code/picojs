import {
  app,
  afterMount,
  html,
  onMount,
  ref,
  state,
  useFuture,
  useRef
} from "./pico.js"

const delay = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms))

const results = []

function test(name, condition, details = "") {
  const passed = !!condition

  const message =
    `${passed ? "PASS" : "FAIL"}: ${name}` +
    (details ? ` — ${details}` : "")

  results.push(message)
  console.log(message)

  const output = document.querySelector("#results")

  if (output) {
    output.textContent = results.join("\n")
  }
}

function getRefElement(key) {
  return document.querySelector(
    `[data-pico-ref="${key}"]`
  )
}

/*
 * =========================================================
 * TEST 1
 *
 * A future whose ref is created AFTER an await.
 * =========================================================
 */

async function DelayedRef() {
  await delay(40)

  const r = ref.unique()

  let derefCount = 0

  r.deref((el) => {
    derefCount++

    test(
      "ref created after await resolves",
      el !== null
    )

    test(
      "resolved ref has correct element",
      el === getRefElement(r.key),
      `key=${r.key}`
    )
  })

  await delay(50)

  return html`
    <div ${useRef(r)}>
      delayed ref
    </div>
  `
}

/*
 * =========================================================
 * TEST 2
 *
 * Two independent futures resolving in different orders.
 * =========================================================
 */

async function FastFuture() {
  await delay(20)

  const r = ref.unique()

  r.deref((el) => {
    test(
      "fast future ref resolves",
      el !== null &&
      el === getRefElement(r.key)
    )
  })

  return html`
    <div ${useRef(r)}>
      fast
    </div>
  `
}

async function SlowFuture() {
  await delay(80)

  const r = ref.unique()

  r.deref((el) => {
    test(
      "slow future ref resolves",
      el !== null &&
      el === getRefElement(r.key)
    )
  })

  return html`
    <div ${useRef(r)}>
      slow
    </div>
  `
}

/*
 * =========================================================
 * TEST 3
 *
 * Parent future creates a child future.
 *
 * The child starts before the parent HTML exists.
 * =========================================================
 */

async function NestedChild() {
  await delay(30)

  const r = ref.unique()

  r.deref((el) => {
    test(
      "nested child ref resolves",
      el !== null &&
      el === getRefElement(r.key)
    )

    test(
      "nested child is in the DOM",
      document.contains(el)
    )
  })

  await delay(50)

  return html`
    <div ${useRef(r)}>
      nested child
    </div>
  `
}

async function NestedParent() {
  await delay(20)

  const parentRef = ref.unique()

  parentRef.deref((el) => {
    test(
      "nested parent ref resolves",
      el !== null &&
      el === getRefElement(parentRef.key)
    )
  })

  /*
   * Child starts before Parent's HTML is inserted.
   */
  const child = useFuture(NestedChild)

  await delay(70)

  return html`
    <section ${useRef(parentRef)}>
      <div>nested parent</div>
      ${child}
    </section>
  `
}

/*
 * =========================================================
 * TEST 4
 *
 * Multiple levels of nesting.
 *
 * Grandparent
 *   -> Parent
 *      -> Child
 * =========================================================
 */

async function Grandchild() {
  await delay(20)

  const r = ref.unique()

  r.deref((el) => {
    test(
      "grandchild ref resolves",
      el !== null &&
      document.contains(el)
    )
  })

  return html`
    <span ${useRef(r)}>
      grandchild
    </span>
  `
}

async function Middle() {
  await delay(30)

  const r = ref.unique()
  const child = useFuture(Grandchild)

  r.deref((el) => {
    test(
      "middle ref resolves",
      el !== null &&
      document.contains(el)
    )
  })

  await delay(40)

  return html`
    <div ${useRef(r)}>
      middle
      ${child}
    </div>
  `
}

async function Grandparent() {
  const r = ref.unique()
  const child = useFuture(Middle)

  r.deref((el) => {
    test(
      "grandparent ref resolves",
      el !== null &&
      document.contains(el)
    )
  })

  await delay(100)

  return html`
    <section ${useRef(r)}>
      grandparent
      ${child}
    </section>
  `
}

/*
 * =========================================================
 * TEST 5
 *
 * onMount should run exactly once.
 *
 * The callback itself triggers a reactive update.
 * This catches the re-entrant callback bug you encountered.
 * =========================================================
 */

async function MountTest() {
  const value = new state("initial")

  let mountCount = 0

  onMount(() => {
    mountCount++

    value.value = "mounted"
  })

  afterMount(() => {
    test(
      "afterMount runs once",
      mountCount === 1,
      `onMount count=${mountCount}`
    )
  })

  return html`
    <div>
      <span class="mount-value">
        ${value}
      </span>
    </div>
  `
}

/*
 * =========================================================
 * TEST 6
 *
 * useRef should point to the actual DOM node and remain
 * usable after a reactive update.
 * =========================================================
 */

function ReactiveRefTest() {
  const r = ref.unique()
  const value = new state("A")

  r.deref((el) => {
    test(
      "useRef initially points to correct element",
      el === getRefElement(r.key)
    )

    test(
      "initial text is correct",
      el.textContent.trim() === "A"
    )
  })

  onMount(() => {
    value.value = "B"
  })

  afterMount(() => {
    const el = getRefElement(r.key)

    test(
      "useRef still points to element after state update",
      el !== null
    )

    test(
      "reactive update reached referenced element",
      el?.textContent.trim() === "B"
    )
  })

  return html`
    <div ${useRef(r)}>
      ${value}
    </div>
  `
}

/*
 * =========================================================
 * APP
 * =========================================================
 */

function App() {
  return html`
    <h2>PicoJS async/ref integration tests</h2>

    <pre id="results">Running...</pre>

    ${useFuture(DelayedRef)}

    ${useFuture(FastFuture)}
    ${useFuture(SlowFuture)}

    ${useFuture(NestedParent)}

    ${useFuture(Grandparent)}

    ${useFuture(MountTest)}

    ${ReactiveRefTest()}
  `
}

app.init(App)

/*
 * Final summary after enough time for every async test.
 */
setTimeout(() => {
  const failed = results.filter(
    result => result.startsWith("FAIL")
  )

  console.log("\n========== SUMMARY ==========")
  console.log(`Tests: ${results.length}`)
  console.log(`Passed: ${results.length - failed.length}`)
  console.log(`Failed: ${failed.length}`)

  if (failed.length > 0) {
    console.log("\nFailures:")
    console.log(failed.join("\n"))
  }
}, 1000)
