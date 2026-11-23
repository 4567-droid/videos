import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {SombraSuave} from './Efectos';
import {Segmento, mezclarV3} from './Segmento';
import {TAU, type V3} from './utilidades3d';

/**
 * Abeja "mascota" 3D (estilo muñeco): cabeza grande, ojos expresivos, antenas,
 * alas que aletean, brazos posables y abdomen con rayas. Mira hacia +Z.
 * Mide ~2,5 de alto con scale=1 (de las antenas al aguijón); los pies quedan en y ≈ -0.85.
 */

const AMARILLO = '#FFC93C';
const NEGRO = '#2E2118';

let geoAbdomen: THREE.BufferGeometry | null = null;
/** Esfera con rayas negras pintadas por cara (bordes nítidos, sombreado suave). */
const obtenerAbdomen = () => {
	if (geoAbdomen) return geoAbdomen;
	const geo = new THREE.SphereGeometry(1, 32, 24).toNonIndexed();
	const pos = geo.attributes.position;
	const colores = new Float32Array(pos.count * 3);
	const amarillo = new THREE.Color(AMARILLO);
	const negro = new THREE.Color(NEGRO);
	const rayas: [number, number][] = [
		[0.42, 0.7],
		[-0.1, 0.18],
		[-0.6, -0.34],
		[-1.01, -0.84],
	];
	for (let i = 0; i < pos.count; i += 3) {
		const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
		const c = rayas.some(([a, b]) => y >= a && y <= b) ? negro : amarillo;
		for (let k = 0; k < 3; k++) colores.set([c.r, c.g, c.b], (i + k) * 3);
	}
	geo.setAttribute('color', new THREE.BufferAttribute(colores, 3));
	geoAbdomen = geo;
	return geo;
};

const GEO_ESFERA = new THREE.SphereGeometry(1, 32, 24);
const GEO_ALA = new THREE.CircleGeometry(1, 32);

export type PropsAbeja = {
	/** segundos (para aleteo, antenas, respiración) */
	t: number;
	/** 0 = alas quietas y plegadas, 1 = aleteo completo */
	aleteo?: number;
	/** 0..1: cejas fruncidas y boca hacia abajo */
	enojo?: number;
	/** 0..1: cejas arriba y boca en "O" */
	sorpresa?: number;
	/** 0..1: brazos cruzados */
	brazosCruzados?: number;
	/** 0..1: saluda con el brazo derecho */
	saludo?: number;
	/** hacia dónde miran las pupilas (-1..1) */
	mirada?: [number, number];
	/** 0 = ojos abiertos, 1 = cerrados */
	parpadeo?: number;
	/** 0..1: golpecito impaciente con un pie */
	golpeteo?: number;
	sombra?: boolean;
	position?: V3;
	rotation?: V3;
	scale?: number;
};

