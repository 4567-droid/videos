import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {
	AMARILLO,
	avance,
	Cruz,
	elipse,
	Garabato,
	GRIS,
	LunaPizarra,
	Palito,
	Pizarra,
	rectangulo,
	ROJO,
	SolPizarra,
	Texto,
	tramo,
	Trazo,
} from '../componentes/Pizarra';
import type {CaraPalito} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';
import {cortisol, muestrear, polilinea} from './curvas-hormonas';

/**
 * "El problema es cuando el estrés no para. Un cortisol alto durante mucho tiempo se asocia con
 * cansancio, tensión y mal sueño. Tu cuerpo, en modo alerta las veinticuatro horas."
 * El gráfico de antes (gris) y encima la curva con estrés que no baja nunca (roja). Aparecen
 * tres íconos: batería baja, un nudo y una luna tachada. Abajo, el palito con una sirena de
 * alarma en la cabeza que gira y, a los costados, el sol y la luna: alerta día y noche.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const X0 = 150;
const ANCHO = 780;
const BASE = 600;
const ALTO = 300;
const aPixel = (h: number, c: number): [number, number] => [X0 + (ANCHO * h) / 24, BASE - ALTO * c];
const conEstres = (h: number) => (h < 7.6 ? cortisol(h) : Math.max(cortisol(h), 0.8 + 0.07 * Math.sin(h * 2.3) + 0.04 * Math.sin(h * 5.1)));
const NORMAL = muestrear(cortisol, 0, 24, aPixel, 100);
const ESTRES = muestrear(conEstres, 0, 24, aPixel, 140);
const NUDO = 'M 470 760 C 470 690 560 690 560 740 C 560 790 490 790 500 740 C 510 690 610 700 610 750 C 610 800 530 800 540 750 C 548 712 600 716 612 730';

export const CortisolSirena: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fEstres = momento('estrés');
	const fAlto = momento('alto');
	const fMucho = momento('mucho');
	const fCansancio = momento('cansancio');
	const fTension = momento('tensión');
	const fSueno = momento('sueño');
	const fTu = momento('tu cuerpo');
	const fAlerta = momento('alerta');
	const fVeinticuatro = momento('veinticuatro');

	const ejes = avance(frame, 0, 16);
	const normal = avance(frame, 6, 26);
	const estres = interpolate(frame, [fEstres - 4, fEstres + 36], [0, 1], clamp);
	const persona = avance(frame, 10, 24);
	const sirena = avance(frame, fTu - 2, 16);
	const gira = frame > fAlerta - 4 ? 1 : 0;
	const lado = Math.sin(t * 12) > 0 ? 1 : 0;
	const solLuna = avance(frame, fVeinticuatro - 6, 18);
	const cara: CaraPalito = frame > fTu ? 'alerta' : frame > fTension ? 'alerta' : frame > fCansancio ? 'agotado' : 'preocupada';
	const tiembla = frame > fTension ? 2 * Math.sin(t * 50) : 0;

	return (
		<Pizarra zoom={[1, 1.03]} foco={[540, 760]}>
			{/* gráfico */}
			<Trazo d={`M ${X0} ${BASE} L ${X0} 270 M ${X0 - 14} 294 L ${X0} 270 L ${X0 + 14} 294`} p={ejes} ancho={7} />
			<Trazo d={`M ${X0} ${BASE} L 955 ${BASE} M 931 ${BASE - 14} L 955 ${BASE} L 931 ${BASE + 14}`} p={ejes} ancho={7} />
			<Texto x={98} y={440} texto="cortisol" p={tramo(ejes, 0.4, 1)} tam={46} rotar={-90} negrita />
			{[0, 12, 24].map((h, i) => (
				<Texto key={h} x={aPixel(h, 0)[0]} y={BASE + 50} texto={h === 0 ? '0 h' : h === 24 ? '24 h' : '12'} p={tramo(ejes, 0.4 + i * 0.2, 0.7 + i * 0.1)} tam={40} />
			))}
			<Trazo d={polilinea(NORMAL)} p={normal} color={GRIS} ancho={7} />
			<Texto x={850} y={560} texto="normal" p={tramo(normal, 0.7, 1)} tam={38} color="#8A8A96" />
			<Trazo d={polilinea(ESTRES)} p={estres} color={ROJO} ancho={11} />
			<Texto x={640} y={330} texto="cortisol alto" p={avance(frame, fAlto - 10, 16)} tam={54} color={ROJO} negrita />
			<Texto x={810} y={672} texto="días, semanas..." p={avance(frame, fMucho - 2, 18)} tam={38} color="#6B6B78" />

			{/* se asocia con... */}
			<g>
				{(() => {
					const p = avance(frame, fCansancio - 6, 16);
					return (
						<g>
							<Trazo d={rectangulo(150, 700, 124, 64, 10)} p={tramo(p, 0, 0.6)} ancho={7} />
							<Trazo d="M 280 718 L 290 718 L 290 746 L 280 746" p={tramo(p, 0.4, 0.7)} ancho={7} />
							<path d={rectangulo(160, 710, 26, 44, 4)} fill={ROJO} opacity={tramo(p, 0.6, 1) * (0.6 + 0.4 * Math.sin(t * 8))} />
							<Texto x={212} y={840} texto="cansancio" p={tramo(p, 0.4, 1)} tam={48} />
						</g>
					);
				})()}
				{(() => {
					const p = avance(frame, fTension - 6, 16);
					return (
						<g>
							<Trazo d={NUDO} p={p} color={ROJO} ancho={9} />
							<Texto x={540} y={840} texto="tensión" p={tramo(p, 0.4, 1)} tam={48} />
						</g>
					);
				})()}
				{(() => {
					const p = avance(frame, fSueno - 10, 16);
					return (
						<g>
							<LunaPizarra x={870} y={735} p={p} escala={0.8} cara="fastidio" brillo={0.2} />
							<Cruz x={870} y={735} p={tramo(p, 0.6, 1)} tam={42} ancho={9} />
							<Texto x={870} y={840} texto="mal sueño" p={tramo(p, 0.4, 1)} tam={48} />
						</g>
					);
				})()}
			</g>

			{/* la persona con la sirena */}
			{sirena > 0.01 && gira
				? ([0, 1] as const).map((i) => (
						<path
							key={i}
							d={i === 0 ? 'M 526 928 L 300 858 L 300 988 Z' : 'M 554 928 L 780 858 L 780 988 Z'}
							fill={AMARILLO}
							opacity={0.5 * (i === lado ? 1 : 0.15)}
						/>
					))
				: null}
			<g transform={`translate(${tiembla} 0)`}>
				<Palito
					x={540}
					y={1180}
					p={persona}
					escala={0.95}
					cara={cara}
					pelo="despeinado"
					pose={frame > fTension ? {brazoI: [40, -70], brazoD: [40, -70]} : {brazoI: [24, 8], brazoD: [24, 8]}}
				/>
				{sirena > 0.01 ? (
					<g>
						<Garabato forma="M 512 956 Q 512 900 540 900 Q 568 900 568 956 Z" caja={[510, 898, 60, 60]} p={sirena} color={ROJO} paso={10} opacidad={gira ? 0.7 + 0.3 * lado : 0.6} />
						<Trazo d="M 512 956 Q 512 900 540 900 Q 568 900 568 956 Z" p={sirena} ancho={6} />
						<Trazo d={rectangulo(500, 954, 80, 16, 4)} p={sirena} ancho={6} />
						{gira ? <circle cx={540 + (lado ? 9 : -9)} cy={924} r={7} fill="#FFFFFF" /> : null}
					</g>
				) : null}
			</g>
			{gira ? (
				<Trazo d="M 470 944 Q 458 926 470 908 M 610 944 Q 622 926 610 908" p={1} ancho={6} opacidad={0.5 + 0.5 * lado} />
			) : null}
			{/* día y noche */}
			<SolPizarra x={205} y={1160} p={solLuna} escala={0.75} cara="asustado" giro={t * 30} />
			<LunaPizarra x={880} y={1160} p={tramo(solLuna, 0.15, 1)} escala={1.05} cara="asustado" voltear />
			<Texto x={880} y={1290} texto="24 h" p={avance(frame, fVeinticuatro + 4, 14)} tam={56} negrita />
			{solLuna > 0.5 ? <Trazo d={elipse(880, 1272, 64, 30)} p={tramo(solLuna, 0.5, 1)} color={AMARILLO} ancho={8} opacidad={0.8} /> : null}
		</Pizarra>
	);
};
