import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara} from '../componentes/Camara';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {useEscena} from '../lib/escena';
import {LISTA_PALETA} from '../lib/colores';

const FONDOS = [
	'radial-gradient(circle at 50% 45%, #3a86ff 0%, #4b1fa8 55%, #12052e 100%)',
	'radial-gradient(circle at 50% 45%, #ff5da2 0%, #8a1fa8 55%, #1d0530 100%)',
	'radial-gradient(circle at 50% 45%, #00c2a8 0%, #0d5fa8 55%, #04122e 100%)',
];

/**
 * Escena de reemplazo: se usa cuando data/video.json pide un componente que
 * todavía no existe en src/escenas/index.ts. Permite ver tiempos y subtítulos
 * del guion antes de programar la animación definitiva.
 */
export const EscenaGenerica: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {indice} = useEscena();
	const t = frame / fps;
	const formas = [0, 1, 2, 3, 4];
	return (
		<Escenario3D fondo={FONDOS[indice % FONDOS.length]}>
			<Camara posicion={[Math.sin(t * 0.3) * 8, 0.6, Math.cos(t * 0.3) * 8]} mirarA={[0, 0, 0]} />
			{formas.map((i) => {
				const a = (i / formas.length) * Math.PI * 2 + t * 0.4;
				return (
					<mesh key={i} position={[Math.cos(a) * 1.8, Math.sin(t * 1.2 + i) * 0.6, Math.sin(a) * 1.8]} rotation={[t + i, t * 0.7, 0]}>
						{i % 3 === 0 ? <icosahedronGeometry args={[0.6, 0]} /> : i % 3 === 1 ? <torusGeometry args={[0.45, 0.18, 8, 24]} /> : <boxGeometry args={[0.8, 0.8, 0.8]} />}
						<meshStandardMaterial color={LISTA_PALETA[i % LISTA_PALETA.length]} flatShading roughness={0.5} />
					</mesh>
				);
			})}
			<Destellos t={t} cantidad={50} />
		</Escenario3D>
	);
};
