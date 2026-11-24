import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {
	avance,
	CabezaPalito,
	Estrella,
	Flecha,
	Garabato,
	GRIS,
	LunaPizarra,
	NEGRO,
	Pizarra,
	RelojPizarra,
	ROJO,
	SolPizarra,
	Texto,
	tramo,
	Trazo,
} from '../componentes/Pizarra';
import type {CaraPalito} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';
import {cortisol, muestrear, polilinea, puntoEnPolilinea} from './curvas-hormonas';

/**
 * "Su nivel sube a la mañana, suele llegar a su pico a los treinta o cuarenta minutos de
 * despertar, y baja de a poco durante el día."
 * Gráfico de 24 h: la curva del cortisol es una montaña rusa. Un carrito con un palito sube
 * la cuesta de la mañana (asustado), grita "¡wiii!" en el pico (30–40 min después de despertar)
 * y después baja... despacito, todo el día, bostezando.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const X0 = 150;
const ANCHO = 800;
const BASE = 1150;
const ALTO = 700;
const aPixel = (h: number, c: number): [number, number] => [X0 + (ANCHO * h) / 24, BASE - ALTO * c];
const SUBIDA = muestrear(cortisol, 0, 7.6, aPixel, 120);
const BAJADA = muestrear(cortisol, 7.6, 24, aPixel, 120);
const SOPORTES = [1, 3, 5, 6.5, 9.5, 12, 14.5, 17, 19.5, 22];

export const MontanaRusaCortisol: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento, duracion} = useEscena();
	const t = frame / 30;
	const fManana = momento('mañana');
	const fPico = momento('pico');
	const fTreinta = momento('treinta');
	const fDespertar = momento('despertar');
	const fBaja = momento('baja');
	const fPoco = momento('poco');
	const fDia = momento('día');

	const ejes = avance(frame, 0, 18);
	const sube = interpolate(frame, [8, fPico], [0, 1], clamp);
	const baja = interpolate(frame, [fBaja - 6, duracion - 12], [0, 1], clamp);
	const carro = baja > 0 ? puntoEnPolilinea(BAJADA, baja) : puntoEnPolilinea(SUBIDA, sube);
	const enPico = frame >= fPico - 2 && baja < 0.04;
	const cara: CaraPalito = baja > 0.15 ? (frame > fPoco ? 'bostezo' : 'fastidio') : enPico ? 'feliz' : 'asustado';
	const brazosArriba = enPico ? 1 : 0;
	const sol = avance(frame, fManana - 6, 20);
	const luna = avance(frame, fDia - 10, 18);

	return (
		<Pizarra zoom={[1, 1.04]} foco={[540, 800]}>
			{/* ejes */}
			<Trazo d={`M ${X0} ${BASE} L ${X0} 420 M ${X0 - 16} 446 L ${X0} 420 L ${X0 + 16} 446`} p={ejes} ancho={7} />
			<Trazo d={`M ${X0} ${BASE} L 975 ${BASE} M 949 ${BASE - 16} L 975 ${BASE} L 949 ${BASE + 16}`} p={ejes} ancho={7} />
			<Texto x={96} y={790} texto="cortisol" p={tramo(ejes, 0.4, 1)} tam={54} rotar={-90} negrita />
			{[0, 6, 12, 18, 24].map((h, i) => (
				<Texto key={h} x={aPixel(h, 0)[0]} y={BASE + 58} texto={h === 0 ? '0 h' : h === 24 ? '24 h' : String(h)} p={tramo(ejes, 0.3 + i * 0.12, 0.6 + i * 0.1)} tam={46} />
			))}
			{/* estructura de la montaña rusa: aparece por donde ya pasó el carrito */}
			{SOPORTES.map((h, i) => {
				const [x, y] = aPixel(h, cortisol(h));
				const pasado = tramo(carro.x - x, 0, 70) * (h < 7.6 || baja > 0 ? 1 : 0);
				const sig = SOPORTES[i + 1];
				const [x2, y2] = sig ? aPixel(sig, cortisol(sig)) : [x, y];
				return (
					<g key={h}>
						<Trazo d={`M ${x} ${y + 10} L ${x} ${BASE}`} p={pasado} color={GRIS} ancho={6} />
						{sig && sig < 24 ? (
							<Trazo d={`M ${x} ${BASE} L ${x2} ${Math.max(y2 + 20, BASE - 0.55 * (BASE - y2))} M ${x} ${Math.max(y + 20, BASE - 0.55 * (BASE - y))} L ${x2} ${BASE}`} p={pasado * tramo(carro.x - x2, 0, 60)} color={GRIS} ancho={4} />
						) : null}
					</g>
				);
			})}
			{/* la curva (vía) */}
			<Trazo d={polilinea(SUBIDA)} p={sube} color={ROJO} ancho={11} />
			<Trazo d={polilinea(BAJADA)} p={baja} color={ROJO} ancho={11} />

			{/* despertar */}
			<RelojPizarra x={232} y={600} r={44} p={avance(frame, fDespertar - 8, 14)} hora={7} minuto={0} campanas sacudir={frame > fDespertar ? 1 : 0} t={t} />
			<Texto x={232} y={712} texto="despertar" p={avance(frame, fDespertar - 2, 14)} tam={44} />
			{frame > fDespertar - 4 ? (
				<path d={`M ${aPixel(7, 0)[0]} ${BASE} L ${aPixel(7, 0)[0]} ${aPixel(7, 0.6)[1]}`} stroke={NEGRO} strokeWidth={5} strokeDasharray="14 12" opacity={avance(frame, fDespertar - 4, 10)} />
			) : null}
			<Flecha desde={[290, 728]} hasta={[372, 760]} curva={-14} p={avance(frame, fDespertar + 4, 12)} ancho={6} punta={20} />
			{/* pico */}
			<Texto x={600} y={432} texto="¡pico!" p={avance(frame, fPico - 2, 12)} tam={66} color={ROJO} negrita />
			<Flecha desde={[520, 420]} hasta={[432, 446]} curva={-12} p={avance(frame, fPico + 4, 10)} ancho={6} punta={20} />
			<Texto x={612} y={505} texto="30–40 min" p={avance(frame, fTreinta - 2, 18)} tam={52} />
			<Texto x={612} y={556} texto="después de despertar" p={avance(frame, fDespertar - 2, 18)} tam={38} color="#6B6B78" />

			{/* sol (mañana) y luna (noche) */}
			<SolPizarra x={430} y={240} p={sol} escala={0.85} cara="feliz" giro={t * 25} />
			<LunaPizarra x={880} y={430} p={luna} escala={1.05} cara="dormido" />
			<Estrella x={800} y={350} r={16} p={tramo(luna, 0.4, 1)} />
			<Estrella x={950} y={540} r={12} p={tramo(luna, 0.6, 1)} />

			{/* carrito con el palito */}
			<g transform={`translate(${carro.x} ${carro.y}) rotate(${carro.angulo})`}>
				<g transform={`rotate(${-carro.angulo * 0.6})`}>
					<Trazo d="M 0 -48 L 0 -26" p={1} ancho={6} />
					<Trazo
						d={brazosArriba ? 'M 0 -42 L -18 -72 M 0 -42 L 18 -72' : baja > 0.15 ? 'M 0 -40 L 20 -30 L 8 -56' : 'M 0 -42 L -22 -28 M 0 -42 L 22 -28'}
						p={1}
						ancho={6}
					/>
					<g transform="translate(0 -66) scale(0.42)">
						<CabezaPalito p={1} cara={cara} />
					</g>
				</g>
				<Garabato forma="M -36 -34 L 36 -34 L 30 -6 L -30 -6 Z" caja={[-38, -36, 76, 32]} p={1} color={ROJO} paso={10} opacidad={0.8} />
				<Trazo d="M -36 -34 L 36 -34 L 30 -6 L -30 -6 Z" p={1} ancho={6} />
				<circle cx={-18} cy={-2} r={8} fill="#FFFFFF" stroke={NEGRO} strokeWidth={5} />
				<circle cx={18} cy={-2} r={8} fill="#FFFFFF" stroke={NEGRO} strokeWidth={5} />
			</g>
			{enPico ? <Texto x={300} y={360} texto="¡wiii!" p={avance(frame, fPico - 2, 8)} tam={58} rotar={-10} negrita /> : null}
			{baja > 0.15 ? <Texto x={carro.x + 70} y={carro.y - 90} texto="..." p={1} tam={60} /> : null}
		</Pizarra>
	);
};
