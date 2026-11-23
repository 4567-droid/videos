import React, {useMemo} from 'react';
import * as THREE from 'three';
import type {V3} from './utilidades3d';

const geometriasCorazon = new Map<string, THREE.BufferGeometry>();

/**
 * Superficie implícita del corazón 3D (Taubin):
 *   (x² + 9/4·y² + z² − 1)³ − x²·z³ − 9/80·y²·z³ = 0
 * escrita con raíz cúbica (misma superficie, pero el gradiente no se anula en z = 0):
 *   x² + 9/4·y² + z² − 1 − z·∛(x² + 9/80·y²) = 0      (f < 0 adentro)
 * Coordenadas: x = ancho, y = profundidad, z = alto.
 */
const fCorazon = (x: number, y: number, z: number) =>
	x * x + 2.25 * y * y + z * z - 1 - z * Math.cbrt(x * x + 0.1125 * y * y);

const gradienteCorazon = (x: number, y: number, z: number): [number, number, number] => {
	const c = Math.cbrt(x * x + 0.1125 * y * y);
	if (c < 1e-6) return [0, 0, 0]; // eje vertical (hendidura y punta): se usa la normal de respaldo
	const k = z / (3 * c * c);
	return [2 * x - 2 * x * k, 4.5 * y - 0.225 * y * k, 2 * z - c];
};

const ESCALA_CORAZON = 1.17;
const PROFUNDIDAD_CORAZON = 0.78; // un poco más "chato" que la fórmula original

/** Busca dónde el rayo desde el centro cruza la superficie (bisección). Dirección en ejes de three. */
const radioEnDireccion = (dx: number, dy: number, dz: number) => {
	let lo = 0;
	let hi = 1.6;
	for (let k = 0; k < 40; k++) {
		const m = (lo + hi) / 2;
		if (fCorazon(dx * m, dz * m, dy * m) < 0) lo = m;
		else hi = m;
	}
	return (lo + hi) / 2;
};

/** Normal (ejes de three) en un punto de la superficie, contemplando el escalado. */
const normalEn = (px: number, py: number, pz: number, respaldo: [number, number, number]) => {
	const g = gradienteCorazon(px, pz, py);
	let nx = g[0] / ESCALA_CORAZON;
	let ny = g[2] / ESCALA_CORAZON;
	let nz = g[1] / (ESCALA_CORAZON * PROFUNDIDAD_CORAZON);
	const largo = Math.hypot(nx, ny, nz);
	if (largo < 1e-9) return respaldo;
	nx /= largo;
	ny /= largo;
	nz /= largo;
	return [nx, ny, nz] as [number, number, number];
};

/**
 * Corazón 3D suave (con hendidura arriba y punta abajo), generado 100 % por código:
 * se proyecta una esfera sobre la superficie implícita y se usan normales analíticas.
 * Mide ~2,7 de ancho, ~2,6 de alto y ~1,2 de profundidad, centrado en el origen.
 * detalle "bajo" = pocas caras, para cientos/miles de copias (galaxias, lluvias).
 */
