# Claude Animated Shorts

The free Claude skill from the video **"How to Make Viral Animated Shorts Using Claude (Full Workflow)"**.

It makes 55-70 s vertical animated story shorts: 2D characters in a colourful 3D world, with ink outlines, a painted town, lens blur, gliding cameras, a march score and sound effects. Everything is rendered with three.js inside Remotion on your own PC, with no AI video generator.

Proven on **The Bridge That Fell for a Song**, a 67 s short about the 1831 Broughton bridge.

## What's inside
| Path | What it is |
|---|---|
| `SKILL.md` | The skill: the full pipeline, every rule, every fix, and the final look values |
| `templates/bridge/` | The full source of the bridge short: world, characters, ink, lens blur, grade, story/camera |
| `templates/audio/` | The synthesized sound: SFX, march music, the mix with ducking and loudness |
| `templates/scripts/` | Stills, side-by-side sheets, shot merge and frame-by-frame QA helpers |
| `references/STYLE_BIBLE.md` | The script and visual formula measured from 20 reference shorts |
| `references/reports/` | Seven measured reports: motion, depth, textures, characters, lighting, outlines, grade |
| `references/frames/` | 38 full-size reference frames (540x960) to compare your frames against |
| `references/sheets/` | 20 contact sheets, one per reference short, 60 frames each (1,200 frames) |

## Install
1. Copy this folder to `~/.claude/skills/cartoon-3d-short/` (clone it there, or download the ZIP).
2. You need [Remotion](https://www.remotion.dev/) with `@remotion/three`, plus Node, Python 3 and ffmpeg.
3. In Claude Code, say: *"Use the cartoon short skill and make a short about …"*.

Claude then follows `SKILL.md`: topic and facts, then script, then voice, then the shot plan in `story.ts`, then stills, then renders. Agents check your frames against the reports and the frames, and you get the final 2K render and sound mix.

## Notes
- Set `REMOTION_TMP` to a folder on a big drive. Every Remotion bundle copies `public/` (~1.3 GB) into the temp folder.
- Story, characters and voice should always be your own. Use the references for the look, not the content.

## Chạy trên Windows (PowerShell) — 2 phiên bản 1080 + 2K

Mặc định: mỗi lần render ra **cả 2 phiên bản 1080 (1080×1920) và 2K (1440×2560)**.

```powershell
cd C:\Users\matth\Downloads\claude-animated-shorts
$env:REMOTION_RENDERER_TIMEOUT_MS="600000"; $env:REMOTION_BROWSER_TIMEOUT_MS="600000"

# Stills xem trước cả 2 độ phân giải (frame 100, 400)
npm run stills:both

# Render video cả 2 phiên bản
npm run render:both

# Hoặc từng phiên bản riêng
npm run stills:1080    # stills 1080p
npm run stills:2k      # stills 2K (1440x2560)
npm run render:1080    # video 1080p
npm run render:2k      # video 2K (1440x2560)
```

Tham số `bridge-stills.mjs <outPrefix> <frame,frame,...> [scale]` — đổi frame/xem thêm độ phân giải khác (ví dụ `2` = 4K 2160×3840):

```powershell
node templates/scripts/bridge-stills.mjs out/fake-job/4k- 100,400 2
npx remotion render src/index.ts FakeJobShort out/fake-job/fake-job-4k.mp4 --scale=2 --crf=16 --timeout=600000
```

Nét ink/DOF tự scale theo độ phân giải (`pxScale = height/1920`), màn hình monitor trong scene vẽ ở 2× density — không cần chỉnh gì thêm khi lên 2K/4K.

## License
The code and docs are MIT (see `LICENSE`). The reference frames are included for style study only.
