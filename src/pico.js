/**
 * @template T
 * @typedef {{
   * __unsafe_raw_value: Array<T>
   * [key: `getItemRenderString${number}`]: string
   * fn: (x: T) => string
   * id: number
   * } & Array<T>} ArrayProxy
 */

const PICO_ARRAY_MUTATORS = new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin'])
/**
 * Defines a reactive object that is tracked by effect, computed etc and automatically updated by pico in the html.
 * @example
 * // returns a reactive number which can be accessed by calling .value
 * const a = new state(10) 
 * a.value // 10
 * @example
 * // .from creates a reactive array instead
 * const arr = new state.from([1,2,3])
 * arr[0] // 1
 * @template T
 */
export class state {
  /** 
    * @private
    * @type {number}
    */
  static id = 0
  /**
    * @type{(()=>unknown) | undefined}
    */
  static currentFn = undefined

  /** 
    * @type {Set<()=>unknown>}
    */
  static runningEffects = new Set()
  /** 
    * @type {(Array<()=>unknown>) | undefined}
    */
  static currentCleanups = undefined
  /**
   * Returns a reactivee array.
   * @template U
   * @param {Array<U>} arr 
   * @returns {ArrayProxy<U>}
   */
  static from(arr) {
    /**
     * @type {Set<()=>unknown>}
     */
    const dependencies = new Set()
    const id = state.id
    let isMutating = false
    /**
     * @type {((x: U)=>string) | undefined}
     */
    let fn = undefined
    state.id++
    /**
     * @type {ProxyHandler<Array<U>>}
     */
    const handler = {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver)
        if (typeof value === "function" && typeof prop === "string") {
          if (PICO_ARRAY_MUTATORS.has(prop)) {
            /** 
              * @param {Parameters<typeof value>} args
              */
            return function(...args) {
              isMutating = true
              const result = value.apply(receiver, args)
              isMutating = false
              for (const dependency of [...dependencies]) {
                if (state.runningEffects.has(dependency)) continue
                try { dependency() } catch (err) { }
              }
              return result
            }
          }
          return value.bind(receiver)
        } else if (typeof prop === "string" && prop.startsWith("getItemRenderString")) {
          const index = parseInt(prop.substring(19))
          return `<li id="pico-array-element" class="pico-state-id${id}-idx${index}">`
        } else if (prop === '__unsafe_raw_value') {
          return target
        } else if (prop === "id") {
          return id
        }
        if (state.currentFn !== undefined) {
          const fn = state.currentFn
          dependencies.add(state.currentFn)
          if (state.currentCleanups) {
            state.currentCleanups.push(() => dependencies.delete(fn))
          }
        }
        return value
      },
      set(target, prop, value, receiver) {
        if (prop === "__unsafe_raw_value") {
          target.splice(0, target.length, ...value)
          return true
        }
        if (prop === "fn") {
          fn = value
          return true
        }
        if (typeof prop === "string" && parseInt(prop).toString() === prop) {
          const index = parseInt(prop)
          const content = fn ? fn(value) : value
          onMount(() => {
            const existing = document.querySelector(`.pico-state-id${id}-idx${index}`)
            if (existing) {
              existing.innerHTML = content
            } else {
              const prevElement = document.querySelector(`.pico-state-id${id}-idx${index - 1}`)
              const newHtml = `<li id="pico-array-element" class="pico-state-id${id}-idx${index}">${content}</li>`
              if (prevElement) {
                prevElement.insertAdjacentHTML("afterend", newHtml)
              } else {
                document.querySelector(`.pico-state-id${id}-list`)?.insertAdjacentHTML("afterbegin", newHtml)
              }
            }
          })
        }

        const mutated = target[/**@type {any}*/(prop)] !== value
        const result = Reflect.set(target, prop, value, receiver)
        if (mutated && !isMutating) {
          for (const dependency of [...dependencies]) {
            if (state.runningEffects.has(dependency)) continue
            try { dependency() } catch (err) { }
          }
        }
        return result
      },
      deleteProperty(target, prop) {
        if (typeof prop === "string" && parseInt(prop).toString() === prop) {
          onMount(() => {
            const el = document.querySelector(`.pico-state-id${id}-idx${prop}`)
            if (el) el.remove()
          })
        }
        const result = Reflect.deleteProperty(target, prop)
        for (const dependency of [...dependencies]) {
          if (state.runningEffects.has(dependency)) continue
          try {
            dependency()
          } catch (err) { }
        }
        return result
      },
      has(target, prop) {
        if (prop === "getRenderString" || prop === "__unsafe_raw_value" || prop === "fn" || prop === "id") {
          return true
        }
        return prop in target
      }
    }

    return /**@type {ArrayProxy<U>}*/ (new Proxy(arr, handler))
  }
  /**
   * @param {T} value 
   */
  constructor(value) {
    /**
     * @private
     * @type {T}
     */
    this._value = value
    /**
     * @private
     * @type{Set<()=>unknown>}
     */
    this.dependencies = new Set()
    /**
     * @private
     * @type {number}
     */
    this.id = state.id
    state.id++
  }
  /** 
    * Returns the value without tracking
    * WARNING: All calls to this are untracked by the internal state machinery
    * @returns {T}
    */
  get __unsafe_raw_value() {
    return this._value
  }
  /** 
    * Allows setting of value without tracking
    * WARNING: All calls to this are untracked by the internal state machinery
    * @param {T} newValue 
    */
  set __unsafe_raw_value(newValue) {
    this._value = newValue
  }
  /**
    * @returns{T}
    */
  get value() {
    if (state.currentFn !== undefined) {
      const fn = state.currentFn
      this.dependencies.add(fn)
      if (state.currentCleanups) {
        state.currentCleanups.push(() => this.dependencies.delete(fn))
      }
    }
    return this._value
  }
  /**
    * @param {T} newValue 
    */
  set value(newValue) {
    if (newValue !== this._value) {
      this._value = newValue
      onMount(() => {
        for (const el of document.querySelectorAll(`.pico-state-id${this.id}`)) {
          el.textContent = /**@type {string | null}*/ (this._value)
        }
      })
      for (const dependency of [...this.dependencies]) {
        if (state.runningEffects.has(dependency)) continue
        try {
          dependency()
        } catch (err) { }
      }
    }
  }
  /**
   * @package
   * @returns {string}
   */
  getRenderString() {
    return `<span id="pico-element" class="pico-state-id${this.id}">${this._value}</span>`
  }
}
export class RenderErrror extends Error { }
/**
 * Pass in a function which will be reran when its dependencies mutates
 * @example
 * const a = new state(10)
 * effect(()=>{
 *   console.log(a.value)
 * })
 * // "10"
 * a.value = 11
 * // "11"
 * @param {()=>((()=>unknown) | void)} fn 
 */
