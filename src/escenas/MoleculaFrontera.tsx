import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara, proyectar} from '../componentes/Camara';
import {Resplandor} from '../componentes/Efectos';
import {Etiqueta} from '../componentes/Etiqueta';
import {Atomo, EscenarioMisterio, Gato, LILA, Molecula, TURQUESA} from '../componentes/Misterio';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';
import {camaraPlanos} from '../lib/planos';

/**
 * "Y lo más loco: en laboratorios sí se lograron superposiciones con moléculas y partículas de miles
 * de átomos. La frontera entre lo cuántico y lo cotidiano se sigue empujando."
 * Una molécula gigante de bolitas de colores gira y se desdobla en dos copias que vibran. Después,
 * plano general: una línea de luz en el piso separa "cuántico" de "cotidiano" y avanza hacia un
 * gato diminuto, que la mira con curiosidad.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const MOL: V3 = [-1.4, 1.5, 0];
const GATITO: V3 = [2.1, 0, 0.4];

export const MoleculaFrontera: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;
	const fLaboratorios = momento('laboratorios');
	const fSuper = momento('superposiciones');
	const fMiles = momento('miles');
	const fFrontera = momento('frontera');
	const fEmpujando = momento('empujando');

	const desdoblar = interpolate(frame, [fSuper - 4, fSuper + 12], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
	const xFrontera = interpolate(frame, [fFrontera - 6, fEmpujando + 20], [-0.1, 1.45], {...clamp, easing: Easing.inOut(Easing.quad)});
	const frontera = interpolate(frame, [fFrontera - 10, fFrontera + 4], [0, 1], clamp);
	const vib = 0.04 * desdoblar;
	const curioso = frame > fEmpujando - 6;

	const {posicion, mirarA, fov} = camaraPlanos(frame, fps, [
		{desde: 0, pos: [-0.3, 2.2, 3.6], mira: MOL, deriva: [-0.25, -0.05, -0.1]},
		{desde: fLaboratorios + 4, pos: [-2.6, 1.3, 2.9], mira: MOL, deriva: [0.3, 0.06, 0]},
		{desde: fMiles - 3, pos: [-1.4, 1.9, 4.2], mira: [-1.2, 1.4, 0], deriva: [0.15, 0, 0.12]},
		{desde: fFrontera - 6, pos: [0.4, 3.4, 7.6], mira: [0.35, 0.8, 0], deriva: [0.2, -0.12, -0.35], llegada: 14},
		{desde: fEmpujando - 4, pos: [2.9, 0.9, 2.9], mira: [1.6, 0.45, 0.3], deriva: [-0.12, 0, -0.08]},
		{desde: duracion + 1, pos: [0, 0, 0], mira: [0, 0, 0]},
	]);
	const ancla = (p: V3) => proyectar(p, posicion, mirarA, width, height, fov);
	const enGeneral = frame >= fFrontera - 6 && frame < fEmpujando - 4;
	const eQ = ancla([-1.3, 0.05, 1.4]);
	const eC = ancla([2.0, 0.05, 1.4]);

	return (
		<EscenarioMisterio
			t={t}
			overlay={
				enGeneral ? (
					<>
						<Etiqueta x={eQ.x} y={eQ.y} texto="CUÁNTICO" aparicion={frontera} fondo={TURQUESA} color="#120A2E" tamano={40} anclaje="centro" />
						<Etiqueta x={eC.x} y={eC.y} texto="COTIDIANO" aparicion={frontera} fondo="#FFD23F" color="#120A2E" tamano={40} anclaje="centro" />
					</>
				) : null
			}
		>
			<Camara posicion={posicion} mirarA={mirarA} fov={fov} />
			{/* la molécula y su copia superpuesta */}
			<group position={MOL} rotation={[0.4 + 0.2 * Math.sin(t * 0.7), t * 0.6, 0.2]}>
				<Molecula position={[-0.35 * desdoblar + vib * Math.sin(t * 53), vib * Math.cos(t * 41), 0]} opacidad={desdoblar > 0.05 ? 0.85 : 1} scale={0.85} />
				{desdoblar > 0.05 ? <Molecula position={[0.35 * desdoblar - vib * Math.cos(t * 47), -vib * Math.sin(t * 37), 0.1]} opacidad={0.55} scale={0.85} /> : null}
			</group>
			<Resplandor color={LILA} escala={3.4 + 0.8 * desdoblar} opacidad={0.2 + 0.2 * desdoblar} position={[MOL[0], MOL[1], MOL[2] - 0.6]} />
			{/* átomos sueltos del lado cuántico */}
			<Atomo t={t} position={[-2.4, 0.6, 0.6]} scale={0.25} />
			<Atomo t={t + 1} position={[-0.6, 0.45, 1.0]} scale={0.2} color="#7CE7FF" />
			{/* la frontera: una pared de luz que avanza */}
			{frontera > 0.01 ? (
				<group position={[xFrontera, 0, 0]}>
					<mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
						<planeGeometry args={[0.07, 6]} />
						<meshBasicMaterial color="#FFFFFF" transparent opacity={frontera} toneMapped={false} />
					</mesh>
					<mesh position={[0, 0.9, 0]} rotation={[0, Math.PI / 2, 0]}>
						<planeGeometry args={[6, 1.8]} />
						<meshBasicMaterial color={TURQUESA} transparent opacity={0.16 * frontera * (0.8 + 0.2 * Math.sin(t * 8))} depthWrite={false} toneMapped={false} side={2} fog={false} />
					</mesh>
					{[0, 1, 2, 3, 4].map((i) => {
						const y = ((t * 0.6 + i / 5) % 1) * 1.8;
						return <Resplandor key={i} color={TURQUESA} escala={0.35} opacidad={0.8 * frontera} position={[0, y, -2 + i]} />;
					})}
				</group>
			) : null}
			{/* el gatito del mundo cotidiano */}
			<Gato
				t={t}
				ojos={1}
				cara={curioso ? 'sorpresa' : 'normal'}
				mirar={curioso ? [0.1, -0.6] : [0, -0.2 + 0.2 * Math.sin(t)]}
				pupilas={curioso ? [-0.8, -0.2] : [0, 0]}
				position={GATITO}
				rotation={[0, -0.5, 0]}
				scale={0.32}
			/>
		</EscenarioMisterio>
	);
};
