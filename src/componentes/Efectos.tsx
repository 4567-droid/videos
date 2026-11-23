import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {random} from 'remotion';
import * as THREE from 'three';
import {LISTA_PALETA} from '../lib/colores';
import {TAU, texturaResplandor, texturaSombra, type V3} from './utilidades3d';

/** Halo luminoso (sprite aditivo) para dar brillo a objetos. */
export const Resplandor: React.FC<{color: string; escala: number; opacidad?: number; position?: V3}> = ({
	color,
	escala,
	opacidad = 0.8,
	position,
}) => (
	<sprite position={position} scale={[escala, escala, 1]}>
		<spriteMaterial
			map={texturaResplandor()}
			color={color}
			transparent
			opacity={opacidad}
			blending={THREE.AdditiveBlending}
			depthWrite={false}
			toneMapped={false}
			fog={false}
		/>
	</sprite>
);

/** Sombra suave falsa (más barata que sombras reales). */
export const SombraSuave: React.FC<{radio?: number; opacidad?: number; position?: V3}> = ({
	radio = 0.6,
	opacidad = 1,
	position = [0, 0.01, 0],
}) => (
	<mesh position={position} rotation={[-Math.PI / 2, 0, 0]} scale={[radio * 2, radio * 2, 1]} renderOrder={1}>
		<planeGeometry args={[1, 1]} />
		<meshBasicMaterial map={texturaSombra()} transparent opacity={opacidad} depthWrite={false} toneMapped={false} />
	</mesh>
);

type PropsDestellos = {
	t: number;
	cantidad?: number;
	/** Tamaño de la caja donde flotan */
	rango?: V3;
	centro?: V3;
	tamano?: number;
	semilla?: string;
	colores?: string[];
	opacidad?: number;
};

/** Partículas brillantes que flotan y titilan (InstancedMesh). */
export const Destellos: React.FC<PropsDestellos> = ({
	t,
	cantidad = 60,
	rango = [8, 10, 6],
	centro = [0, 0, 0],
	tamano = 0.06,
	semilla = 'destellos',
	colores = LISTA_PALETA,
	opacidad = 0.9,
}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	// clave estable: los arrays por defecto son nuevos en cada render
	const clave = JSON.stringify([cantidad, centro, rango, semilla, tamano, colores]);
	const datos = useMemo(
		() =>
			new Array(cantidad).fill(0).map((_, i) => ({
				x: centro[0] + (random(`${semilla}-x-${i}`) - 0.5) * rango[0],
				y: centro[1] + (random(`${semilla}-y-${i}`) - 0.5) * rango[1],
				z: centro[2] + (random(`${semilla}-z-${i}`) - 0.5) * rango[2],
				fase: random(`${semilla}-f-${i}`) * TAU,
				vel: 0.4 + random(`${semilla}-v-${i}`) * 0.8,
				s: tamano * (0.5 + random(`${semilla}-s-${i}`)),
				color: colores[Math.floor(random(`${semilla}-c-${i}`) * colores.length)],
			})),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[clave],
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
			o.position.set(d.x + Math.sin(t * d.vel * 0.7 + d.fase) * 0.25, d.y + Math.sin(t * d.vel + d.fase) * 0.35, d.z);
			o.rotation.set(t * d.vel * 1.3, t * d.vel, 0);
			o.scale.setScalar(d.s * (0.55 + 0.45 * Math.sin(t * 3.1 * d.vel + d.fase)));
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
		});
		m.instanceMatrix.needsUpdate = true;
	});

	return (
		<instancedMesh ref={ref} args={[undefined, undefined, cantidad]} frustumCulled={false}>
			<octahedronGeometry args={[1, 0]} />
			<meshBasicMaterial transparent opacity={opacidad} toneMapped={false} />
		</instancedMesh>
	);
};

/** Cielo con degradé (esfera gigante) para escenas con horizonte. */
export const Cielo: React.FC<{arriba: string; horizonte: string; abajo?: string}> = ({arriba, horizonte, abajo}) => {
	const material = useMemo(
		() =>
			new THREE.ShaderMaterial({
				side: THREE.BackSide,
				depthWrite: false,
				fog: false,
				uniforms: {
					cArriba: {value: new THREE.Color(arriba)},
					cHorizonte: {value: new THREE.Color(horizonte)},
					cAbajo: {value: new THREE.Color(abajo ?? horizonte)},
				},
				vertexShader: /* glsl */ `
					varying vec3 vDir;
					void main() {
						vDir = normalize(position);
						gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
					}`,
				fragmentShader: /* glsl */ `
					uniform vec3 cArriba;
					uniform vec3 cHorizonte;
					uniform vec3 cAbajo;
					varying vec3 vDir;
					void main() {
						float h = vDir.y;
						vec3 c = h > 0.0
							? mix(cHorizonte, cArriba, pow(clamp(h * 1.6, 0.0, 1.0), 0.7))
							: mix(cHorizonte, cAbajo, clamp(-h * 4.0, 0.0, 1.0));
						gl_FragColor = vec4(c, 1.0);
						#include <colorspace_fragment>
					}`,
			}),
		[arriba, horizonte, abajo],
	);
	return (
		<mesh material={material} scale={180} renderOrder={-10}>
			<sphereGeometry args={[1, 32, 16]} />
		</mesh>
	);
};

type PropsOndas = {
	/** fase del latido (1 = un latido) */
	fase: number;
	bpm: number;
	/** segundos desde que empezó la escena (no muestra ondas de antes) */
	t: number;
	radio?: number;
	color?: string;
	position?: V3;
	rotation?: V3;
	duracion?: number;
	expansion?: number;
};

/** Anillos que se expanden en cada latido, como una onda expansiva. */
export const OndasLatido: React.FC<PropsOndas> = ({
	fase,
	bpm,
	t,
	radio = 1.25,
	color = '#FFD6E0',
	position,
	rotation,
	duracion = 1.3,
	expansion = 2.6,
}) => {
	const periodo = 60 / bpm;
	const ultimo = Math.floor(fase - 0.06);
	const anillos: React.ReactNode[] = [];
	for (let n = ultimo; n > ultimo - 4; n--) {
		const edad = (fase - 0.06 - n) * periodo;
		if (edad < 0 || edad > duracion || edad > t) continue;
		const k = edad / duracion;
		anillos.push(
			<mesh key={n} scale={1 + Math.sqrt(k) * expansion}>
				<torusGeometry args={[radio, 0.03, 6, 96]} />
				<meshBasicMaterial
					color={color}
					transparent
					opacity={(1 - k) ** 1.5 * 0.9}
					toneMapped={false}
					depthWrite={false}
				/>
			</mesh>,
		);
	}
	return (
		<group position={position} rotation={rotation}>
			{anillos}
		</group>
	);
};
