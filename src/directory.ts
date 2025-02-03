import VirtualObject from "./object";
import VirtualFile from "./file";

export default class VirtualDirectory extends VirtualObject<FileSystemDirectoryHandle> {
  #cache: Record<string, WeakRef<VirtualFile | VirtualDirectory>> = {};

  async create(createParents = false) {
    if (this.loaded) {
      return;
    }
    if (createParents) {
      await this.parent!.create(true);
    }

    this.handle = await this.parent!.handle!.getDirectoryHandle(this.name, {
      create: true,
    });
  }

  async load(loadParents = true) {
    if (this.loaded) {
      return;
    }
    if (loadParents) {
      await this.parent!.load(true);
    }

    this.handle = await this.parent!.handle!.getDirectoryHandle(this.name);
  }

  async touch(name: string, isFolder: true): Promise<VirtualDirectory>;
  async touch(name: string, isFolder: false): Promise<VirtualFile>;
  async touch(name: string, isFolder: boolean = false) {
    // TODO: validate name
    const cached = this.#getCached(name);

    if (cached) {
      return cached;
    }

    let entry;

    if (isFolder) {
      const handle = await this.handle!.getDirectoryHandle(name, { create: true });
      entry = new VirtualDirectory(name, this, handle);
    } else {
      const handle = await this.handle!.getFileHandle(name, { create: true });
      entry = new VirtualFile(name, this, handle);
    }

    this.#cache[name] = new WeakRef(entry);
    return entry;
  }

  async query(path: string): Promise<VirtualFile | VirtualDirectory | undefined> {
    path = path.replace(/\/+/, "/");

    // Absolute path
    if (path.startsWith("/")) {
      let entry: VirtualDirectory = this;

      while (entry.parent) {
        entry = entry.parent;
      }

      return entry.query(path.substring(1));
    }

    // Relative path
    const way = path.split("/");
    let entry: VirtualDirectory = this;

    while (way.length > 0) {
      const part = way.shift()!;

      let nextEntry = await entry.get(part);

      if (nextEntry instanceof VirtualFile) {
        if (way.length > 0) {
          throw new Error("Invalid path");
        }

        return nextEntry;
      } else {
        entry = nextEntry;
      }
    }

    return entry;
  }

  async get(name: string) {
    if (name === "." || name.length === 0) {
      return this;
    } else if (name === "..") {
      return this.parent ?? this;
    }

    const cached = this.#getCached(name);

    if (cached) {
      return cached;
    }

    let entry;

    try {
      const handle = await this.handle!.getDirectoryHandle(name);
      entry = new VirtualDirectory(name, this, handle);
    } catch(error) {
      if (error instanceof DOMException && error.name === "TypeMismatchError") {
        const handle = await this.handle!.getFileHandle(name);
        entry = new VirtualFile(name, this, handle);
      } else {
        throw error;
      }
    }

    this.#cache[name] = new WeakRef(entry!);
    return entry;
  }


  async delete() {
    await this.parent!.handle!.removeEntry(this.name, { recursive: true });
    this.handle = undefined;
  }

  async copy(directory: VirtualDirectory, name: string = this.name) {
    const newDirectory = await directory.touch(name, true);

    for await (const object of this.list()) {
      await object.copy(newDirectory);
    }

    return newDirectory;
  }

  async move(directory: VirtualDirectory, name: string = this.name) {
    const newDirectoryHandle = (await this.copy(directory, name)).handle!;
    await this.delete();

    this.handle = newDirectoryHandle;
    this.name = name;
    this.parent = directory;
  }

  async rename(name: string) {
    if (name === this.name) {
      return;
    }
    await this.move(this.parent!, name);
  }

  async *list() {
    for await (const [name, handle] of this.handle!.entries()) {
      yield this.get(name)!;
    }
  }

  #getCached(name: string) {
    const cache = this.#cache[name];

    if (cache) {
      const entry = cache.deref();

      if (entry) {
        return entry;
      }

      delete this.#cache[name];
    }
  }
}
