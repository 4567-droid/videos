import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {avance, Bombilla, elipse, Flecha, GRIS, NEGRO, Palito, Pizarra, ROJO, Texto, tramo, Trazo} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Con el uso repetido, el cerebro se adapta: baja su sensibilidad y lo cotidiano puede empezar a
 * sentirse apagado. Suele hacer falta más para sentir lo mismo."
 * Palitos de conteo (repetición). Una lamparita brillante se va apagando; el personaje pasa de
 * sonreír a cara plana y sus cosas de todos los días (música, sol) se ponen grises.
 * Con "más", la luz sube un poquito y vuelve a bajar.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const LuzApagada: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const fUso = momento('uso');
	const fBaja = momento('baja');
	const fCotidiano = momento('cotidiano');
	const fApagado = momento('apagado', {fin: true});
	const fMas = momento('más');
	const fMismo = momento('mismo', {fin: true});

	const conteo = avance(frame, fUso - 2, 26);
	const lampara = avance(frame, 4, 34);
	const brillo = interpolate(
		frame,
		[24, 44, fBaja, fApagado + 10, fMas - 4, fMas + 6, fMismo + 4],
		[0, 1, 1, 0.12, 0.12, 0.45, 0.12],
		clamp,
	);
	const persona = avance(frame, 14, 34);
	const cosas = avance(frame, fCotidiano - 4, 22);
	const gris = interpolate(frame, [fApagado - 14, fApagado + 6], [1, 0.3], clamp);
	const mas = avance(frame, fMas - 8, 18);

	return (
		<Pizarra>
			{/* uso repetido: palitos de conteo */}
			{[0, 1].map((g) =>
				[0, 1, 2, 3].map((i) => (
					<Trazo key={`${g}-${i}`} d={`M ${150 + g * 170 + i * 28} 210 L ${150 + g * 170 + i * 28} 300`} p={tramo(conteo, g * 0.5 + i * 0.1, g * 0.5 + i * 0.1 + 0.12)} ancho={8} />
				)),
			)}
			{[0, 1].map((g) => (
				<Trazo key={`d${g}`} d={`M ${135 + g * 170} 285 L ${255 + g * 170} 225`} p={tramo(conteo, g * 0.5 + 0.4, g * 0.5 + 0.5)} color={ROJO} ancho={8} />
			))}

			<Bombilla x={320} y={700} p={lampara} brillo={brillo} escala={1.25} />
			<Flecha desde={[160, 1080]} hasta={[160, 880]} p={mas} color={ROJO} ancho={10} />
			<Texto x={300} y={1010} texto="+ más" p={mas} tam={80} color={ROJO} negrita />

			{/* lo cotidiano */}
			<g opacity={gris}>
				<Trazo d="M 690 610 L 690 520 L 745 505 L 745 590" p={cosas} ancho={8} />
				{cosas > 0.6 ? (
					<>
						<ellipse cx={676} cy={612} rx={17} ry={13} fill={NEGRO} />
						<ellipse cx={731} cy={592} rx={17} ry={13} fill={NEGRO} />
					</>
				) : null}
				<Trazo d={elipse(905, 560, 34)} p={cosas} ancho={7} />
				{new Array(8).fill(0).map((_, i) => {
					const a = (i / 8) * Math.PI * 2;
					return (
						<Trazo key={i} d={`M ${905 + Math.cos(a) * 48} ${560 + Math.sin(a) * 48} L ${905 + Math.cos(a) * 68} ${560 + Math.sin(a) * 68}`} p={tramo(cosas, 0.4, 1)} ancho={6} />
					);
				})}
			</g>
			<Palito x={800} y={1010} p={persona} escala={1.45} cara={frame > fCotidiano + 24 ? 'plana' : 'sonrisa'} color={NEGRO} />
			{frame > fApagado ? <Texto x={800} y={1290} texto="todo igual..." p={avance(frame, fApagado, 16)} tam={46} color={GRIS} /> : null}
		</Pizarra>
	);
};
