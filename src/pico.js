/**
 * @template T
 */
export class state {
  static #id = 0
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
  constructor(value){
    /**
     * @private
     */
    this._value = value
    /**
     * @private
     * @type{Array<()=>unknown>}
     */
    this.dependencies = []
    this.id = state.#id
    state.#id++
  }
  /**
    * @returns{T}
    */
  get value(){
    if(state.current_fn && state.calling_effects===false){
      this.dependencies.push(state.current_fn)
    }
    return this._value
  }
  /**
    * @param {T} new_value 
    */
  set value(new_value){
    this._value = new_value
    state.calling_effects = true
    console.debug("Setting new value")
    for (const dependency of this.dependencies){
      dependency()
    }
    if (app.is_mounted){
      for (const el of document.querySelectorAll(`.pico-state-id${this.id}`)){
        el.textContent = this._value
      }
    }
    state.calling_effects = false
  }
  get_render_string(){
    return `<span id="pico-state-element" class="pico-state-id${this.id}">${this._value}</span>`
  }
}
/**
 * @param {()=>unknown} fn 
 */
export function effect(fn){
  function internal_effect(){
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
export function computed(fn){
  const internal_value = /** @type {state<T>} */ (new state(undefined))
  function internal_effect(){
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
export function html(strings, ...args){
  let str = ""
  for (let i=0;i<args.length; i++){
    str += strings[i]
    if (args[i] instanceof state){
      str += /** @type {state<unknown>} */ (args[i]).get_render_string()
    } else {
      str += args[i]
    }
  }
  return str + strings[args.length]
}
export class app{
  /** 
    * @type {Array<()=>unknown>}
    */
  static on_mount_callbacks = []
  static event_listener_id = 0
  static is_mounted = false
  /**
   * @param {()=>string} app_component 
   */
  constructor(app_component){
    document.body.innerHTML = app_component()
    for (const cb of app.on_mount_callbacks){
      cb()
    }
    app.is_mounted = true
  }
}
/**
 * @param {()=>unknown} cb 
 */
export function on_mount(cb){
  app.on_mount_callbacks.push(cb)
}
/**
 * @param {()=>unknown} cb 
 * @returns {string}
 */
export function click(cb){
  const local_id = app.event_listener_id
  app.event_listener_id += 1
  app.on_mount_callbacks.push(()=>{
    document.querySelector(`[data-pico-listener${local_id}]`)?.addEventListener("click", cb)
  })
  return `data-pico-listener${local_id}`
}
