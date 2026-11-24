import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Avatar} from '../componentes/Avatar';
import {Camara, proyectar, temblor} from '../componentes/Camara';
import {Nave} from '../componentes/Ciencia';
import {Escenario3D} from '../componentes/Escenario3D';
import {Etiqueta} from '../componentes/Etiqueta';
import {Reloj3D} from '../componentes/Reloj';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Cuanto más rápido vas, más lento pasa tu reloj, comparado con el de alguien quieto."
 * Arriba, un cohete a toda velocidad con un reloj que avanza lento.
 * Abajo, una persona quieta con un reloj que corre rápido.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const suave = Easing.inOut(Easing.cubic);
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const NAVE: V3 = [0.1, 0.8, 0];
const PERSONA: V3 = [0, -1.8, 0.4];

/** Estelas de velocidad (rayas que pasan hacia la izquierda). */
const Estelas: React.FC<{t: number}> = ({t}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const datos = useMemo(
		() =>
			new Array(40).fill(0).map((_, i) => ({
				y: NAVE[1] + (random(`est-y-${i}`) - 0.5) * 3.2,
				z: -1.5 + random(`est-z-${i}`) * 2.2,
				x0: random(`est-x-${i}`) * 12,
				largo: 0.6 + random(`est-l-${i}`) * 1.4,
				vel: 9 + random(`est-v-${i}`) * 7,
			})),
		[],
	);
	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const o = new THREE.Object3D();
		datos.forEach((d, i) => {
			o.position.set(6 - ((d.x0 + t * d.vel) % 12), d.y, d.z);
			o.scale.set(d.largo, 1, 1);
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
		});
		m.instanceMatrix.needsUpdate = true;
	});
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, 40]} frustumCulled={false}>
			<boxGeometry args={[1, 0.025, 0.025]} />
			<meshBasicMaterial color="#CAF0F8" transparent opacity={0.75} toneMapped={false} />
		</instancedMesh>
	);
};

export const NaveRelojes: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fLento = momento('lento');
	const fComparado = momento('comparado');
	const fQuieto = momento('quieto');

	// el cohete entra rápido desde la izquierda
	const entra = interpolate(frame, [0, 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const posNave: V3 = [NAVE[0] - 5 * (1 - entra), NAVE[1] + 0.06 * Math.sin(t * 9), NAVE[2]];
	const destacaNave = interpolate(frame, [fLento - 2, fLento + 6], [0, 1], clamp);
	const destacaPersona = interpolate(frame, [fQuieto - 6, fQuieto + 4], [0, 1], clamp);
	const lentoEtiqueta = spring({frame: frame - fLento, fps, config: {damping: 12}});
	const rapidoEtiqueta = spring({frame: frame - fQuieto + 4, fps, config: {damping: 12}});

	// cámara: empieza en el cohete y baja para mostrar a la persona
	const bajar = interpolate(frame, [fComparado - 10, fQuieto + 4], [0, 1], {...clamp, easing: suave});
	const sacudon = temblor(t * 1.6, 1.1 - 0.6 * bajar);
	const base = mezclar([0.3, 1.05, 5.2], [0.25, 0.15, 8.6], bajar);
	const posicion: V3 = [base[0] + sacudon[0], base[1] + sacudon[1], base[2]];
	const mirarA = mezclar([0.1, 0.65, 0], [0, 0.05, 0], bajar);

	// cada reloj al costado de su dueño (así no se pisan en el plano general)
	const relojNave: V3 = [posNave[0] - 0.75, posNave[1] + 0.62, 0.2];
	const relojPersona: V3 = [PERSONA[0] + 0.82, PERSONA[1] + 1.25, PERSONA[2]];
	const pLento = proyectar([relojNave[0] + 0.62, relojNave[1] + 0.05, relojNave[2]], posicion, mirarA, width, height);
	const pRapido = proyectar([relojPersona[0], relojPersona[1] - 0.52, relojPersona[2]], posicion, mirarA, width, height);

	return (
		<Escenario3D
			fondo="linear-gradient(180deg, #0B1026 0%, #1B2A6B 42%, #4361EE 72%, #8BE8FF 100%)"
			colorContraluz="#7DF9FF"
			overlay={
				<>
					<Etiqueta x={pLento.x + 70} y={pLento.y + 40} texto="LENTO" aparicion={lentoEtiqueta} fondo="#4CC9F0" color="#0B1026" anclaje="centro" />
					<Etiqueta x={pRapido.x} y={pRapido.y + 30} texto="RÁPIDO" aparicion={rapidoEtiqueta} fondo="#FFD166" color="#3D2B1F" anclaje="centro" />
				</>
			}
		>
			<Camara posicion={posicion} mirarA={mirarA} />
			<Estelas t={t} />

			{/* cohete con su reloj lento */}
			<Nave t={t} position={posNave} rotation={[0, 0, -Math.PI / 2]} scale={0.75} />
			<Reloj3D hora={4 + t * 0.06} t={t} color="#4CC9F0" brillo={destacaNave} position={relojNave} scale={0.36} />

			{/* persona quieta con su reloj rápido */}
			<mesh position={[PERSONA[0], PERSONA[1] - 0.06, PERSONA[2]]}>
				<cylinderGeometry args={[1.3, 1.4, 0.12, 48]} />
				<meshStandardMaterial color="#80ED99" roughness={0.9} />
			</mesh>
			<Avatar
				t={t}
				animacion="reposo"
				position={PERSONA}
				rotation={[0, 0.25, 0]}
				scale={0.95}
				colores={{remera: '#FF5DA2', pantalon: '#3A0CA3', pelo: '#2B1B12', zapatillas: '#FFD23F'}}
			/>
			<Reloj3D hora={4 + t * 2.2} t={t} color="#FFD166" brillo={destacaPersona} position={relojPersona} scale={0.36} />
		</Escenario3D>
	);
};
