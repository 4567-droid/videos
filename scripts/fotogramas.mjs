#!/usr/bin/env node
/**
 * Renderiza fotogramas sueltos del Reel (un solo bundle) para revisarlos rápido.
 *
 *   npm run fotogramas -- out/fotogramas 0 90 300 600
 *   npm run fotogramas -- out/fotogramas 0 90 --escala=1   (resolución completa)
 *
 * Guarda JPG (por defecto a media resolución, 540x960) en la carpeta indicada.
 */
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';

const argumentos = process.argv.slice(2);
const escala = Number(argumentos.find((a) => a.startsWith('--escala='))?.split('=')[1] ?? 0.5);
const [salida = 'out/fotogramas', ...lista] = argumentos.filter((a) => !a.startsWith('--'));
if (lista.length === 0) {
	console.error('Indicá los frames: npm run fotogramas -- out/fotogramas 0 90 300');
	process.exit(1);
}
await mkdir(salida, {recursive: true});
const chromiumOptions = {gl: process.env.REMOTION_GL ?? 'angle'};
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {
	browserExecutable: process.env.REMOTION_BROWSER ?? null,
	chromiumOptions,
});
const composition = await selectComposition({serveUrl, id: 'Reel', puppeteerInstance: browser, chromiumOptions});
for (const frame of lista.map(Number)) {
	const archivo = path.join(salida, `f${String(frame).padStart(4, '0')}.jpg`);
	await renderStill({
		composition,
		serveUrl,
		frame,
		output: archivo,
		imageFormat: 'jpeg',
		jpegQuality: 85,
		scale: escala,
		puppeteerInstance: browser,
		chromiumOptions,
	});
	console.log(archivo);
}
await browser.close({silent: true});
