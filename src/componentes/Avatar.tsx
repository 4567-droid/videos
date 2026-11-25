import React, {useEffect, useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {obtenerGeometriaCorazon} from './Corazon3D';
import {Resplandor, SombraSuave} from './Efectos';
import {Segmento} from './Segmento';
import {TAU, type V3} from './utilidades3d';

/**
 * Muñeco low-poly articulado (cadera, torso, cabeza, brazos con codo,
 * piernas con rodilla y tobillo). Mide ~1,75 de alto con scale=1 y mira hacia +Z.
 * Animaciones: reposo, caminar, correr, saludar, celebrar (se pueden mezclar).
 */

export type Animacion = 'reposo' | 'caminar' | 'correr' | 'saludar' | 'celebrar' | 'señalar' | 'escribir';

type Pose = {
	bob: number;
	cadera: V3;
	torso: V3;
	cabeza: V3;
	hombroI: V3;
	codoI: V3;
	hombroD: V3;
	codoD: V3;
	piernaI: V3;
	rodillaI: number;
	pieI: number;
	piernaD: V3;
	rodillaD: number;
	pieD: number;
	respira: number;
};

const {sin, cos, max, abs} = Math;

const reposo = (t: number): Pose => {
	const r = sin((TAU * t) / 3.4);
	return {
		bob: 0.006 * r,
		cadera: [0, 0.05 * sin((TAU * t) / 7), 0],
		torso: [0.02 + 0.012 * r, 0.03 * sin((TAU * t) / 6), 0],
		cabeza: [0.04 * sin((TAU * t) / 4.6), 0.18 * sin((TAU * t) / 5.7), 0.03 * sin((TAU * t) / 7.3)],
		hombroI: [0.05 * sin((TAU * t) / 3.4 + 1), 0, -0.1 - 0.025 * r],
		codoI: [-0.2, 0, 0],
		hombroD: [0.05 * sin((TAU * t) / 3.4 + 2), 0, 0.1 + 0.025 * r],
		codoD: [-0.2, 0, 0],
		piernaI: [0, 0, -0.035],
		rodillaI: 0.03,
		pieI: -0.03,
		piernaD: [0, 0, 0.035],
		rodillaD: 0.03,
		pieD: -0.03,
		respira: r,
	};
};

const caminar = (t: number, frecuencia = 0.95): Pose => {
	const f = TAU * frecuencia * t;
	const s = sin(f);
	const c = cos(f);
	const mI = -0.5 * s;
	const mD = 0.5 * s;
	const rI = 0.12 + 0.75 * max(0, c) ** 2;
	const rD = 0.12 + 0.75 * max(0, -c) ** 2;
	return {
		bob: -0.035 * s * s + 0.012 * cos(2 * f),
		cadera: [0, 0.1 * s, 0],
		torso: [0.06, -0.2 * s, 0],
		cabeza: [-0.03, 0.08 * s, 0],
		hombroI: [0.45 * s, 0, -0.08],
		codoI: [-0.3 - 0.25 * max(0, -s), 0, 0],
		hombroD: [-0.45 * s, 0, 0.08],
		codoD: [-0.3 - 0.25 * max(0, s), 0, 0],
		piernaI: [mI, 0, -0.02],
		rodillaI: rI,
		pieI: -(mI + rI) * 0.6,
		piernaD: [mD, 0, 0.02],
		rodillaD: rD,
		pieD: -(mD + rD) * 0.6,
		respira: 0,
	};
};

const correr = (t: number, frecuencia = 1.45): Pose => {
	const f = TAU * frecuencia * t;
	const s = sin(f);
	const mI = -0.85 * s - 0.2;
	const mD = 0.85 * s - 0.2;
	const rI = 0.35 + 1.5 * max(0, cos(f + 0.5)) ** 2;
	const rD = 0.35 + 1.5 * max(0, -cos(f + 0.5)) ** 2;
	return {
		bob: 0.07 * abs(s) - 0.03,
		cadera: [0, 0.16 * s, 0],
		torso: [0.24, -0.3 * s, 0],
		cabeza: [-0.14, 0.12 * s, 0],
		hombroI: [0.8 * s, 0, -0.18],
		codoI: [-1.5 - 0.25 * max(0, -s), 0, 0],
		hombroD: [-0.8 * s, 0, 0.18],
		codoD: [-1.5 - 0.25 * max(0, s), 0, 0],
		piernaI: [mI, 0, -0.02],
		rodillaI: rI,
		pieI: -(mI + rI) * 0.45 + 0.15,
		piernaD: [mD, 0, 0.02],
		rodillaD: rD,
		pieD: -(mD + rD) * 0.45 + 0.15,
		respira: 0,
	};
};

const saludar = (t: number): Pose => {
	const base = reposo(t);
	const ola = sin(TAU * 2.2 * t);
	return {
		...base,
		hombroD: [-0.15, 0, 2.55],
		codoD: [0, 0, 0.35 + 0.45 * ola],
		cabeza: [base.cabeza[0], 0.1, -0.08],
	};
};

const celebrar = (t: number): Pose => {
	const b = abs(sin(TAU * 1.5 * t));
	return {
		...reposo(t),
		bob: 0.06 * b,
		hombroI: [-0.1, 0, -2.6 + 0.15 * b],
		hombroD: [-0.1, 0, 2.6 - 0.15 * b],
		codoI: [-0.25, 0, 0],
		codoD: [-0.25, 0, 0],
		cabeza: [-0.15, 0, 0],
		rodillaI: 0.1 + 0.15 * (1 - b),
		rodillaD: 0.1 + 0.15 * (1 - b),
	};
};

/** Brazo derecho estirado hacia arriba y a la derecha (señala algo). */
const señalar = (t: number): Pose => {
	const base = reposo(t);
	const vaiven = 0.04 * sin(TAU * 1.6 * t);
	return {
		...base,
		torso: [0.02, 0.12, 0],
		hombroD: [-2.2 + vaiven, 0, 0.9],
		codoD: [-0.12, 0, 0],
		cabeza: [-0.18, 0.28, 0],
	};
};

/** Brazo derecho levantado hacia el costado, haciendo circulitos (escribe en un pizarrón). */
const escribir = (t: number): Pose => {
	const base = reposo(t);
	const f = TAU * 1.8 * t;
	return {
		...base,
		torso: [0.02, 0.25, 0],
		hombroD: [-1.55 + 0.1 * sin(f), 0, 1.15 + 0.1 * cos(f)],
		codoD: [-0.35, 0, 0],
		cabeza: [-0.05, 0.45, 0],
	};
};

const ANIMACIONES: Record<Animacion, (t: number, frecuencia?: number) => Pose> = {
	reposo,
	caminar,
	correr,
	saludar,
	celebrar,
	señalar,
	escribir,
};

const mezclarPoses = (lista: {pose: Pose; peso: number}[]): Pose => {
	const total = lista.reduce((a, p) => a + p.peso, 0) || 1;
	const resultado = {} as Record<string, number | number[]>;
	for (const clave of Object.keys(lista[0].pose) as (keyof Pose)[]) {
		const v0 = lista[0].pose[clave];
		if (Array.isArray(v0)) {
			resultado[clave] = [0, 1, 2].map(
				(i) => lista.reduce((a, p) => a + (p.pose[clave] as V3)[i] * p.peso, 0) / total,
			);
		} else {
			resultado[clave] = lista.reduce((a, p) => a + (p.pose[clave] as number) * p.peso, 0) / total;
		}
	}
	return resultado as unknown as Pose;
};

export type ColoresAvatar = {
	piel: string;
	remera: string;
	pantalon: string;
	zapatillas: string;
	pelo: string;
};

const COLORES_DEFECTO: ColoresAvatar = {
	piel: '#F1B38A',
	remera: '#00B4D8',
	pantalon: '#1D3557',
	zapatillas: '#FF9F1C',
	pelo: '#3B2416',
};

type Props = {
	/** tiempo en segundos (normalmente frame / fps) */
	t: number;
	animacion?: Animacion;
	/** Mezcla de animaciones, ej: [{animacion:'reposo', peso:0.3}, {animacion:'correr', peso:0.7}] */
	mezcla?: {animacion: Animacion; peso: number}[];
	/** Multiplica la velocidad del ciclo de caminar/correr */
	frecuencia?: number;
	colores?: Partial<ColoresAvatar>;
	pantalonCorto?: boolean;
	/** Si se pasa (0..1), muestra un corazón latiendo en el pecho */
	latido?: number | null;
	/** cejas (del color del pelo) */
	cejas?: boolean;
	/** "feliz" (sonrisa), "preocupada" (cejas arqueadas y boca hacia abajo) o "serena" (sonrisa chiquita, ojos entornados) */
	expresion?: 'feliz' | 'preocupada' | 'serena';
	/** 0..1: hombros encogidos (tensión); la cabeza baja un poco */
	encoger?: number;
	/** giro extra de la cabeza [x, y, z] (mirar arriba, a un costado...) */
	giroCabeza?: V3;
	/** brazos en una posición fija, en coordenadas del torso: codo y mano (izq = x negativa, der = x positiva) */
	brazos?: {izq?: {codo: V3; mano: V3}; der?: {codo: V3; mano: V3}};
	/** objeto en la mano (un celular, por ejemplo) y en cuál de las dos */
	enMano?: React.ReactNode;
	manoObjeto?: 'izq' | 'der';
	/** elementos extra dentro de la cabeza (pelo, bigote, anteojos...). Centro de la cabeza: [0, 0.17, 0], radio 0.2 */
	cabeza?: React.ReactNode;
	/** elementos extra pegados al torso (bata, moño...). El torso va de y=0.02 a 0.52, radio ~0.2 */
	torso?: React.ReactNode;
	/** 0..1: cierra el ojo derecho (guiño) */
	guino?: number;
	sombra?: boolean;
	position?: V3;
	rotation?: V3;
	scale?: number;
};

export const Avatar: React.FC<Props> = ({
	t,
	animacion = 'reposo',
	mezcla,
	frecuencia = 1,
	colores,
	pantalonCorto = false,
	latido = null,
	cejas = false,
	expresion = 'feliz',
	encoger = 0,
	giroCabeza,
	brazos,
	enMano,
	manoObjeto = 'der',
	cabeza,
	torso,
	guino = 0,
	sombra = true,
	position,
	rotation,
	scale = 1,
}) => {
	const c = {...COLORES_DEFECTO, ...colores};
	const preocupada = expresion === 'preocupada';
	const serena = expresion === 'serena';
	const subeHombros = 0.06 * encoger;

	const m = useMemo(() => {
		const mat = (props: THREE.MeshStandardMaterialParameters) =>
			new THREE.MeshStandardMaterial({flatShading: true, roughness: 0.62, metalness: 0, ...props});
		return {
			piel: mat({}),
			remera: mat({}),
			pantalon: mat({}),
			zapatillas: mat({roughness: 0.45}),
			pelo: mat({roughness: 0.8}),
			ojos: new THREE.MeshBasicMaterial({color: '#1b1b2f'}),
			boca: new THREE.MeshBasicMaterial({color: '#7a2531'}),
			mejillas: new THREE.MeshBasicMaterial({color: '#ff7b8a', transparent: true, opacity: 0.55}),
			corazon: new THREE.MeshStandardMaterial({color: '#FF2E4D', emissive: '#FF2E4D', roughness: 0.3}),
		};
	}, []);

	useEffect(() => () => Object.values(m).forEach((mat) => mat.dispose()), [m]);

	useLayoutEffect(() => {
		m.piel.color.set(c.piel);
		m.remera.color.set(c.remera);
		m.pantalon.color.set(c.pantalon);
		m.zapatillas.color.set(c.zapatillas);
		m.pelo.color.set(c.pelo);
		m.corazon.emissiveIntensity = 0.3 + 1.6 * (latido ?? 0);
	});

	const lista = mezcla?.filter((x) => x.peso > 0.0001) ?? [];
	const p =
		lista.length > 0
			? mezclarPoses(lista.map((x) => ({pose: ANIMACIONES[x.animacion](t, frecuenciaBase(x.animacion) * frecuencia), peso: x.peso})))
			: ANIMACIONES[animacion](t, frecuenciaBase(animacion) * frecuencia);

	const corazonGeo = obtenerGeometriaCorazon();

	return (
		<group position={position} rotation={rotation} scale={scale}>
			<group position={[0, 0.98 + p.bob, 0]} rotation={p.cadera}>
				{/* cadera */}
				<mesh material={m.pantalon}>
					<cylinderGeometry args={[0.17, 0.155, 0.24, 8]} />
				</mesh>

				{/* torso */}
				<group position={[0, 0.1, 0]} rotation={p.torso}>
					<mesh material={m.remera} position={[0, 0.27, 0]} scale={[1, 1 + 0.015 * p.respira, 1 + 0.025 * p.respira]}>
						<cylinderGeometry args={[0.23, 0.17, 0.5, 8]} />
					</mesh>
					<mesh material={m.remera} position={[-0.245, 0.47 + subeHombros, 0]}>
						<icosahedronGeometry args={[0.088, 1]} />
					</mesh>
					<mesh material={m.remera} position={[0.245, 0.47 + subeHombros, 0]}>
						<icosahedronGeometry args={[0.088, 1]} />
					</mesh>
					{/* cuello */}
					<mesh material={m.piel} position={[0, 0.56, 0]}>
						<cylinderGeometry args={[0.06, 0.07, 0.12, 7]} />
					</mesh>

					{/* cabeza */}
					<group
						position={[0, 0.6, 0]}
						rotation={[
							p.cabeza[0] + 0.14 * encoger + (giroCabeza?.[0] ?? 0),
							p.cabeza[1] + (giroCabeza?.[1] ?? 0),
							p.cabeza[2] + (giroCabeza?.[2] ?? 0),
						]}
					>
						<mesh material={m.piel} position={[0, 0.17, 0]}>
							<icosahedronGeometry args={[0.2, 1]} />
						</mesh>
						<mesh material={m.pelo} position={[0, 0.205, -0.02]} rotation={[-0.3, 0, 0]}>
							<sphereGeometry args={[0.215, 9, 6, 0, TAU, 0, Math.PI * 0.52]} />
						</mesh>
						<mesh material={m.ojos} position={[-0.07, 0.185, 0.178]} scale={serena ? [1.1, 0.5, 1] : 1}>
							<sphereGeometry args={[0.027, 8, 6]} />
						</mesh>
						<mesh material={m.ojos} position={[0.07, 0.185 + 0.006 * guino, 0.178]} scale={serena ? [1.1, 0.5 * (1 - 0.8 * guino), 1] : [1 + 0.25 * guino, 1 - 0.85 * guino, 1]}>
							<sphereGeometry args={[0.027, 8, 6]} />
						</mesh>
						<mesh material={m.mejillas} position={[-0.115, 0.125, 0.155]} scale={[1, 0.7, 0.4]}>
							<sphereGeometry args={[0.032, 8, 6]} />
						</mesh>
						<mesh material={m.mejillas} position={[0.115, 0.125, 0.155]} scale={[1, 0.7, 0.4]}>
							<sphereGeometry args={[0.032, 8, 6]} />
						</mesh>
						<mesh
							material={m.boca}
							position={[0, preocupada ? 0.095 : 0.115, 0.186]}
							rotation={[0.25, 0, Math.PI]}
							scale={serena ? [0.7, 0.55, 1] : [preocupada ? 0.8 : 1, preocupada ? -0.75 : 1, 1]}
						>
							<torusGeometry args={[0.042, 0.012, 5, 12, Math.PI]} />
						</mesh>
						{cejas
							? [-1, 1].map((lado) => (
									<Segmento
										key={`ceja-${lado}`}
										desde={[lado * 0.105, preocupada ? 0.222 : 0.235, 0.172]}
										hasta={[lado * 0.035, preocupada ? 0.262 : 0.243, 0.19]}
										radio={0.016}
										material={m.pelo}
									/>
								))
							: null}
						{cabeza}
					</group>
					{torso}

					{([-1, 1] as const).map((lado) => {
						const fijo = lado < 0 ? brazos?.izq : brazos?.der;
						const objeto = enMano && (manoObjeto === 'izq') === lado < 0 ? enMano : null;
						if (fijo) {
							const hombro: V3 = [lado * 0.27, 0.46 + subeHombros, 0];
							return (
								<group key={lado}>
									<Segmento desde={hombro} hasta={fijo.codo} radio={0.068} material={m.remera} />
									<Segmento desde={fijo.codo} hasta={fijo.mano} radio={0.056} material={m.piel} />
									<mesh material={m.piel} position={fijo.mano}>
										<icosahedronGeometry args={[0.072, 1]} />
									</mesh>
									{objeto ? <group position={fijo.mano}>{objeto}</group> : null}
								</group>
							);
						}
						return (
							<Brazo key={lado} lado={lado} y={0.46 + subeHombros} hombro={lado < 0 ? p.hombroI : p.hombroD} codo={lado < 0 ? p.codoI : p.codoD} m={m}>
								{objeto}
							</Brazo>
						);
					})}

					{latido !== null ? (
						<group position={[0.075, 0.37, 0.225]}>
							<mesh geometry={corazonGeo} material={m.corazon} scale={0.085 * (1 + 0.3 * latido)} />
							<Resplandor color="#ff4d6d" escala={0.55 + 0.5 * latido} opacidad={0.35 + 0.5 * latido} />
						</group>
					) : null}
				</group>

				<Pierna lado={-1} muslo={p.piernaI} rodilla={p.rodillaI} pie={p.pieI} m={m} corto={pantalonCorto} />
				<Pierna lado={1} muslo={p.piernaD} rodilla={p.rodillaD} pie={p.pieD} m={m} corto={pantalonCorto} />
			</group>
			{sombra ? <SombraSuave radio={0.55} /> : null}
		</group>
	);
};

const frecuenciaBase = (a: Animacion) => (a === 'correr' ? 1.45 : a === 'caminar' ? 0.95 : 1);

type Materiales = Record<'piel' | 'remera' | 'pantalon' | 'zapatillas', THREE.Material>;

const Brazo: React.FC<{lado: number; y?: number; hombro: V3; codo: V3; m: Materiales; children?: React.ReactNode}> = ({
	lado,
	y = 0.46,
	hombro,
	codo,
	m,
	children,
}) => (
	<group position={[lado * 0.27, y, 0]} rotation={hombro}>
		<mesh material={m.remera} position={[0, -0.13, 0]}>
			<capsuleGeometry args={[0.068, 0.17, 3, 7]} />
		</mesh>
		<group position={[0, -0.29, 0]} rotation={codo}>
			<mesh material={m.piel} position={[0, -0.12, 0]}>
				<capsuleGeometry args={[0.056, 0.17, 3, 7]} />
			</mesh>
			<mesh material={m.piel} position={[0, -0.27, 0]}>
				<icosahedronGeometry args={[0.072, 1]} />
			</mesh>
			{children ? <group position={[0, -0.27, 0]}>{children}</group> : null}
		</group>
	</group>
);

const Pierna: React.FC<{lado: number; muslo: V3; rodilla: number; pie: number; m: Materiales; corto: boolean}> = ({
	lado,
	muslo,
	rodilla,
	pie,
	m,
	corto,
}) => (
	<group position={[lado * 0.1, -0.05, 0]} rotation={muslo}>
		<mesh material={m.pantalon} position={[0, -0.22, 0]}>
			<capsuleGeometry args={[0.09, 0.28, 3, 7]} />
		</mesh>
		<group position={[0, -0.45, 0]} rotation={[rodilla, 0, 0]}>
			<mesh material={corto ? m.piel : m.pantalon} position={[0, -0.21, 0]}>
				<capsuleGeometry args={[0.072, 0.28, 3, 7]} />
			</mesh>
			<group position={[0, -0.43, 0]} rotation={[pie, 0, 0]}>
				<mesh material={m.zapatillas} position={[0, -0.02, 0.055]}>
					<boxGeometry args={[0.13, 0.085, 0.27]} />
				</mesh>
			</group>
		</group>
	</group>
);
