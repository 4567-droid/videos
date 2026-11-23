import type React from 'react';
import {AbejaEnojada} from './AbejaEnojada';
import {AbejaGancho} from './AbejaGancho';
import {BombaSangre} from './BombaSangre';
import {CaraEnFlor} from './CaraEnFlor';
import {CerebrosComparados} from './CerebrosComparados';
import {CorazonLatiendo} from './CorazonLatiendo';
import {CorredorPulso} from './CorredorPulso';
import {ExperimentoCaras} from './ExperimentoCaras';
import {JardinConOjos} from './JardinConOjos';
import {MemoriaDias} from './MemoriaDias';
import {VidaEntera} from './VidaEntera';

/**
 * Registro de escenas: el campo "componente" de data/video.json
 * tiene que coincidir con una clave de este objeto.
 * Si no existe, se usa EscenaGenerica (formas flotando) como reemplazo.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ESCENAS: Record<string, React.FC<any>> = {
	// reel: el corazón late 100 mil veces por día
	CorazonLatiendo,
	CorredorPulso,
	BombaSangre,
	VidaEntera,
	// reel: las abejas reconocen caras humanas
	AbejaGancho,
	CerebrosComparados,
	ExperimentoCaras,
	MemoriaDias,
	CaraEnFlor,
	JardinConOjos,
	AbejaEnojada,
};
