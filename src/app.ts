import { get as getExtension } from "./extension";
import * as VirtualFilesystem from "./fs";

const root = new VirtualFilesystem.VirtualDirectory(
  "",
  undefined,
  await navigator.storage.getDirectory(),
);

class Program extends EventTarget {
  async query(uri: URL): Promise<any> {
    switch (uri.protocol) {
      case "file:":
        return await this.#queryFilesystem(uri);
      case "extension:": {
        return await this.#queryExtension(uri);
      }
    }
  }

  async #queryFilesystem(
    uri: URL,
  ): Promise<
    | VirtualFilesystem.VirtualFile
    | VirtualFilesystem.VirtualDirectory
    | undefined
  > {
    return await root.query(uri.pathname);
  }

  async #queryExtension(uri: URL): Promise<any> {
    const extension = getExtension(uri.hostname);

    if (!extension) {
      // TODO: Show error message to user
      console.error(
        `[CORE:APP] No extension registered with id: ${uri.hostname}`,
      );
      return;
    }

    try {
      const result = await extension.module.query(uri);
      console.info(`[CORE:APP] Query result for ${uri}:`, result);

      // Allows for chaining queries and redirects
      if (result instanceof URL) {
        return await this.query(result);
      }

      return result;
    } catch (error) {
      // TODO: Show error message to user
      console.error(
        `[CORE:APP] Error querying extension id: ${uri.hostname}`,
        error,
      );
    }
  }
}

export default new Program();
