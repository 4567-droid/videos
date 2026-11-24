import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {AMARILLO, avance, Flecha, Garabato, GRIS, Palito, Pizarra, ROJO, Texto, tramo, Trazo} from '../componentes/Pizarra';
import type {CaraPalito} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Y quedate con esto: una recaída no borra tu progreso. Es información de qué señal te ganó.
 * Volvé a empezar sin castigarte." (enseñanza)
 * Un camino con banderitas de progreso. El personaje camina, tropieza con una piedra y cae; las
 * banderitas que ya pasó siguen marcadas ("progreso"), la piedra se marca como "señal" y el
 * personaje se levanta y sigue caminando.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
type P2 = [number, number];
const P: P2[] = [
	[150, 1250],
	[760, 1190],
	[250, 560],
	[930, 330],
];
const punto = (s: number): P2 => {
	const u = 1 - s;
	const a = u * u * u;
	const b = 3 * u * u * s;
	const c = 3 * u * s * s;
	const d = s * s * s;
	return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]];
};
const CAMINO = `M ${P[0][0]} ${P[0][1]} C ${P[1][0]} ${P[1][1]} ${P[2][0]} ${P[2][1]} ${P[3][0]} ${P[3][1]}`;
const ESCALA = 0.72;
const S_PIEDRA = 0.56;

const Bandera: React.FC<{s: number; p: number; marcada: number; meta?: boolean}> = ({s, p, marcada, meta = false}) => {
	const [x, y] = punto(s);
	const tela = `M ${x} ${y - 100} L ${x + 62} ${y - 80} L ${x} ${y - 60} Z`;
	return (
		<g>
			<Garabato forma={tela} caja={[x, y - 102, 64, 44]} p={marcada} color={meta ? ROJO : AMARILLO} paso={12} />
			<Trazo d={`M ${x} ${y} L ${x} ${y - 100}`} p={tramo(p, 0, 0.5)} ancho={7} />
			<Trazo d={tela} p={tramo(p, 0.4, 1)} ancho={6} />
		</g>
	);
};

export const TropiezoCamino: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento, duracion} = useEscena();
	const t = frame / 30;
	const fRecaida = momento('recaída');
	const fProgreso = momento('progreso');
	const fSenal = momento('señal');
	const fVolve = momento('volvé');
	const fCastigarte = momento('castigarte');

	const camino = avance(frame, 2, 34);
	const banderas = avance(frame, 20, 30);
	const persona = avance(frame, 4, 24);
	const piedra = avance(frame, 30, 16);
	// recorrido: camina, tropieza, queda en el piso, se levanta y sigue
	const s =
		frame < fVolve + 14
			? interpolate(frame, [12, fRecaida - 2], [0.05, S_PIEDRA - 0.035], clamp)
			: interpolate(frame, [fVolve + 14, duracion - 8], [S_PIEDRA - 0.02, 0.86], clamp);
	const cae = interpolate(frame, [fRecaida - 2, fRecaida + 8], [0, 1], clamp);
	const levanta = interpolate(frame, [fVolve, fVolve + 14], [0, 1], clamp);
	const caido = cae * (1 - levanta);
	const caminando = (frame > 12 && frame < fRecaida - 2) || frame > fVolve + 14;
	const paso = caminando ? Math.sin(t * 11) : 0;
	const [x, y] = punto(s);
	const marcadas = avance(frame, fProgreso - 6, 20);
	const senal = avance(frame, fSenal - 6, 20);
	const cara: CaraPalito = caido > 0.5 ? (frame < fRecaida + 20 ? 'o' : 'triste') : frame > fCastigarte ? 'sonrisa' : caido > 0.1 ? 'o' : 'sonrisa';
	const [px, py] = punto(S_PIEDRA);

	return (
		<Pizarra zoom={[1, 1.03]} foco={[540, 800]}>
			<Trazo d={CAMINO} p={camino} color="#E9E9DF" ancho={90} />
			<Trazo d={CAMINO} p={camino} ancho={7} />
			<Bandera s={0.2} p={banderas} marcada={marcadas} />
			<Bandera s={0.4} p={tramo(banderas, 0.2, 1)} marcada={tramo(marcadas, 0.3, 1)} />
			<Bandera s={0.995} p={tramo(banderas, 0.4, 1)} marcada={tramo(banderas, 0.6, 1)} meta />
			<Texto x={215} y={985} texto="progreso" p={marcadas} tam={58} color={NEGRO_TEXTO} />
			{/* piedra (la señal que te ganó) */}
			<Garabato forma={`M ${px - 34} ${py + 4} Q ${px - 30} ${py - 34} ${px} ${py - 32} Q ${px + 34} ${py - 30} ${px + 36} ${py + 4} Z`} caja={[px - 40, py - 40, 80, 50]} p={piedra} color={GRIS} paso={12} opacidad={0.8} />
			<Trazo d={`M ${px - 34} ${py + 4} Q ${px - 30} ${py - 34} ${px} ${py - 32} Q ${px + 34} ${py - 30} ${px + 36} ${py + 4} Z`} p={piedra} ancho={6} />
			<Flecha desde={[px + 230, py - 140]} hasta={[px + 50, py - 30]} curva={30} p={senal} color={ROJO} ancho={8} punta={26} />
			<Texto x={px + 250} y={py - 160} texto="señal" p={senal} tam={64} color={ROJO} negrita />

			<Palito
				x={x}
				y={y - 120 * ESCALA}
				p={persona}
				escala={ESCALA}
				cara={cara}
				giro={80 * caido}
				pose={{
					piernaI: [12 + 22 * paso, 6 * Math.max(0, paso)],
					piernaD: [12 - 22 * paso, 6 * Math.max(0, -paso)],
					brazoI: [24 - 18 * paso + 60 * caido, 8],
					brazoD: [24 + 18 * paso + 60 * caido, 8],
				}}
			/>
		</Pizarra>
	);
};
const NEGRO_TEXTO = '#1D1D24';
