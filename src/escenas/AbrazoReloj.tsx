import React from 'react';
import {useCurrentFrame} from 'remotion';
import {avance, CabezaPalito, CamaPizarra, Cruz, Estrella, Garabato, LunaPizarra, Pizarra, RelojPizarra, ROJO, Texto, Tilde, tramo, Trazo, Zzz} from '../componentes/Pizarra';
import type {CaraPalito} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Y quedate con esto: dormir bien no es un lujo, es parte de cómo funciona tu cuerpo. Cuidá tu
 * reloj y él te cuida a vos." (enseñanza)
 * Bajo una luna grande con gorro, el palito duerme sonriente abrazando un reloj como si fuera un
 * peluche. Un diamante ("lujo") se tacha; aparece un corazón con un engranaje (parte del cuerpo).
 * Con "Cuidá tu reloj" suben corazoncitos y el reloj guiña un ojo.
 */
const corazon = (cx: number, cy: number, s: number) =>
	`M ${cx} ${cy + s * 0.9} C ${cx - s * 1.3} ${cy + s * 0.1} ${cx - s * 0.9} ${cy - s * 0.9} ${cx} ${cy - s * 0.35} C ${cx + s * 0.9} ${cy - s * 0.9} ${cx + s * 1.3} ${cy + s * 0.1} ${cx} ${cy + s * 0.9} Z`;
const DIAMANTE = 'M 180 340 L 210 300 L 270 300 L 300 340 L 240 420 Z';

export const AbrazoReloj: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fNo = momento('no');
	const fLujo = momento('lujo');
	const fParte = momento('parte');
	const fCuerpo = momento('cuerpo');
	const fCuida = momento('cuidá');
	const fEl = momento('él');

	const luna = avance(frame, 0, 28);
	const cama = avance(frame, 6, 26);
	const reloj = avance(frame, 22, 20);
	const diamante = avance(frame, fNo - 8, 14);
	const tacha = avance(frame, fLujo, 10);
	const parte = avance(frame, fParte - 6, 16);
	const caraReloj: CaraPalito = frame > fEl ? 'guino' : 'dormido';
	const respira = 1 + 0.025 * Math.sin(t * 2.4);

	return (
		<Pizarra zoom={[1, 1.05]} foco={[540, 820]}>
			<LunaPizarra x={760} y={380} p={luna} escala={2.1} cara="dormido" gorro brillo={0.45} />
			{[
				[560, 250, 20],
				[950, 230, 16],
				[620, 520, 14],
				[960, 560, 18],
			].map(([x, y, r], i) => (
				<g key={i} transform={`translate(${x} ${y}) scale(${0.85 + 0.15 * Math.sin(t * 3 + i * 1.7)}) translate(${-x} ${-y})`}>
					<Estrella x={x} y={y} r={r} p={tramo(luna, 0.4 + i * 0.12, 0.7 + i * 0.1)} />
				</g>
			))}

			{/* no es un lujo / es parte de tu cuerpo */}
			<Garabato forma={DIAMANTE} caja={[176, 296, 128, 128]} p={tramo(diamante, 0.4, 1)} color="#9CE3FF" paso={12} opacidad={0.8} />
			<Trazo d={DIAMANTE} p={diamante} ancho={6} />
			<Trazo d="M 180 340 L 300 340 M 225 300 L 212 340 L 240 420 M 255 300 L 268 340 L 240 420" p={tramo(diamante, 0.5, 1)} ancho={4} />
			<Texto x={240} y={488} texto="lujo" p={tramo(diamante, 0.5, 1)} tam={50} />
			<Cruz x={240} y={385} p={tacha} tam={80} ancho={12} />
			<path d={corazon(240, 660, 64)} fill={ROJO} opacity={tramo(parte, 0.3, 0.7)} />
			<Trazo d={corazon(240, 660, 64)} p={parte} ancho={6} />
			<g opacity={tramo(parte, 0.6, 1)}>
				<circle cx={240} cy={652} r={20} fill="none" stroke="#FFFFFF" strokeWidth={9} strokeDasharray="7 5" />
				<circle cx={240} cy={652} r={7} fill="#FFFFFF" />
			</g>
			<Tilde x={345} y={610} p={avance(frame, fCuerpo - 4, 10)} tam={50} />

			{/* la cama: duerme abrazando el reloj */}
			<CamaPizarra x={190} y={1040} ancho={660} p={cama} bulto={64} />
			<g transform={`translate(300 982) rotate(-90) scale(${respira})`}>
				<CabezaPalito p={tramo(cama, 0.3, 1)} cara="dormido" pelo="gorro" />
			</g>
			<g transform={`translate(470 950) scale(${respira})`}>
				<RelojPizarra x={0} y={0} r={74} p={reloj} hora={10} minuto={10} cara={caraReloj} marcas={false} />
			</g>
			{/* el brazo que abraza el reloj */}
			<Trazo d="M 372 1000 C 420 1010 470 1040 540 990 C 556 976 552 958 536 952" p={tramo(reloj, 0.5, 1)} ancho={8} />
			<Zzz x={330} y={880} p={tramo(cama, 0.8, 1)} t={t} />

			{/* cuidá tu reloj y él te cuida a vos */}
			{frame > fCuida
				? [0, 1, 2, 3].map((i) => {
						const k = ((frame - fCuida - i * 12) / 50) % 1;
						if (frame - fCuida - i * 12 < 0) return null;
						const x = 400 + i * 40 + 20 * Math.sin(k * 6 + i);
						const y = 900 - 230 * k;
						return <path key={i} d={corazon(x, y, 20 + 6 * (i % 2))} fill={ROJO} opacity={Math.min(1, (1 - k) * 2)} />;
					})
				: null}
		</Pizarra>
	);
};
