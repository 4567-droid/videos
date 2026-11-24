import React, {useId} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {
	AMARILLO,
	avance,
	AZUL,
	AZUL_CLARO,
	Brillo,
	CerebroPizarra,
	elipse,
	Estrella,
	Flecha,
	Garabato,
	LunaPizarra,
	NEGRO,
	Palito,
	Pizarra,
	rectangulo,
	SolPizarra,
	Texto,
	tramo,
	Trazo,
} from '../componentes/Pizarra';
import type {CaraPalito} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "La melatonina es la otra mitad del equipo. Una glándula del cerebro la produce sobre todo
 * cuando oscurece y le avisa al cuerpo: “che, es hora de dormir”."
 * La luna (melatonina) saluda. En el cerebro se enciende la glándula pineal y salen lunitas;
 * en la ventana se pone el sol y oscurece. Con "avisa" sale un megáfono que le habla al palito,
 * que termina bostezando.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const CEREBRO: [number, number] = [575, 790];
const ESC = 0.85;
const PINEAL: [number, number] = [CEREBRO[0] + 40 * ESC, CEREBRO[1] + 22 * ESC];
const VENTANA = {x: 90, y: 200, w: 300, h: 270};

export const MelatoninaMegafono: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const id = useId().replace(/:/g, '');
	const fMelatonina = momento('melatonina');
	const fOtra = momento('otra');
	const fGlandula = momento('glándula');
	const fProduce = momento('produce');
	const fOscurece = momento('oscurece');
	const fAvisa = momento('avisa');
	const fChe = momento('che');
	const fDormir = momento('dormir');

	const mascota = avance(frame, 4, 24);
	const saluda = interpolate(frame, [fOtra - 6, fOtra, fOtra + 40, fOtra + 48], [0, 1, 1, 0], clamp);
	const ventana = avance(frame, 10, 22);
	const cerebro = avance(frame, fGlandula - 24, 26);
	const pineal = interpolate(frame, [fGlandula - 2, fGlandula + 10], [0, 1], clamp);
	const noche = interpolate(frame, [fOscurece - 14, fOscurece + 12], [0, 1], clamp);
	const megafono = avance(frame, fAvisa - 6, 14);
	const globo = avance(frame, fChe - 4, 14);
	const bosteza = interpolate(frame, [fDormir - 4, fDormir + 10], [0, 1], clamp);
	const persona = avance(frame, fAvisa - 30, 22);
	const cara: CaraPalito = bosteza > 0.3 ? 'bostezo' : frame > fChe - 4 ? 'o' : 'neutra';

	return (
		<Pizarra zoom={[1, 1.04]} foco={[540, 760]}>
			{/* ventana: se pone el sol y oscurece */}
			<clipPath id={`ventana-${id}`}>
				<rect x={VENTANA.x} y={VENTANA.y} width={VENTANA.w} height={VENTANA.h} />
			</clipPath>
			<g clipPath={`url(#ventana-${id})`}>
				<Garabato forma={rectangulo(VENTANA.x, VENTANA.y, VENTANA.w, VENTANA.h, 4)} caja={[VENTANA.x, VENTANA.y, VENTANA.w, VENTANA.h]} p={noche} color={AZUL} paso={22} opacidad={0.35} />
				<SolPizarra x={300} y={310 + 260 * noche} p={ventana} escala={0.6} cara={noche > 0.3 ? 'dormido' : 'sonrisa'} giro={t * 20} />
				<LunaPizarra x={190} y={560 - 260 * noche} p={noche > 0.05 ? 1 : 0} escala={0.9} cara="sonrisa" brillo={0.5} />
				<Estrella x={300} y={250} r={14} p={tramo(noche, 0.5, 0.8)} />
				<Estrella x={350} y={330} r={10} p={tramo(noche, 0.6, 0.9)} />
				<Estrella x={130} y={430} r={10} p={tramo(noche, 0.7, 1)} />
			</g>
			<Trazo d={rectangulo(VENTANA.x, VENTANA.y, VENTANA.w, VENTANA.h, 6)} p={ventana} ancho={9} />
			<Trazo d={`M ${VENTANA.x + VENTANA.w / 2} ${VENTANA.y} L ${VENTANA.x + VENTANA.w / 2} ${VENTANA.y + VENTANA.h} M ${VENTANA.x} ${VENTANA.y + VENTANA.h / 2} L ${VENTANA.x + VENTANA.w} ${VENTANA.y + VENTANA.h / 2}`} p={tramo(ventana, 0.4, 1)} ancho={6} />
			<Texto x={240} y={530} texto="oscurece..." p={avance(frame, fOscurece - 2, 14)} tam={46} color={AZUL} />

			{/* la luna, la otra mitad del equipo */}
			<Palito
				x={860}
				y={470}
				p={mascota}
				escala={0.9}
				tipoCabeza="luna"
				voltear
				cara="sonrisa"
				pose={{brazoD: [150 + 25 * Math.sin(t * 12) * saluda, 20], brazoI: [24, 8]}}
			/>
			<Texto x={860} y={640} texto="melatonina" p={avance(frame, fMelatonina - 2, 16)} tam={54} negrita />
			<Trazo d="M 740 660 Q 860 672 980 658" p={avance(frame, fMelatonina + 10, 10)} color={AZUL} ancho={12} />

			{/* cerebro con la glándula pineal */}
			<CerebroPizarra x={CEREBRO[0]} y={CEREBRO[1]} p={cerebro} escala={ESC} />
			<Brillo x={PINEAL[0]} y={PINEAL[1]} r={70} intensidad={0.8 * pineal * (0.85 + 0.15 * Math.sin(t * 6))} color={AZUL_CLARO} />
			{pineal > 0.01 ? (
				<g>
					<ellipse cx={PINEAL[0]} cy={PINEAL[1]} rx={20} ry={15} fill={AMARILLO} opacity={pineal} />
					<Trazo d={elipse(PINEAL[0], PINEAL[1], 20, 15)} p={pineal} ancho={5} />
				</g>
			) : null}
			<Texto x={830} y={1010} texto="glándula pineal" p={avance(frame, fGlandula + 4, 18)} tam={46} />
			<Flecha desde={[760, 975]} hasta={[PINEAL[0] + 14, PINEAL[1] + 18]} curva={-30} p={avance(frame, fGlandula + 12, 12)} ancho={6} punta={20} />
			{/* lunitas de melatonina que salen */}
			{[0, 1, 2, 3, 4].map((i) => {
				const arranque = fProduce + i * 10;
				if (frame < arranque) return null;
				const k = ((frame - arranque) / 70) % 1;
				return <LunaPizarra key={i} x={PINEAL[0] - 30 - 200 * k} y={PINEAL[1] + 40 * Math.sin(k * 6 + i) + (i - 2) * 20} p={1} escala={0.28} cara="sonrisa" brillo={0.2 * (1 - k)} />;
			})}

			{/* megáfono */}
			{megafono > 0.01 ? (
				<g transform={`translate(400 820) rotate(138) scale(${0.6 + 0.4 * megafono})`}>
					<path d="M 0 -16 L 130 -54 L 130 54 L 0 16 Z" fill="#FFFFFF" opacity={tramo(megafono, 0.2, 0.5)} />
					<Garabato forma="M 0 -16 L 130 -54 L 130 54 L 0 16 Z" caja={[0, -56, 132, 112]} p={tramo(megafono, 0.4, 1)} color={AMARILLO} paso={14} opacidad={0.7} />
					<Trazo d="M 0 -16 L 130 -54 L 130 54 L 0 16 Z" p={megafono} ancho={8} />
					<Trazo d="M 130 -54 Q 146 0 130 54" p={megafono} ancho={8} />
					{frame > fAvisa
						? [0, 1, 2].map((i) => {
								const k = ((t * 1.6 + i / 3) % 1) * 1;
								const r = 30 + 60 * k;
								return <Trazo key={i} d={`M ${160 + 60 * k} ${-r} Q ${190 + 80 * k} 0 ${160 + 60 * k} ${r}`} p={1} ancho={6} opacidad={1 - k} />;
							})
						: null}
				</g>
			) : null}
			{/* globo: "che, es hora de dormir" */}
			{globo > 0.01 ? (
				<g>
					<path d={rectangulo(430, 1050, 470, 170, 40)} fill="#FFFFFF" opacity={tramo(globo, 0.2, 0.5)} />
					<Trazo d={rectangulo(430, 1050, 470, 170, 40)} p={tramo(globo, 0, 0.6)} ancho={8} />
					<Trazo d="M 470 1060 L 360 990 L 520 1052" p={tramo(globo, 0.3, 0.7)} ancho={8} />
					<Texto x={665} y={1122} texto="¡Che, es hora" p={tramo(globo, 0.3, 1)} tam={62} negrita />
					<Texto x={665} y={1188} texto="de dormir!" p={avance(frame, fDormir - 8, 12)} tam={62} negrita />
				</g>
			) : null}
			{/* el palito que bosteza */}
			<Palito
				x={210}
				y={1170}
				p={persona}
				escala={0.95}
				cara={cara}
				cabeza={{rot: bosteza > 0.3 ? -10 : 0}}
				pose={{brazoI: [24 + 140 * bosteza, 10], brazoD: [24 + 140 * bosteza, 10]}}
			/>
			{bosteza > 0.5 ? <Texto x={110} y={945} texto="aaah..." p={tramo(bosteza, 0.5, 1)} tam={48} color={NEGRO} /> : null}
		</Pizarra>
	);
};
