import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Camara} from '../componentes/Camara';
import {Resplandor} from '../componentes/Efectos';
import {EscenarioMisterio, Gato, GatosSuperpuestos, TURQUESA} from '../componentes/Misterio';
import {useEscena} from '../lib/escena';
import {camaraPlanos} from '../lib/planos';

/**
 * "Entonces… ¿por qué no vemos gatos así de raros? Hoy se explica en gran parte con la
 * decoherencia: los objetos grandes interactúan tanto con su entorno que pierden esa rareza
 * cuántica en un instante."
 * Los dos gatos translúcidos titilan; partículas del entorno (aire, luz) llueven sobre ellos y
 * cada choque deja una chispa. Se acercan, se funden y con "instante" queda un solo gato, sólido,
 * despierto y sorprendido.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const N = 90;

/** Partículas que vuelan desde lejos hacia el gato (instanciadas). `k` 0..1 = cuánto llovió. */
const Lluvia: React.FC<{frame: number; desde: number; hasta: number; destino: [number, number, number]}> = ({frame, desde, hasta, destino}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const datos = useMemo(
		() =>
			new Array(N).fill(0).map((_, i) => {
				const a = random(`ll-a-${i}`) * Math.PI * 2;
				const e = (random(`ll-e-${i}`) - 0.3) * 1.4;
				const r = 4 + random(`ll-r-${i}`) * 3;
				return {
					origen: [Math.cos(a) * Math.cos(e) * r, 1 + Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r] as [number, number, number],
					sale: random(`ll-s-${i}`),
					vuelo: 14 + random(`ll-v-${i}`) * 10,
					color: random(`ll-c-${i}`) > 0.5 ? TURQUESA : '#FFD23F',
				};
			}),
		[],
	);
	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const c = new THREE.Color();
		datos.forEach((d, i) => m.setColorAt(i, c.set(d.color)));
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
	}, [datos]);
	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const o = new THREE.Object3D();
		datos.forEach((d, i) => {
			const inicio = desde + d.sale * (hasta - desde);
			// cada partícula vuelve a salir en ciclos mientras dura la lluvia
			const ciclo = (((frame - inicio) % (d.vuelo + 6)) + d.vuelo + 6) % (d.vuelo + 6);
			const k = ciclo / d.vuelo;
			const activa = frame >= inicio && frame <= hasta + 20 && k <= 1;
			o.position.set(
				d.origen[0] + (destino[0] - d.origen[0]) * k,
				d.origen[1] + (destino[1] + 0.6 - d.origen[1]) * k,
				d.origen[2] + (destino[2] - d.origen[2]) * k,
			);
			o.scale.setScalar(activa ? 0.05 : 0);
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
		});
		m.instanceMatrix.needsUpdate = true;
	});
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
			<sphereGeometry args={[1, 8, 6]} />
			<meshBasicMaterial toneMapped={false} />
		</instancedMesh>
	);
};

export const LluviaChispas: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;
	const fRaros = momento('raros');
	const fDeco = momento('decoherencia');
	const fInteractuan = momento('interactúan');
	const fInstante = momento('instante');

	const lluviaDesde = fDeco - 6;
	const lluviaHasta = fInstante;
	const choques = interpolate(frame, [fInteractuan - 10, fInstante], [0, 1], clamp);
	const separar = interpolate(frame, [0, fRaros, fInteractuan, fInstante - 4], [0.5, 0.9, 0.9, 0], clamp);
	const fundido = spring({frame: frame - fInstante + 2, fps, config: {damping: 11, stiffness: 140}});
	const flash = interpolate(frame, [fInstante - 3, fInstante + 1, fInstante + 14], [0, 1, 0], clamp);
	const fantasmas = 1 - interpolate(frame, [fInstante - 3, fInstante + 2], [0, 1], clamp);
	const temblor = choques * (1 - fundido) * 0.04;
	const centro: [number, number, number] = [0, 0, 0];

	const {posicion, mirarA, fov} = camaraPlanos(frame, fps, [
		{desde: 0, pos: [1.6, 1.4, 4.0], mira: [0, 0.8, 0], deriva: [-0.3, 0.02, -0.1]},
		{desde: fDeco - 4, pos: [-2.4, 3.2, 6.6], mira: [0, 0.9, 0], deriva: [0.35, -0.08, -0.3]},
		{desde: fInteractuan - 2, pos: [0.9, 1.3, 3.2], mira: [0, 0.85, 0], deriva: [-0.2, 0, -0.05]},
		{desde: fInstante - 4, pos: [0, 1.15, 2.6], mira: [0, 0.95, 0], deriva: [0, 0, -0.12], llegada: 6},
		{desde: duracion + 1, pos: [0, 0, 0], mira: [0, 0, 0]},
	]);

	return (
		<EscenarioMisterio t={t}>
			<Camara posicion={posicion} mirarA={mirarA} fov={fov} />
			<group position={[temblor * Math.sin(t * 60), 0, temblor * Math.cos(t * 53)]}>
				{fantasmas > 0.01 ? <GatosSuperpuestos t={t} opacidad={0.85 * fantasmas} separar={separar} titilar={0.4 + 0.6 * choques} position={centro} /> : null}
				{fundido > 0.01 ? (
					<Gato t={t} ojos={frame > fInstante + 20 && Math.sin(t * 3) > 0.96 ? 0.1 : 1} cara="sorpresa" mirar={[0, 0.3 * Math.sin(t * 2)]} position={centro} scale={0.6 + 0.4 * fundido} />
				) : null}
			</group>
			{frame >= lluviaDesde && frame <= lluviaHasta + 24 ? <Lluvia frame={frame} desde={lluviaDesde} hasta={lluviaHasta} destino={centro} /> : null}
			{/* chispas de los choques */}
			{choques > 0.01 && fundido < 0.9
				? new Array(8).fill(0).map((_, i) => {
						const fase = (t * 2.3 + i / 8) % 1;
						const a = random(`ch-${i}-${Math.floor(t * 2.3 + i / 8)}`) * Math.PI * 2;
						const y = 0.3 + random(`chy-${i}-${Math.floor(t * 2.3 + i / 8)}`) * 1.1;
						return (
							<group key={i} position={[Math.cos(a) * 0.55, y, Math.sin(a) * 0.45 + 0.15]} scale={0.2 + fase * 0.6}>
								<Resplandor color={i % 2 ? '#FFD23F' : TURQUESA} escala={1} opacidad={(1 - fase) * choques} />
							</group>
						);
					})
				: null}
			{flash > 0.01 ? <Resplandor color="#FFFFFF" escala={1 + 6 * flash} opacidad={flash} position={[0, 0.9, 0.3]} /> : null}
		</EscenarioMisterio>
	);
};
