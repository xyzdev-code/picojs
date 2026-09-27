/**
 * @template T
 * @typedef {{
   * __unsafe_raw_value: Array<T>
   * value: Array<T>
   * fn: (x: T) => string
   * __parents: ref
   * } & Array<T>} ArrayProxy
 */

const PICO_ARRAY_MUTATORS = new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin'])
/**
 * @type {Set<ref>}
 */
const unresolvedRefs = new Set()

function resolveRefs() {
  for (const r of [...unresolvedRefs]) {
    r._resolve()
  }
}
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
  static uniqueId = 0
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
    let isMutating = false
    /**
     * @type {Array<(x: U)=>string>}
     */
    const fns = []
    const id = state.id
    state.id++
    /**
     * @type {Array<Array<Element>>}
     */
    let elementss = []
    /**
     * @type {Array<ref>}
     */
    const parents = []
    /**
     * @type {ProxyHandler<Array<U>>}
     */
    const handler = {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver)
        if (typeof value === "function" && typeof prop === "string") {
          if (prop === "push") {
            // Fast path for .push
            /** 
              * @param {Array<U>} items
              */
            return (...items) => {
              const prevNested = app.isCurrNested
              app.isCurrNested = true
              isMutating = true
              const start = target.length
              const result = target.push(...items)
              isMutating = false
              if (app.isMounted) {
                beforeMount(() => {
                  for (let i = 0; i < parents.length; i++) {
                    let newHtml = ""
                    for (let x = start; x < target.length; x++) {
                      newHtml += /**@type {Function}*/(fns[i])(/**@type {U}*/(target[x]))
                    }
                  /**@type {Element}*/(/**@type {ref}*/(parents[i])._element).insertAdjacentHTML("beforeend", newHtml)
                    const newElements = Array.from(/**@type {Element}*/(/**@type {ref}*/(parents[i])._element).children).slice(start);
                  /**@type {Array<Element>}*/(elementss[i]).push(...newElements)
                  }
                })
              }
              if (!isMutating) {
                for (const dependency of [...dependencies]) {
                  if (state.runningEffects.has(dependency)) continue
                  try { dependency() } catch (err) { }
                }
              }
              if (!prevNested) {
                for (const cb of app.immediateRenders) {
                  cb()
                }
                app.immediateRenders = []

                for (const cb of app.renderCallbacks) {
                  cb()
                }
                app.renderCallbacks = []
              }
              app.isCurrNested = prevNested
              return result
            }
          } else if (prop === "splice") {
            // Fast path for .splice
            /** 
              * @param {number} start
              * @param {number} deleteCount
              * @param {U[]}
              * @returns {U[]}
              */
            return (start, deleteCount, ...items) => {
              const prevNested = app.isCurrNested
              app.isCurrNested = true
              const len = target.length
              if (start >= len) {
                receiver.push(...items)
                app.isCurrNested = prevNested
                return []
              } else if (start < 0) {
                start = Math.max(len + start, 0)
              }
              if (deleteCount === undefined) {
                deleteCount = len - start
              } else {
                deleteCount = Math.min(
                  Math.max(deleteCount, 0),
                  len - start
                )
              }
              isMutating = true
              const removed = target.splice(start, deleteCount, ...items)
              isMutating = false
              if (app.isMounted) {
                beforeMount(() => {
                  for (let x = 0; x < parents.length; x++) {
                    const removedElements = /**@type {Array<Element>}*/(elementss[x]).splice(start, deleteCount)
                    for (const el of removedElements) {
                      el.remove()
                    }
                    for (let i = 0; i < items.length; i++) {
                      const index = start + i
                      const content = /**@type {Function}*/(fns[x])(/**@type {U}*/(items[i]))
                      const newHtml = content
                      if (index === 0) {
                    /**@type {ref}*/(parents[x])?._element?.insertAdjacentHTML("afterbegin", newHtml);
                    /**@type {Array<Element>}*/(elementss[x]).splice(0, 0,/** @type {Element} */(parents[x]?._element?.firstElementChild))
                      } else {
                        const previous = /**@type {Array<Element>}*/(elementss[x])[index - 1]
                        previous?.insertAdjacentHTML("afterend", newHtml);
                    /**@type {Array<Element>}*/(elementss[x]).splice(index, 0,/** @type {Element} */(previous?.nextElementSibling))
                      }
                    }
                  }
                })
              }
              if (!isMutating) {
                for (const dependency of [...dependencies]) {
                  if (state.runningEffects.has(dependency)) continue
                  try { dependency() } catch (err) { }
                }
              }
              if (!prevNested) {
                for (const cb of app.immediateRenders) {
                  cb()
                }
                app.immediateRenders = []

                for (const cb of app.renderCallbacks) {
                  cb()
                }
                app.renderCallbacks = []
              }
              app.isCurrNested = prevNested
              return removed
            }
          } else if (PICO_ARRAY_MUTATORS.has(prop)) {
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
        } else if (typeof prop === "string" && prop === "getRenderString") {
          return ``
        } else if (prop === '__unsafe_raw_value' || prop === "value") {
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
      // DOM updates possible
      set(target, prop, value, receiver) {
        let result = true
        let mutated = false
        if (prop === "value") {
          target.length = 0
          if (value.length === 0) {
            for (let i = 0; i < parents.length; i++) {
              parents[i]?._element?.replaceChildren();
              /**@type {Array<Element>}*/(elementss[i]).length = 0
            }
          } else {
            target.push(...value)
            const prevNested = app.isCurrNested
            app.isCurrNested = true
            if (app.isMounted) {
              beforeMount(() => {
                for (let x = 0; x < parents.length; x++) {
                  if (!parents[x]) throw new RenderErrror(`No parent for list with data-pico-list="${id}"`)
                  let html = ""
                  for (let i = 0; i < target.length; i++) {
                    html += `${/**@type {Function}*/(fns[x])(/**@type {U}*/(target[i]))}`
                  }
                /**@type {Element}*/(/**@type {ref}*/(parents[x])._element).innerHTML = html
                  elementss[x] = Array.from(/**@type {Element}*/(/**@type {ref}*/(parents[x])._element).children)
                }
              })
            }
            if (!prevNested) {
              for (const cb of app.immediateRenders) {
                cb()
              }
              app.immediateRenders = []
              for (const cb of app.renderCallbacks) {
                cb()
              }
              app.renderCallbacks = []
            }
            app.isCurrNested = prevNested
          }
          mutated = true
        } else if (prop === "fn") {
          fns.push(value)
          return true
        } else if (prop === "__parents") {
          const index = parents.length
          parents.push(value)
          elementss[index] = []
          value.deref((/**@type {Element}*/el) => {
            elementss[index] = Array.from(el.children)
          })
          return true
        } else if (prop === "__unsafe_raw_value") {
          target.length = 0
          target.push(...value)
          return true
        } else if (typeof prop === "string" && parseInt(prop).toString() === prop) {
          const prevNested = app.isCurrNested
          app.isCurrNested = true
          const index = parseInt(prop)
          for (let x = 0; x < parents.length; x++) {
            const content = /**@type {Function}*/(fns[x])(value)
            if (app.isMounted) {
              beforeMount(() => {
                const existing = /**@type {Array<Element>}*/(elementss[x])[index]
                if (existing) {
                  const template = document.createElement("template")
                  template.innerHTML = content
                  const replacement = /**@type {Element}*/(template.content.firstElementChild)
                  existing.replaceChildren(...replacement.childNodes)
                } else {
                  const newHtml = content
                  const prevElement = /**@type {Array<Element>}*/(elementss[x])[index - 1]
                  if (prevElement) {
                    prevElement.insertAdjacentHTML("afterend", newHtml)
                    if (index === elementss.length) {
                    /**@type {Array<Element>}*/(elementss[x]).push(/**@type {Element}*/(prevElement.nextElementSibling))
                    } else {
                    /**@type {Array<Element>}*/(elementss[x])[index] = /**@type {Element}*/(prevElement.nextElementSibling)
                    }
                  } else {
                    parents[x]?._element?.insertAdjacentHTML("afterbegin", newHtml)
                    if (index === elementss.length) {
                    /**@type {Array<Element>}*/(elementss[x]).push(/**@type {Element}*/(/**@type {Element}*/(/**@type {ref}*/(parents[x])._element).firstElementChild))
                    } else {
                    /**@type {Array<Element>}*/(elementss[x])[index] = /**@type {Element}*/(/**@type {Element}*/(/**@type {ref}*/(parents[x])._element).firstElementChild)
                    }
                  }
                }
              })
            }
          }
          if (!prevNested) {
            for (const cb of app.immediateRenders) {
              cb()
            }
            app.immediateRenders = []
            for (const cb of app.renderCallbacks) {
              cb()
            }
            app.renderCallbacks = []
          }
          app.isCurrNested = prevNested
          result = Reflect.set(target, prop, value, receiver)
          mutated = target[/** @type {any} */ (prop)] !== value
        } else {
          result = Reflect.set(target, prop, value, receiver)
          mutated = target[/** @type {any} */ (prop)] !== value
        }
        if (mutated && !isMutating) {
          for (const dependency of [...dependencies]) {
            if (state.runningEffects.has(dependency)) continue
            try { dependency() } catch (err) { }
          }
        }
        return result
      },
      // DOM updates possible
      deleteProperty(target, prop) {
        if (typeof prop === "string" && parseInt(prop).toString() === prop) {
          const prevNested = app.isCurrNested
          app.isCurrNested = true
          if (app.isMounted) {
            beforeMount(() => {
              for (let x = 0; x < parents.length; x++) {
                if (/**@type {Array<Element>}*/(elementss[x])[parseInt(prop)]) {
                /**@type {Array<Element>}*/(elementss[x])[parseInt(prop)]?.remove();
                /**@type {Array<Element>}*/(elementss[x]).splice(parseInt(prop), 1)
                }
              }
            })
          }
          if (!prevNested) {
            for (const cb of app.immediateRenders) {
              cb()
            }
            app.immediateRenders = []
            for (const cb of app.renderCallbacks) {
              cb()
            }
            app.renderCallbacks = []
          }
          app.isCurrNested = prevNested
        }
        const result = Reflect.deleteProperty(target, prop)
        if (!isMutating) {
          for (const dependency of [...dependencies]) {
            if (state.runningEffects.has(dependency)) continue
            try {
              dependency()
            } catch (err) { }
          }
        }
        return result
      },
      has(target, prop) {
        if (prop === "__unsafe_raw_value" || prop === "fn" || prop === "__parents" || prop === "value") {
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
    /** 
      * @package
      * @type {Array<Element>}
      */
    this._elements = []
    this._initialBuildElemets = true
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
      const prevNested = app.isCurrNested
      app.isCurrNested = true
      this._value = newValue
      if (this._initialBuildElemets) {
        this._elements = Array.from(document.querySelectorAll(`.pico-state-id${this.id}`))
        this._initialBuildElemets = false
      }
      for (const el of this._elements) {
        el.textContent = /**@type {string}*/ (this._value)
      }
      if (!prevNested) {
        for (const cb of app.immediateRenders) {
          cb()
        }
        app.immediateRenders = []
        for (const cb of app.renderCallbacks) {
          cb()
        }
        app.renderCallbacks = []
      }
      app.isCurrNested = prevNested
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
    state.uniqueId += 1
    return `<span id="pico-element" class="pico-state-id${this.id} pico-unique-state-id${state.uniqueId}">${this._value}</span>`
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
  * @returns {state<T>}
  */
export function computed(fn) {
  const internal_value = /** @type {state<T>} */ (new state(undefined))
  effect(() => {
    internal_value.value = fn()
    return undefined
  })
  return internal_value
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
      str += /** @type {state<unknown>} */ (args[i]).getRenderString();
      /**@type {state<unknown>}*/(args[i])._initialBuildElemets = true
    } else {
      str += `${args[i]}`
    }
  }
  return str + strings[args.length]
}
export class app {
  /** 
    * @type {Array<()=>unknown>}
    */
  static renderCallbacks = []
  /** 
    * @type {Array<()=>unknown>}
    */
  static immediateRenders = []
  static eventListenerId = 0
  /** 
    * @type {Array<()=>unknown>}
    */
  static afterMounts = []
  static isMounted = false
  static generatedComponentId = 0
  static listId = 0
  static isCurrNested = false
  /** 
    * @type {Object<number, (e: Event)=>unknown>}
    */
  static delegatedEvents = {}
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
      throw new RenderErrror(`Failed to get an html element with selector ${root}`)
    }
    el.innerHTML = app_component()
    for (const cb of app.immediateRenders) {
      cb()
    }
    app.immediateRenders = []
    app.isMounted = true
    resolveRefs()
    for (const cb of app.renderCallbacks) {
      cb()
    }
    app.renderCallbacks = []
    for (const cb of app.afterMounts) {
      cb()
    }
    app.afterMounts = []
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
 */
export function beforeMount(cb) {
  app.immediateRenders.push(cb)
}
/**
 * @param {()=>unknown} cb 
 */
export function afterMount(cb) {
  app.afterMounts.push(cb)
}
/**
 * @param {(e: Event)=>unknown} cb 
 * @param {boolean} [delegated=false] 
 * @returns {string}
 */
export function bindClick(cb, delegated = false) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  if (!delegated) {
    onMount(() => {
      document.querySelector(`[data-pico-listener="${localId}"]`)?.addEventListener("click", cb)
    })
  } else {
    app.delegatedEvents[localId] = cb
  }
  return `data-pico-listener="${localId}"`
}
/**
 * @param {(e: Event)=>unknown} cb 
 * @param {boolean} [delegated=false] 
 * @returns {string}
 */
export function bindMouseover(cb, delegated = false) {
  const local_id = app.eventListenerId
  app.eventListenerId += 1
  if (!delegated) {
    onMount(() => {
      document.querySelector(`[data-pico-listener="${local_id}"]`)?.addEventListener("mouseover", cb)
    })
  } else {
    app.delegatedEvents[local_id] = cb
  }
  return `data-pico-listener="${local_id}"`
}

/**
 * @param {(e: Event)=>unknown} cb 
 * @param {boolean} [delegated=false] 
 * @returns {string}
 */
export function bindMouseenter(cb, delegated = false) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  if (!delegated) {
    onMount(() => {
      document.querySelector(`[data-pico-listener="${localId}"]`)?.addEventListener("mouseenter", cb)
    })
  } else {
    app.delegatedEvents[localId] = cb
  }
  return `data-pico-listener="${localId}"`
}