export const Abeja: React.FC<PropsAbeja> = ({
	t,
	aleteo = 1,
	enojo = 0,
	sorpresa = 0,
	brazosCruzados = 0,
	saludo = 0,
	mirada = [0, 0],
	parpadeo = 0,
	golpeteo = 0,
	sombra = false,
	position,
	rotation,
	scale = 1,
}) => {
	const m = useMemo(
		() => ({
			amarillo: new THREE.MeshStandardMaterial({color: AMARILLO, roughness: 0.42}),
			negro: new THREE.MeshStandardMaterial({color: NEGRO, roughness: 0.55}),
			rayas: new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.42}),
			cuello: new THREE.MeshStandardMaterial({color: '#FFE7A0', roughness: 0.85}),
			blanco: new THREE.MeshStandardMaterial({color: '#FFFFFF', roughness: 0.2}),
			pupila: new THREE.MeshStandardMaterial({color: '#120E16', roughness: 0.15}),
			brillo: new THREE.MeshBasicMaterial({color: '#FFFFFF', toneMapped: false}),
			mejilla: new THREE.MeshBasicMaterial({color: '#FF7B9C', transparent: true, opacity: 0.65, toneMapped: false}),
			boca: new THREE.MeshStandardMaterial({color: '#7A1F2B', roughness: 0.5}),
			ala: new THREE.MeshStandardMaterial({
				color: '#E6FBFF',
				emissive: '#9DEBFF',
				emissiveIntensity: 0.25,
				transparent: true,
				opacity: 0.55,
				roughness: 0.1,
				side: THREE.DoubleSide,
				depthWrite: false,
			}),
		}),
		[],
	);
	useEffect(() => () => Object.values(m).forEach((mat) => mat.dispose()), [m]);

	// ---- alas ----
	const fase = t * TAU * 7.5;
	const aleteoAct = Math.max(0, Math.min(1, aleteo));
	const anguloAla = (lado: number, desfase: number) =>
		lado * ((0.15 + 0.55 * Math.sin(fase + desfase)) * aleteoAct + -0.55 * (1 - aleteoAct));

	// ---- brazos ----
	const ondaSaludo = Math.sin(t * TAU * 2.2);
	const brazo = (lado: number) => {
		const hombro: V3 = [lado * 0.29, 0.13, 0.04];
		const sueltoCodo: V3 = [lado * 0.45, -0.06, 0.14 + 0.02 * Math.sin(t * 2 + lado)];
		const sueltoMano: V3 = [lado * 0.47, -0.25, 0.25 + 0.03 * Math.sin(t * 2.3 + lado)];
		// cruzados: el antebrazo derecho pasa por delante del izquierdo
		const cruzCodo: V3 = [lado * 0.42, -0.1, 0.27];
		const cruzMano: V3 = [-lado * 0.22, lado > 0 ? 0.05 : -0.01, lado > 0 ? 0.47 : 0.42];
		let codo = mezclarV3(sueltoCodo, cruzCodo, brazosCruzados);
		let mano = mezclarV3(sueltoMano, cruzMano, brazosCruzados);
		if (lado > 0 && saludo > 0) {
			codo = mezclarV3(codo, [0.56, 0.3, 0.12], saludo);
			mano = mezclarV3(mano, [0.62 + 0.1 * ondaSaludo, 0.66, 0.2], saludo);
		}
		return {hombro, codo, mano};
	};
	const bI = brazo(-1);
	const bD = brazo(1);

	// ---- patas (4, cortitas) ----
	const tap = golpeteo * Math.max(0, Math.sin(t * TAU * 2.4)) * 0.12;
	const patas: {cadera: V3; rodilla: V3; pie: V3}[] = [-1, 1].flatMap((lado) => [
		{cadera: [lado * 0.11, -0.22, 0.1] as V3, rodilla: [lado * 0.19, -0.5, 0.16] as V3, pie: [lado * 0.17, -0.84 + (lado > 0 ? tap : 0), 0.24] as V3},
		{cadera: [lado * 0.13, -0.24, -0.08] as V3, rodilla: [lado * 0.26, -0.52, -0.08] as V3, pie: [lado * 0.24, -0.84, -0.02] as V3},
	]);

	// ---- cara ----
	const ojoAbierto = 1 - 0.93 * Math.max(0, Math.min(1, parpadeo));
	const [mx, my] = mirada;
	const cejaY = 0.9 + 0.06 * sorpresa - 0.03 * enojo;
	const cejaInterna = -0.1 * enojo + 0.04 * sorpresa;

	return (
		<group position={position} rotation={rotation} scale={scale}>
			{/* abdomen con rayas + aguijón */}
			<group position={[0, -0.3, -0.42]} rotation={[0.9, 0, 0]}>
				<mesh geometry={obtenerAbdomen()} material={m.rayas} scale={[0.43, 0.56, 0.43]} />
				<mesh material={m.negro} position={[0, -0.62, 0]} rotation={[Math.PI, 0, 0]}>
					<coneGeometry args={[0.07, 0.2, 12]} />
				</mesh>
			</group>

			{/* tórax peludito */}
			<mesh geometry={GEO_ESFERA} material={m.negro} position={[0, 0.02, -0.05]} scale={0.35} />
			<mesh material={m.cuello} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
				<torusGeometry args={[0.24, 0.085, 10, 28]} />
			</mesh>

			{/* alas: par delantero (grande) y trasero */}
			{[-1, 1].map((lado) => (
				<group key={`ala-${lado}`} position={[lado * 0.12, 0.3, -0.28]}>
					<group rotation={[0.25, lado * 0.35, anguloAla(lado, 0)]}>
						<mesh geometry={GEO_ALA} material={m.ala} position={[lado * 0.5, 0.26, 0]} rotation={[0, 0, lado * 0.45]} scale={[0.55, 0.31, 1]} />
					</group>
					<group rotation={[0.15, lado * 0.45, anguloAla(lado, 0.6) - lado * 0.35]}>
						<mesh geometry={GEO_ALA} material={m.ala} position={[lado * 0.4, 0.02, -0.04]} rotation={[0, 0, lado * -0.2]} scale={[0.4, 0.23, 1]} />
					</group>
				</group>
			))}

			{/* patas */}
			{patas.map((p, i) => (
				<group key={`pata-${i}`}>
					<Segmento desde={p.cadera} hasta={p.rodilla} radio={0.035} material={m.negro} />
					<Segmento desde={p.rodilla} hasta={p.pie} radio={0.032} material={m.negro} />
				</group>
			))}

			{/* brazos */}
			{[bI, bD].map((b, i) => (
				<group key={`brazo-${i}`}>
					<Segmento desde={b.hombro} hasta={b.codo} radio={0.062} material={m.negro} />
					<Segmento desde={b.codo} hasta={b.mano} radio={0.056} material={m.negro} />
					<mesh geometry={GEO_ESFERA} material={m.amarillo} position={b.mano} scale={0.095} />
				</group>
			))}

			{/* cabeza */}
			<group position={[0, 0.62, 0.05]}>
				<mesh geometry={GEO_ESFERA} material={m.amarillo} scale={0.5} />

				{/* ojos */}
				{[-1, 1].map((lado) => (
					<group key={`ojo-${lado}`} position={[lado * 0.18, 0.06, 0.42]} scale={[1, ojoAbierto, 1]}>
						<mesh geometry={GEO_ESFERA} material={m.blanco} scale={[0.15, 0.19, 0.09]} />
						<mesh geometry={GEO_ESFERA} material={m.pupila} position={[mx * 0.045, -0.01 + my * 0.05, 0.075]} scale={[0.09, 0.105, 0.04]} />
						<mesh geometry={GEO_ESFERA} material={m.brillo} position={[mx * 0.045 + 0.035, 0.035 + my * 0.05, 0.11]} scale={0.03} />
					</group>
				))}

				{/* cejas */}
				{[-1, 1].map((lado) => (
					<Segmento
						key={`ceja-${lado}`}
						desde={[lado * 0.3, cejaY - 0.62 - 0.01, 0.32]}
						hasta={[lado * 0.08, cejaY - 0.62 + cejaInterna, 0.44]}
						radio={0.024}
						material={m.negro}
					/>
				))}

				{/* mejillas */}
				{[-1, 1].map((lado) => (
					<mesh key={`mej-${lado}`} geometry={GEO_ESFERA} material={m.mejilla} position={[lado * 0.31, -0.1, 0.36]} scale={[0.075, 0.05, 0.03]} />
				))}

				{/* boca: sonrisa que se invierte con el enojo; "O" con la sorpresa */}
				{sorpresa > 0.5 ? (
					<mesh material={m.boca} position={[0, -0.18, 0.47]}>
						<torusGeometry args={[0.05, 0.02, 8, 20]} />
					</mesh>
				) : (
					<mesh material={m.boca} position={[0, -0.17 + 0.03 * enojo, 0.47]} rotation={[0.25, 0, Math.PI]} scale={[1, 1 - 2 * enojo, 1]}>
						<torusGeometry args={[0.085, 0.022, 8, 20, Math.PI]} />
					</mesh>
				)}

				{/* antenas */}
				{[-1, 1].map((lado) => {
					const vaiven = 0.04 * Math.sin(t * 3.1 + lado);
					const base: V3 = [lado * 0.13, 0.43, 0.12];
					const medio: V3 = [lado * 0.22, 0.7, 0.22];
					const punta: V3 = [lado * 0.34 + vaiven, 0.84 + vaiven * 0.5, 0.3];
					return (
						<group key={`ant-${lado}`}>
							<Segmento desde={base} hasta={medio} radio={0.022} material={m.negro} />
							<Segmento desde={medio} hasta={punta} radio={0.02} material={m.negro} />
							<mesh geometry={GEO_ESFERA} material={m.negro} position={punta} scale={0.065} />
						</group>
					);
				})}
			</group>

			{sombra ? <SombraSuave radio={0.6} position={[0, -0.86, 0]} /> : null}
		</group>
	);
};