export function effect(fn) {
  /**
   * @type {(()=>unknown) | undefined}
   */
  let cleanupFn
  let disposed = false
  /**
   * @type {Array<()=>unknown>}
   */
  let unsubscribes = []
  function cleanup() {
    if (typeof cleanupFn === "function") {
      cleanupFn()
      cleanupFn = undefined
    }
    for (const unsubscribe of unsubscribes) {
      unsubscribe()
    }
    unsubscribes = []
  }
  function internalEffect() {
    if (disposed) { return }
    cleanup()
    state.runningEffects.add(internalEffect)
    state.currentFn = internalEffect
    const prevCleanups = state.currentCleanups
    state.currentCleanups = unsubscribes
    const res = fn()
    if (typeof res === "function") {
      cleanupFn = res
    }
    state.currentCleanups = prevCleanups
    state.currentFn = undefined
    state.runningEffects.delete(internalEffect)
  }
  internalEffect()
  return () => {
    disposed = true
    cleanup()
  }
}
/**
  * @template T
  * @param {()=>T} fn 
  * @returns {[state<T>, ()=>unknown]}
  */
export function computed(fn) {
  const internal_value = /** @type {state<T>} */ (new state(undefined))
  const dispose = effect(() => {
    internal_value.value = fn()
    return undefined
  })
  return [internal_value, dispose]
}
/**
 * @param {TemplateStringsArray} strings 
 * @param {unknown[]} args 
 * @returns {string}
 */
export function html(strings, ...args) {
  let str = ""
  for (let i = 0; i < args.length; i++) {
    str += strings[i]
    if (args[i] instanceof state) {
      str += /** @type {state<unknown>} */ (args[i]).getRenderString()
    } else {
      str += args[i]
    }
  }
  return str + strings[args.length]
}
export class app {
  /** 
    * @type {Array<()=>unknown>}
    */
  static renderCallbacks = []
  static eventListenerId = 0
  static isMounted = false
  static generatedComponentId = 0
  static listId = 0
  /**
   * @param {()=>Promise<string>} asyncAppComponent 
   * @param {string} root 
   * @returns {Promise<app>}
   */
  static async initAsync(asyncAppComponent, root = "body") {
    const res = await asyncAppComponent()
    return new app(() => res, root)
  }
  /**
   * @param {()=>string} appComponent 
   * @param {string} root 
   * @returns {app}
   */
  static init(appComponent, root = "body") {
    return new app(appComponent, root)
  }
  /**
   * @private
   * @param {()=>string} app_component 
   * @param {string} root 
   */
  constructor(app_component, root) {
    const el = document.querySelector(root)
    if (el === null) {
      throw new RenderErrror(`Failed to get an html element with property ${root}`)
    }
    el.innerHTML = app_component()
    app.isMounted = true
    for (const cb of app.renderCallbacks) {
      cb()
    }
    app.renderCallbacks = []
  }
}
/**
 * @param {()=>unknown} cb 
 */
export function onMount(cb) {
  app.renderCallbacks.push(cb)
}
/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bindClick(cb) {
  const local_id = app.eventListenerId
  app.eventListenerId += 1
  onMount(() => {
    document.querySelector(`[data-pico-listener="${local_id}"]`)?.addEventListener("click", cb)
  })
  return `data-pico-listener="${local_id}"`
}
/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bindMouseover(cb) {
  const local_id = app.eventListenerId
  app.eventListenerId += 1
  onMount(() => {
    document.querySelector(`[data-pico-listener="${local_id}"]`)?.addEventListener("mouseover", cb)
  })
  return `data-pico-listener="${local_id}"`
}

