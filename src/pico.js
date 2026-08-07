/** 
  * @typedef {string | number | boolean | state<string | number | boolean>} renderable
 */
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
  static current_fn = undefined
  /**
    * @private
    */
  static calling_effects = false
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
    if (state.current_fn && state.calling_effects === false) {
      this.dependencies.push(state.current_fn)
    }
    return this._value
  }
  /**
    * @param {T} new_value 
    */
  set value(new_value) {
    this._value = new_value
    state.calling_effects = true
    for (const dependency of this.dependencies) {
      dependency()
    }
    if (app.is_mounted) {
      for (const el of document.querySelectorAll(`.pico-state-id${this.id}`)) {
        el.textContent = /**@type {string | null}*/ (this._value)
      }
    }
    state.calling_effects = false
  }
  get_render_string() {
    return `<span id="pico-element" class="pico-state-id${this.id}">${this._value}</span>`
  }
}
/**
 * @param {()=>unknown} fn 
 */
export function effect(fn) {
  function internal_effect() {
    state.current_fn = internal_effect
    fn()
    state.current_fn = undefined
  }
  internal_effect()
}
/**
  * @template T
  * @param {()=>T} fn 
  * @returns {state<T>}
  */
export function computed(fn) {
  const internal_value = /** @type {state<T>} */ (new state(undefined))
  function internal_effect() {
    state.current_fn = internal_effect
    internal_value.value = fn()
    state.current_fn = undefined
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
  static on_mount_callbacks = []
  static event_listener_id = 0
  static is_mounted = false
  static generated_component_id = 0
  /**
   * @param {()=>Promise<string>} async_app_component 
   * @returns {Promise<app>}
   */
  static async from_async(async_app_component) {
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
    for (const cb of app.on_mount_callbacks) {
      cb()
    }
    app.is_mounted = true
  }
}
/**
 * @param {()=>unknown} cb 
 */
export function on_mount(cb) {
  app.on_mount_callbacks.push(cb)
}
/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bind_click(cb) {
  const local_id = app.event_listener_id
  app.event_listener_id += 1
  app.on_mount_callbacks.push(() => {
    document.querySelector(`[data-pico-listener${local_id}]`)?.addEventListener("click", cb)
  })
  return `data-pico-listener${local_id}`
}
/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bind_mouseover(cb) {
  const local_id = app.event_listener_id
  app.event_listener_id += 1
  app.on_mount_callbacks.push(() => {
    document.querySelector(`[data-pico-listener${local_id}]`)?.addEventListener("mouseover", cb)
  })
  return `data-pico-listener${local_id}`
}

/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bind_mouseenter(cb) {
  const local_id = app.event_listener_id
  app.event_listener_id += 1
  app.on_mount_callbacks.push(() => {
    document.querySelector(`[data-pico-listener${local_id}]`)?.addEventListener("mouseenter", cb)
  })
  return `data-pico-listener${local_id}`
}

/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bind_mousedown(cb) {
  const local_id = app.event_listener_id
  app.event_listener_id += 1
  app.on_mount_callbacks.push(() => {
    document.querySelector(`[data-pico-listener${local_id}]`)?.addEventListener("mousedown", cb)
  })
  return `data-pico-listener${local_id}`
}

/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bind_mouseup(cb) {
  const local_id = app.event_listener_id
  app.event_listener_id += 1
  app.on_mount_callbacks.push(() => {
    document.querySelector(`[data-pico-listener${local_id}]`)?.addEventListener("mouseup", cb)
  })
  return `data-pico-listener${local_id}`
}

/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function bind_dblclick(cb) {
  const local_id = app.event_listener_id
  app.event_listener_id += 1
  app.on_mount_callbacks.push(() => {
    document.querySelector(`[data-pico-listener${local_id}]`)?.addEventListener("dblclick", cb)
  })
  return `data-pico-listener${local_id}`
}
/**
 * @param {(is_checked: boolean)=>unknown} cb 
 * @returns {string}
 */
export function bind_checked(cb) {
  const local_id = app.event_listener_id
  app.event_listener_id += 1
  app.on_mount_callbacks.push(() => {
    document.querySelector(`[data-pico-listener${local_id}]`)?.addEventListener("change", (event) => {
      if (/**@type {HTMLInputElement}*/(event.target).checked) {
        cb(/**@type {HTMLInputElement}*/(event.target).checked)
      }
    })
  })
  return `data-pico-listener${local_id}`
}
/**
 * @param {state<string | number>} bound_var 
 * @returns {string}
 */
export function bind_value(bound_var) {
  const local_id = app.event_listener_id
  app.event_listener_id += 1
  app.on_mount_callbacks.push(() => {
    document.querySelector(`[data-pico-listener${local_id}]`)?.addEventListener("input", (event) => {
      if (typeof bound_var.value === "string") {
        bound_var.value = /**@type {HTMLInputElement}*/ (event.target).value
      } else {
        bound_var.value = parseFloat(/**@type {HTMLInputElement}*/(event.target).value)
      }
    })
  })
  return `data-pico-listener${local_id}`
}

/**
 * @param {()=>(renderable | Error)} fn 
 * @param {(err: unknown)=>renderable} fallback_fn
 * @returns {renderable}
 */
export function use_try(fn, fallback_fn) {
  try {
    return /**@type {renderable}*/ (fn())
  } catch (err) {
    return fallback_fn(err)
  }
}
/**
 * @param {()=>Promise<string>} fn 
 * @param {(err: unknown)=>string} fallback_fn 
 * @param {(()=>renderable) | undefined} placeholder_fn
 * @returns {string}
 */
export function use_future(fn, placeholder_fn, fallback_fn) {
  const id = app.generated_component_id
  fn()
    .then((value) => {
      if (app.is_mounted) {
        for (const el of document.querySelectorAll(`.pico-generated-id${id}`)) {
          el.innerHTML = value
        }
      } else {
        app.on_mount_callbacks.push(() => {
          for (const el of document.querySelectorAll(`.pico-generated-id${id}`)) {
            el.innerHTML = value
          }
        })
      }
    })
    .catch((err) => {
      if (app.is_mounted) {
        for (const el of document.querySelectorAll(`.pico-generated-id${id}`)) {
          el.innerHTML = fallback_fn(err)
        }
      } else {
        app.on_mount_callbacks.push(() => {
          for (const el of document.querySelectorAll(`.pico-generated-id${id}`)) {
            el.innerHTML = fallback_fn(err)
          }
        })
      }
    })
  return `<div id="pico-element" class="pico-generated-id${id}">${placeholder_fn!==undefined ? placeholder_fn() : ""}</div>`
}
