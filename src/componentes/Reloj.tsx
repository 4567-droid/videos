import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {FUENTE} from '../lib/fuente';
import {useTexturaCanvas} from './texturas';
import {TAU, type V3} from './utilidades3d';

/** Cara de reloj dibujada en canvas (marcas y números); opcionalmente con agujas y aro de color. */
export const dibujarCaraReloj = (ctx: CanvasRenderingContext2D, opciones: {hora?: number; aro?: string} = {}) => {
	const W = ctx.canvas.width;
	const c = W / 2;
	const R = W / 2;
	ctx.clearRect(0, 0, W, W);
	const circulo = (r: number, color: string) => {
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(c, c, r, 0, TAU);
		ctx.fill();
	};
	if (opciones.aro) circulo(R * 0.995, opciones.aro);
	const radioCara = opciones.aro ? R * 0.84 : R * 0.995;
	circulo(radioCara, '#FFFDF5');
	for (let i = 0; i < 60; i++) {
		const a = (i / 60) * TAU;
		const larga = i % 5 === 0;
		const r1 = radioCara * 0.94;
		const r2 = r1 - radioCara * (larga ? 0.12 : 0.05);
		ctx.strokeStyle = '#2B2D42';
		ctx.lineWidth = larga ? W * 0.018 : W * 0.007;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1);
		ctx.lineTo(c + Math.sin(a) * r2, c - Math.cos(a) * r2);
		ctx.stroke();
	}
	ctx.fillStyle = '#2B2D42';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = `900 ${Math.round(radioCara * 0.26)}px ${FUENTE}`;
	[12, 3, 6, 9].forEach((n, i) => {
		const a = (i / 4) * TAU;
		const r = radioCara * 0.62;
		ctx.fillText(String(n), c + Math.sin(a) * r, c - Math.cos(a) * r + radioCara * 0.02);
	});
	if (opciones.hora !== undefined) {
		const aguja = (angulo: number, largo: number, ancho: number, color: string) => {
			ctx.strokeStyle = color;
			ctx.lineWidth = ancho;
			ctx.beginPath();
			ctx.moveTo(c, c);
			ctx.lineTo(c + Math.sin(angulo) * largo, c - Math.cos(angulo) * largo);
			ctx.stroke();
		};
		aguja(((opciones.hora % 12) / 12) * TAU, radioCara * 0.45, W * 0.04, '#2B2D42');
		aguja((opciones.hora % 1) * TAU, radioCara * 0.72, W * 0.028, '#2B2D42');
		circulo(W * 0.035, '#EF233C');
	}
};

const GEO_ESFERA = new THREE.SphereGeometry(1, 24, 16);

/**
 * Despertador 3D: cuerpo, campanitas, patas y agujas animables.
 * `hora` es continua (10,5 = 10:30). `estirar` lo deforma como goma; `sonar` lo hace vibrar.
 */
export const Reloj3D: React.FC<{
	hora: number;
	t: number;
	color?: string;
	estirar?: number;
	sonar?: number;
	/** 0..1: aro brillante alrededor (para destacar) */
	brillo?: number;
	position?: V3;
	rotation?: V3;
	scale?: number;
}> = ({hora, t, color = '#EF476F', estirar = 0, sonar = 0, brillo = 0, position, rotation, scale = 1}) => {
	const cara = useTexturaCanvas('cara-reloj', 512, 512, (ctx) => dibujarCaraReloj(ctx), true);
	const angMin = (hora % 1) * TAU;
	const angHora = ((hora % 12) / 12) * TAU;
	const vib = sonar * Math.sin(t * 70) * 0.06;
	const goma = 0.06 * estirar * Math.sin(t * 7);
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<group rotation={[0, 0, vib]} scale={[1 - 0.28 * estirar - goma, 1 + 0.65 * estirar + goma, 1]}>
				{/* cuerpo */}
				<mesh rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[1, 1, 0.34, 64]} />
					<meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
				</mesh>
				<mesh position={[0, 0, 0.17]}>
					<torusGeometry args={[0.97, 0.075, 12, 64]} />
					<meshStandardMaterial color="#FFD166" roughness={0.25} metalness={0.6} />
				</mesh>
				{brillo > 0.01 ? (
					<mesh position={[0, 0, 0.12]} scale={1 + 0.1 * brillo}>
						<torusGeometry args={[1.05, 0.05, 8, 64]} />
						<meshBasicMaterial color="#FFF3B0" transparent opacity={brillo} toneMapped={false} />
					</mesh>
				) : null}
				{cara ? (
					<mesh position={[0, 0, 0.172]}>
						<circleGeometry args={[0.92, 64]} />
						<meshBasicMaterial map={cara} toneMapped={false} />
					</mesh>
				) : null}
				{/* agujas */}
				<group position={[0, 0, 0.2]} rotation={[0, 0, -angHora]}>
					<mesh position={[0, 0.2, 0]}>
						<boxGeometry args={[0.09, 0.48, 0.03]} />
						<meshStandardMaterial color="#2B2D42" roughness={0.4} />
					</mesh>
				</group>
				<group position={[0, 0, 0.22]} rotation={[0, 0, -angMin]}>
					<mesh position={[0, 0.3, 0]}>
						<boxGeometry args={[0.06, 0.72, 0.03]} />
						<meshStandardMaterial color="#2B2D42" roughness={0.4} />
					</mesh>
				</group>
				<mesh geometry={GEO_ESFERA} position={[0, 0, 0.24]} scale={0.07}>
					<meshStandardMaterial color="#EF233C" roughness={0.3} />
				</mesh>
				{/* campanitas */}
				{[-1, 1].map((lado) => (
					<group key={lado} position={[lado * 0.58, 0.86, -0.02]} rotation={[0, 0, lado * -0.55 + vib * 2]}>
						<mesh>
							<sphereGeometry args={[0.34, 24, 12, 0, TAU, 0, Math.PI / 2]} />
							<meshStandardMaterial color="#FFD166" roughness={0.25} metalness={0.6} side={THREE.DoubleSide} />
						</mesh>
						<mesh geometry={GEO_ESFERA} position={[0, 0.36, 0]} scale={0.06}>
							<meshStandardMaterial color="#FFD166" roughness={0.25} metalness={0.6} />
						</mesh>
					</group>
				))}
				{/* martillito y patas */}
				<mesh position={[0, 1.08, 0]} rotation={[0, 0, vib * 6]}>
					<cylinderGeometry args={[0.035, 0.035, 0.3, 10]} />
					<meshStandardMaterial color="#6C757D" metalness={0.5} roughness={0.35} />
				</mesh>
				{[-1, 1].map((lado) => (
					<mesh key={lado} position={[lado * 0.6, -0.92, 0]} rotation={[0, 0, lado * 0.5]}>
						<cylinderGeometry args={[0.06, 0.09, 0.32, 10]} />
						<meshStandardMaterial color="#2B2D42" roughness={0.5} />
					</mesh>
				))}
			</group>
		</group>
	);
};

