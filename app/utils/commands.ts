// 终端指令模块：数据（解析 commands.json）与行为（handler 注册表）在此一处
// —— 新增内置指令 = commands.json 加一条 + 下面 commandHandlers 加一个 handler；
//    target / url 类指令是声明式的，在 Terminal.vue 的分发器里兜底，无需动代码。
// 解析方式与 repos.ts 一致（?raw 静态导入，打包时读入）
import commandsRaw from "../config/commands.json?raw";
import modelsRaw from "../config/ollama-models.json?raw";
import { site } from "~/config/site";
import { useWeather, type WeatherMode } from "~/composables/useWeather";
import { useTheme, type ThemeMode } from "~/composables/useTheme";
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

// ollama list 展示的假模型库。本地模型照抄真 ollama list 的输出格式：name 带 tag、
// size / modified 手填，ID 不用编——由模型名哈希自动生成（真 ollama 的 ID 也是截断哈希）；
// 闭源模型走 cloud 形式，只注明 provider。展示时按 name 排序，json 里顺序随意
export interface OllamaModel {
  name: string;
  /** 本地模型字段 */
  size?: string;
  modified?: string;
  /** 手动指定 ID 覆盖自动哈希（一般不用填） */
  id?: string;
  /** 闭源模型标记：有此项则按 cloud 形式展示 */
  cloud?: boolean;
  provider?: string;
}

// 假 ID 生成器：对模型名做两轮 FNV-1a（不同种子）拼出 12 位十六进制，
// 观感与真 CLI 的截断哈希一致；确定性哈希保证同名永远同 ID
function fakeModelId(name: string): string {
  const fnv = (seed: number) => {
    let h = seed;
    for (let i = 0; i < name.length; i++) {
      h = Math.imul((h ^ name.charCodeAt(i)) >>> 0, 0x01000193) >>> 0;
    }
    return h >>> 0;
  };
  const a = fnv(0x811c9dc5);
  const b = fnv(0x811c9dc5 ^ name.length);
  return (
    a.toString(16).padStart(8, "0") +
    b.toString(16).padStart(8, "0").slice(0, 4)
  );
}

export const ollamaModels = JSON.parse(modelsRaw) as OllamaModel[];

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

// ollama 运行态：ps 展示的“正在跑”的模型（run / stop 实装后由它们增删这份列表），
// 默认为空——刚打开的终端没有模型在跑；processor / until 照抄真 ollama ps 的取值风格
const ollamaRunning: { name: string; processor: string; until: string }[] = [];

// 裸 ollama / 未知子命令 / -h 时贴的完整帮助，排版照抄真 ollama CLI：
// 分节标题用强调色，子命令表两列对齐（终端一行一个样式类，描述列并进同一行）
function ollamaHelp(ctx: TerminalContext) {
  const cmds = [
    ["run", "Run a model"],
    ["stop", "Stop a running model"],
    ["list", "List models"],
    ["ps", "List running models"],
  ] as const;
  const w = Math.max(...cmds.map(([n]) => n.length));
  ctx.push("Large language model runner", "t-out");
  ctx.push("", "t-out");
  ctx.push("Usage:", "t-accent");
  ctx.push("  ollama [flags]", "t-out");
  ctx.push("  ollama [command]", "t-out");
  ctx.push("", "t-out");
  ctx.push("Available Commands:", "t-accent");
  cmds.forEach(([n, d]) => ctx.push(`  ${n.padEnd(w)}  ${d}`, "t-out"));
  ctx.push("", "t-out");
  ctx.push("Flags:", "t-accent");
  ctx.push("  -h, --help      help for ollama", "t-out");
  ctx.push("  -v, --version   Show version information", "t-out");
}

