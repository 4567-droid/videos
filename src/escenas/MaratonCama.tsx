import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {
	AMARILLO,
	avance,
	CabezaPalito,
	CamaPizarra,
	elipse,
	Garabato,
	Gota,
	NEGRO,
	NubePensamiento,
	Palito,
	Pizarra,
	poseCorrer,
	rectangulo,
	RelojPizarra,
	ROJO,
	Texto,
	tramo,
	Trazo,
	Zzz,
} from '../componentes/Pizarra';
import type {CaraPalito} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "¿Por qué hay días en que dormís ocho horas y te levantás como si hubieras corrido una
 * maratón... en sueños?"
 * Un palito duerme 8 horas; al despertarse se sienta despeinado, con ojeras enormes y la lengua
 * afuera. Con "maratón" aparece el arco de llegada ("META"), la cinta rota, la medalla y el
 * dorsal... y la cama tiene zapatillas. Con "en sueños" se vuelve a dormir y en la nube corre.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
type P2 = [number, number];
const CADERA: P2 = [540, 962];
const rot = (ang: number, [x, y]: P2): P2 => {
	const a = (ang * Math.PI) / 180;
	return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};

const Zapatilla: React.FC<{x: number; y: number; p: number}> = ({x, y, p}) => {
	const forma = `M ${x - 30} ${y} Q ${x - 32} ${y - 26} ${x - 6} ${y - 26} L ${x + 8} ${y - 14} Q ${x + 40} ${y - 12} ${x + 42} ${y} Z`;
	return (
		<g>
			<Garabato forma={forma} caja={[x - 34, y - 28, 78, 30]} p={p} color={ROJO} paso={10} opacidad={0.85} />
			<Trazo d={forma} p={p} ancho={6} />
			<Trazo d={`M ${x - 36} ${y + 4} L ${x + 46} ${y + 4}`} p={p} ancho={7} />
		</g>
	);
};