/**
 * @param {(e: Event)=>unknown} cb 
 * @param {boolean} [delegated=false] 
 * @returns {string}
 */
export function bindMousedown(cb, delegated = false) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  if (!delegated) {
    onMount(() => {
      document.querySelector(`[data-pico-listener="${localId}"]`)?.addEventListener("mousedown", cb)
    })
  } else {
    app.delegatedEvents[localId] = cb
  }
  return `data-pico-listener="${localId}"`
}

/**
 * @param {(e: Event)=>unknown} cb 
 * @param {boolean} [delegated=false] 
 * @returns {string}
 */
export function bindMouseup(cb, delegated = false) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  if (!delegated) {
    onMount(() => {
      document.querySelector(`[data-pico-listener="${localId}"]`)?.addEventListener("mouseup", cb)
    })
  } else {
    app.delegatedEvents[localId] = cb
  }
  return `data-pico-listener="${localId}"`
}

/**
 * @param {(e: Event)=>unknown} cb 
 * @param {boolean} [delegated=false] 
 * @returns {string}
 */
export function bindDblclick(cb, delegated = false) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  if (!delegated) {
    onMount(() => {
      document.querySelector(`[data-pico-listener="${localId}"]`)?.addEventListener("dblclick", cb)
    })
  } else {
    app.delegatedEvents[localId] = cb
  }
  return `data-pico-listener="${localId}"`
}
/**
 * @param {(is_checked: boolean)=>unknown} cb 
 * @returns {string}
 */
