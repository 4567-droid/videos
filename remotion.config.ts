import {Config} from '@remotion/cli/config';

// Three.js necesita WebGL. "angle" es lo recomendado en máquinas con GPU.
// En servidores sin GPU podés usar REMOTION_GL=swangle (render por software).
Config.setChromiumOpenGlRenderer(
	(process.env.REMOTION_GL as 'angle' | 'swangle' | 'egl' | 'swiftshader' | 'vulkan') ?? 'angle',
);

// Opcional: usar un Chrome ya instalado en vez del que descarga Remotion.
if (process.env.REMOTION_BROWSER) {
	Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
