// 终端指令模块：数据（解析 commands.json）与行为（handler 注册表）在此一处
// —— 新增内置指令 = commands.json 加一条 + 下面 commandHandlers 加一个 handler；
//    target / url 类指令是声明式的，在 Terminal.vue 的分发器里兜底，无需动代码。
// 解析方式与 repos.ts 一致（?raw 静态导入，打包时读入）
import commandsRaw from "../config/commands.json?raw";
import { site } from "~/config/site";
import { useWeather, type WeatherMode } from "~/composables/useWeather";
import { useAudio, musicTracks, type MusicTrack } from "~/composables/useAudio";

// ---- 数据：指令表契约 ----

export interface SlashCommand {
  name: string;
  desc: string;
  /** 内置动作名，对应下面 commandHandlers 的键，存在则执行对应动作 */
  action?: string;
  /** 彩蛋指令：可执行但不进 help 列表，避免剧透 */
  hidden?: boolean;
  /** help 输出的分组名，缺省为系统命令（裸列表不显示组名）；分组按首次出现顺序排列 */
  group?: string;
  /** 是否接受参数（如 /weather rain）；run() 据此放开首段匹配 */
  args?: boolean;
  /** run() 解析出的参数列表，仅对 args 指令存在 */
  argv?: string[];
  /** 页面 section id（对应 site.ts 的 sections），存在则平滑滚动跳转 */
  target?: string;
  /** 外链地址，存在则新窗口打开 */
  url?: string;
}

export const slashCommands = JSON.parse(commandsRaw) as SlashCommand[];

// ---- 行为：内置动作注册表 ----

/** 终端能力集：handler 通过它操作终端，不直接碰组件内部状态 */
export interface TerminalContext {
  push: (text: string, cls?: string) => void;
  /** 打字机逐字流式输出一行，resolve 于整行输出完 */
  stream: (text: string, cls?: string) => Promise<void>;
  /** 伪思考：Claude Code 式 spinner（乒乓星号帧）动画片刻，结束时定格为 Thought for Xs */
  think: (ms: number) => Promise<void>;
  /** 纯延时，演出节奏控制用 */
  delay: (ms: number) => Promise<void>;
  clear: () => void;
  reset: () => void;
  focusInput: () => void;
  nuke: () => void;
}

export type CommandHandler = (sc: SlashCommand, ctx: TerminalContext) => void;

