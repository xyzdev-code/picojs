/**
 * @template T
 * @typedef {{
   * __unsafe_raw_value: Array<T>
   * value: Array<T>
   * fn: (x: T) => string
   * __parents: ref
   * } & Array<T>} ArrayProxy
 */
export type ArrayProxy<T> = {
    __unsafe_raw_value: Array<T>;
    value: Array<T>;
    fn: (x: T) => string;
    __parents: ref;
} & Array<T>;
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
export declare class state<T> {
    /**
     * @private
     * @type {T}
     */
    _value;
    /**
     * @private
     * @type{Set<()=>unknown>}
     */
    dependencies;
    /**
     * @private
     * @type {number}
     */
    id;
    /**
      * @package
      * @type {Array<Element>}
      */
    _elements: Array<Element>;
    _initialBuildElemets: boolean;
    /**
      * @private
      * @type {number}
      */
    private static id;
    static uniqueId: number;
    /**
      * @type{(()=>unknown) | undefined}
      */
    static currentFn: (() => unknown) | undefined;
    /**
      * @type {Set<()=>unknown>}
      */
    static runningEffects: Set<() => unknown>;
    /**
      * @type {(Array<()=>unknown>) | undefined}
      */
    static currentCleanups: (Array<() => unknown>) | undefined;
    /**
     * Returns a reactivee array.
     * @template U
     * @param {Array<U>} arr
     * @returns {ArrayProxy<U>}
     */
    static from<U>(arr: Array<U>): ArrayProxy<U>;
    /**
     * @param {T} value
     */
    constructor(value: T);
    /**
      * Returns the value without tracking
      * WARNING: All calls to this are untracked by the internal state machinery
      * @returns {T}
      */
    get __unsafe_raw_value(): T;
    /**
      * Allows setting of value without tracking
      * WARNING: All calls to this are untracked by the internal state machinery
      * @param {T} newValue
      */
    set __unsafe_raw_value(newValue: T);
    /**
      * @returns{T}
      */
    get value(): T;
    /**
      * @param {T} newValue
      */
    set value(newValue: T);
    /**
     * @package
     * @returns {string}
     */
    getRenderString(): string;
}
export declare class RenderErrror extends Error {
}
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
export declare function effect(fn: () => ((() => unknown) | void)): () => void;
/**
  * @template T
  * @param {()=>T} fn
  * @returns {state<T>}
  */
export declare function computed<T>(fn: () => T): state<T>;
/**
 * @param {TemplateStringsArray} strings
 * @param {unknown[]} args
 * @returns {string}
 */
export declare function html(strings: TemplateStringsArray, ...args: unknown[]): string;
export declare class app {
    /**
      * @type {Array<()=>unknown>}
      */
    static renderCallbacks: Array<() => unknown>;
    /**
      * @type {Array<()=>unknown>}
      */
    static immediateRenders: Array<() => unknown>;
    static eventListenerId: number;
    /**
      * @type {Array<()=>unknown>}
      */
    static afterMounts: Array<() => unknown>;
    static isMounted: boolean;
    static generatedComponentId: number;
    static listId: number;
    static isCurrNested: boolean;
    /**
      * @type {Object<number, (e: Event)=>unknown>}
      */
    static delegatedEvents: Record<number, (e: Event) => unknown>;
    /**
     * @param {()=>Promise<string>} asyncAppComponent
     * @param {string} root
     * @returns {Promise<app>}
     */
    static initAsync(asyncAppComponent: () => Promise<string>, root?: string): Promise<app>;
    /**
     * @param {()=>string} appComponent
     * @param {string} root
     * @returns {app}
     */
    static init(appComponent: () => string, root?: string): app;
    /**
     * @private
     * @param {()=>string} app_component
     * @param {string} root
     */
    private constructor();
}
/**
 * @param {()=>unknown} cb
 */
export declare function onMount(cb: () => unknown): void;
/**
 * @param {()=>unknown} cb
 */
export declare function beforeMount(cb: () => unknown): void;
/**
 * @param {()=>unknown} cb
 */
export declare function afterMount(cb: () => unknown): void;
/**
 * @param {(e: Event)=>unknown} cb
 * @param {boolean} [delegated=false]
 * @returns {string}
 */
export declare function bindClick(cb: (e: Event) => unknown, delegated?: boolean): string;
/**
 * @param {(e: Event)=>unknown} cb
 * @param {boolean} [delegated=false]
 * @returns {string}
 */
