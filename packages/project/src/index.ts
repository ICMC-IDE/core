import { type VirtualDirectory, VirtualFile } from "fs";

class Project extends EventTarget {}

export default new Project();

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
