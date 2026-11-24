import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {
	AZUL,
	avance,
	Brillo,
	Flecha,
	Garabato,
	Gota,
	NEGRO,
	Palito,
	Pizarra,
	poseCorrer,
	Rayo,
	rectangulo,
	ROJO,
	Texto,
	Tilde,
	tramo,
	Trazo,
} from '../componentes/Pizarra';
import {FUENTE_MANO} from '../lib/fuente';
import {useEscena} from '../lib/escena';

/**
 * "Ante un peligro, te da energía extra: sube el azúcar en sangre y te mantiene en alerta.
 * Muy útil si te persigue un perro. Menos útil si es un mail de tu jefe."
 * Arriba: un palito huye de un perro con un rayo de energía en el pecho; aparecen "azúcar ↑" y
 * signos de alerta, y una tilde de "útil". Abajo (después de la pausa): el mismo palito huye de
 * un sobre con cara de enojado que dice "URGENTE".
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Perro: React.FC<{x: number; y: number; p: number; t: number}> = ({x, y, p, t}) => {
	if (p <= 0.001) return null;
	const f = t * 14;
	const pata = (px: number, fase: number) => {
		const a = 0.6 * Math.sin(f + fase);
		return `M ${px} 30 L ${px + Math.sin(a) * 34} ${30 + Math.cos(a) * 34} L ${px + Math.sin(a) * 34 + 10} ${30 + Math.cos(a) * 34 + 26}`;
	};
	const salto = -8 * Math.abs(Math.sin(f / 2));
	return (
		<g transform={`translate(${x} ${y + salto}) scale(-1 1)`}>
			<Trazo d="M -10 -10 C 30 -40 120 -40 140 -8 C 152 16 120 40 70 40 C 20 42 -20 34 -24 12 Z" p={tramo(p, 0, 0.4)} ancho={8} />
			{[pata(0, 0), pata(26, Math.PI), pata(100, Math.PI * 0.6), pata(124, Math.PI * 1.6)].map((d, i) => (
				<Trazo key={i} d={d} p={tramo(p, 0.4, 0.7)} ancho={7} />
			))}
			<Trazo d={`M 138 -6 Q 170 ${-40 + 10 * Math.sin(f)} 160 ${-64 + 6 * Math.sin(f)}`} p={tramo(p, 0.5, 0.8)} ancho={7} />
			{/* cabeza */}
			<Trazo d="M -20 -20 C -40 -70 -110 -72 -128 -40 C -140 -18 -126 6 -96 10 L -40 12 C -20 8 -12 -6 -20 -20 Z" p={tramo(p, 0.2, 0.6)} ancho={8} />
			<Trazo d="M -46 -60 L -30 -104 L -14 -50" p={tramo(p, 0.5, 0.8)} ancho={7} />
			<circle cx={-132} cy={-36} r={10} fill={NEGRO} opacity={tramo(p, 0.6, 0.8)} />
			<circle cx={-74} cy={-38} r={6} fill={NEGRO} opacity={tramo(p, 0.6, 0.8)} />
			<Trazo d="M -92 -56 L -58 -46" p={tramo(p, 0.7, 0.9)} ancho={7} />
			<Trazo d="M -124 -4 L -114 6 L -104 -4 L -94 6 L -84 -4 L -74 6 L -64 -2" p={tramo(p, 0.7, 1)} ancho={5} />
		</g>
	);
};

const SobreEnojado: React.FC<{x: number; y: number; p: number; t: number; urgente: number}> = ({x, y, p, t, urgente}) => {
	if (p <= 0.001) return null;
	const f = t * 14;
	const salto = -8 * Math.abs(Math.sin(f / 2));
	const sobre = rectangulo(-110, -72, 220, 144, 12);
	return (
		<g transform={`translate(${x} ${y + salto}) rotate(${4 * Math.sin(f / 2)})`}>
			{[-50, 50].map((px, i) => {
				const a = 0.6 * Math.sin(f + i * Math.PI);
				return <Trazo key={px} d={`M ${px} 70 L ${px + Math.sin(a) * 40} ${70 + Math.cos(a) * 40} L ${px + Math.sin(a) * 40 - 18} ${70 + Math.cos(a) * 40}`} p={tramo(p, 0.5, 0.8)} ancho={7} />;
			})}
			<path d={sobre} fill="#FFFFFF" opacity={tramo(p, 0.2, 0.5)} />
			<Trazo d={sobre} p={tramo(p, 0, 0.5)} ancho={8} />
			<Trazo d="M -108 -66 L 0 14 L 108 -66" p={tramo(p, 0.3, 0.7)} ancho={7} />
			{/* cara enojada */}
			<Trazo d="M -70 -30 L -34 -16 M 70 -30 L 34 -16" p={tramo(p, 0.6, 0.9)} ancho={8} />
			<circle cx={-48} cy={-2} r={8} fill={NEGRO} opacity={tramo(p, 0.7, 0.9)} />
			<circle cx={48} cy={-2} r={8} fill={NEGRO} opacity={tramo(p, 0.7, 0.9)} />
			<path d="M -40 38 L 40 38 L 40 54 L -40 54 Z" fill="#FFFFFF" stroke={NEGRO} strokeWidth={5} opacity={tramo(p, 0.7, 1)} />
			<path d="M -40 46 L 40 46 M -20 38 L -20 54 M 0 38 L 0 54 M 20 38 L 20 54" stroke={NEGRO} strokeWidth={3} opacity={tramo(p, 0.7, 1)} />
			{urgente > 0.01 ? (
				<g transform={`rotate(-14) scale(${1.4 - 0.4 * Math.min(1, urgente * 1.5)})`} opacity={Math.min(1, urgente * 2)}>
					<path d={rectangulo(-96, -132, 192, 52, 8)} fill="#FFFFFF" stroke={ROJO} strokeWidth={6} />
					<text x={0} y={-94} textAnchor="middle" fontFamily={FUENTE_MANO} fontSize={40} fill={ROJO} fontWeight={700}>
						URGENTE
					</text>
				</g>
			) : null}
		</g>
	);
};

