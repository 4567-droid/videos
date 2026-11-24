import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {
	AMARILLO,
	avance,
	Brillo,
	Celular,
	Cruz,
	Garabato,
	Gota,
	Palito,
	Pizarra,
	rectangulo,
	RelojPizarra,
	SolPizarra,
	Texto,
	Tilde,
	tramo,
	Trazo,
} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Algunos hábitos ayudan: luz natural a la mañana, luces bajas a la noche, horarios regulares y
 * menos pantallas antes de dormir. Sí, ya sabías todo esto. Yo también."
 * Cuatro tarjetas que se dibujan una por una (sol, lámpara baja, reloj, celular tachado) con su
 * tilde. Con "Sí, ya sabías todo esto" aparece el palito con cara de culpable y el celular en la
 * mano; con "Yo también" levanta la mano y transpira.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const PANTALLA = 'M 732 380 L 828 380 L 856 452 L 704 452 Z';

const Tarjeta: React.FC<{x: number; y: number; p: number; tilde: number; texto: string; children: React.ReactNode}> = ({x, y, p, tilde, texto, children}) => (
	<g>
		<path d={rectangulo(x - 190, y - 160, 380, 320, 26)} fill="#FFFFFF" opacity={tramo(p, 0.1, 0.4)} />
		<Trazo d={rectangulo(x - 190, y - 160, 380, 320, 26)} p={tramo(p, 0, 0.4)} ancho={6} color="#9A9AA6" />
		{children}
		<Texto x={x} y={y + 132} texto={texto} p={tramo(p, 0.5, 1)} tam={50} />
		<Tilde x={x + 150} y={y - 122} p={tilde} tam={44} />
	</g>
);

export const HabitosCulpable: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fHabitos = momento('hábitos');
	const fLuz = momento('luz');
	const fLuces = momento('luces');
	const fHorarios = momento('horarios');
	const fPantallas = momento('pantallas');
	const fSi = momento('sí');
	const fYo = momento('yo también');

	const titulo = avance(frame, fHabitos - 6, 18);
	const c1 = avance(frame, fLuz - 8, 22);
	const c2 = avance(frame, fLuces - 8, 22);
	const c3 = avance(frame, fHorarios - 8, 22);
	const c4 = avance(frame, fPantallas - 8, 22);
	const tilde = (f: number) => avance(frame, f + 20, 10);
	const persona = avance(frame, fSi - 4, 18);
	const levanta = interpolate(frame, [fYo - 4, fYo + 6], [0, 1], clamp);

	return (
		<Pizarra zoom={[1, 1.03]} foco={[540, 760]}>
			<Texto x={540} y={250} texto="hábitos que ayudan" p={titulo} tam={68} negrita />
			<Trazo d="M 290 272 Q 540 286 790 270" p={tramo(titulo, 0.5, 1)} color={AMARILLO} ancho={14} />

			<Tarjeta x={300} y={460} p={c1} tilde={tilde(fLuz)} texto="luz de mañana">
				<SolPizarra x={300} y={430} p={tramo(c1, 0.2, 1)} escala={0.95} cara="feliz" giro={t * 25} />
			</Tarjeta>
			<Tarjeta x={780} y={460} p={c2} tilde={tilde(fLuces)} texto="luces bajas">
				<Brillo x={780} y={470} r={90} intensidad={0.45 * tramo(c2, 0.6, 1)} />
				<Garabato forma={PANTALLA} caja={[700, 376, 160, 80]} p={tramo(c2, 0.5, 1)} color={AMARILLO} paso={12} opacidad={0.7} />
				<Trazo d={PANTALLA} p={tramo(c2, 0.2, 0.6)} ancho={7} />
				<Trazo d="M 780 452 L 780 520 M 730 528 Q 780 506 830 528" p={tramo(c2, 0.4, 0.8)} ancho={7} />
				<Texto x={872} y={536} texto="zzz" p={tramo(c2, 0.8, 1)} tam={34} color="#6B6B78" />
			</Tarjeta>
			<Tarjeta x={300} y={830} p={c3} tilde={tilde(fHorarios)} texto="mismos horarios">
				<RelojPizarra x={300} y={810} r={86} p={tramo(c3, 0.2, 1)} hora={10} minuto={10} />
			</Tarjeta>
			<Tarjeta x={780} y={830} p={c4} tilde={tilde(fPantallas)} texto="menos pantallas">
				<Celular x={780} y={805} p={tramo(c4, 0.2, 0.8)} escala={0.75} brillo={0.4} />
				<Cruz x={780} y={805} p={tramo(c4, 0.6, 1)} tam={62} ancho={12} />
			</Tarjeta>

			{/* el culpable */}
			<Palito
				x={540}
				y={1210}
				p={persona}
				escala={0.85}
				cara="culpable"
				cabeza={{rot: -8 * levanta}}
				pose={{brazoI: [24 + 150 * levanta, 4], brazoD: [30, -130]}}
				enMano={<Celular x={6} y={-24} p={1} escala={0.32} brillo={0.9} />}
			/>
			<Gota x={600} y={1040} p={tramo(levanta, 0.3, 1)} tam={1} />
			<Gota x={610} y={1080 + 20 * ((t * 1.2) % 1)} p={levanta > 0.5 ? 1 - ((t * 1.2) % 1) : 0} tam={0.7} />
		</Pizarra>
	);
};
