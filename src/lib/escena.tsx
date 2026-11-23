import {createContext, useContext} from 'react';
import {normalizar} from './estimacion';
import type {EscenaCalculada} from './tipos';

export const EscenaContext = createContext<EscenaCalculada | null>(null);

type OpcionesMomento = {
	/** Si la palabra aparece varias veces, cuál usar (1 = la primera). */
	ocurrencia?: number;
	/** true = devuelve el frame en el que TERMINA la palabra. */
	fin?: boolean;
};

/**
 * Datos de la escena actual + `momento("palabra")`, que devuelve el frame
 * (relativo a la escena) en el que se dice esa palabra. Sirve para sincronizar
 * la animación con el guion, tanto con tiempos estimados como con voz real.
 */
export const useEscena = () => {
	const escena = useContext(EscenaContext);
	if (!escena) {
		throw new Error('useEscena() solo funciona dentro de una escena del Reel.');
	}

	const momento = (busqueda: string, opciones: OpcionesMomento = {}): number => {
		const objetivo = busqueda.split(/\s+/).map(normalizar).filter(Boolean);
		const palabras = escena.palabras.map((p) => normalizar(p.texto));
		const buscar = (coincide: (palabra: string, obj: string) => boolean) => {
			let vistas = 0;
			for (let i = 0; i + objetivo.length <= palabras.length; i++) {
				if (objetivo.every((o, j) => coincide(palabras[i + j], o))) {
					vistas++;
					if (vistas === (opciones.ocurrencia ?? 1)) {
						return opciones.fin ? escena.palabras[i + objetivo.length - 1].fin : escena.palabras[i].inicio;
					}
				}
			}
			return null;
		};
		const frame = buscar((p, o) => p === o) ?? buscar((p, o) => p.startsWith(o));
		if (frame === null) {
			console.warn(`[escena ${escena.id}] No encontré "${busqueda}" en el texto. Uso el inicio de la escena.`);
			return 0;
		}
		return frame;
	};

	return {...escena, momento};
};