// ollama 子命令注册表：新子命令加一个键即可。stop 目前只留命令接口占位，具体演出等后续设计；
// run 是聊天入口——校验模型在库后，先随机“思考”一两秒，再逐字流式回显，
// 自曝没有人工智能，把访客引去右上角的真人联系方式
const ollamaSubcommands: Record<string, CommandHandler> = {
  // list：复刻 ollama list 的表格式输出，模型数据在 config/ollama-models.json，
  // 按 name 排序、列宽按最长行实时对齐，和真 CLI 一样；
  // 闭源模型不进表格，以 cloud 形式注明 provider
  list: (_sc, ctx) => {
    const models = [...ollamaModels].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    const cols = ["NAME", "ID", "SIZE"] as const;
    // 元组标注：列数固定，避免 number[] 索引访问在 noUncheckedIndexedAccess 下变成 number | undefined
    const widths: [number, number, number] = [
      Math.max(cols[0].length, ...models.map((m) => m.name.length)),
      Math.max(
        cols[1].length,
        ...models.map((m) => (m.id ?? fakeModelId(m.name)).length),
      ),
      Math.max(cols[2].length, ...models.map((m) => m.size?.length ?? 0)),
    ];
    ctx.push(
      `${cols[0].padEnd(widths[0])}  ${cols[1].padEnd(widths[1])}  ${cols[2].padEnd(widths[2])}  MODIFIED`,
      "t-dim",
    );
    models.forEach((m) => {
      if (!m.cloud) {
        const id = m.id ?? fakeModelId(m.name);
        ctx.push(
          `${m.name.padEnd(widths[0])}  ${id.padEnd(widths[1])}  ${m.size!.padEnd(widths[2])}  ${m.modified}`,
          "t-out",
        );
        return;
      }
      ctx.push(`${m.name.padEnd(widths[0])}  cloud · ${m.provider}`, "t-dim");
    });
  },

  // ps：复刻 ollama ps——正在运行的模型表，运行态在 ollamaRunning（run/stop 实装后接手增删）；
  // size 从模型库里按名补齐，没登记的显示 --。空运行态时只出表头，和真 CLI 一样安静
  ps: (_sc, ctx) => {
    const rows = ollamaRunning
      .map((r) => ({
        name: r.name,
        id: fakeModelId(r.name),
        size: ollamaModels.find((m) => m.name === r.name)?.size ?? "--",
        processor: r.processor,
        until: r.until,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const cols = ["NAME", "ID", "SIZE", "PROCESSOR"] as const;
    const widths: [number, number, number, number] = [
      Math.max(cols[0].length, ...rows.map((r) => r.name.length)),
      Math.max(cols[1].length, ...rows.map((r) => r.id.length)),
      Math.max(cols[2].length, ...rows.map((r) => r.size.length)),
      Math.max(cols[3].length, ...rows.map((r) => r.processor.length)),
    ];
    ctx.push(
      `${cols[0].padEnd(widths[0])}  ${cols[1].padEnd(widths[1])}  ${cols[2].padEnd(widths[2])}  ${cols[3].padEnd(widths[3])}  UNTIL`,
      "t-dim",
    );
    rows.forEach((r) => {
      ctx.push(
        `${r.name.padEnd(widths[0])}  ${r.id.padEnd(widths[1])}  ${r.size.padEnd(widths[2])}  ${r.processor.padEnd(widths[3])}  ${r.until}`,
        "t-out",
      );
    });
  },

  // run：ollama run <model>——唯一的聊天入口。模型名不带 tag 时按真 ollama 的习惯
  // 补 :latest 再查库；命中后走假 LLM 演出
  run: async (sc, ctx) => {
    const raw = sc.argv?.[1]?.toLowerCase();
    if (!raw) {
      ctx.push("用法：ollama run <model>（ollama list 看看有什么）", "t-dim");
      return;
    }
    const name = raw.includes(":") ? raw : `${raw}:latest`;
    if (!ollamaModels.some((m) => m.name.toLowerCase() === name)) {
      ctx.push(
        `ollama: 模型库里没有 "${raw}"（ollama list 看看有什么）`,
        "t-err",
      );
      return;
    }
    await ctx.think(1400 + Math.random() * 1600);
    await ctx.stream("没有人工智能，右上角联系方式找能工智人", "t-out");
  },
  stop: () => {},
};

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

  // ollama：本地大模型玩家的终端仪式感入口，子命令走上面的注册表分发；
  // 裸命令 / -h / 未知子命令都贴完整帮助（真 CLI 风格），-v 报版本号（与初始画面的 shell 版本一致）
  ollama: async (sc, ctx) => {
    const sub = sc.argv?.[0]?.toLowerCase();
    if (!sub || sub === "-h" || sub === "--help" || sub === "help") {
      ollamaHelp(ctx);
      return;
    }
    if (sub === "-v" || sub === "--version") {
      ctx.push("ollama version 9.318.054", "t-out");
      return;
    }
    const handler = ollamaSubcommands[sub];
    if (!handler) {
      ctx.push(`ollama: 未知的子命令 "${sub}"`, "t-err");
      ollamaHelp(ctx);
      return;
    }
    await handler(sc, ctx);
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

  // theme：切换深浅主题，default 是 dark 的别名（两者等价）；状态落到 useTheme，
  // app.vue 的 useHead 把它变成 <html data-theme>，配色由 main.css 的浅色覆盖块接管
  theme: (sc, ctx) => {
    const modes: ThemeMode[] = ["dark", "light"];
    const raw = sc.argv?.[0]?.toLowerCase();
    const sub =
      raw === "default" ? ("dark" as const) : modes.find((m) => m === raw); // find 帮 TS 收窄到 ThemeMode
    if (!raw || !sub) {
      if (raw) ctx.push(`theme: 未知的主题 "${raw}"`, "t-err");
      ctx.push("用法：theme <dark(default)|light>", "t-dim");
      return;
    }
    useTheme().set(sub);
    ctx.push(
      sub === "light" ? "已切换到浅色主题" : "已切换到深色主题",
      "t-accent",
    );
  },

  // music：终端点唱机——曲库在 config/music.json，音频文件自备放 public/audio/。
  // 子命令 list / play <name> / stop；裸 play 续播上次曲目
  music: async (sc, ctx) => {
    const { current, playing, play, pause } = useAudio();
    const sub = sc.argv?.[0]?.toLowerCase();
    const arg = sc.argv?.[1];

    // 裸 music：只打用法；music list：列曲库，正在播的行用强调色，曲库为空时指路登记方式
    if (!sub) {
      ctx.push("用法：music <list|play <name>|stop>", "t-dim");
      return;
    }

    if (sub === "list") {
      if (musicTracks.length === 0) {
        ctx.push(`懒惰的${site.profile.name}还没上传音乐`, "t-dim");
        return;
      }
      ctx.push("曲库：", "t-out");
      musicTracks.forEach((t: MusicTrack) => {
        const now =
          current.value?.id === t.id && playing.value ? "  ◀ 正在播放" : "";
        ctx.push(
          `  ${t.id.padEnd(11)} ${t.title}${now}`,
          now ? "t-accent" : "t-out",
        );
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
        ctx.push(
          "用法：music play <name>（先 music list 看看有什么）",
          "t-dim",
        );
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
      ctx.push("已暂停背景音乐（music play 续播）", "t-accent");
      return;
    }

    ctx.push(`music: 未知的子命令 "${sub}"`, "t-err");
    ctx.push("用法：music <list|play <name>|stop>", "t-dim");
  },
};
