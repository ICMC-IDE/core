const extensions: Record<string, Extension> = {};

export type Metadata = {
  id: string;
  title: string;
  version: string;
  emulators?: {
    id: string;
    title: string;
    description?: string;
    uri: string;
    tags?: string[];
  }[];
};

export type Extension = {
  origin: URL;
  protocol: string;
  metadata: Metadata;
  stylesheet?: CSSStyleSheet;
  module: {
    /// General communication method with the extension.
    query: (uri: URL) => Promise<unknown>;

    /// Method called when the extension is loaded.
    load: () => Promise<void>;

    /// Method called when the extension is to be unloaded.
    unload: () => Promise<void>;
  };
};

async function fetchStylesheet(
  origin: URL,
): Promise<CSSStyleSheet | undefined> {
  try {
    const url = new URL("./main.css", origin);
    const css = await (await fetch(url)).text();

    const stylesheet = new CSSStyleSheet();
    await stylesheet.replace(css);

    return stylesheet;
  } catch {
    return;
  }
}

async function fetchMetadata(origin: URL): Promise<Metadata> {
  const url = new URL("./metadata.json", origin);
  return (await (await fetch(url)).json()) as Metadata;
}

async function fetchModule(origin: URL): Promise<any> {
  const url = new URL("./main.js", origin);
  return await import(url.href);
}

async function loadExtension(origin: URL): Promise<Extension> {
  const metadata = await fetchMetadata(origin);
  const [module, stylesheet] = await Promise.all([
    fetchModule(origin),
    fetchStylesheet(origin),
  ]);

  return {
    origin,
    protocol: `${metadata.id}://`,
    metadata,
    stylesheet,
    module,
  };
}

export async function load(url: URL) {
  try {
    const extension = await loadExtension(url);

    // TODO: Validate module, check if it has the required methods, etc.
    extensions[extension.metadata.id] = extension;
    console.info(
      `[CORE:EXTENSION] Extension loaded: ${extension.metadata.title} (${extension.metadata.id})`,
    );
    await extension.module.load();
    // TODO: Dispatch event to notify that the extension was loaded
  } catch (error) {
    console.error(`[CORE:EXTENSION] Error loading extension from url: ${url}`, error);
  }
}

export function get(name: string): Extension | undefined {
  return extensions[name];
}

export function list() {
  return Object.values(extensions);
}
