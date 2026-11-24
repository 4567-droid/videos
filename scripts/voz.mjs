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
 *   npm run voz -- --voces         lista las voces de tu cuenta (primero las que hablan español)
 *
 * Variables (en .env o en el entorno; .env nunca se sube al repo):
 *   ELEVENLABS_API_KEY   (obligatoria)
 *   VOICE_ID             (obligatoria para generar; también se acepta ELEVENLABS_VOICE_ID)
 *   ELEVENLABS_MODEL_ID  (opcional, por defecto eleven_multilingual_v2)
 */
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync, renameSync, rmSync, statSync} from 'node:fs';
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
const VOICE_ID = process.env.VOICE_ID || process.env.ELEVENLABS_VOICE_ID;
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

if (!API_KEY) {
	console.error('Falta ELEVENLABS_API_KEY (copiá .env.example a .env y completalo).');
	process.exit(1);
}

// --- npm run voz -- --voces : listar voces disponibles ---
if (args.includes('--voces')) {
	const res = await fetch('https://api.elevenlabs.io/v1/voices', {headers: {'xi-api-key': API_KEY}});
	if (!res.ok) {
		console.error(`ElevenLabs respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
		process.exit(1);
	}
	const {voices} = await res.json();
	const idiomas = (v) => [...new Set((v.verified_languages ?? []).map((l) => [l.language, l.accent, l.locale].filter(Boolean).join('/')))];
	const hablaEspanol = (v) =>
		(v.verified_languages ?? []).some((l) => l.language === 'es') ||
		/spanish|español|espanol|argentin|latin|mexic|castilian|colombian|chilean|rioplat/i.test(
			[v.name, v.description, ...Object.values(v.labels ?? {})].join(' '),
		);
	const ordenadas = [...voices].sort((a, b) => Number(hablaEspanol(b)) - Number(hablaEspanol(a)));
	for (const v of ordenadas) {
		const l = v.labels ?? {};
		console.log(
			`${hablaEspanol(v) ? 'ES' : '  '}  ${v.name.padEnd(26)} ${v.voice_id}  ${[l.gender, l.age, l.accent, l.description, l.use_case].filter(Boolean).join(', ')}` +
				(idiomas(v).length ? `  [${idiomas(v).join(' ')}]` : ''),
		);
	}
	console.log(`\n${voices.length} voces. Copiá el ID elegido en .env como VOICE_ID=...`);
	process.exit(0);
}

if (!VOICE_ID) {
	console.error('Falta VOICE_ID en .env (listá las voces con: npm run voz -- --voces).');
	process.exit(1);
}

const separarPalabras = (texto) => texto.trim().split(/\s+/).filter(Boolean);

/**
 * Normaliza el volumen del mp3 (−16 LUFS, pico real ≤ −1,5 dB) con el ffmpeg que trae
 * Remotion: todas las escenas suenan parejas y a un nivel adecuado para redes.
 */
const VOLUMEN_OBJETIVO = 'loudnorm=I=-16:TP=-1.5:LRA=11';
const normalizarVolumen = (ruta) => {
	const temporal = ruta.replace(/\.mp3$/, '.tmp.mp3');
	const r = spawnSync(
		'npx',
		['--no-install', 'remotion', 'ffmpeg', '-y', '-v', 'error', '-i', ruta, '-af', VOLUMEN_OBJETIVO, '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', `${KBPS}k`, temporal],
		{cwd: RAIZ, encoding: 'utf8', shell: process.platform === 'win32'},
	);
	if (r.status !== 0 || !existsSync(temporal)) {
		rmSync(temporal, {force: true});
		console.warn(`  ⚠ No pude normalizar el volumen de ${path.basename(ruta)}; queda como vino.`);
		return false;
	}
	renameSync(temporal, ruta);
	return true;
};

const duracionMp3 = (ruta) => (statSync(ruta).size * 8) / (KBPS * 1000);
const redondear = (n) => Math.round(n * 1000) / 1000;

/**
 * Agrupa la alineación por caracteres de ElevenLabs en palabras (separadas por espacios).
 * Inicio y fin se toman de la primera y la última LETRA/CIFRA: ElevenLabs le asigna
 * a los signos finales ("," ".") la pausa que viene después, y eso no es habla.
 */
const palabrasDesdeAlineacion = (alineacion) => {
	const {characters, character_start_times_seconds: inicios, character_end_times_seconds: fines} = alineacion;
	const esLetra = (ch) => /[\p{L}\p{N}]/u.test(ch);
	const palabras = [];
	let actual = null;
	const cerrar = () => {
		if (actual) palabras.push({texto: actual.texto, inicio: actual.inicioLetra ?? actual.inicio, fin: actual.finLetra ?? actual.fin});
		actual = null;
	};
	characters.forEach((ch, i) => {
		if (/\s/.test(ch)) return cerrar();
		if (!actual) actual = {texto: '', inicio: inicios[i], fin: fines[i], inicioLetra: null, finLetra: null};
		actual.texto += ch;
		actual.fin = fines[i];
		if (esLetra(ch)) {
			actual.inicioLetra ??= inicios[i];
			actual.finLetra = fines[i];
		}
	});
	cerrar();
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

const generar = async (escena, anterior, siguiente, velocidad) => {
	const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(VOICE_ID)}/with-timestamps?output_format=${FORMATO}`;
	const cuerpo = {
		text: escena.texto,
		model_id: MODEL_ID,
		voice_settings: {
			stability: 0.45,
			similarity_boost: 0.8,
			style: 0.3,
			use_speaker_boost: true,
			...(velocidad !== 1 ? {speed: velocidad} : {}),
		},
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
	// Cómo "leyó" ElevenLabs el texto (útil para revisar números: "100 mil" -> "cien mil")
	const normalizado = datos.normalized_alignment?.characters?.join('').trim();
	if (normalizado && normalizado !== escena.texto.trim()) console.log(`\n  leído como: "${normalizado}"`);
	return {audio, finHabla, palabras: alinearConGuion(escena.texto, palabrasAudio, finHabla)};
};

const video = JSON.parse(await readFile(RUTA_VIDEO, 'utf8'));
// velocidad de la voz para todo el video (opcional en data/video.json: "voz": {"velocidad": 1.05}; ElevenLabs acepta 0,7–1,2)
const VELOCIDAD = Math.min(1.2, Math.max(0.7, Number(video.voz?.velocidad ?? 1)));
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
		(previa.velocidad ?? 1) === VELOCIDAD &&
		existsSync(path.join(RAIZ, 'public', archivo));
	const rutaAudio = path.join(RAIZ, 'public', archivo);
	if (vigente && !forzar && !soloEscena) {
		if (!previa.normalizado && normalizarVolumen(rutaAudio)) {
			previa.normalizado = true;
			previa.duracion = redondear(Math.max(previa.palabras.at(-1)?.fin ?? 0, duracionMp3(rutaAudio)));
			console.log(`= ${escena.id}: sin cambios de texto (volumen normalizado)`);
		} else {
			console.log(`= ${escena.id}: sin cambios`);
		}
		continue;
	}
	process.stdout.write(`> ${escena.id}: generando voz... `);
	const {audio, finHabla, palabras} = await generar(escena, video.escenas[i - 1], video.escenas[i + 1], VELOCIDAD);
	await writeFile(rutaAudio, audio);
	const normalizado = normalizarVolumen(rutaAudio);
	const duracion = Math.max(finHabla, duracionMp3(rutaAudio));
	voz.escenas[escena.id] = {
		texto: escena.texto,
		audio: archivo,
		duracion: redondear(duracion),
		voz: VOICE_ID,
		modelo: MODEL_ID,
		velocidad: VELOCIDAD,
		normalizado,
		palabras,
	};
	console.log(`listo (${duracion.toFixed(2)} s, ${palabras.length} palabras${normalizado ? ', volumen normalizado' : ''})`);
	// guardar después de cada escena por si algo falla a mitad de camino
	await writeFile(RUTA_VOZ, JSON.stringify(voz, null, 2) + '\n');
}

await writeFile(RUTA_VOZ, JSON.stringify(voz, null, 2) + '\n');
console.log('\nListo. data/voz.json actualizado. Ahora: npm run preview  o  npm run render');
