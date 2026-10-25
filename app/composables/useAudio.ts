// music 命令彩蛋共享状态：commands.ts 的 handler 调用；Audio 元素是模块级单例（仅客户端），
// 反复点唱只换 src 不叠声。曲库来自 config/music.json（?raw 打包时读入，与 commands.json 同套路），
// 音频文件由站长自备放 public/audio/，文件缺失时靠 error 事件兜底报错
import tracksRaw from "../config/music.json?raw";

export interface MusicTrack {
  /** 曲目代号，music play <id> 用 */
  id: string;
  /** 展示名 */
  title: string;
  /** 音频地址（相对 public/，如 /audio/grasswalk.mp3） */
  file: string;
}

export const musicTracks = JSON.parse(tracksRaw) as MusicTrack[];

let audioEl: HTMLAudioElement | null = null;
function ensureAudio(): HTMLAudioElement | null {
  if (!import.meta.client) return null;
  audioEl ??= Object.assign(new Audio(), { loop: true });
  return audioEl;
}

export function useAudio() {
  const current = useState<MusicTrack | null>("music-track", () => null);
  const playing = useState<boolean>("music-playing", () => false);

  /**
   * 播放曲目：换曲重设 src，同曲续播。返回给 handler 的失败提示文案（null = 成功）。
   * 注意 404 这类加载失败时 play() 可能照常 resolve，需同时等 canplay / error 事件定成败
   */
  async function play(track: MusicTrack): Promise<string | null> {
    const el = ensureAudio();
    if (!el) return "music: 音频只在浏览器里有效";
    if (current.value?.id !== track.id) {
      el.src = track.file;
      current.value = track;
      const failed = await new Promise<boolean>((resolve) => {
        const ok = () => settle(false);
        const onerr = () => settle(true);
        const settle = (bad: boolean) => {
          el.removeEventListener("canplay", ok);
          el.removeEventListener("error", onerr);
          resolve(bad);
        };
        el.addEventListener("canplay", ok);
        el.addEventListener("error", onerr);
        el.play().catch(() => settle(true));
      });
      playing.value = !failed;
      if (failed)
        return `music: 播放 "${track.title}" 失败，检查 ${track.file} 是否存在`;
      return null;
    }
    try {
      await el.play();
      playing.value = true;
      return null;
    } catch {
      return `music: 续播 "${track.title}" 失败`;
    }
  }

  /** 暂停（保留进度，play 同曲可续播） */
  function pause() {
    const el = ensureAudio();
    if (el) el.pause();
    playing.value = false;
  }

  /** 设音量，入参 0-100 */
  function setVolume(percent: number) {
    const el = ensureAudio();
    if (el) el.volume = Math.min(100, Math.max(0, percent)) / 100;
  }

  return { current, playing, play, pause, setVolume };
}