export const MaratonCama: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fOcho = momento('ocho');
	const fLevantas = momento('levantás');
	const fCorrido = momento('corrido');
	const fMaraton = momento('maratón');
	const fSuenos = momento('en sueños');

	const cama = avance(frame, 0, 26);
	const persona = avance(frame, 6, 22);
	const reloj = avance(frame, fOcho - 8, 18);
	const sienta = interpolate(frame, [fLevantas - 4, fLevantas + 12], [0, 1], clamp);
	const meta = avance(frame, fMaraton - 4, 16);
	const premio = avance(frame, fMaraton + 4, 14);
	const duerme = interpolate(frame, [fSuenos - 2, fSuenos + 10], [0, 1], clamp);
	const sueno = avance(frame, fSuenos - 2, 18);

	// el torso gira alrededor de la cadera: acostado (-90°) → sentado (-8°) → cabeceando
	const angulo = -90 + 82 * sienta + 14 * duerme;
	const hombro = rot(angulo, [0, -100]);
	const cuello = rot(angulo, [0, -122]);
	const cabeza = rot(angulo, [0, -160]);
	const [hx, hy] = [CADERA[0] + cabeza[0], CADERA[1] + cabeza[1]];
	const cara: CaraPalito = sienta < 0.5 || duerme > 0.5 ? 'dormido' : 'agotado';
	const jadeo = sienta > 0.5 && duerme < 0.5 ? 3 * Math.sin(t * 16) : 0;
	const [sx, sy] = [CADERA[0] + hombro[0], CADERA[1] + hombro[1]];
	const cinta = 6 * Math.sin(t * 7);

	return (
		<Pizarra zoom={[1, 1.05]} foco={[540, 820]}>
			{/* arco de llegada */}
			<Trazo d="M 160 1245 L 160 330" p={tramo(meta, 0, 0.5)} ancho={10} />
			<Trazo d="M 920 1245 L 920 330" p={tramo(meta, 0, 0.5)} ancho={10} />
			{meta > 0.3 ? (
				<g>
					<path d={rectangulo(140, 250, 800, 120, 14)} fill="#FFFFFF" opacity={tramo(meta, 0.3, 0.6)} />
					{[0, 1].map((col) =>
						[0, 1, 2].map((fil) => (
							<g key={`${col}-${fil}`}>
								<rect x={150 + col * 30} y={258 + fil * 36} width={30} height={36} fill={(col + fil) % 2 === 0 ? NEGRO : '#FFFFFF'} opacity={tramo(meta, 0.5, 0.8)} />
								<rect x={870 + col * 30} y={258 + fil * 36} width={30} height={36} fill={(col + fil) % 2 === 1 ? NEGRO : '#FFFFFF'} opacity={tramo(meta, 0.5, 0.8)} />
							</g>
						)),
					)}
					<Trazo d={rectangulo(140, 250, 800, 120, 14)} p={tramo(meta, 0.3, 0.7)} ancho={9} />
					<Texto x={540} y={346} texto="META" p={tramo(meta, 0.55, 1)} tam={104} color={ROJO} negrita />
				</g>
			) : null}
			{/* cinta cortada, flameando */}
			<Trazo d={`M 160 830 Q 230 ${870 + cinta} 300 ${905 - cinta}`} p={tramo(meta, 0.5, 1)} color={ROJO} ancho={12} />
			<Trazo d={`M 920 830 Q 860 ${872 - cinta} 790 ${900 + cinta}`} p={tramo(meta, 0.5, 1)} color={ROJO} ancho={12} />
			{/* rayitas de velocidad y polvo: la cama "llegó corriendo" */}
			{[0, 1, 2].map((i) => (
				<Trazo key={i} d={`M ${190 + i * 8} ${1010 + i * 34} L ${240 + i * 8} ${1010 + i * 34}`} p={tramo(premio, i * 0.15, 0.5 + i * 0.15)} ancho={7} opacidad={1 - 0.6 * duerme} />
			))}

			{/* reloj: 8 horas */}
			<RelojPizarra x={300} y={600} r={78} p={reloj} hora={7} minuto={0} campanas sacudir={interpolate(frame, [fLevantas - 6, fLevantas, fLevantas + 30, fLevantas + 40], [0, 1, 1, 0], clamp)} t={t} />
			<Texto x={300} y={765} texto="8 horas" p={avance(frame, fOcho, 14)} tam={58} />

			{/* la persona: torso y cabeza (se sientan); la manta tapa lo de abajo */}
			{persona > 0.01 ? (
				<g>
					<Trazo d={`M ${CADERA[0]} ${CADERA[1]} L ${CADERA[0] + cuello[0]} ${CADERA[1] + cuello[1]}`} p={tramo(persona, 0.3, 0.6)} ancho={8} />
					{sienta > 0.3 ? (
						<>
							<Trazo d={`M ${sx} ${sy} L ${sx + 30} ${sy + 60} L ${sx + 60 + jadeo} ${sy + 110}`} p={tramo(sienta, 0.3, 1)} ancho={8} />
							<Trazo d={`M ${sx} ${sy} L ${sx - 10} ${sy + 64} L ${sx + 20 - jadeo} ${sy + 112}`} p={tramo(sienta, 0.3, 1)} ancho={8} />
						</>
					) : null}
					<g transform={`translate(${hx} ${hy + jadeo}) rotate(${angulo})`}>
						<CabezaPalito p={tramo(persona, 0, 0.6)} cara={cara} pelo="despeinado" />
					</g>
					{/* medalla */}
					{premio > 0.01 ? (
						<g>
							<Trazo d={`M ${sx - 24} ${sy - 18} L ${sx + 4} ${sy + 46} L ${sx + 30} ${sy - 16}`} p={tramo(premio, 0, 0.5)} color={ROJO} ancho={7} />
							<circle cx={sx + 4} cy={sy + 70} r={24} fill={AMARILLO} opacity={tramo(premio, 0.4, 0.8)} />
							<Trazo d={elipse(sx + 4, sy + 70, 24)} p={tramo(premio, 0.4, 1)} ancho={6} />
							<Texto x={sx + 4} y={sy + 82} texto="1" p={tramo(premio, 0.8, 1)} tam={34} negrita />
						</g>
					) : null}
				</g>
			) : null}
			<CamaPizarra x={250} y={1010} ancho={560} p={cama} bulto={58} />
			{/* dorsal en la manta */}
			{premio > 0.01 ? (
				<g transform="rotate(-4 690 985)">
					<path d={rectangulo(630, 948, 120, 76, 8)} fill="#FFFFFF" opacity={tramo(premio, 0.2, 0.5)} />
					<Trazo d={rectangulo(630, 948, 120, 76, 8)} p={tramo(premio, 0, 0.5)} ancho={6} />
					<Texto x={690} y={1004} texto="42K" p={tramo(premio, 0.4, 1)} tam={48} color={ROJO} negrita />
				</g>
			) : null}
			{/* la cama tiene zapatillas */}
			<Zapatilla x={258} y={1124} p={tramo(premio, 0.2, 0.8)} />
			<Zapatilla x={818} y={1124} p={tramo(premio, 0.3, 0.9)} />

			{/* transpiración al sentarse */}
			{[0, 1].map((i) => {
				const k = ((t * 1.3 + i * 0.5) % 1) * (sienta > 0.5 && duerme < 0.5 ? 1 : 0);
				return <Gota key={i} x={hx + (i === 0 ? 62 : -60) + (i === 0 ? 30 : -30) * k} y={hy - 30 - 40 * Math.sin(k * Math.PI)} p={k > 0.02 ? Math.min(1, (1 - k) * 3) : 0} tam={0.9} />;
			})}
			<Zzz x={hx + 40} y={hy - 70} p={Math.max(1 - interpolate(frame, [fLevantas - 8, fLevantas], [0, 1], clamp), duerme)} t={t} />
			<Texto x={hx + 120} y={hy + 20} texto="uf..." p={avance(frame, fCorrido, 10) * (1 - duerme)} tam={56} />

			{/* el sueño: corría una maratón */}
			<NubePensamiento x={730} y={590} w={290} h={210} p={sueno} cola={[600, 760]} />
			{sueno > 0.6 ? (
				<g opacity={tramo(sueno, 0.6, 1)}>
					<Palito x={730} y={600} p={1} escala={0.5} cara="feliz" pose={poseCorrer(t * 14)} giro={10} />
					<Trazo d="M 640 650 L 690 650 M 630 620 L 670 620" p={1} ancho={5} />
				</g>
			) : null}
		</Pizarra>
	);
};