export function bindChecked(cb) {
  const localId = app.eventListenerId
  app.eventListenerId += 1
  onMount(() => {
    document.querySelector(`[data-pico-listener="${localId}"]`)?.addEventListener("change", (event) => {
      if (/**@type {HTMLInputElement}*/(event.target).checked) {
        cb(/**@type {HTMLInputElement}*/(event.target).checked)
      }
    })
  })
  return `data-pico-listener="${localId}"`
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
// DOM updates possible
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
  const immediateStart = app.immediateRenders.length
  const renderStart = app.renderCallbacks.length
  const afterMountStart = app.afterMounts.length
  const promise = fn()
  const renderCallbacks = app.renderCallbacks.splice(renderStart)
  const afterMounts = app.afterMounts.splice(afterMountStart)
  const immediateRenders = app.immediateRenders.splice(immediateStart)
  promise
    .then((value) => {
      const prevNested = app.isCurrNested
      app.isCurrNested = true
      for (const el of document.querySelectorAll(`.pico-generated-id${id}`)) {
        el.innerHTML = value
      }
      resolveRefs()
      if (!prevNested) {
        for (const cb of immediateRenders) {
          cb()
        }
        app.immediateRenders = []
        for (const cb of renderCallbacks) {
          cb()
        }
        app.renderCallbacks = []
        for (const cb of afterMounts) {
          cb()
        }
        app.afterMounts = []
      }
      app.isCurrNested = prevNested
    })
    .catch((err) => {
      const prevNested = app.isCurrNested
      app.isCurrNested = true
      for (const el of document.querySelectorAll(`.pico-generated-id${id}`)) {
        el.innerHTML = fallbackFn(err)
      }
      if (!prevNested) {
        for (const cb of app.renderCallbacks) {
          cb()
        }
        app.renderCallbacks = []
      }
      app.isCurrNested = prevNested
    })
  return `<div id="pico-element" class="pico-generated-id${id}">${placeholderFn !== undefined ? placeholderFn() : ""}</div>`
}
/**
 * @template T
 * @param {Iterable<T>} arr 
 * @returns {arr is ArrayProxy<T>}
 */
