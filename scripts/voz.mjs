#!/usr/bin/env node
/**
 * Genera la voz de cada escena con ElevenLabs (endpoint "with-timestamps")
 * y guarda:
 *   - public/voz/<id>.mp3          audio de cada escena
 *   - data/voz.json                tiempos exactos de cada palabra por escena
 *
 * Después, `npm run render` usa el audio y esos tiempos en lugar de la estimación.
 *
 * Uso:
 *   npm run voz                    genera solo las escenas nuevas o con texto cambiado
 *   npm run voz -- --forzar        regenera todas
 *   npm run voz -- --escena gancho regenera una sola escena
 *
 * Variables (en .env o en el entorno):
 *   ELEVENLABS_API_KEY   (obligatoria)
 *   ELEVENLABS_VOICE_ID  (obligatoria)
 *   ELEVENLABS_MODEL_ID  (opcional, por defecto eleven_multilingual_v2)
 */
import {existsSync, readFileSync} from 'node:fs';
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUTA_VIDEO = path.join(RAIZ, 'data/video.json');
const RUTA_VOZ = path.join(RAIZ, 'data/voz.json');
const CARPETA_AUDIO = path.join(RAIZ, 'public/voz');
const FORMATO = 'mp3_44100_128';
const KBPS = 128;

// --- .env simple (sin dependencias) ---
const rutaEnv = path.join(RAIZ, '.env');
if (existsSync(rutaEnv)) {
	for (const linea of readFileSync(rutaEnv, 'utf8').split(/\r?\n/)) {
		const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
		if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
	}
}

const args = process.argv.slice(2);
const forzar = args.includes('--forzar');
const soloEscena = args.includes('--escena') ? args[args.indexOf('--escena') + 1] : null;

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

if (!API_KEY || !VOICE_ID) {
	console.error('Faltan ELEVENLABS_API_KEY y/o ELEVENLABS_VOICE_ID (copiá .env.example a .env y completalo).');
	process.exit(1);
}

const separarPalabras = (texto) => texto.trim().split(/\s+/).filter(Boolean);
const redondear = (n) => Math.round(n * 1000) / 1000;

/** Agrupa la alineación por caracteres de ElevenLabs en palabras (separadas por espacios). */
const palabrasDesdeAlineacion = (alineacion) => {
	const {characters, character_start_times_seconds: inicios, character_end_times_seconds: fines} = alineacion;
	const palabras = [];
	let actual = null;
	characters.forEach((ch, i) => {
		if (/\s/.test(ch)) {
			if (actual) palabras.push(actual);
			actual = null;
			return;
		}
		if (!actual) actual = {texto: '', inicio: inicios[i], fin: fines[i]};
		actual.texto += ch;
		actual.fin = fines[i];
	});
	if (actual) palabras.push(actual);
	return palabras;
};

/** Asegura una entrada por cada palabra del guion (mismo orden que los subtítulos). */
const alinearConGuion = (texto, palabrasAudio, duracion) => {
	const guion = separarPalabras(texto);
	if (palabrasAudio.length === guion.length) {
		return guion.map((p, i) => ({texto: p, inicio: redondear(palabrasAudio[i].inicio), fin: redondear(palabrasAudio[i].fin)}));
	}
	console.warn(`  ⚠ ElevenLabs devolvió ${palabrasAudio.length} palabras y el guion tiene ${guion.length}; reparto proporcional.`);
	const total = guion.reduce((a, p) => a + p.length, 0);
	let t = 0;
	return guion.map((p) => {
		const d = (p.length / total) * duracion;
		const r = {texto: p, inicio: redondear(t), fin: redondear(t + d * 0.92)};
		t += d;
		return r;
	});
};

const generar = async (escena, anterior, siguiente) => {
	const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(VOICE_ID)}/with-timestamps?output_format=${FORMATO}`;
	const cuerpo = {
		text: escena.texto,
		model_id: MODEL_ID,
		voice_settings: {stability: 0.45, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true},
		// contexto para que la entonación fluya entre escenas
		previous_text: anterior?.texto,
		next_text: siguiente?.texto,
	};
	const res = await fetch(url, {
		method: 'POST',
		headers: {'xi-api-key': API_KEY, 'Content-Type': 'application/json', Accept: 'application/json'},
		body: JSON.stringify(cuerpo),
	});
	if (!res.ok) {
		const detalle = await res.text();
		const pista = res.status === 401 ? ' (API key inválida)' : res.status === 404 ? ' (voice_id inexistente)' : '';
		throw new Error(`ElevenLabs respondió ${res.status}${pista}: ${detalle.slice(0, 300)}`);
	}
	const datos = await res.json();
	const audio = Buffer.from(datos.audio_base64, 'base64');
	const alineacion = datos.alignment ?? datos.normalized_alignment;
	const palabrasAudio = palabrasDesdeAlineacion(alineacion);
	const finHabla = Math.max(0, ...alineacion.character_end_times_seconds);
	const duracionArchivo = (audio.length * 8) / (KBPS * 1000);
	const duracion = Math.max(finHabla, duracionArchivo);
	return {audio, duracion, palabras: alinearConGuion(escena.texto, palabrasAudio, finHabla)};
};

const video = JSON.parse(await readFile(RUTA_VIDEO, 'utf8'));
const voz = existsSync(RUTA_VOZ) ? JSON.parse(await readFile(RUTA_VOZ, 'utf8')) : {escenas: {}};
voz.escenas ??= {};
await mkdir(CARPETA_AUDIO, {recursive: true});

// borrar audios de escenas que ya no existen
const ids = new Set(video.escenas.map((e) => e.id));
for (const id of Object.keys(voz.escenas)) {
	if (!ids.has(id)) {
		await rm(path.join(RAIZ, 'public', voz.escenas[id].audio), {force: true});
		delete voz.escenas[id];
		console.log(`- ${id}: eliminada (ya no está en el guion)`);
	}
}

for (const [i, escena] of video.escenas.entries()) {
	if (soloEscena && escena.id !== soloEscena) continue;
	const previa = voz.escenas[escena.id];
	const archivo = `voz/${escena.id}.mp3`;
	const vigente =
		previa &&
		previa.texto === escena.texto &&
		previa.voz === VOICE_ID &&
		previa.modelo === MODEL_ID &&
		existsSync(path.join(RAIZ, 'public', archivo));
	if (vigente && !forzar && !soloEscena) {
		console.log(`= ${escena.id}: sin cambios`);
		continue;
	}
	process.stdout.write(`> ${escena.id}: generando voz... `);
	const {audio, duracion, palabras} = await generar(escena, video.escenas[i - 1], video.escenas[i + 1]);
	await writeFile(path.join(RAIZ, 'public', archivo), audio);
	voz.escenas[escena.id] = {
		texto: escena.texto,
		audio: archivo,
		duracion: redondear(duracion),
		voz: VOICE_ID,
		modelo: MODEL_ID,
		palabras,
	};
	console.log(`listo (${duracion.toFixed(2)} s, ${palabras.length} palabras)`);
	// guardar después de cada escena por si algo falla a mitad de camino
	await writeFile(RUTA_VOZ, JSON.stringify(voz, null, 2) + '\n');
}

await writeFile(RUTA_VOZ, JSON.stringify(voz, null, 2) + '\n');
console.log('\nListo. data/voz.json actualizado. Ahora: npm run preview  o  npm run render');
