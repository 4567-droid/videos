import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {
	AMARILLO,
	avance,
	AZUL,
	AZUL_CLARO,
	CabezaPalito,
	CamaPizarra,
	Cara,
	Celular,
	Flecha,
	Garabato,
	GRIS,
	LunaPizarra,
	NEGRO,
	Pizarra,
	rectangulo,
	RelojPizarra,
	ROJO,
	Texto,
	tramo,
	Trazo,
} from '../componentes/Pizarra';
import {FUENTE} from '../lib/fuente';
import {useEscena} from '../lib/escena';
import {melatonina, muestrear, polilinea} from './curvas-hormonas';

/**
 * "Pero la luz la frena. Un estudio mostró que leer en una pantalla luminosa antes de dormir
 * retrasó la melatonina y costó más despertar al día siguiente. Sí, ese “solo un video más”
 * puede tener costo."
 * Arriba: el palito en la cama con el celular encendido en la cara; un cartel de PARE frena a la
 * luna. Abajo: la curva de melatonina con libro (gris) y con pantalla (azul, con cara de
 * fastidio), corrida ~1,5 h; a las 6 todavía está alta. Al final el celular dice "solo un video
 * más" y le cuelga una etiqueta de precio: "costo: sueño".
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const X0 = 150;
const ANCHO = 790;
const BASE = 1180;
const ALTO = 380;
const aPixel = (h: number, c: number): [number, number] => [X0 + (ANCHO * (h - 20)) / 14, BASE - ALTO * c];
const LIBRO = muestrear((h) => melatonina(h), 20, 34, aPixel, 110);
const PANTALLA = muestrear((h) => melatonina(h, 1.5), 20, 34, aPixel, 110);
const AREA = `${polilinea(PANTALLA)} L ${X0 + ANCHO} ${BASE} L ${X0} ${BASE} Z`;
const OCTOGONO = new Array(8)
	.fill(0)
	.map((_, i) => {
		const a = Math.PI / 8 + (i / 8) * Math.PI * 2;
		return `${(560 + Math.cos(a) * 62).toFixed(1)} ${(300 + Math.sin(a) * 62).toFixed(1)}`;
	})
	.join(' L ');

export const PantallaMelatonina: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fLuz = momento('luz');
	const fFrena = momento('frena');
	const fEstudio = momento('estudio');
	const fRetraso = momento('retrasó');
	const fCosto = momento('costó');
	const fDespertar = momento('despertar');
	const fSolo = momento('solo');
	const fCosto2 = momento('costo', {ocurrencia: 2});

	const cama = avance(frame, 0, 22);
	const celu = avance(frame, 4, 18);
	const cansado = frame > fCosto - 4;
	const brillo = cansado ? 0.25 : interpolate(frame, [fLuz - 6, fLuz + 4], [0.4, 1], clamp);
	const pare = avance(frame, fFrena - 6, 14);
	const fueraArriba = 1 - interpolate(frame, [fRetraso + 20, fRetraso + 34], [0, 1], clamp);
	const estudio = avance(frame, fEstudio - 6, 18);
	const ejes = avance(frame, fEstudio + 10, 20);
	const libro = avance(frame, fEstudio + 20, 30);
	const pantalla = interpolate(frame, [fRetraso - 4, fRetraso + 34], [0, 1], clamp);
	const caraCurva = avance(frame, fRetraso + 24, 12);
	const alarma = avance(frame, fDespertar - 10, 14);
	const globo = avance(frame, fSolo - 8, 14);
	const etiqueta = avance(frame, fCosto2 - 10, 14);
	const vaiven = 6 * Math.sin(t * 3);

	return (
		<Pizarra zoom={[1, 1.03]} foco={[540, 700]}>
			{/* cama con el palito y el celular */}
			{brillo > 0.3 ? <path d="M 352 330 L 205 430 L 300 505 Z" fill={AMARILLO} opacity={0.3 * brillo * celu} /> : null}
			<Trazo d="M 350 470 L 380 420 L 372 372" p={tramo(celu, 0.3, 1)} ancho={8} />
			<Celular x={362} y={330} p={celu} escala={0.62} rot={215} brillo={brillo} />
			<g transform="translate(262 466) rotate(-90)">
				<CabezaPalito p={tramo(cama, 0.3, 1)} cara={cansado ? 'agotado' : 'alerta'} />
			</g>
			<CamaPizarra x={150} y={520} ancho={530} p={cama} bulto={48} />
			{/* la luz frena a la luna */}
			{fueraArriba > 0.01 ? (
				<g opacity={fueraArriba}>
					<LunaPizarra x={710} y={300} p={pare} escala={0.75} cara="fastidio" voltear />
					<path d={`M ${OCTOGONO} Z`} fill={ROJO} opacity={tramo(pare, 0.3, 0.7)} />
					<Trazo d={`M ${OCTOGONO} Z`} p={pare} ancho={6} />
					<Trazo d="M 560 362 L 560 460" p={pare} ancho={8} />
					<text x={560} y={318} textAnchor="middle" fontFamily={FUENTE} fontWeight={900} fontSize={40} fill="#FFFFFF" opacity={tramo(pare, 0.6, 1)}>
						PARE
					</text>
					{/* un estudio */}
					<path d={rectangulo(830, 230, 120, 150, 10)} fill="#FFFFFF" opacity={tramo(estudio, 0.2, 0.5)} />
					<Trazo d={rectangulo(830, 230, 120, 150, 10)} p={tramo(estudio, 0, 0.5)} ancho={7} />
					<Trazo d={rectangulo(862, 216, 56, 26, 6)} p={tramo(estudio, 0.3, 0.6)} ancho={6} />
					<Trazo d="M 850 290 L 930 290 M 850 320 L 912 320" p={tramo(estudio, 0.5, 0.8)} ancho={5} />
					<Trazo d="M 850 362 L 878 342 L 900 352 L 932 326" p={tramo(estudio, 0.7, 1)} color={ROJO} ancho={5} />
					<Texto x={890} y={436} texto="un estudio" p={tramo(estudio, 0.5, 1)} tam={44} />
				</g>
			) : null}
			{/* al día siguiente: cuesta despertar */}
			<RelojPizarra x={640} y={330} r={58} p={alarma * (1 - interpolate(frame, [fSolo - 20, fSolo - 10], [0, 1], clamp))} hora={7} minuto={0} campanas cara="feliz" sacudir={1} t={t} />
			{/* "solo un video más" + etiqueta de precio */}
			{globo > 0.01 ? (
				<g>
					<path d={rectangulo(470, 200, 450, 110, 36)} fill="#FFFFFF" opacity={tramo(globo, 0.2, 0.5)} />
					<Trazo d={rectangulo(470, 200, 450, 110, 36)} p={tramo(globo, 0, 0.6)} ancho={7} />
					<Trazo d="M 505 290 L 418 330 L 540 304" p={tramo(globo, 0.4, 0.8)} ancho={7} />
					<Texto x={695} y={272} texto="“solo un video más”" p={tramo(globo, 0.3, 1)} tam={52} />
				</g>
			) : null}
			{etiqueta > 0.01 ? (
				<g transform={`rotate(${-12 + vaiven} 400 380)`}>
					<Trazo d="M 400 380 L 470 420" p={tramo(etiqueta, 0, 0.3)} ancho={4} />
					<path d="M 470 400 L 500 380 L 660 380 L 660 470 L 500 470 L 470 450 Z" fill="#FFFFFF" opacity={tramo(etiqueta, 0.2, 0.5)} />
					<Garabato forma="M 470 400 L 500 380 L 660 380 L 660 470 L 500 470 L 470 450 Z" caja={[470, 380, 190, 90]} p={tramo(etiqueta, 0.4, 1)} color={AMARILLO} paso={12} opacidad={0.6} />
					<Trazo d="M 470 400 L 500 380 L 660 380 L 660 470 L 500 470 L 470 450 Z" p={tramo(etiqueta, 0, 0.6)} ancho={6} />
					<circle cx={492} cy={425} r={7} fill="#FFFFFF" stroke={NEGRO} strokeWidth={4} />
					<Texto x={580} y={418} texto="costo:" p={tramo(etiqueta, 0.4, 0.8)} tam={40} />
					<Texto x={580} y={458} texto="sueño" p={tramo(etiqueta, 0.6, 1)} tam={40} color={ROJO} negrita />
				</g>
			) : null}

			{/* gráfico de melatonina */}
			<Trazo d={`M ${X0} ${BASE} L ${X0} 740 M ${X0 - 14} 764 L ${X0} 740 L ${X0 + 14} 764`} p={ejes} ancho={7} />
			<Trazo d={`M ${X0} ${BASE} L 960 ${BASE} M 936 ${BASE - 14} L 960 ${BASE} L 936 ${BASE + 14}`} p={ejes} ancho={7} />
			<Texto x={96} y={960} texto="melatonina" p={tramo(ejes, 0.4, 1)} tam={46} rotar={-90} negrita />
			{[
				[20, '20 h'],
				[24, '0 h'],
				[28, '4 h'],
				[32, '8 h'],
			].map(([h, rotulo], i) => (
				<Texto key={rotulo} x={aPixel(h as number, 0)[0]} y={BASE + 52} texto={rotulo as string} p={tramo(ejes, 0.4 + i * 0.12, 0.7 + i * 0.1)} tam={40} />
			))}
			<Trazo d={polilinea(LIBRO)} p={libro} color={GRIS} ancho={7} />
			<Texto x={240} y={850} texto="libro" p={tramo(libro, 0.3, 0.8)} tam={44} color="#8A8A96" />
			<Garabato forma={AREA} caja={[X0, 780, ANCHO, BASE - 780]} p={tramo(pantalla, 0.3, 1)} color={AZUL_CLARO} paso={20} opacidad={0.5} />
			<Trazo d={polilinea(PANTALLA)} p={pantalla} color={AZUL} ancho={11} />
			<Texto x={870} y={770} texto="pantalla" p={tramo(pantalla, 0.6, 1)} tam={46} color={AZUL} negrita />
			{caraCurva > 0.01 ? (
				<g transform="translate(600 880) scale(1.5)" opacity={caraCurva}>
					<Cara cara="fastidio" />
				</g>
			) : null}
			<Flecha desde={aPixel(22.2, 0.5)} hasta={[aPixel(23.6, 0.5)[0] + 6, aPixel(23.6, 0.5)[1]]} p={avance(frame, fRetraso + 6, 12)} color={ROJO} ancho={7} punta={20} />
			<Texto x={aPixel(22.1, 0)[0]} y={aPixel(0, 0.2)[1]} texto="+1,5 h" p={avance(frame, fRetraso + 12, 12)} tam={46} color={ROJO} negrita />
			{/* a las 6 la melatonina sigue alta */}
			{alarma > 0.01 ? (
				<g>
					<path d={`M ${aPixel(30, 0)[0]} ${BASE} L ${aPixel(30, 0)[0]} ${aPixel(30, melatonina(30, 1.5))[1]}`} stroke={NEGRO} strokeWidth={5} strokeDasharray="12 10" opacity={alarma} />
					<RelojPizarra x={aPixel(30, 0)[0]} y={1110} r={28} p={alarma} hora={6} minuto={0} campanas sacudir={1} t={t} />
				</g>
			) : null}
		</Pizarra>
	);
};
