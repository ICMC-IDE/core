import VirtualObject from "./object";
import VirtualFile from "./file";

export default class VirtualDirectory extends VirtualObject<FileSystemDirectoryHandle> {
  #directoriesCache: VirtualDirectory[] = [];
  #filesCache: VirtualFile[] = [];

  newChildDirectory(name: string) {
    let directory = this.#directoriesCache.find(
      (directory) => directory.name === name,
    );
    if (!directory) {
      directory = new VirtualDirectory(name, this);
      this.#directoriesCache.push(directory);
    }
    return directory;
  }

  newChildFile(name: string) {
    let file = this.#filesCache.find((file) => file.name === name);
    if (!file) {
      file = new VirtualFile(name, this);
      this.#filesCache.push(file);
    }
    return file;
  }

  resolveDirectory(path: string[]): VirtualDirectory {
    if (path.length === 0) {
      return this;
    }

    let part = path.shift()!;
    while (part === "." || part === "") {
      part = path.shift()!;
    }

    const nextDirectory = this.newChildDirectory(part);

    if (path.length === 0) {
      return nextDirectory;
    }
    return nextDirectory.resolveDirectory(path);
  }

  resolveFile(path: string[]) {
    const directory = this.resolveDirectory(path.slice(0, -1));
    const filename = path.at(-1)!;

    return directory.newChildFile(filename);
  }

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

  async getDirectory(path: string, load = true) {
    const directory = this.resolveDirectory(path.split("/"));
    if (load) {
      await directory.load();
    }
    return directory;
  }

  async getFile(path: string, load = true) {
    const file = this.resolveFile(path.split("/"));
    if (load) {
      await file.load();
    }
    return file;
  }

  async createDirectory(path: string, createParents = false) {
    const directory = await this.getDirectory(path, false);
    await directory.create(createParents);
    return directory;
  }

  async createFile(path: string, createParents = false) {
    const file = await this.getFile(path, false);
    await file.create(createParents);
    return file;
  }

  async delete() {
    await this.parent!.handle!.removeEntry(this.name, { recursive: true });
    this.handle = undefined;
  }

  async copy(directory: VirtualDirectory, name: string = this.name) {
    const newDirectory = await directory.createDirectory(name);

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

  async hasDirectory(path: string) {
    try {
      await this.getDirectory(path);
      return true;
    } catch {
      return false;
    }
  }

  async hasFile(path: string) {
    try {
      await this.getFile(path);
      return true;
    } catch {
      return false;
    }
  }

  async *list() {
    for await (const [name, handle] of this.handle!.entries()) {
      if (handle instanceof FileSystemFileHandle) {
        const file = this.newChildFile(name);
        file.handle = handle;
        yield file;
      } else {
        const directory = this.newChildDirectory(name);
        directory.handle = handle as FileSystemDirectoryHandle;
        yield directory;
      }
    }
  }
}