function isArrayProxy(arr) {
  return "fn" in arr
}
/**
 * @template T
 * @param {Iterable<T>} arr 
 * @param {ref} ref 
 * @param {((item: T)=>string) | undefined} [fn=(x)=>x]
 * @param {boolean} [delegate=false] 
 * @returns {string}
 */
export function useEach(arr, ref, fn = (x) => /**@type {string}*/(x), delegate = false) {
  let finalStr = ""
  if (isArrayProxy(arr)) {
    arr["fn"] = fn
    arr["__parents"] = ref
    for (let i = 0; i < arr.length; i++) {
      const res = fn(/**@type {T}*/(arr[i]))
      finalStr += res
    }
    if (delegate) {
      ref.deref((el) => {
        el.addEventListener("click", (event) => {
          const el = /**@type {Element}*/(event.target).closest("[data-pico-listener]")
          const listenerId = parseInt(/**@type {string}*/(el?.getAttribute("data-pico-listener")))
          const delegatedEvent = Object.create(event);
          Object.defineProperty(delegatedEvent, "currentTarget", {
            value: el
          });
          /**@type {(e: Event)=>unknown}*/(app.delegatedEvents[listenerId])(delegatedEvent)
        })
      })
    }
  } else {
    for (const item of arr) {
      const res = fn(item)
      finalStr += res
    }
  }
  return finalStr
}
export class ref {
  /**
   * @param {string} key 
   */
  constructor(key) {
    /**
     * @type {Array<(el: Element)=>unknown>}
     */
    this._callbacks = []
    this.key = key
    /**
     * @package
     */
    this._element = null
    unresolvedRefs.add(this)
  }
  /**
   * @param {(el: Element)=>unknown} fn 
   */
  deref(fn) {
    if (this._element) {
      fn(this._element)
    } else {
      this._callbacks.push(fn)
    }
  }
  toString() {
    return `data-pico-ref="${this.key}"`
  }
  /**
   * @returns {ref}
   */
  static unique() {
    return new ref(`pico-unique-id-${Date.now()}`)
  }
  /**
   * @package
   */
  _resolve() {
    if (this._element) {
      return true
    }

    const element = Array.from(
      document.querySelectorAll("[data-pico-ref]")
    ).find(
      (el) => el.getAttribute("data-pico-ref") === this.key
    )

    if (!element) {
      return false
    }

    this._element = element
    unresolvedRefs.delete(this)

    const callbacks = this._callbacks
    this._callbacks = []

    for (const cb of callbacks) {
      cb(element)
    }

    return true
  }
}
/**
 * @param {ref} ref 
 * @returns {string}
 */