/**
 * Reloj blando que se derrite (estilo Dalí). `derretir` 0..1 estira hacia abajo la mitad
 * inferior en "gotas" y la dobla hacia atrás. Las agujas quedan pintadas en la cara.
 */
export const RelojDerretido: React.FC<{
	t: number;
	derretir: number;
	aro?: string;
	position?: V3;
	rotation?: V3;
	scale?: number;
}> = ({t, derretir, aro = '#FF9F1C', position, rotation, scale = 1}) => {
	const cara = useTexturaCanvas(`reloj-blando-${aro}`, 512, 512, (ctx) => dibujarCaraReloj(ctx, {hora: 10.17, aro}), true);
	const ref = useRef<THREE.Mesh>(null);
	const {geo, base} = useMemo(() => {
		const g = new THREE.PlaneGeometry(2, 2, 48, 48);
		return {geo: g, base: Float32Array.from(g.attributes.position.array)};
	}, []);
	useLayoutEffect(() => {
		const pos = geo.attributes.position;
		for (let i = 0; i < pos.count; i++) {
			const x = base[i * 3];
			const y = base[i * 3 + 1];
			const debajo = Math.max(0, 0.15 - y);
			const goteo = 0.55 + 0.45 * Math.sin(x * 5.3 + 0.7) * Math.cos(x * 2.1 + 1.3);
			const ola = 0.05 * Math.sin(t * 2.5 + x * 3) * debajo;
			pos.setXYZ(
				i,
				x * (1 + 0.12 * derretir * debajo),
				y - derretir * (debajo * debajo * (0.7 + 1.5 * goteo) + ola),
				-derretir * debajo * 0.55,
			);
		}
		pos.needsUpdate = true;
		geo.computeVertexNormals();
	});
	// gotitas que caen del borde
	const gotas = [0, 1, 2].map((i) => {
		const k = (t * 0.6 + i / 3) % 1;
		const x = [-0.35, 0.1, 0.45][i];
		const fondo = -1 - derretir * 1.2 * (0.7 + 1.5 * (0.55 + 0.45 * Math.sin(x * 5.3 + 0.7) * Math.cos(x * 2.1 + 1.3)));
		return {x, y: fondo - k * 1.2, z: -derretir * 0.6, s: 0.07 * (1 - k * 0.6) * derretir};
	});
	return (
		<group position={position} rotation={rotation} scale={scale}>
			{cara ? (
				<mesh ref={ref} geometry={geo}>
					<meshStandardMaterial map={cara} transparent alphaTest={0.5} side={THREE.DoubleSide} roughness={0.5} />
				</mesh>
			) : null}
			{gotas.map((g, i) =>
				g.s > 0.005 ? (
					<mesh key={i} geometry={GEO_ESFERA} position={[g.x, g.y, g.z]} scale={[g.s, g.s * 1.4, g.s]}>
						<meshStandardMaterial color={aro} roughness={0.4} />
					</mesh>
				) : null,
			)}
		</group>
	);
};
