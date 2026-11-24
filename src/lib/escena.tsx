import {createContext, useContext} from 'react';
import {buscarPalabra} from './estimacion';
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
		const encontrada = buscarPalabra(
			escena.palabras.map((p) => p.texto),
			busqueda,
			opciones.ocurrencia ?? 1,
		);
		if (!encontrada) {
			console.warn(`[escena ${escena.id}] No encontré "${busqueda}" en el texto. Uso el inicio de la escena.`);
			return 0;
		}
		return opciones.fin ? escena.palabras[encontrada.fin].fin : escena.palabras[encontrada.inicio].inicio;
	};

	return {...escena, momento};
};