export const commandHandlers: Record<string, CommandHandler> = {
  // 帮助输出：只列 commands.json 的非隐藏指令表（彩蛋靠猜）。
  // 仿 Linux 风格：无 group 的系统命令是默认分组，裸列表不显示标题；其余按 group 分节渲染
  help: (_sc, ctx) => {
    ctx.push("可用指令：", "t-out");
    const plain: SlashCommand[] = [];
    const groups: { name: string; cmds: SlashCommand[] }[] = [];
    slashCommands
      .filter((c) => !c.hidden)
      .forEach((c) => {
        if (!c.group) {
          plain.push(c);
          return;
        }
        const g = groups.find((x) => x.name === c.group);
        if (g) g.cmds.push(c);
        else groups.push({ name: c.group, cmds: [c] });
      });
    let started = false;
    const breakIfStarted = () => {
      if (started) ctx.push("", "t-out");
      started = true;
    };
    plain.forEach((c) => ctx.push(`  ${c.name.padEnd(11)} ${c.desc}`, "t-out"));
    if (plain.length > 0) started = true;
    groups.forEach((g) => {
      breakIfStarted();
      ctx.push(`── ${g.name}`, "t-dim");
      g.cmds.forEach((c) =>
        ctx.push(`  ${c.name.padEnd(11)} ${c.desc}`, "t-out"),
      );
    });
  },

  clear: (_sc, ctx) => ctx.clear(),

  // whoami / whereami：复刻初始画面的自报家门，输出样式（渐变名 / 强调色）与之共用
  whoami: (_sc, ctx) => ctx.push(site.profile.name, "t-name"),

  whereami: (_sc, ctx) => ctx.push(site.profile.location, "t-accent"),

  refresh: (_sc, ctx) => {
    ctx.reset();
    ctx.focusInput();
  },

  // rm -rf /：真实复刻 GNU rm 的保 root 保险丝，拒绝执行
  rmrf: (_sc, ctx) => {
    ctx.push("rm: it is dangerous to operate recursively on '/'", "t-err");
    ctx.push("rm: use --no-preserve-root to override the failsafe", "t-err");
  },

  // rm -rf / --no-preserve-root：具体演出在 Terminal.vue 的 nuke 里（需要 staggered 计时器）
  "rmrf-force": (_sc, ctx) => ctx.nuke(),

  // chat：假 LLM 对话——先随机“思考”一两秒，再逐字流式回显，自曝没有人工智能，把访客引去右上角的真人联系方式
  chat: async (_sc, ctx) => {
    await ctx.think(1400 + Math.random() * 1600);
    await ctx.stream("没有人工智能，右上角联系方式找能工智人", "t-out");
  },

  // docker：复刻 daemon 没起的经典报错，裸报错不解释
  docker: (_sc, ctx) => {
    ctx.push(
      "Cannot connect to the Docker daemon at unix:///var/run/docker.sock",
      "t-err",
    );
  },

  // /weather：我的世界天气指令，参数落到 useWeather 共享状态，特效由 WeatherFx.vue 渲染
  weather: (sc, ctx) => {
    const modes: WeatherMode[] = ["clear", "rain", "thunder"];
    const raw = sc.argv?.[0]?.toLowerCase();
    const sub = modes.find((m) => m === raw); // find 帮 TS 把类型收窄到 WeatherMode
    if (!raw || !sub) {
      if (raw) ctx.push(`weather: 未知的天气 "${raw}"`, "t-err");
      ctx.push("用法：/weather <clear|rain|thunder>", "t-dim");
      return;
    }
    useWeather().weather.value = sub;
    ctx.push(
      {
        clear: "已将天气更改为晴天",
        rain: "已将天气更改为雨天",
        thunder: "已将天气更改为雷暴",
      }[sub],
      "t-accent",
    );
  },

  // /music：终端点唱机——曲库在 config/music.json，音频文件自备放 public/audio/。
  // 子命令 ls / play <name> / stop；裸 play 续播上次曲目
  music: async (sc, ctx) => {
    const { current, playing, play, pause } = useAudio();
    const sub = sc.argv?.[0]?.toLowerCase();
    const arg = sc.argv?.[1];

    // 裸 music / music list：列曲库，正在播的行用强调色；曲库为空时指路登记方式
    if (!sub || sub === "list") {
      if (musicTracks.length === 0) {
        ctx.push(`懒惰的${site.profile.name}还没上传音乐`, "t-dim");
        return;
      }
      ctx.push("曲库：", "t-out");
      musicTracks.forEach((t: MusicTrack) => {
        const now = current.value?.id === t.id && playing.value ? "  ◀ 正在播放" : "";
        ctx.push(`  ${t.id.padEnd(11)} ${t.title}${now}`, now ? "t-accent" : "t-out");
      });
      return;
    }

    if (sub === "play") {
      // 裸 play：有历史曲目就续播，没有则指路 ls
      if (!arg) {
        if (current.value) {
          const err = await play(current.value);
          if (err) ctx.push(err, "t-err");
          else ctx.push(`正在播放：${current.value.title}`, "t-accent");
          return;
        }
        ctx.push("用法：/music play <name>（先 /music list 看看有什么）", "t-dim");
        return;
      }
      const track = musicTracks.find((t) => t.id === arg.toLowerCase());
      if (!track) {
        ctx.push(`music: 曲库里没有 "${arg}"`, "t-err");
        return;
      }
      const err = await play(track);
      if (err) ctx.push(err, "t-err");
      else ctx.push(`正在播放：${track.title}`, "t-accent");
      return;
    }

    if (sub === "stop") {
      pause();
      ctx.push("已暂停背景音乐（/music play 续播）", "t-accent");
      return;
    }

    ctx.push(`music: 未知的子命令 "${sub}"`, "t-err");
    ctx.push("用法：/music <list|play <name>|stop>", "t-dim");
  },
};
