import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {avance, CerebroPizarra, Flecha, Pizarra, rectangulo, ROJO, Texto, tramo, Trazo} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Estudios con imágenes cerebrales sugieren que, tras muchos meses sin consumir, parte de este
 * sistema puede recuperarse."
 * Dos "imágenes" de cerebro: a la izquierda, apagado (sombreado gris); a la derecha, el mismo
 * cerebro tras muchos meses, que recupera parte de sus zonas encendidas. Una flecha dice "meses".
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const DosCerebros: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const fSugieren = momento('sugieren');
	const fTras = momento('tras');
	const fParte = momento('parte');
	const fRecuperarse = momento('recuperarse', {fin: true});

	const marcos = avance(frame, 4, 26);
	const cerebros = avance(frame, 12, 44);
	const etiquetas = avance(frame, fSugieren - 6, 26);
	const flecha = avance(frame, fTras - 4, 26);
	const recupera = interpolate(frame, [fParte - 4, fRecuperarse + 4], [0, 1], clamp);

	return (
		<Pizarra zoom={[1, 1.03]}>
			<Trazo d={rectangulo(55, 470, 470, 470, 28)} p={marcos} ancho={6} />
			<Trazo d={rectangulo(555, 470, 470, 470, 28)} p={marcos} ancho={6} />
			<Texto x={290} y={430} texto="al principio" p={etiquetas} tam={52} />
			<Texto x={790} y={430} texto="tras muchos meses" p={tramo(etiquetas, 0.2, 1)} tam={52} />
			<CerebroPizarra x={300} y={690} p={cerebros} escala={0.68} apagado={tramo(cerebros, 0.6, 1)} circuito={0.15} />
			<CerebroPizarra
				x={800}
				y={690}
				p={tramo(cerebros, 0.1, 1)}
				escala={0.68}
				apagado={tramo(cerebros, 0.6, 1) * (1 - 0.75 * recupera)}
				zonas={recupera}
				circuito={0.15 + 0.55 * recupera}
			/>
			<Flecha desde={[300, 1010]} hasta={[780, 1010]} curva={110} p={flecha} color={ROJO} ancho={11} punta={36} />
			<Texto x={540} y={1150} texto="meses" p={tramo(flecha, 0.4, 1)} tam={80} color={ROJO} negrita />
		</Pizarra>
	);
};
