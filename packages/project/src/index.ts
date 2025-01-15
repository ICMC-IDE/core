import { type VirtualDirectory, VirtualFile } from "@core/fs";

class Project extends EventTarget {
  #root: VirtualDirectory;

  constructor(name?: string) {
    super();

    /*
    const projectRoot = root.resolve(["projects", name ?? "blank"]);

    if (projectRoot instanceof VirtualFile) {
      throw new Error("Project root must be a directory");
    }

    this.#root = projectRoot;

    console.log(projectRoot);
    */
  }

  root() {
    return this.#root;
  }
}

export default new Project(sessionStorage.getItem("project") ?? undefined);

/** project.json
 * {
 *   "name": "project",
 *   "extensions": [
 *     "icmc",
 *     "vga",
 *   ],
 *   "emulator": "icmc:///emulator?abc",
 * }
 **/