/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bindMouseenter(cb) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  onMount(() => {
    document.querySelector(`[data-pico-listener="${localId}"]`)?.addEventListener("mouseenter", cb)
  })

  return `data-pico-listener="${localId}"`
}

/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bindMousedown(cb) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  onMount(() => {
    document.querySelector(`[data-pico-listener="${localId}"]`)?.addEventListener("mousedown", cb)
  })
  return `data-pico-listener="${localId}"`
}

/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bindMouseup(cb) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  onMount(() => {
    document.querySelector(`[data-pico-listener="${localId}"]`)?.addEventListener("mouseup", cb)
  })
  return `data-pico-listener="${localId}"`
}

/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bindDblclick(cb) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  onMount(() => {
    document.querySelector(`[data-pico-listener="${localId}"]`)?.addEventListener("dblclick", cb)
  })
  return `data-pico-listener="${localId}"`
}
/**
 * @param {(is_checked: boolean)=>unknown} cb 
 * @returns {string}
 */
export function bindChecked(cb) {
  const local_id = app.eventListenerId
  app.eventListenerId += 1
  onMount(() => {
    document.querySelector(`[data-pico-listener="${local_id}"]`)?.addEventListener("change", (event) => {
      if (/**@type {HTMLInputElement}*/(event.target).checked) {
        cb(/**@type {HTMLInputElement}*/(event.target).checked)
      }
    })
  })
  return `data-pico-listener="${local_id}"`
}
/**
 * @param {state<string | number>} boundVar 
 * @returns {string}
 */
export function bindValue(boundVar) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  onMount(() => {
    document.querySelector(`[data-pico-listener="${localId}"]`)?.addEventListener("input", (event) => {
      if (typeof boundVar.value === "string") {
        boundVar.value = /**@type {HTMLInputElement}*/ (event.target).value
      } else {
        boundVar.value = parseFloat(/**@type {HTMLInputElement}*/(event.target).value)
      }
    })
  })
  return `data-pico-listener="${localId}"`
}

/**
 * Optionally takes in some function that may throw or return an error and if an error does occur, it returns a fallback function
 * WARNING: If the fallback function errors it will get called again with err being the error the first call of the fallback throws
 * @template T, U
 * @param {()=>T} fn 
 * @param {((err: unknown)=>U) | undefined} fallbackFn
 * @returns {T|U}
 */
export function useTry(fn, fallbackFn = () => /**@type {U}*/("")) {
  try {
    const res = fn()
    if (!(res instanceof Error)) {
      return res
    } else {
      return fallbackFn(res)
    }
  } catch (err) {
    return fallbackFn(err)
  }
}
/**
 * Takes some async function and optionally displays a placeholder function while it is still running or error function if it fails. 
 * @param {()=>Promise<string>} fn 
 * @param {(()=>unknown) | undefined} placeholderFn
 * @param {((err: unknown)=>string) | undefined} fallbackFn 
 * @returns {string}
 */
export function useFuture(fn, fallbackFn = () => "", placeholderFn = () => "") {
  const id = app.generatedComponentId
  app.generatedComponentId++
  fn()
    .then((value) => {
      for (const el of document.querySelectorAll(`.pico-generated-id${id}`)) {
        el.innerHTML = value
      }
      for (const cb of app.renderCallbacks) {
        cb()
      }
      app.renderCallbacks = []
    })
    .catch((err) => {
      for (const el of document.querySelectorAll(`.pico-generated-id${id}`)) {
        el.innerHTML = fallbackFn(err)
      }
      for (const cb of app.renderCallbacks) {
        cb()
      }
      app.renderCallbacks = []
    })
  return `<div id="pico-element" class="pico-generated-id${id}">${placeholderFn !== undefined ? placeholderFn() : ""}</div>`
}
/**
 * @template T
 * @param {Iterable<T>} arr 
 * @returns {arr is ArrayProxy<T>}
 */
function isArrayProxy(arr) {
  return "getRenderString" in arr
}
/**
 * @template T
 * @param {Iterable<T>} arr 
 * @param {((item: T)=>string) | undefined} fn
 * @returns {string}
 */
export function useEach(arr, fn = (x) => /**@type {string}*/(x)) {
  let finalStr = ""
  if (isArrayProxy(arr)) {
    if (arr.length === 0) {
      return `<li class="pico-state-id${arr["id"]}-idx-1 id="pico-array-element" style="display: none"></li>`
    }
    arr["fn"] = fn
    for (let i = 0; i < arr.length; i++) {
      const res = fn(/**@type {T}*/(arr[i]))
      finalStr += arr[`getItemRenderString${i}`] + res + "</li>"
    }
  } else {
    for (const item of arr) {
      const res = fn(item)
      finalStr += `<li>${res}</li>`
    }
  }
  return finalStr
}
