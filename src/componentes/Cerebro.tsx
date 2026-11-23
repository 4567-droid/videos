import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {random} from 'remotion';
import * as THREE from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {TAU, type V3} from './utilidades3d';

let geoCerebro: THREE.BufferGeometry | null = null;

/**
 * Cerebro procedural: esfera alargada con circunvoluciones (ondas entrelazadas;
 * el valor absoluto marca los surcos), cisura entre hemisferios y base aplanada.
 * Mide ~1,7 de ancho, ~1,5 de alto y ~2,1 de largo (el frente mira a +Z).
 */
export const obtenerGeometriaCerebro = (): THREE.BufferGeometry => {
	if (geoCerebro) return geoCerebro;
	let geo: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 5);
	geo.deleteAttribute('normal');
	geo.deleteAttribute('uv');
	geo = mergeVertices(geo);
	const pos = geo.attributes.position;
	const colores = new Float32Array(pos.count * 3);
	const rosa = new THREE.Color('#FF9EBB');
	const surco = new THREE.Color('#D94F7C');
	const c = new THREE.Color();
	const v = new THREE.Vector3();
	for (let i = 0; i < pos.count; i++) {
		v.fromBufferAttribute(pos, i).normalize();
		const {x, y, z} = v;
		const n =
			Math.sin(x * 9 + Math.sin(y * 7) * 1.6) +
			Math.sin(y * 9 + Math.sin(z * 7) * 1.6) +
			Math.sin(z * 9 + Math.sin(x * 7) * 1.6);
		const pliegue = 1 - Math.min(1, Math.abs(n) / 1.1); // 1 en el surco
		const cisura = Math.exp(-((x / 0.07) ** 2)) * (y > -0.3 ? 1 : 0.15);
		const r = 1 - 0.075 * pliegue - 0.17 * cisura;
		const px = x * r * 0.86;
		let py = y * r * 0.76;
		const pz = z * r * 1.06;
		if (py < -0.4) py = -0.4 + (py + 0.4) * 0.45;
		pos.setXYZ(i, px, py, pz);
		c.copy(rosa).lerp(surco, Math.min(1, pliegue * 0.85 + cisura));
		colores.set([c.r, c.g, c.b], i * 3);
	}
	geo.setAttribute('color', new THREE.BufferAttribute(colores, 3));
	geo.computeVertexNormals();
	geoCerebro = geo;
	return geo;
};

export const Cerebro: React.FC<{
	/** 0..1: brillo rosado (actividad) */
	brillo?: number;
	position?: V3;
	rotation?: V3;
	scale?: number;
}> = ({brillo = 0, position, rotation, scale = 1}) => (
	<group position={position} rotation={rotation} scale={scale}>
		<mesh geometry={obtenerGeometriaCerebro()}>
			<meshStandardMaterial vertexColors roughness={0.5} emissive="#FF5C8A" emissiveIntensity={0.06 + 0.35 * brillo} />
		</mesh>
		{/* cerebelo y tronco */}
		<mesh position={[0, -0.36, -0.66]} scale={[0.44, 0.26, 0.3]}>
			<sphereGeometry args={[1, 24, 16]} />
			<meshStandardMaterial color="#F27BA0" roughness={0.55} />
		</mesh>
		<mesh position={[0, -0.58, -0.38]} rotation={[0.45, 0, 0]}>
			<cylinderGeometry args={[0.1, 0.13, 0.45, 14]} />
			<meshStandardMaterial color="#E86A92" roughness={0.55} />
		</mesh>
	</group>
);

/** Chispitas (neuronas) titilando alrededor de un cerebro. */
export const Neuronas: React.FC<{
	t: number;
	cantidad: number;
	/** 0..1: cuántas se ven */
	progreso: number;
	radio?: V3;
	tamano?: number;
	semilla?: string;
	position?: V3;
	rotation?: V3;
	scale?: number;
}> = ({t, cantidad, progreso, radio = [0.95, 0.85, 1.15], tamano = 0.045, semilla = 'neuronas', position, rotation, scale = 1}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const datos = useMemo(
		() =>
			new Array(cantidad).fill(0).map((_, i) => {
				const d = new THREE.Vector3(
					random(`${semilla}-x-${i}`) - 0.5,
					random(`${semilla}-y-${i}`) - 0.35,
					random(`${semilla}-z-${i}`) - 0.5,
				).normalize();
				const r = 1 + random(`${semilla}-r-${i}`) * 0.12;
				return {
					p: [d.x * radio[0] * r, d.y * radio[1] * r, d.z * radio[2] * r] as V3,
					fase: random(`${semilla}-f-${i}`) * TAU,
					color: random(`${semilla}-c-${i}`) > 0.5 ? '#7DF9FF' : '#FFE66D',
				};
			}),
		[cantidad, semilla, radio],
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
		const visibles = progreso * cantidad;
		const o = new THREE.Object3D();
		datos.forEach((d, i) => {
			const k = Math.max(0, Math.min(1, visibles - i));
			o.position.set(...d.p);
			o.rotation.set(t * 2 + d.fase, t * 1.5, 0);
			o.scale.setScalar(tamano * k * (0.55 + 0.45 * Math.sin(t * 7 + d.fase)));
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
		});
		m.instanceMatrix.needsUpdate = true;
	});
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<instancedMesh ref={ref} args={[undefined, undefined, cantidad]} frustumCulled={false}>
				<octahedronGeometry args={[1, 0]} />
				<meshBasicMaterial toneMapped={false} />
			</instancedMesh>
		</group>
	);
};
