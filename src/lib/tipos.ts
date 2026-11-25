// ---------- Lo que vive en data/video.json ----------
/**
 * Transiciones: "zoom", "deslizar", "fundido", "destello" (un fogonazo de luz, para los giros) y,
 * en la pizarra, "borrar" (un borrador pasa).
 * Las variantes "borrar-saludo", "borrar-cansado" y "borrar-giro" duran un poco más
 * porque el borrador hace un gesto gracioso (saluda, se cansa a mitad de camino, gira).
 */
export type TipoTransicion = 'zoom' | 'deslizar' | 'fundido' | 'destello' | 'borrar' | 'borrar-saludo' | 'borrar-cansado' | 'borrar-giro';

/** Silencio extra (pausa cómica) antes de una palabra o frase del texto. */
export type PausaJSON = {
	/** palabra o frase ANTES de la cual se hace la pausa (se busca como en `momento`) */
	antes: string;
	segundos: number;
	/** si la frase aparece varias veces, cuál (1 = la primera) */
	ocurrencia?: number;
};

/** Palabra clave que aparece grande en pantalla, con un golpe, cuando la voz la dice. */
export type ClaveJSON = {
	/** palabra o frase del texto que la dispara (se busca como en `momento`) */
	palabra: string;
	/** lo que se muestra (por defecto, la palabra en mayúsculas) */
	texto?: string;
	ocurrencia?: number;
	/** color del texto (por defecto, turquesa) */
	color?: string;
	/** altura del centro en píxeles (por defecto 1480, en la zona de etiquetas) */
	y?: number;
};

export type EscenaJSON = {
	/** Identificador único (se usa para los archivos de voz). */
	id: string;
	/** Nombre del componente en src/escenas/index.ts */
	componente: string;
	/** La frase que se dice y se subtitula en esta escena. */
	texto: string;
	/** Props opcionales que recibe el componente de la escena. */
	props?: Record<string, unknown>;
	/** Transición de ENTRADA a esta escena (por defecto "zoom", o "borrar" en la pizarra). */
	transicion?: TipoTransicion;
	/** Pausas cómicas o dramáticas: se agrega silencio a la voz (sin regenerarla) y se corren los tiempos. */
	pausas?: PausaJSON[];
	/** Multiplica el `ritmo` general en esta escena (1.05 = 5 % más rápido): sirve para acelerar hacia el final. */
	ritmo?: number;
	/** Palabras clave que aparecen grandes con un golpe de animación (y un pequeño zoom de toda la imagen). */
	claves?: ClaveJSON[];
};

export type VideoJSON = {
	tema: string;
	titulo: string;
	/**
	 * Opcional, para todo el video:
	 *  - velocidad: velocidad con la que ElevenLabs genera la voz (0,7–1,2; requiere `npm run voz`)
	 *  - ritmo: acelera o frena el audio ya generado al reproducirlo (mismo tono, sin regenerar)
	 */
	voz?: {velocidad?: number; ritmo?: number; estabilidad?: number; estilo?: number};
	/** "pizarra": fondo blanco con dibujos a marcador, subtítulos abajo y transición de borrado */
	estilo?: 'pizarra';
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
	/** true si el script ya normalizó el volumen del mp3 */
	normalizado?: boolean;
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
	transicion: TipoTransicion;
	/** duración (frames) de la transición de entrada */
	duracionTransicion: number;
	/** frame global donde empieza la escena (incluye la transición de entrada) */
	inicio: number;
	/** duración total en frames */
	duracion: number;
	palabras: Palabra[];
	/** true si los tiempos vienen de ElevenLabs y no de la estimación */
	conVoz: boolean;
	/**
	 * Audio de ElevenLabs, en tramos (más de uno si hay pausas cómicas). Cada tramo empieza
	 * `desde` frames después del inicio de la escena y arranca `recorte` frames dentro del mp3.
	 */
	audio: {src: string; velocidad: number; tramos: {desde: number; duracion: number; recorte: number}[]} | null;
	/** palabras clave ya ubicadas (frame relativo a la escena) */
	claves: {texto: string; inicio: number; color?: string; y?: number}[];
};

export type LineaDeTiempo = {
	escenas: EscenaCalculada[];
	duracionTotal: number;
};
