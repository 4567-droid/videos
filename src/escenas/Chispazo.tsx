import React from 'react';
import {useCurrentFrame} from 'remotion';
import {AMARILLO, avance, Brillo, CerebroPizarra, elipse, GRIS, NEGRO, Pizarra, rectangulo, ROJO, Texto, Tilde, tramo, Trazo} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Por eso, aguantar en ese período suele ser más fácil que después de volver a consumir. Un solo
 * consumo puede encender de nuevo el circuito, y las ganas pueden volver con más fuerza."
 * Arriba, dos cuadritos: "aguantar" (ola chica, con tilde) y "volver a consumir" (ola grande).
 * Abajo, un circuito apagado alrededor de un cerebro: un chispazo rojo lo enciende entero.
 */
const LAZO = 'M 200 690 L 880 690 L 880 1240 L 200 1240 Z';
const NODOS: [number, number][] = [
	[200, 690],
	[540, 690],
	[880, 690],
	[880, 1240],
	[540, 1240],
	[200, 1240],
];
// fracción del lazo en la que el brillo pasa por cada nodo (perímetro 2460)
const POS_NODO = [0, 0.138, 0.276, 0.5, 0.638, 0.776];

const olaChica = (x0: number, y0: number, amp: number, ciclos: number) => {
	let d = '';
	for (let i = 0; i <= 60; i++) {
		const k = i / 60;
		d += `${i === 0 ? 'M' : 'L'} ${(x0 + 330 * k).toFixed(1)} ${(y0 - amp * Math.sin(k * Math.PI * 2 * ciclos)).toFixed(1)} `;
	}
	return d;
};

export const Chispazo: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const fAguantar = momento('aguantar');
	const fFacil = momento('fácil');
	const fDespues = momento('después');
	const fUn = momento('un');
	const fEncender = momento('encender');
	const fGanas = momento('ganas');

	const panelA = avance(frame, fAguantar - 6, 24);
	const tilde = avance(frame, fFacil, 12);
	const panelB = avance(frame, fDespues - 4, 26);
	const lazo = avance(frame, 6, 40);
	const cerebro = avance(frame, 16, 40);
	const chispa = avance(frame, fUn - 2, 14);
	const enciende = avance(frame, fEncender - 4, 40);
	const ganas = avance(frame, fGanas - 6, 22);

	return (
		<Pizarra zoom={[1, 1.04]} foco={[540, 900]}>
			{/* cuadritos de arriba */}
			<Trazo d={rectangulo(80, 200, 430, 290, 22)} p={panelA} ancho={6} />
			<Trazo d={olaChica(130, 350, 22, 3)} p={tramo(panelA, 0.3, 1)} color={NEGRO} ancho={8} />
			<Texto x={295} y={548} texto="aguantar" p={tramo(panelA, 0.4, 1)} tam={54} />
			<Tilde x={455} y={250} p={tilde} tam={50} />
			<Trazo d={rectangulo(570, 200, 430, 290, 22)} p={panelB} ancho={6} />
			<Trazo d={olaChica(620, 350, 115, 3)} p={tramo(panelB, 0.3, 1)} color={ROJO} ancho={9} />
			<Texto x={785} y={548} texto="volver a consumir" p={tramo(panelB, 0.4, 1)} tam={50} />

			{/* circuito */}
			<Trazo d={LAZO} p={lazo} color={GRIS} ancho={10} />
			{enciende > 0.01 ? <Trazo d={LAZO} p={enciende} color={AMARILLO} ancho={26} opacidad={0.95} /> : null}
			{NODOS.map(([x, y], i) => {
				const encendido = enciende > POS_NODO[i] + 0.02 || (i === 0 && chispa > 0.6);
				return (
					<g key={i}>
						<Brillo x={x} y={y} r={60} intensidad={encendido ? 0.9 : 0} />
						{lazo > 0.2 + i * 0.12 ? <circle cx={x} cy={y} r={17} fill={encendido ? ROJO : '#FFFFFF'} stroke={NEGRO} strokeWidth={6} /> : null}
					</g>
				);
			})}
			<CerebroPizarra x={545} y={960} p={cerebro} escala={0.45} circuito={enciende} />
			{/* chispazo */}
			<Brillo x={200} y={690} r={110} intensidad={chispa > 0.5 ? 1 - tramo(enciende, 0.2, 0.6) : 0} />
			<Trazo d="M 280 560 L 215 640 L 262 645 L 196 712" p={chispa} color={ROJO} ancho={12} />
			<Trazo d={elipse(200, 690, 42)} p={tramo(chispa, 0.6, 1)} color={AMARILLO} ancho={8} />
			<Texto x={540} y={800} texto="GANAS" p={ganas} tam={96} color={ROJO} negrita />
			{ganas > 0.4
				? [-1, 1].map((l) => <Trazo key={l} d={`M ${540 + l * 200} 790 l 0 -70 m -18 22 l 18 -22 l 18 22`} p={tramo(ganas, 0.4, 1)} color={ROJO} ancho={9} />)
				: null}
		</Pizarra>
	);
};
