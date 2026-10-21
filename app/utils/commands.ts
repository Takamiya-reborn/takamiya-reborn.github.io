// 终端 / 指令表：彩蛋命令在此配置，内容维护只改 commands.json
// target 为页面 section id（对应 site.ts 的 sections），存在则平滑滚动跳转；
// url 为外链，存在则新窗口打开。解析方式与 repos.ts 一致（?raw 静态导入，打包时读入）
import commandsRaw from "../config/commands.json?raw";

export interface SlashCommand {
  name: string;
  desc: string;
  /** 内置动作名，存在则执行对应动作 */
  action?: "help" | "clear" | "refresh" | "rmrf" | "rmrf-force";
  /** 彩蛋指令：可执行但不进 help 列表，避免剧透 */
  hidden?: boolean;
  /** 页面 section id，存在则滚动跳转 */
  target?: string;
  /** 外链地址，存在则新窗口打开 */
  url?: string;
}

export const slashCommands = JSON.parse(commandsRaw) as SlashCommand[];
