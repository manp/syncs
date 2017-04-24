/// <reference types="node" />
import { Server } from "http";
import { SyncsConfig } from "./lib/SyncsBase";
import { SyncsServer } from "./lib/SyncsServer";
export * from './lib/SyncsServer';
export * from './lib/SyncsClient';
export * from './lib/SyncsGroup';
/**
 *
 * @param {Server} server
 * @param {SyncsConfig} configs
 * @return {SyncsServer}
 */
export default function syncs(server: Server, configs?: SyncsConfig): SyncsServer;