export function useRef(ref) {
  return `data-pico-ref=${ref.key}`
}
/**
 * @param {(()=>boolean) | state<boolean>} condition 
 * @param {()=>string} value 
 */
export function useIf(condition, value) {
  const branches = [
    {
      condition: condition instanceof state
        ? () => condition.value
        : condition,
      value
    }
  ]
  /**
   * @type {undefined | (()=>string)}
   */
  let elseValue = undefined
  function render() {
    for (const branch of branches) {
      if (branch.condition()) {
        return branch.value()
      }
    }
    return elseValue ? elseValue() : ""
  }
  let reactive = condition instanceof state
  /**
   * @type {state<string> | undefined}
   */
  let outputState = undefined
  return {
    /**
     * 
     * @param {(()=>boolean) | state<boolean>} condition 
     * @param {()=>string} value 
     * @returns 
     */
    elif(condition, value) {
      branches.push({
        condition: condition instanceof state
          ? () => condition.value
          : condition,
        value
      })
      if (condition instanceof state && !outputState) {
        reactive = true
      }
      return this
    },
    /**
     * @param {()=>string} value 
     * @returns 
     */
    else(value) {
      elseValue = value
      return this
    },
    toString() {
      if (!reactive) {
        return render()
      }
      if (!outputState) {
        outputState = new state(render())
        effect(() => {
          /**@type {state<string>}*/(outputState).value = render()
        })
      }
      return outputState.getRenderString()
    }
  }
}
