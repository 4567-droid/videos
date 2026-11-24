import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {
	AMARILLO,
	avance,
	CabezaPalito,
	Cruz,
	Flecha,
	Garabato,
	Gota,
	NEGRO,
	Pizarra,
	rectangulo,
	RelojPizarra,
	ROJO,
	ROSA,
	SolPizarra,
	Texto,
	tramo,
	Trazo,
} from '../componentes/Pizarra';
import type {CaraPalito} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "El cortisol lo producen las glándulas suprarrenales. Es la famosa hormona del estrés, pero
 * también funciona como tu despertador natural. Sí, el que no tiene botón de posponer."
 * Un cuerpo de palitos con los riñones y, arriba de cada uno, las suprarrenales (señaladas con
 * flechas) de donde salen solcitos. Con "estrés" se asusta; con "despertador" aparece un
 * despertador que suena y se ríe; una mano busca el botón de posponer... y no hay.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const TORSO = 'M 330 435 C 470 435 482 525 472 645 C 462 785 440 900 330 900 C 220 900 198 785 188 645 C 178 525 190 435 330 435 Z';
const rinon = (cx: number, cy: number, lado: 1 | -1) => {
	const X = (dx: number) => cx + lado * dx;
	return `M ${X(-5)} ${cy - 42} C ${X(30)} ${cy - 46} ${X(32)} ${cy - 12} ${X(12)} ${cy - 4} C ${X(4)} ${cy} ${X(4)} ${cy + 8} ${X(12)} ${cy + 12} C ${X(32)} ${cy + 22} ${X(26)} ${cy + 46} ${X(-5)} ${cy + 42} C ${X(-36)} ${cy + 38} ${X(-38)} ${cy - 38} ${X(-5)} ${cy - 42} Z`;
};
const glandula = (cx: number, cy: number, lado: 1 | -1) => {
	const X = (dx: number) => cx + lado * dx;
	return `M ${X(-28)} ${cy - 38} L ${X(-2)} ${cy - 74} L ${X(24)} ${cy - 40} Q ${X(-2)} ${cy - 50} ${X(-28)} ${cy - 38} Z`;
};
const RINONES: [number, number, 1 | -1][] = [
	[272, 735, 1],
	[388, 735, -1],
];
const MANO = 'M -38 -10 Q -40 -50 -22 -52 L -22 -86 Q -22 -98 -12 -98 Q -2 -98 -2 -86 L -2 -96 Q -2 -108 8 -108 Q 18 -108 18 -96 L 18 -88 Q 18 -98 28 -98 Q 38 -98 38 -86 L 38 -40 Q 44 -60 54 -56 Q 64 -52 56 -34 L 40 4 Q 30 24 0 24 Q -36 24 -38 -10 Z';

