import { type Extension, get as getExtension } from "extension";

class Program extends EventTarget {
  async query(uri: URL): Promise<any> {
    if (uri.protocol === "file:") {
      // TODO: Implement file protocol
      return;
    }

    const extension = this.resolve(uri);

    if (!extension) {
      // TODO: Show error message to user
      console.error(
        `[CORE] No extension registered for protocol: ${uri.protocol}`,
      );
      return;
    }

    try {
      const result = await extension.module.query(uri);
      console.info(`[CORE] Query result for ${uri}:`, result);

      // Allows for chaining queries and redirects
      if (result instanceof URL) {
        return await this.query(result);
      }

      return result;
    } catch (error) {
      // TODO: Show error message to user
      console.error(
        `[CORE] Error querying extension for protocol: ${uri.protocol}`,
        error,
      );
    }
  }
  resolve(uri: URL): Extension | undefined {
    return getExtension(uri.protocol.slice(0, -1));
  }
}

export default new Program();