export const PerroMailJefe: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fPeligro = momento('peligro');
	const fEnergia = momento('energía');
	const fAzucar = momento('azúcar');
	const fAlerta = momento('alerta');
	const fUtil = momento('útil');
	const fMenos = momento('menos');
	const fUtil2 = momento('útil', {ocurrencia: 2});
	const fJefe = momento('jefe');

	const huye = avance(frame, 2, 22);
	const perro = avance(frame, fPeligro - 8, 20);
	const rayo = avance(frame, fEnergia - 4, 14);
	const azucar = avance(frame, fAzucar - 6, 18);
	const alerta = avance(frame, fAlerta - 4, 10);
	const util = avance(frame, fUtil - 2, 12);
	const abajo = avance(frame, fMenos - 6, 20);
	const sobre = avance(frame, fMenos, 20);
	const dudoso = avance(frame, fUtil2, 14);
	const urgente = interpolate(frame, [fJefe - 2, fJefe + 8], [0, 1], clamp);
	const titila = 0.55 + 0.45 * Math.abs(Math.sin(t * 9));

	return (
		<Pizarra zoom={[1, 1.03]} foco={[540, 800]}>
			{/* fila de arriba: el perro */}
			<Perro x={250} y={650} p={perro} t={t} />
			<Texto x={330} y={500} texto="¡GUAU!" p={avance(frame, fPeligro, 10)} tam={56} rotar={-8} negrita />
			<Palito x={640} y={640} p={huye} escala={1.05} cara={alerta > 0.5 ? 'alerta' : 'asustado'} pose={poseCorrer(t * 14)} giro={10} />
			{[0, 1, 2].map((i) => (
				<Trazo key={i} d={`M ${480 - i * 10} ${560 + i * 50} L ${530 - i * 10} ${560 + i * 50}`} p={tramo(huye, 0.6, 1)} ancho={6} />
			))}
			<Rayo x={655} y={565} p={rayo} tam={0.52} rot={8} brillo={0.6 * rayo} />
			<Texto x={762} y={430} texto="¡!" p={alerta} tam={72} color={ROJO} negrita />
			{/* azúcar en sangre ↑ */}
			<g>
				<path d="M 836 330 L 896 314 L 936 336 L 876 352 Z" fill="#FFFFFF" opacity={tramo(azucar, 0.2, 0.4)} />
				<Trazo d="M 836 330 L 896 314 L 936 336 L 876 352 Z M 836 330 L 836 390 L 876 412 L 876 352 M 876 412 L 936 396 L 936 336" p={tramo(azucar, 0, 0.6)} ancho={6} />
				<Flecha desde={[980, 430]} hasta={[980, 300]} p={tramo(azucar, 0.4, 0.9)} color={ROJO} ancho={8} punta={24} />
				<Texto x={890} y={470} texto="azúcar" p={tramo(azucar, 0.5, 1)} tam={46} />
			</g>
			<Tilde x={840} y={640} p={util} tam={60} />
			<Texto x={920} y={660} texto="útil" p={util} tam={56} negrita />

			{/* separador */}
			<path d="M 120 820 L 960 820" stroke="#C9C9D1" strokeWidth={5} strokeDasharray="18 14" opacity={tramo(abajo, 0, 0.5)} />
			{/* fila de abajo: el mail del jefe */}
			<SobreEnojado x={290} y={1120} p={sobre} t={t} urgente={urgente} />
			<Palito x={660} y={1130} p={abajo} escala={1.0} cara="agotado" pose={poseCorrer(t * 14 + 1)} giro={10} />
			{abajo > 0.6 ? (
				<g opacity={titila}>
					<Brillo x={672} y={1052} r={50} intensidad={0.35} />
					<Rayo x={672} y={1052} p={1} tam={0.4} rot={8} />
				</g>
			) : null}
			<Gota x={720} y={950} p={tramo(abajo, 0.6, 1)} tam={1} />
			<Garabato forma="M 820 1080 L 1000 1080 L 1000 1150 L 820 1150 Z" caja={[820, 1080, 180, 70]} p={dudoso} color={AZUL} paso={14} opacidad={0.18} />
			<Texto x={905} y={1135} texto="¿útil?" p={dudoso} tam={56} color={ROJO} negrita />
		</Pizarra>
	);
};
