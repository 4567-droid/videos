import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {
	avance,
	AZUL,
	AZUL_CLARO,
	Celular,
	Estrella,
	Flecha,
	Garabato,
	LunaPizarra,
	NEGRO,
	Pizarra,
	Rayo,
	rectangulo,
	RelojPizarra,
	ROJO,
	SolPizarra,
	Texto,
	tramo,
	Trazo,
} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';
import {muestrear, polilinea} from './curvas-hormonas';

/**
 * "O sea: de noche, el cortisol debería estar bajo y la melatonina alta. Si el estrés o el celular
 * los cambian, tu reloj interno puede hacer un desastre."
 * Dos curvas cruzadas del día a la noche: el cortisol baja (rojo) y la melatonina sube (azul).
 * Con "estrés" y "celular" aparecen una nube con rayo y un celular que empujan las curvas: se
 * tuercen y se enredan. El reloj interno termina con las agujas hechas un nudo y cara de mareado.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const suave = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const X0 = 150;
const ANCHO = 650;
const BASE = 760;
const ALTO = 440;
const aPixel = (u: number, c: number): [number, number] => [X0 + ANCHO * u, BASE - ALTO * c];
const NUBE = 'M 120 1010 C 90 1010 86 960 122 958 C 120 920 170 908 190 934 C 206 900 262 906 262 948 C 296 948 300 1010 262 1010 Z';

export const RelojMareado: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fNoche = momento('noche');
	const fCortisol = momento('cortisol');
	const fBajo = momento('bajo');
	const fMelatonina = momento('melatonina');
	const fAlta = momento('alta');
	const fEstres = momento('estrés');
	const fCelular = momento('celular');
	const fCambian = momento('cambian');
	const fReloj = momento('reloj');
	const fDesastre = momento('desastre');

	// desorden: 0 = todo en su lugar, 1 = curvas torcidas y enredadas
	const lio = interpolate(frame, [fEstres, fCambian + 24], [0, 1], clamp);
	const onda = (u: number, fase: number) => lio * 0.09 * Math.sin(u * 22 + t * 7 + fase);
	const cortisol = (u: number) => 0.12 + 0.73 * (1 - suave((u - 0.15) / 0.7)) + lio * 0.42 * suave((u - 0.55) / 0.35) + onda(u, 0);
	const melatonina = (u: number) => 0.08 + 0.82 * suave((u - 0.35 - 0.25 * lio) / 0.5) - lio * 0.12 * suave((u - 0.8) / 0.2) + onda(u, 2);
	const rojo = polilinea(muestrear(cortisol, 0, 1, aPixel, 90));
	const azul = polilinea(muestrear(melatonina, 0, 1, aPixel, 90));

	const ejes = avance(frame, 0, 18);
	const noche = avance(frame, fNoche - 6, 20);
	const pRojo = interpolate(frame, [fCortisol - 6, fBajo + 8], [0, 1], clamp);
	const pAzul = interpolate(frame, [fMelatonina - 6, fAlta + 8], [0, 1], clamp);
	const estres = avance(frame, fEstres - 6, 16);
	const celular = avance(frame, fCelular - 6, 16);
	const reloj = avance(frame, fReloj - 8, 20);
	const mareo = interpolate(frame, [fDesastre - 6, fDesastre + 10], [0, 1], clamp);
	const bamboleo = mareo * 9 * Math.sin(t * 5);

	return (
		<Pizarra zoom={[1, 1.03]} foco={[540, 760]}>
			{/* la noche, sombreada */}
			<Garabato forma={rectangulo(X0 + ANCHO * 0.5, 300, ANCHO * 0.5, BASE - 300, 0)} caja={[X0 + ANCHO * 0.5, 300, ANCHO * 0.5, BASE - 300]} p={noche} color={AZUL_CLARO} paso={24} opacidad={0.35} />
			<Trazo d={`M ${X0} ${BASE} L ${X0} 290 M ${X0 - 14} 314 L ${X0} 290 L ${X0 + 14} 314`} p={ejes} ancho={7} />
			<Trazo d={`M ${X0} ${BASE} L 820 ${BASE} M 796 ${BASE - 14} L 820 ${BASE} L 796 ${BASE + 14}`} p={ejes} ancho={7} />
			<Texto x={260} y={820} texto="día" p={tramo(ejes, 0.4, 1)} tam={48} />
			<Texto x={640} y={820} texto="noche" p={noche} tam={48} color={AZUL} />
			<SolPizarra x={250} y={225} p={ejes} escala={0.6} cara="sonrisa" giro={t * 20} />
			<LunaPizarra x={660} y={225} p={noche} escala={0.85} cara="dormido" />
			{/* las dos curvas */}
			<Trazo d={rojo} p={pRojo} color={ROJO} ancho={11} />
			<Trazo d={azul} p={pAzul} color={AZUL} ancho={11} />
			<Texto x={822} y={712} texto="cortisol" p={avance(frame, fCortisol, 14)} tam={46} color={ROJO} ancla="inicio" negrita />
			<Flecha desde={[900, 590]} hasta={[900, 660]} p={avance(frame, fBajo - 4, 10) * (1 - lio)} color={ROJO} ancho={7} punta={20} />
			<Texto x={822} y={372} texto="melatonina" p={avance(frame, fMelatonina, 14)} tam={46} color={AZUL} ancla="inicio" negrita />
			<Flecha desde={[910, 480]} hasta={[910, 410]} p={avance(frame, fAlta - 4, 10) * (1 - lio)} color={AZUL} ancho={7} punta={20} />
			{lio > 0.4 ? <Texto x={905} y={540} texto="¿?" p={tramo(lio, 0.4, 0.8)} tam={70} color={NEGRO} negrita /> : null}

			{/* lo que las desordena */}
			<g>
				<path d={NUBE} fill="#8E8E9C" opacity={0.35 * tramo(estres, 0.3, 0.8)} />
				<Trazo d={NUBE} p={estres} ancho={7} />
				<Rayo x={190} y={1062} p={tramo(estres, 0.4, 1)} tam={0.5} rot={10} brillo={0.4 * estres} />
				<Texto x={190} y={1170} texto="estrés" p={tramo(estres, 0.5, 1)} tam={48} />
				<Flecha desde={[230, 930]} hasta={[420, 640]} curva={-40} p={avance(frame, fEstres + 6, 14)} color={NEGRO} ancho={6} punta={22} />
			</g>
			<g>
				<Celular x={890} y={1020} p={celular} escala={0.72} rot={10} brillo={celular} />
				<Texto x={890} y={1170} texto="celular" p={tramo(celular, 0.5, 1)} tam={48} />
				<Flecha desde={[850, 930]} hasta={[700, 560]} curva={40} p={avance(frame, fCelular + 6, 14)} color={NEGRO} ancho={6} punta={22} />
			</g>

			{/* el reloj interno, mareado */}
			<g transform={`rotate(${bamboleo} 540 1080)`}>
				<RelojPizarra x={540} y={1080} r={125} p={reloj} hora={10} minuto={10} cara={mareo > 0.4 ? 'mareado' : 'sonrisa'} enredado={mareo} />
			</g>
			<Texto x={540} y={1265} texto="reloj interno" p={avance(frame, fReloj, 16)} tam={46} />
			{mareo > 0.05
				? [0, 1, 2].map((i) => {
						const a = t * 4 + (i * Math.PI * 2) / 3;
						return <Estrella key={i} x={540 + Math.cos(a) * 150} y={925 + Math.sin(a) * 26} r={18} p={mareo} />;
					})
				: null}
		</Pizarra>
	);
};
