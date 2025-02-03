import type VirtualDirectory from "./directory";

export default class VirtualObject<
  T extends FileSystemFileHandle | FileSystemDirectoryHandle,
> {
  name: string;
  handle?: T;
  parent?: VirtualDirectory;

  constructor(name: string, parent?: VirtualDirectory, handle?: T) {
    this.name = name;
    this.handle = handle;
    this.parent = parent;
  }

  get loaded(): boolean {
    return this.handle !== undefined;
  }

  get path(): string {
    return this.parent ? `${this.parent.path}/${this.name}` : this.name;
  }
}
