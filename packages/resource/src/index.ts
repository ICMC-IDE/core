export default class Resource<T> extends EventTarget {
  #resource: T;

  constructor(resource: T) {
    super();
    this.#resource = resource;
  }

  get(): T {
    return this.#resource;
  }

  set(resource: T) {
    this.#resource = resource;
    this.dispatchEvent(new CustomEvent("change"));
  }

  update(func: (current: T) => T) {
    this.set(func(this.#resource));
  }
}

interface ResourceEventMap {
  change: CustomEvent<void>;
}

declare global {
  interface Resource<T> {
    addEventListener<K extends keyof ResourceEventMap>(
      type: K,
      listener: (this: Resource<T>, ev: ResourceEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof ResourceEventMap>(
      type: K,
      listener: (this: Resource<T>, ev: ResourceEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
  }
}
