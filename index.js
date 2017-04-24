"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const SyncsServer_1 = require("./lib/SyncsServer");
__export(require("./lib/SyncsServer"));
__export(require("./lib/SyncsClient"));
__export(require("./lib/SyncsGroup"));
/**
 *
 * @param {Server} server
 * @param {SyncsConfig} configs
 * @return {SyncsServer}
 */
function syncs(server, configs = {}) {
    return new SyncsServer_1.SyncsServer(server, configs);
}
exports.default = syncs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUVBLG1EQUE4QztBQUM5Qyx1Q0FBaUM7QUFDakMsdUNBQWlDO0FBQ2pDLHNDQUFnQztBQUdoQzs7Ozs7R0FLRztBQUNILGVBQThCLE1BQWEsRUFBQyxVQUFvQixFQUFFO0lBQzlELE1BQU0sQ0FBQyxJQUFJLHlCQUFXLENBQUMsTUFBTSxFQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzNDLENBQUM7QUFGRCx3QkFFQyJ9