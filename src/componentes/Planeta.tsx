import React, {useMemo} from 'react';
import {random} from 'remotion';
import * as THREE from 'three';
import type {V3} from './utilidades3d';

const geometriasPlaneta = new Map<number, THREE.BufferGeometry>();
/** Planeta low-poly con continentes y océanos (colores por cara). */
export const obtenerPlaneta = (radio = 1.6) => {
	const enCache = geometriasPlaneta.get(radio);
	if (enCache) return enCache;
	const geo = new THREE.IcosahedronGeometry(radio, 3); // sin índice: 3 vértices por cara
	const pos = geo.attributes.position;
	const colores = new Float32Array(pos.count * 3);
	const c = new THREE.Color();
	const tierra = ['#3FAE5A', '#5CD674', '#7BDB6B'];
	for (let i = 0; i < pos.count; i += 3) {
		const x = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
		const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
		const z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
		const ruido = Math.sin(x * 2.1 + 1.3) * Math.sin(y * 2.7 + 0.4) * Math.sin(z * 1.9 + 2.2) + 0.35 * Math.sin(x * 5.3 + z * 4.1);
		if (ruido > 0.02) c.set(tierra[Math.floor(((ruido * 10) % 3 + 3) % 3)]);
		else c.set(ruido > -0.12 ? '#41C9F5' : '#2E9BFF');
		for (let k = 0; k < 3; k++) colores.set([c.r, c.g, c.b], (i + k) * 3);
	}
	geo.setAttribute('color', new THREE.BufferAttribute(colores, 3));
	geometriasPlaneta.set(radio, geo);
	return geo;
};

/** Planeta con arbolitos; `angulo` lo hace girar sobre el eje X (como si alguien caminara arriba). */
export const Planeta: React.FC<{radio?: number; angulo?: number; arboles?: boolean; position?: V3; rotation?: V3; scale?: number}> = ({
	radio = 1.6,
	angulo = 0,
	arboles: conArboles = true,
	position,
	rotation,
	scale = 1,
}) => {
	const arboles = useMemo(() => {
		const lista: {pos: THREE.Vector3; q: THREE.Quaternion; s: number; color: string}[] = [];
		let i = 0;
		while (lista.length < 14 && i < 400) {
			i++;
			const dir = new THREE.Vector3(random(`pl-x-${i}`) - 0.5, random(`pl-y-${i}`) - 0.5, random(`pl-z-${i}`) - 0.5).normalize();
			if (Math.abs(dir.x) < 0.3) continue; // dejar libre el camino del muñeco
			lista.push({
				pos: dir.clone().multiplyScalar(radio - 0.02),
				q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir),
				s: 0.55 + random(`pl-s-${i}`) * 0.5,
				color: ['#2D6A4F', '#40916C', '#1B9C85', '#52B788'][i % 4],
			});
		}
		return lista;
	}, [radio]);
	return (
		<group position={position} rotation={rotation} scale={scale}>
		<group rotation={[angulo, 0, 0]}>
			<mesh geometry={obtenerPlaneta(radio)}>
				<meshStandardMaterial vertexColors flatShading roughness={0.85} />
			</mesh>
			{(conArboles ? arboles : []).map((a, i) => (
				<group key={i} position={a.pos} quaternion={a.q} scale={a.s}>
					<mesh position={[0, 0.1, 0]}>
						<cylinderGeometry args={[0.03, 0.04, 0.2, 5]} />
						<meshStandardMaterial color="#8B5A2B" flatShading />
					</mesh>
					<mesh position={[0, 0.3, 0]}>
						<icosahedronGeometry args={[0.16, 0]} />
						<meshStandardMaterial color={a.color} flatShading roughness={0.8} />
					</mesh>
				</group>
			))}
		</group>
		</group>
	);
};

/** Cielo de estrellas lejanas (puntos). */
export const Estrellas: React.FC = () => {
	const geo = useMemo(() => {
		const n = 700;
		const pos = new Float32Array(n * 3);
		for (let i = 0; i < n; i++) {
			const dir = new THREE.Vector3(random(`es-x-${i}`) - 0.5, random(`es-y-${i}`) - 0.5, random(`es-z-${i}`) - 0.5).normalize();
			dir.multiplyScalar(60 + random(`es-r-${i}`) * 40);
			pos.set([dir.x, dir.y, dir.z], i * 3);
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
		return g;
	}, []);
	return (
		<points geometry={geo}>
			<pointsMaterial color="#ffffff" size={2.6} sizeAttenuation={false} transparent opacity={0.85} />
		</points>
	);
};

