# Remotion + React Three Fiber Starter Template

<p align="center">
    <img src="demo.gif" style="border-radius: 5px">
</p>

[This is a template repository, click "Use this template" to create a repository based off this template!](https://github.com/remotion-dev/remotion-template-three/generate)

This is a lightweight boilerplate for [Remotion](https://github.com/remotion-dev/remotion) with [React Three Fiber](https://github.com/pmndrs/react-three-fiber) and [@remotion/three](https://remotion.dev/docs/three) preinstalled.

- [Remotion documentation](https://remotion.dev)
- [React Three Fiber documentation](https://docs.pmnd.rs/react-three-fiber)
- [@remotion/three documentation](https://remotion.dev/docs/three)

This example features a phone with a screen. You can easily switch out the video and change a series of parameters, like size, color, aspect ratio, corner radius etc. of the phone.

You can also simply delete everything inside the canvas to start off with your own 3D project.

## Commands

**Install Dependencies**

```console
npm ci
```

**Start Preview**

```console
npm run dev
```

**Render MP4 video**

```console
npm run render
```

### Vatican Obelisk Short

The `RopeShort` composition renders to `out/rope-short.mp4` as a 1080×1920,
30 fps H.264 video (about 63.5 seconds). From this directory, install
dependencies, check the project, and render:

```sh
npm ci
npm run lint
npm run render
```

If the machine cannot initialize its normal graphics backend, use the slower
software-rendered fallback:

```sh
npm run render:cpu
```

Keep the project in the repository layout with `../templates/bridge/toon.ts`
and `public/voice.wav` present. The renderer script checks for these inputs and
creates `out/` automatically. Copying only `video-project/` is not sufficient.

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).

The content of this template is licensed under MIT.