export declare function bindMouseover(cb: (e: Event) => unknown, delegated?: boolean): string;
/**
 * @param {(e: Event)=>unknown} cb
 * @param {boolean} [delegated=false]
 * @returns {string}
 */
export declare function bindMouseenter(cb: (e: Event) => unknown, delegated?: boolean): string;
/**
 * @param {(e: Event)=>unknown} cb
 * @param {boolean} [delegated=false]
 * @returns {string}
 */
export declare function bindMousedown(cb: (e: Event) => unknown, delegated?: boolean): string;
/**
 * @param {(e: Event)=>unknown} cb
 * @param {boolean} [delegated=false]
 * @returns {string}
 */
export declare function bindMouseup(cb: (e: Event) => unknown, delegated?: boolean): string;
/**
 * @param {(e: Event)=>unknown} cb
 * @param {boolean} [delegated=false]
 * @returns {string}
 */
export declare function bindDblclick(cb: (e: Event) => unknown, delegated?: boolean): string;
/**
 * @param {(e: Event)=>unknown} cb
 * @returns {string}
 */
export declare function bindChanged(cb: (e: Event) => unknown): string;
/**
 * @param {state<string | number>} boundVar
 * @returns {string}
 */
export declare function bindValue(boundVar: state<string | number>): string;
/**
 * @param {(e: SubmitEvent)=>unknown} cb
 * @returns {string}
 */
export declare function bindSubmit(cb: (e: SubmitEvent) => unknown): string;
/**
 * Optionally takes in some function that may throw or return an error and if an error does occur, it returns a fallback function
 * WARNING: If the fallback function errors it will get called again with err being the error the first call of the fallback throws
 * @template T, U
 * @param {()=>T} fn
 * @param {((err: unknown)=>U) | undefined} fallbackFn
 * @returns {T|U}
 */
export declare function useTry<T, U>(fn: () => T, fallbackFn?: ((err: unknown) => U) | undefined): T | U;
/**
 * Takes some async function and optionally displays a placeholder function while it is still running or error function if it fails.
 * @param {()=>Promise<string>} fn
 * @param {(()=>unknown) | undefined} placeholderFn
 * @param {((err: unknown)=>string) | undefined} fallbackFn
 * @returns {string}
 */
export declare function useFuture(fn: () => Promise<string>, fallbackFn?: ((err: unknown) => string) | undefined, placeholderFn?: (() => unknown) | undefined): string;
/**
 * @template T
 * @param {Iterable<T>} arr
 * @param {ref} ref
 * @param {((item: T)=>string) | undefined} [fn=(x)=>x]
 * @param {boolean} [delegate=false]
 * @returns {string}
 */
export declare function useEach<T>(arr: Iterable<T>, ref: ref, fn?: ((item: T) => string) | undefined, delegate?: boolean): string;
export declare class ref {
    /**
     * @type {Array<(el: Element)=>unknown>}
     */
    _callbacks: Array<(el: Element) => unknown>;
    key: string;
    /**
     * @package
     */
    _element: Element | null;
    /**
     * @param {string} key
     */
    constructor(key: string);
    /**
     * @param {(el: Element)=>unknown} fn
     */
    deref(fn: (el: Element) => unknown): void;
    toString(): string;
    /**
     * @returns {ref}
     */
    static unique(): ref;
    /**
     * @package
     */
    _resolve(): boolean;
}
/**
 * @param {ref} ref
 * @returns {string}
 */
export declare function useRef(ref: ref): string;
/**
 * @param {(()=>boolean) | state<boolean>} condition
 * @param {()=>string} value
 */
export declare function useIf(condition: (() => boolean) | state<boolean>, value: () => string): {
    /**
     *
     * @param {(()=>boolean) | state<boolean>} condition
     * @param {()=>string} value
     * @returns
     */
    elif(condition: (() => boolean) | state<boolean>, value: () => string): {
        elif(condition: (() => boolean) | state<boolean>, value: () => string): /*elided*/ any;
        /**
         * @param {()=>string} value
         * @returns
         */
        else(value: () => string): /*elided*/ any;
        toString(): string;
    };
    /**
     * @param {()=>string} value
     * @returns
     */
    else(value: () => string): {
        /**
         *
         * @param {(()=>boolean) | state<boolean>} condition
         * @param {()=>string} value
         * @returns
         */
        elif(condition: (() => boolean) | state<boolean>, value: () => string): any;
        else(value: () => string): any;
        toString(): string;
    };
    toString(): string;
};
