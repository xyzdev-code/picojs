/**
 * @template T
 */
export class state {
  /** 
    * @private
    */
  static id = 0
  /**
    * @type{(()=>unknown) | undefined}
    */
  static currentFn = undefined
  /**
    * @private
    */
  static callingEffects = false
  /**
   * @param {T} value 
   */
  constructor(value) {
    /**
     * @private
     */
    this._value = value
    /**
     * @private
     * @type{Array<()=>unknown>}
     */
    this.dependencies = []
    /**
     * @private
     */
    this.id = state.id
    state.id++
    /**
     * @type {T}
     */
    this.__unsafe_raw_value = this.value
  }
  /**
    * @returns{T}
    */
  get value() {
    if (state.currentFn && state.callingEffects === false) {
      this.dependencies.push(state.currentFn)
    }
    return this._value
  }
  /**
    * @param {T} newValue 
    */
  set value(newValue) {
    this._value = newValue
    state.callingEffects = true
    for (const dependency of this.dependencies) {
      dependency()
    }
    if (app.isMounted) {
      for (const el of document.querySelectorAll(`.pico-state-id${this.id}`)) {
        el.textContent = /**@type {string | null}*/ (this._value)
      }
    }
    state.callingEffects = false
  }
  get_render_string() {
    return `<span id="pico-element" class="pico-state-id${this.id}">${this._value}</span>`
  }
}
/**
 * @param {()=>unknown} fn 
 */
export function effect(fn) {
  function internalEffect() {
    state.currentFn = internalEffect
    fn()
    state.currentFn = undefined
  }
  internalEffect()
}
/**
  * @template T
  * @param {()=>T} fn 
  * @returns {state<T>}
  */
export function computed(fn) {
  const internal_value = /** @type {state<T>} */ (new state(undefined))
  function internal_effect() {
    state.currentFn = internal_effect
    internal_value.value = fn()
    state.currentFn = undefined
  }
  internal_effect()
  return internal_value
}
/**
 * @param {TemplateStringsArray} strings 
 * @param {(string | number | boolean | state<unknown>)[]} args 
 * @returns {string}
 */
export function html(strings, ...args) {
  let str = ""
  for (let i = 0; i < args.length; i++) {
    str += strings[i]
    if (args[i] instanceof state) {
      str += /** @type {state<unknown>} */ (args[i]).get_render_string()
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
  static onMountCallbacks = []
  static eventListenerId = 0
  static isMounted = false
  static generatedComponentId = 0
  /**
   * @param {()=>Promise<string>} async_app_component 
   * @returns {Promise<app>}
   */
  static async fromAsync(async_app_component) {
    const res = await async_app_component()
    return new app(() => res)
  }
  /**
   * @param {()=>string} app_component 
   * @returns {app}
   */
  static from(app_component) {
    return new app(app_component)
  }
  /**
   * @param {()=>string} app_component 
   */
  constructor(app_component) {
    document.body.innerHTML = app_component()
    for (const cb of app.onMountCallbacks) {
      cb()
    }
    app.isMounted = true
  }
}
/**
 * @param {()=>unknown} cb 
 */
export function onMount(cb) {
  if (!app.isMounted) {
    app.onMountCallbacks.push(cb)
  } else {
    cb()
  }
}
/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bindClick(cb) {
  const local_id = app.eventListenerId
  app.eventListenerId += 1
  if (app.isMounted) {
    document.querySelector(`[data-pico-listener${local_id}]`)?.addEventListener("click", cb)
  } else {
    app.onMountCallbacks.push(() => {
      document.querySelector(`[data-pico-listener${local_id}]`)?.addEventListener("click", cb)
    })
  }
  return `data-pico-listener${local_id}`
}
/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bindMouseover(cb) {
  const local_id = app.eventListenerId
  app.eventListenerId += 1
  if (app.isMounted) {
    document.querySelector(`[data-pico-listener${local_id}]`)?.addEventListener("mouseover", cb)
  } else {
    app.onMountCallbacks.push(() => {
      document.querySelector(`[data-pico-listener${local_id}]`)?.addEventListener("mouseover", cb)
    })
  }
  return `data-pico-listener${local_id}`
}

/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bind_mouseenter(cb) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  if (app.isMounted) {
    document.querySelector(`[data-pico-listener${localId}]`)?.addEventListener("mouseenter", cb)
  } else {
    app.onMountCallbacks.push(() => {
      document.querySelector(`[data-pico-listener${localId}]`)?.addEventListener("mouseenter", cb)
    })
  }
  return `data-pico-listener${localId}`
}

/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bindMousedown(cb) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  app.onMountCallbacks.push(() => {
    document.querySelector(`[data-pico-listener${localId}]`)?.addEventListener("mousedown", cb)
  })
  return `data-pico-listener${localId}`
}

