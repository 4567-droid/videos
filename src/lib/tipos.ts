// ---------- Lo que vive en data/video.json ----------
export type EscenaJSON = {
	/** Identificador único (se usa para los archivos de voz). */
	id: string;
	/** Nombre del componente en src/escenas/index.ts */
	componente: string;
	/** La frase que se dice y se subtitula en esta escena. */
	texto: string;
	/** Props opcionales que recibe el componente de la escena. */
	props?: Record<string, unknown>;
	/** Transición de ENTRADA a esta escena: "zoom" (por defecto), "deslizar" o "fundido". */
	transicion?: 'zoom' | 'deslizar' | 'fundido';
};

export type VideoJSON = {
	tema: string;
	titulo: string;
	escenas: EscenaJSON[];
};

// ---------- Lo que genera scripts/voz.mjs en data/voz.json ----------
export type PalabraVoz = {
	texto: string;
	/** segundos desde el inicio del audio de la escena */
	inicio: number;
	fin: number;
};

export type VozEscena = {
	/** Texto con el que se generó el audio (si cambia, se vuelve a la estimación). */
	texto: string;
	/** Ruta dentro de public/, por ejemplo "voz/gancho.mp3" */
	audio: string;
	/** Duración del audio en segundos */
	duracion: number;
	palabras: PalabraVoz[];
};

export type VozJSON = {
	escenas: Record<string, VozEscena>;
};

// ---------- Lo que calcula la línea de tiempo (en frames) ----------
export type Palabra = {
	texto: string;
	/** frame de inicio, relativo al inicio de la escena */
	inicio: number;
	/** frame de fin, relativo al inicio de la escena */
	fin: number;
};

export type EscenaCalculada = {
	id: string;
	indice: number;
	esUltima: boolean;
	componente: string;
	texto: string;
	props: Record<string, unknown>;
	transicion: 'zoom' | 'deslizar' | 'fundido';
	/** frame global donde empieza la escena (incluye la transición de entrada) */
	inicio: number;
	/** duración total en frames */
	duracion: number;
	palabras: Palabra[];
	/** true si los tiempos vienen de ElevenLabs y no de la estimación */
	conVoz: boolean;
	/** Audio de ElevenLabs: empieza `desde` frames después del inicio de la escena. */
	audio: {src: string; desde: number; duracion: number} | null;
};

export type LineaDeTiempo = {
	escenas: EscenaCalculada[];
	duracionTotal: number;
};
