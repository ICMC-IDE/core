const registry = new FinalizationRegistry((controller: AbortController) => {
  controller.abort();
});

export default class Resource<T> extends EventTarget {
  #value: T;
  #queued: boolean = false;

  constructor(initial: T) {
    super();
    this.#value = initial;
  }

  set value(value: T) {
    this.#value = value;

    // This avoids calling dispatchEvent multiple times when updating the value inside of a loop
    if (this.#queued) return;

    queueMicrotask(() => {
      this.#queued = false;
      this.dispatchEvent(new CustomEvent("update"));
    });
  }

  get value(): T {
    return this.#value;
  }

  update(cb: (current: T) => T): void {
    this.value = cb(this.#value);
  }

  map<R>(cb: (current: T) => R): Resource<R> {
    const resource = new Resource(cb(this.#value));
    const resourceRef = new WeakRef(resource);
    const controller = new AbortController();

    // This will create a permanent event listener on `this`, preventing it from ever being garbage-collected.
    // To resolve that a FinalizationRegistry is used together with WeakRefs to remove the event listener when no longer needed
    this.addEventListener(
      "update",
      () => {
        const resource = resourceRef.deref();

        if (resource) {
          resource.value = cb(this.#value);
        }
      },
      { signal: controller.signal },
    );

    registry.register(resource, controller);

    return resource;
  }

  /// Creates a proxy that will act as an object of type T
  /// This is NOT efficient, but it solves the hassle of handling change events
  proxy(): T {
    return new Proxy(
      {},
      {
        get: (_, key: keyof T & (string | symbol)) => {
          const item = this.value[key];

          if (typeof item === "function") {
            return function (this: T) {
              return item.apply(this, arguments);
            };
          }

          return item;
        },
        set: (_, key: keyof T & (string | symbol), value) => {
          this.value[key] = value;
          return true;
        },
      },
    ) as unknown as T;
  }
}