/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bindMouseup(cb) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  app.onMountCallbacks.push(() => {
    document.querySelector(`[data-pico-listener${localId}]`)?.addEventListener("mouseup", cb)
  })
  return `data-pico-listener${localId}`
}

/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bindDblclick(cb) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  if (app.isMounted) {
    document.querySelector(`[data-pico-listener${localId}]`)?.addEventListener("dblclick", cb)
  } else {
    app.onMountCallbacks.push(() => {
      document.querySelector(`[data-pico-listener${localId}]`)?.addEventListener("dblclick", cb)
    })
  }
  return `data-pico-listener${localId}`
}
/**
 * @param {(is_checked: boolean)=>unknown} cb 
 * @returns {string}
 */
export function bindChecked(cb) {
  const local_id = app.eventListenerId
  app.eventListenerId += 1
  if (app.isMounted) {
    document.querySelector(`[data-pico-listener${local_id}]`)?.addEventListener("change", (event) => {
      if (/**@type {HTMLInputElement}*/(event.target).checked) {
        cb(/**@type {HTMLInputElement}*/(event.target).checked)
      }
    })
  } else {
    app.onMountCallbacks.push(() => {
      document.querySelector(`[data-pico-listener${local_id}]`)?.addEventListener("change", (event) => {
        if (/**@type {HTMLInputElement}*/(event.target).checked) {
          cb(/**@type {HTMLInputElement}*/(event.target).checked)
        }
      })
    })
  }
  return `data-pico-listener${local_id}`
}
/**
 * @param {state<string | number>} boundVar 
 * @returns {string}
 */
export function bindValue(boundVar) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  if (app.isMounted) {
    document.querySelector(`[data-pico-listener${localId}]`)?.addEventListener("input", (event) => {
      if (typeof boundVar.value === "string") {
        boundVar.value = /**@type {HTMLInputElement}*/ (event.target).value
      } else {
        boundVar.value = parseFloat(/**@type {HTMLInputElement}*/(event.target).value)
      }
    })
  } else {
    app.onMountCallbacks.push(() => {
      document.querySelector(`[data-pico-listener${localId}]`)?.addEventListener("input", (event) => {
        if (typeof boundVar.value === "string") {
          boundVar.value = /**@type {HTMLInputElement}*/ (event.target).value
        } else {
          boundVar.value = parseFloat(/**@type {HTMLInputElement}*/(event.target).value)
        }
      })
    })
  }
  return `data-pico-listener${localId}`
}

/**
 * @param {()=>(unknown | Error)} fn 
 * @param {(err: unknown)=>unknown} fallbackFn
 * @returns {unknown}
 */
export function useTry(fn, fallbackFn) {
  try {
    return /**@type {unknown}*/ (fn())
  } catch (err) {
    return fallbackFn(err)
  }
}
/**
 * @param {()=>Promise<string>} fn 
 * @param {(()=>unknown) | undefined} placeholderFn
 * @param {(err: unknown)=>string} fallbackFn 
 * @returns {string}
 */
export function useFuture(fn, placeholderFn, fallbackFn) {
  const id = app.generatedComponentId
  fn()
    .then((value) => {
      if (app.isMounted) {
        for (const el of document.querySelectorAll(`.pico-generated-id${id}`)) {
          el.innerHTML = value
        }
      } else {
        app.onMountCallbacks.push(() => {
          for (const el of document.querySelectorAll(`.pico-generated-id${id}`)) {
            el.innerHTML = value
          }
        })
      }
    })
    .catch((err) => {
      if (app.isMounted) {
        for (const el of document.querySelectorAll(`.pico-generated-id${id}`)) {
          el.innerHTML = fallbackFn(err)
        }
      } else {
        app.onMountCallbacks.push(() => {
          for (const el of document.querySelectorAll(`.pico-generated-id${id}`)) {
            el.innerHTML = fallbackFn(err)
          }
        })
      }
    })
  return `<div id="pico-element" class="pico-generated-id${id}">${placeholderFn !== undefined ? placeholderFn() : ""}</div>`
}