export const obtenerGeometriaCorazon = (detalle: 'alto' | 'bajo' = 'alto'): THREE.BufferGeometry => {
	const enCache = geometriasCorazon.get(detalle);
	if (enCache) return enCache;
	const [segAncho, segAlto] = detalle === 'alto' ? [128, 96] : [20, 14];
	const geo = new THREE.SphereGeometry(1, segAncho, segAlto);
	geo.deleteAttribute('uv');
	const pos = geo.attributes.position;
	const nor = geo.attributes.normal;
	for (let i = 0; i < pos.count; i++) {
		const dx = pos.getX(i);
		const dy = pos.getY(i);
		const dz = pos.getZ(i);
		const r = radioEnDireccion(dx, dy, dz);
		const [px, py, pz] = [dx * r, dy * r, dz * r];
		pos.setXYZ(i, px * ESCALA_CORAZON, py * ESCALA_CORAZON, pz * ESCALA_CORAZON * PROFUNDIDAD_CORAZON);
		const n = normalEn(px, py, pz, [dx, dy, dz]);
		nor.setXYZ(i, n[0], n[1], n[2]);
	}
	// centrar en alto (ancho y profundidad ya son simétricos)
	geo.computeBoundingBox();
	const centroY = (geo.boundingBox!.min.y + geo.boundingBox!.max.y) / 2;
	geo.translate(0, -centroY, 0);

	// punto para el brillo "caricatura" sobre el lóbulo izquierdo
	const d = new THREE.Vector3(-0.5, 0.55, 0.65).normalize();
	const r = radioEnDireccion(d.x, d.y, d.z);
	const p: [number, number, number] = [d.x * r, d.y * r, d.z * r];
	geo.userData.brillo = {
		posicion: [p[0] * ESCALA_CORAZON, p[1] * ESCALA_CORAZON - centroY, p[2] * ESCALA_CORAZON * PROFUNDIDAD_CORAZON],
		normal: normalEn(p[0], p[1], p[2], [d.x, d.y, d.z]),
	};
	geometriasCorazon.set(detalle, geo);
	return geo;
};

type Props = {
	/** 0..1, envolvente del latido (ver lib/latido.ts) */
	latido?: number;
	color?: string;
	/** Cuánto brilla en cada latido */
	brillo?: number;
	/** Agrega arterias/venas estilizadas arriba */
	vasos?: boolean;
	position?: V3;
	rotation?: V3;
	scale?: number;
};

const curvaAorta = new THREE.CatmullRomCurve3([
	new THREE.Vector3(0.15, 0.5, -0.1),
	new THREE.Vector3(0.2, 1.15, -0.05),
	new THREE.Vector3(0.55, 1.5, 0),
	new THREE.Vector3(1.0, 1.3, 0),
]);
const curvaPulmonar = new THREE.CatmullRomCurve3([
	new THREE.Vector3(-0.3, 0.55, 0.15),
	new THREE.Vector3(-0.4, 1.05, 0.2),
	new THREE.Vector3(-0.8, 1.25, 0.15),
]);

export const Corazon3D: React.FC<Props> = ({
	latido = 0,
	color = '#FF2E4D',
	brillo = 0.9,
	vasos = false,
	position,
	rotation,
	scale = 1,
}) => {
	const geo = obtenerGeometriaCorazon();
	const reflejo = useMemo(() => {
		const datos = geo.userData.brillo as {posicion: V3; normal: V3};
		return {
			posicion: datos.posicion,
			orientacion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...datos.normal)),
		};
	}, [geo]);
	const pulso = 1 + 0.13 * latido;
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<group scale={[pulso, pulso * (1 - 0.03 * latido), pulso]}>
				<mesh geometry={geo}>
					<meshStandardMaterial
						color={color}
						emissive={color}
						emissiveIntensity={0.18 + brillo * latido}
						roughness={0.3}
						metalness={0.05}
					/>
				</mesh>
				{/* brillo "caricatura" sobre el lóbulo izquierdo */}
				<group position={reflejo.posicion} quaternion={reflejo.orientacion}>
					<mesh position={[0, 0, 0.01]} rotation={[0, 0, 0.75]} scale={[0.21, 0.095, 0.02]}>
						<sphereGeometry args={[1, 16, 10]} />
						<meshBasicMaterial color="#ffffff" transparent opacity={0.5} toneMapped={false} />
					</mesh>
				</group>
			</group>
			{vasos ? (
				<>
					<mesh>
						<tubeGeometry args={[curvaAorta, 32, 0.17, 10, false]} />
						<meshStandardMaterial color="#E5383B" roughness={0.4} />
					</mesh>
					<mesh>
						<tubeGeometry args={[curvaPulmonar, 24, 0.13, 10, false]} />
						<meshStandardMaterial color="#4895EF" roughness={0.4} />
					</mesh>
				</>
			) : null}
		</group>
	);
};
