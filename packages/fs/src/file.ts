import VirtualObject from "./object";
import type VirtualDirectory from "./directory";

const fileExtensions = new Set(["json", "txt", "c", "asm", "mif", "toml"]);

export default class VirtualFile extends VirtualObject<FileSystemFileHandle> {
  get extension() {
    const parts = this.name.split(".");

    if (parts.length === 1) {
      return "txt";
    }

    const extension = parts.at(-1)!;
    return fileExtensions.has(extension) ? extension : "txt";
  }

  async create(createParents = false) {
    if (this.loaded) {
      return;
    }
    if (createParents) {
      await this.parent!.create(true);
    }

    this.handle = await this.parent!.handle!.getFileHandle(this.name!, {
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

    this.handle = await this.parent!.handle!.getFileHandle(this.name);
  }

  async getReadable() {
    return (await this.handle!.getFile()).stream();
  }

  async getFileHandle() {
    return this.handle!.getFile();
  }

  async getArrayBuffer() {
    return await (await this.handle!.getFile()).arrayBuffer();
  }

  async read() {
    return await (await this.handle!.getFile()).text();
  }

  async getWritable() {
    return await this.handle!.createWritable();
  }

  async write(data: string | BufferSource | Blob) {
    const handle = await this.handle!.createWritable();
    await handle.write(data);
    await handle.close();
  }

  async delete() {
    await this.parent!.handle!.removeEntry(this.name);
    this.handle = undefined;
  }

  async copy(directory: VirtualDirectory, name: string = this.name) {
    // TODO: implement

  }

  async move(directory: VirtualDirectory, name: string = this.name) {
    const newFileHandle = (await this.copy(directory, name)).handle!;
    await this.delete();

    this.handle = newFileHandle;
    this.name = name;
    this.parent = directory;
  }

  async rename(name: string) {
    if (name === this.name) {
      return;
    }
    await this.move(this.parent!, name);
  }
}