export const SuprarrenalesDespertador: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fProducen = momento('producen');
	const fGlandulas = momento('glándulas');
	const fSuprarrenales = momento('suprarrenales');
	const fEstres = momento('estrés');
	const fDespertador = momento('despertador');
	const fSi = momento('sí');
	const fBoton = momento('botón');
	const fPosponer = momento('posponer');

	const cuerpo = avance(frame, 4, 30);
	const rinones = avance(frame, fGlandulas - 10, 18);
	const glandulas = avance(frame, fGlandulas, 14);
	const flechas = avance(frame, fSuprarrenales - 4, 18);
	const susto = interpolate(frame, [fEstres - 4, fEstres + 4, fEstres + 40, fEstres + 50], [0, 1, 1, 0], clamp);
	const reloj = avance(frame, fDespertador - 8, 18);
	const suena = frame > fDespertador ? 1 : 0;
	// la mano baja a buscar el botón y palmea dos veces
	const baja = interpolate(frame, [fSi + 4, fSi + 20], [0, 1], clamp);
	const palmea = frame > fSi + 20 ? Math.abs(Math.sin(((frame - fSi - 20) / 9) * Math.PI)) : 0;
	const yMano = 650 - 330 * (1 - baja) - 34 * palmea;
	const noHay = avance(frame, fBoton - 4, 12);
	const posponer = avance(frame, fPosponer - 6, 14);
	const cara: CaraPalito = susto > 0.5 ? 'asustado' : frame > fSi + 10 ? 'agotado' : 'neutra';
	const caraReloj: CaraPalito = frame > fSi ? 'feliz' : 'sonrisa';

	return (
		<Pizarra zoom={[1, 1.04]} foco={[540, 760]}>
			{/* cuerpo */}
			<g transform="translate(330 360) scale(1.6)">
				<CabezaPalito p={tramo(cuerpo, 0, 0.4)} cara={cara} />
			</g>
			<Trazo d={TORSO} p={tramo(cuerpo, 0.25, 0.7)} ancho={8} />
			<Trazo d="M 200 500 L 140 640 L 130 770" p={tramo(cuerpo, 0.5, 0.8)} ancho={8} />
			<Trazo d="M 460 500 L 520 640 L 540 760" p={tramo(cuerpo, 0.5, 0.8)} ancho={8} />
			<Trazo d="M 285 895 L 262 1060 L 250 1230" p={tramo(cuerpo, 0.6, 0.95)} ancho={8} />
			<Trazo d="M 375 895 L 398 1060 L 412 1230" p={tramo(cuerpo, 0.6, 0.95)} ancho={8} />
			{/* columna (punteada) */}
			{rinones > 0.01 ? <path d="M 330 470 L 330 880" stroke="#C9C9D1" strokeWidth={6} strokeDasharray="14 12" opacity={rinones} /> : null}
			{RINONES.map(([cx, cy, lado]) => (
				<g key={cx}>
					<Garabato forma={rinon(cx, cy, lado)} caja={[cx - 45, cy - 50, 90, 100]} p={rinones} color={ROSA} paso={12} opacidad={0.75} />
					<Trazo d={rinon(cx, cy, lado)} p={rinones} ancho={6} />
					<Garabato forma={glandula(cx, cy, lado)} caja={[cx - 34, cy - 78, 68, 46]} p={glandulas} color={AMARILLO} paso={9} opacidad={1} />
					<Trazo d={glandula(cx, cy, lado)} p={glandulas} ancho={6} />
				</g>
			))}
			<Texto x={330} y={830} texto="riñones" p={tramo(rinones, 0.5, 1)} tam={40} color="#6B6B78" />
			{/* flechas y nombre */}
			<Texto x={800} y={490} texto="glándulas" p={tramo(flechas, 0, 0.5)} tam={62} />
			<Texto x={800} y={556} texto="suprarrenales" p={tramo(flechas, 0.2, 0.8)} tam={62} negrita />
			<Flecha desde={[640, 590]} hasta={[402, 668]} curva={-30} p={tramo(flechas, 0.4, 0.9)} color={ROJO} ancho={8} punta={26} />
			<Flecha desde={[620, 470]} hasta={[284, 652]} curva={70} p={tramo(flechas, 0.55, 1)} color={ROJO} ancho={8} punta={26} />
			{/* solcitos de cortisol que salen de las glándulas */}
			{[0, 1, 2, 3].map((i) => {
				const k = ((frame - fProducen - i * 9) / 60) % 1;
				if (frame < fProducen + i * 9 || frame > fDespertador + 40) return null;
				const [cx, cy] = RINONES[i % 2];
				return <SolPizarra key={i} x={cx + (i % 2 === 0 ? -60 : 60) * k} y={cy - 80 - 170 * k} p={1} escala={0.3} cara="sonrisa" brillo={0.3} giro={t * 40} />;
			})}
			{/* estrés */}
			{susto > 0.01 ? (
				<g opacity={susto}>
					<Trazo d="M 200 270 L 182 250 L 200 236 L 180 214" p={1} color={ROJO} ancho={7} />
					<Trazo d="M 460 270 L 478 250 L 460 236 L 480 214" p={1} color={ROJO} ancho={7} />
					<Gota x={420} y={310} p={1} tam={1.1} />
				</g>
			) : null}
			<g opacity={susto}>
				<Texto x={330} y={205} texto="¡estrés!" p={avance(frame, fEstres - 2, 10)} tam={54} color={ROJO} />
			</g>

			{/* despertador natural */}
			<RelojPizarra x={790} y={930} r={118} p={reloj} hora={7} minuto={0} campanas cara={caraReloj} sacudir={suena} t={t} />
			<Texto x={790} y={1135} texto="despertador natural" p={avance(frame, fDespertador + 6, 16)} tam={48} />
			{suena ? <Texto x={930} y={690} texto="¡RIIING!" p={1} tam={50} color={ROJO} rotar={-8 + 3 * Math.sin(t * 30)} negrita /> : null}
			{/* el botón que no está */}
			{noHay > 0.01 ? (
				<g>
					<path d={rectangulo(740, 772, 100, 36, 12)} fill="none" stroke={NEGRO} strokeWidth={5} strokeDasharray="12 10" opacity={noHay} />
					<Texto x={890} y={808} texto="?" p={noHay} tam={64} color={ROJO} negrita />
				</g>
			) : null}
			{posponer > 0.01 ? (
				<g>
					<Texto x={790} y={1210} texto="posponer" p={tramo(posponer, 0, 0.6)} tam={56} color={NEGRO} />
					<Cruz x={790} y={1192} p={tramo(posponer, 0.5, 1)} tam={46} ancho={10} />
				</g>
			) : null}
			{baja > 0.01 ? (
				<g transform={`translate(800 ${yMano}) rotate(180) scale(1.15)`}>
					<path d={MANO} fill="#FFFFFF" stroke={NEGRO} strokeWidth={6} strokeLinejoin="round" />
				</g>
			) : null}
		</Pizarra>
	);
};
