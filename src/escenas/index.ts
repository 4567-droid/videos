import type React from 'react';
import {BombaSangre} from './BombaSangre';
import {CorazonLatiendo} from './CorazonLatiendo';
import {CorredorPulso} from './CorredorPulso';
import {VidaEntera} from './VidaEntera';

/**
 * Registro de escenas: el campo "componente" de data/video.json
 * tiene que coincidir con una clave de este objeto.
 * Si no existe, se usa EscenaGenerica (formas flotando) como reemplazo.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ESCENAS: Record<string, React.FC<any>> = {
	CorazonLatiendo,
	CorredorPulso,
	BombaSangre,
	VidaEntera,
};
