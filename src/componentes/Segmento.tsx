import React from 'react';
import * as THREE from 'three';
import type {V3} from './utilidades3d';

const GEO_CILINDRO = new THREE.CylinderGeometry(1, 1, 1, 12);
const GEO_ESFERA = new THREE.SphereGeometry(1, 14, 10);
const ARRIBA = new THREE.Vector3(0, 1, 0);

/**
 * Cilindro redondeado entre dos puntos (brazos, patas, antenas, cejas...).
 * Útil para posar extremidades indicando dónde está cada articulación.
 */
export const Segmento: React.FC<{
	desde: V3;
	hasta: V3;
	radio: number;
	material: THREE.Material;
	/** esferas en las puntas (articulaciones redondeadas) */
	extremos?: boolean;
}> = ({desde, hasta, radio, material, extremos = true}) => {
	const a = new THREE.Vector3(...desde);
	const b = new THREE.Vector3(...hasta);
	const dir = b.clone().sub(a);
	const largo = Math.max(1e-4, dir.length());
	const q = new THREE.Quaternion().setFromUnitVectors(ARRIBA, dir.normalize());
	return (
		<>
			<mesh
				geometry={GEO_CILINDRO}
				material={material}
				position={a.clone().lerp(b, 0.5)}
				quaternion={q}
				scale={[radio, largo, radio]}
			/>
			{extremos ? (
				<>
					<mesh geometry={GEO_ESFERA} material={material} position={a} scale={radio} />
					<mesh geometry={GEO_ESFERA} material={material} position={b} scale={radio} />
				</>
			) : null}
		</>
	);
};

/** Interpola dos puntos 3D. */
export const mezclarV3 = (a: V3, b: V3, k: number): V3 => [
	a[0] + (b[0] - a[0]) * k,
	a[1] + (b[1] - a[1]) * k,
	a[2] + (b[2] - a[2]) * k,
];
