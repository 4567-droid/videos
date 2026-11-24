import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {
	AMARILLO,
	avance,
	AZUL_CLARO,
	Celular,
	elipse,
	Estrella,
	Flecha,
	Garabato,
	Palito,
	Pizarra,
	rectangulo,
	ROJO,
	ROSA,
	Texto,
	tramo,
	Trazo,
} from '../componentes/Pizarra';
import type {CaraPalito} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Tu cuerpo es un reloj suizo. Lo único que no encaja es el celular, que te dice: “solo un video
 * más”. Y vos mirando este." (cierre gracioso)
 * Engranajes perfectos girando, con el sello suizo. Un celular se mete entre dos engranajes y los
 * traba (¡CLANC!), y dice "solo un video más". Al final, un palito con el celular en la mano mira
 * a cámara y guiña el ojo: "este video".
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
type P2 = [number, number];
const polar = (r: number, a: number): string => `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
const engranaje = (r: number, n: number) => {
	const pts: string[] = [];
	const paso = (Math.PI * 2) / n;
	for (let i = 0; i < n; i++) {
		const a0 = i * paso;
		pts.push(polar(r - 10, a0), polar(r + 14, a0 + paso * 0.14), polar(r + 14, a0 + paso * 0.42), polar(r - 10, a0 + paso * 0.56));
	}
	return `M ${pts.join(' L ')} Z`;
};
const G1: P2 = [430, 640];
const R1 = 180;
const desde = (ang: number, d: number): P2 => [G1[0] + Math.cos((ang * Math.PI) / 180) * d, G1[1] + Math.sin((ang * Math.PI) / 180) * d];
const R2 = 115;
const G2 = desde(-35, R1 + R2);
const R3 = 90;
const G3 = desde(40, R1 + R3);
const TRABA = desde(-35, R1);

const Engranaje: React.FC<{c: P2; r: number; n: number; giro: number; p: number; color: string}> = ({c, r, n, giro, p, color}) => {
	const forma = engranaje(r, n);
	return (
		<g transform={`translate(${c[0]} ${c[1]}) rotate(${giro})`}>
			<path d={forma} fill="#FFFFFF" opacity={tramo(p, 0.2, 0.5)} />
			<Garabato forma={forma} caja={[-r - 16, -r - 16, 2 * r + 32, 2 * r + 32]} p={tramo(p, 0.4, 1)} color={color} paso={22} opacidad={0.45} />
			<Trazo d={forma} p={tramo(p, 0, 0.7)} ancho={7} />
			<Trazo d={elipse(0, 0, r * 0.24)} p={tramo(p, 0.5, 0.9)} ancho={7} />
			{[0, 1, 2].map((i) => (
				<Trazo key={i} d={elipse(Math.cos((i * Math.PI * 2) / 3) * r * 0.58, Math.sin((i * Math.PI * 2) / 3) * r * 0.58, r * 0.13)} p={tramo(p, 0.6, 1)} ancho={5} />
			))}
		</g>
	);
};

export const RelojSuizoCelular: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fSuizo = momento('suizo');
	const fEncaja = momento('encaja');
	const fCelular = momento('celular');
	const fDice = momento('dice');
	const fY = momento('y vos');
	const fEste = momento('este');

	const engranajes = avance(frame, 2, 30);
	const fTraba = fCelular + 6;
	const entra = interpolate(frame, [fEncaja - 8, fTraba], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
	const trabado = frame >= fTraba;
	const sacudon = trabado ? interpolate(frame, [fTraba, fTraba + 24], [1, 0], clamp) : 0;
	const intento = trabado && frame > fTraba + 30 ? Math.max(0, Math.sin(((frame - fTraba) / 30) * Math.PI * 2)) ** 8 : 0;
	const giro1 = 1.25 * Math.min(frame, fTraba) + 3 * sacudon * Math.sin(frame * 2.2) + 2 * intento;
	const sello = avance(frame, fSuizo - 6, 16);
	const globo = avance(frame, fDice - 6, 14);
	const persona = avance(frame, fY - 6, 18);
	const guina = frame >= fEste - 2;
	const cara: CaraPalito = guina ? 'guino' : 'sonrisa';
	const [px, py] = [TRABA[0] + (1 - entra) * 560, TRABA[1] - (1 - entra) * 330];

	return (
		<Pizarra zoom={[1, 1.04]} foco={[540, 700]}>
			<Engranaje c={G1} r={R1} n={18} giro={giro1} p={engranajes} color={AMARILLO} />
			<Engranaje c={G2} r={R2} n={12} giro={-giro1 * (R1 / R2) + 7} p={tramo(engranajes, 0.15, 1)} color={AZUL_CLARO} />
			<Engranaje c={G3} r={R3} n={9} giro={-giro1 * (R1 / R3) + 11} p={tramo(engranajes, 0.3, 1)} color={ROSA} />

			{/* sello suizo */}
			{sello > 0.01 ? (
				<g transform={`translate(190 300) rotate(-8) scale(${1 + 0.25 * (1 - sello)}) translate(-190 -300)`}>
					<path d={rectangulo(130, 240, 120, 120, 20)} fill={ROJO} opacity={tramo(sello, 0.2, 0.6)} />
					<Trazo d={rectangulo(130, 240, 120, 120, 20)} p={sello} ancho={6} />
					<path d="M 190 268 L 190 332 M 158 300 L 222 300" stroke="#FFFFFF" strokeWidth={20} opacity={tramo(sello, 0.5, 1)} />
				</g>
			) : null}
			<Texto x={190} y={420} texto="reloj suizo" p={avance(frame, fSuizo, 14)} tam={46} />
			{!trabado ? (
				<>
					<Estrella x={720} y={310} r={16} p={tramo(sello, 0.5, 1)} />
					<Estrella x={210} y={800} r={13} p={tramo(sello, 0.7, 1)} />
				</>
			) : null}

			{/* el celular que no encaja */}
			{entra > 0.001 ? (
				<g transform={`translate(${trabado ? 3 * sacudon * Math.sin(frame * 3) : 0} 0)`}>
					<Celular x={px} y={py} p={1} escala={0.85} rot={-35 + 25 * (1 - entra)} brillo={0.7} pantalla={<path d="M -12 -20 L 18 0 L -12 20 Z" fill={ROJO} />} />
				</g>
			) : null}
			{trabado && frame < fTraba + 26
				? [0, 1, 2, 3].map((i) => {
						const a = (i / 4) * Math.PI * 2 + 0.6;
						const r0 = 70;
						return (
							<Trazo
								key={i}
								d={`M ${TRABA[0] + Math.cos(a) * r0} ${TRABA[1] + Math.sin(a) * r0} L ${TRABA[0] + Math.cos(a + 0.2) * (r0 + 30)} ${TRABA[1] + Math.sin(a + 0.2) * (r0 + 30)} L ${TRABA[0] + Math.cos(a) * (r0 + 55)} ${TRABA[1] + Math.sin(a) * (r0 + 55)}`}
								p={1}
								color={ROJO}
								ancho={7}
							/>
						);
					})
				: null}
			<Texto x={790} y={665} texto="¡CLANC!" p={avance(frame, fTraba, 6)} tam={64} color={ROJO} rotar={-8} negrita />

			{/* "solo un video más" */}
			{globo > 0.01 ? (
				<g>
					<path d={rectangulo(560, 160, 450, 120, 40)} fill="#FFFFFF" opacity={tramo(globo, 0.2, 0.5)} />
					<Trazo d={rectangulo(560, 160, 450, 120, 40)} p={tramo(globo, 0, 0.6)} ancho={7} />
					<Trazo d="M 620 276 L 600 400 L 680 278" p={tramo(globo, 0.4, 0.8)} ancho={7} />
					<Texto x={785} y={236} texto="“solo un video más”" p={tramo(globo, 0.3, 1)} tam={46} />
				</g>
			) : null}

			{/* y vos, mirando este */}
			<Palito
				x={300}
				y={1190}
				p={persona}
				escala={0.85}
				cara={cara}
				mirar={guina ? [0, 0] : [0.7, 0.8]}
				cabeza={{rot: guina ? 8 : -6}}
				pose={{brazoD: [30, -130], brazoI: guina ? [150 + 12 * Math.sin(t * 10), 20] : [24, 8]}}
				enMano={<Celular x={6} y={-22} p={1} escala={0.32} brillo={0.9} />}
			/>
			<Texto x={600} y={1165} texto="este video" p={avance(frame, fEste - 4, 14)} tam={50} negrita />
			<Flecha desde={[480, 1150]} hasta={[352, 1140]} curva={-20} p={avance(frame, fEste + 2, 10)} color={ROJO} ancho={7} punta={22} />
		</Pizarra>
	);
};
