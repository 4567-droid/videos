import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {FUENTE} from '../lib/fuente';
import {Resplandor} from './Efectos';
import {useTexturaCanvas} from './texturas';
import {TAU, type V3} from './utilidades3d';

/**
 * Objetos de "ciencia" reutilizables: pizarrón con tiza, cohete, sábana del
 * espacio-tiempo, satélite, celular con mapa, signo de pregunta y lamparita.
 */

const GEO_ESFERA = new THREE.SphereGeometry(1, 24, 16);

// ---------------------------------------------------------------------------
// Pizarrón

const dibujarPizarron = (ctx: CanvasRenderingContext2D, lineas: {texto: string; x: number; y: number; tam: number; circulo?: boolean}[]) => {
	const W = ctx.canvas.width;
	const H = ctx.canvas.height;
	ctx.fillStyle = '#23533F';
	ctx.fillRect(0, 0, W, H);
	// manchas de tiza borrada
	ctx.fillStyle = 'rgba(255,255,255,0.05)';
	for (let i = 0; i < 9; i++) {
		ctx.beginPath();
		ctx.ellipse(((i * 337) % W), ((i * 211) % H), 120, 40, i, 0, TAU);
		ctx.fill();
	}
	ctx.fillStyle = 'rgba(248,249,250,0.93)';
	ctx.strokeStyle = 'rgba(248,249,250,0.85)';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	for (const l of lineas) {
		ctx.font = `900 ${l.tam}px ${FUENTE}`;
		ctx.fillText(l.texto, l.x * W, l.y * H);
		if (l.circulo) {
			ctx.lineWidth = 7;
			const ancho = ctx.measureText(l.texto).width;
			ctx.beginPath();
			ctx.ellipse(l.x * W, l.y * H, ancho * 0.68, l.tam * 0.78, -0.08, 0, TAU);
			ctx.stroke();
		}
	}
	// flechita y relojito dibujados
	ctx.lineWidth = 8;
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.arc(W * 0.8, H * 0.28, 70, 0, TAU);
	ctx.moveTo(W * 0.8, H * 0.28);
	ctx.lineTo(W * 0.8, H * 0.28 - 48);
	ctx.moveTo(W * 0.8, H * 0.28);
	ctx.lineTo(W * 0.8 + 36, H * 0.28 + 10);
	ctx.stroke();
};

/** Pizarrón con texto en tiza. `revelar` (0..1) lo va "escribiendo" de izquierda a derecha. */
export const Pizarron: React.FC<{revelar?: number; position?: V3; rotation?: V3; scale?: number}> = ({
	revelar = 1,
	position,
	rotation,
	scale = 1,
}) => {
	const textura = useTexturaCanvas(
		'pizarron',
		1024,
		614,
		(ctx) =>
			dibujarPizarron(ctx, [
				{texto: '1905', x: 0.22, y: 0.25, tam: 110, circulo: true},
				{texto: 'E = mc²', x: 0.47, y: 0.58, tam: 190},
				{texto: "t' ≠ t", x: 0.8, y: 0.8, tam: 96},
			]),
		true,
	);
	const k = Math.max(0, Math.min(1, revelar));
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<mesh position={[0, 0, -0.05]}>
				<boxGeometry args={[3.25, 2.05, 0.1]} />
				<meshStandardMaterial color="#8B5A2B" roughness={0.7} />
			</mesh>
			{textura ? (
				<mesh position={[0, 0, 0.003]}>
					<planeGeometry args={[3.0, 1.8]} />
					<meshBasicMaterial map={textura} toneMapped={false} />
				</mesh>
			) : null}
			{k < 0.999 ? (
				<mesh position={[1.5 - (3.0 * (1 - k)) / 2, 0, 0.006]}>
					<planeGeometry args={[3.0 * (1 - k), 1.8]} />
					<meshBasicMaterial color="#23533F" toneMapped={false} />
				</mesh>
			) : null}
			<mesh position={[0, -1.06, 0.08]}>
				<boxGeometry args={[2.9, 0.08, 0.18]} />
				<meshStandardMaterial color="#6F4518" roughness={0.7} />
			</mesh>
			{[-1, 1].map((lado) => (
				<mesh key={lado} position={[lado * 1.35, -1.6, -0.1]} rotation={[0.08, 0, lado * 0.06]}>
					<cylinderGeometry args={[0.05, 0.06, 1.2, 8]} />
					<meshStandardMaterial color="#6F4518" roughness={0.7} />
				</mesh>
			))}
		</group>
	);
};

// ---------------------------------------------------------------------------
// Cohete

/** Cohete de caricatura (la punta mira a +Y). `fuego` 0..1 controla la llama. */
export const Nave: React.FC<{t: number; fuego?: number; position?: V3; rotation?: V3; scale?: number}> = ({
	t,
	fuego = 1,
	position,
	rotation,
	scale = 1,
}) => {
	const titila = 1 + 0.18 * Math.sin(t * 40) + 0.1 * Math.sin(t * 23);
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<mesh>
				<cylinderGeometry args={[0.36, 0.33, 1.2, 32]} />
				<meshStandardMaterial color="#F1FAEE" roughness={0.35} />
			</mesh>
			<mesh position={[0, 0.9, 0]}>
				<coneGeometry args={[0.36, 0.62, 32]} />
				<meshStandardMaterial color="#E63946" roughness={0.35} />
			</mesh>
			<mesh position={[0, 0.25, 0.33]}>
				<torusGeometry args={[0.15, 0.04, 10, 24]} />
				<meshStandardMaterial color="#FFD166" metalness={0.6} roughness={0.25} />
			</mesh>
			<mesh position={[0, 0.25, 0.335]}>
				<circleGeometry args={[0.13, 24]} />
				<meshStandardMaterial color="#4CC9F0" emissive="#4CC9F0" emissiveIntensity={0.4} roughness={0.1} />
			</mesh>
			{[0, 1, 2].map((i) => (
				<group key={i} rotation={[0, (i * TAU) / 3, 0]}>
					<mesh position={[0, -0.45, 0.42]} rotation={[0.35, 0, 0]}>
						<boxGeometry args={[0.06, 0.45, 0.3]} />
						<meshStandardMaterial color="#E63946" roughness={0.35} />
					</mesh>
				</group>
			))}
			<mesh position={[0, -0.68, 0]}>
				<cylinderGeometry args={[0.22, 0.28, 0.16, 24]} />
				<meshStandardMaterial color="#495057" metalness={0.5} roughness={0.35} />
			</mesh>
			{fuego > 0.01 ? (
				<group position={[0, -0.78, 0]} scale={[fuego, fuego * titila, fuego]}>
					<mesh position={[0, -0.38, 0]} rotation={[Math.PI, 0, 0]}>
						<coneGeometry args={[0.24, 0.78, 20]} />
						<meshBasicMaterial color="#FF7B00" transparent opacity={0.9} toneMapped={false} />
					</mesh>
					<mesh position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]}>
						<coneGeometry args={[0.14, 0.5, 16]} />
						<meshBasicMaterial color="#FFE066" toneMapped={false} />
					</mesh>
					<Resplandor color="#FF9500" escala={1.4} opacidad={0.7} position={[0, -0.35, 0]} />
				</group>
			) : null}
		</group>
	);
};

// ---------------------------------------------------------------------------
// Sábana del espacio-tiempo

/** Altura de la sábana (pozo de gravedad) en el punto (x, z). */
export const alturaSabana = (x: number, z: number, hundir: number, profundidad = 1.6, ancho = 0.95) =>
	(-hundir * profundidad * ancho * ancho) / (x * x + z * z + ancho * ancho);

const dibujarGrilla = (ctx: CanvasRenderingContext2D) => {
	const W = ctx.canvas.width;
	ctx.fillStyle = '#10143A';
	ctx.fillRect(0, 0, W, W);
	const n = 16;
	for (const [ancho, color] of [
		[14, 'rgba(76,201,240,0.25)'],
		[5, '#7DF9FF'],
	] as [number, string][]) {
		ctx.strokeStyle = color;
		ctx.lineWidth = ancho;
		for (let i = 0; i <= n; i++) {
			const p = (i / n) * W;
			ctx.beginPath();
			ctx.moveTo(p, 0);
			ctx.lineTo(p, W);
			ctx.moveTo(0, p);
			ctx.lineTo(W, p);
			ctx.stroke();
		}
	}
};

/** Grilla luminosa que se hunde bajo una masa (como una sábana estirada). */
export const SabanaEspacioTiempo: React.FC<{hundir: number; tamano?: number; profundidad?: number; position?: V3}> = ({
	hundir,
	tamano = 9,
	profundidad = 1.6,
	position,
}) => {
	const textura = useTexturaCanvas('grilla-espacio-tiempo', 1024, 1024, dibujarGrilla);
	const {geo, base} = useMemo(() => {
		const g = new THREE.PlaneGeometry(tamano, tamano, 110, 110);
		g.rotateX(-Math.PI / 2);
		return {geo: g, base: Float32Array.from(g.attributes.position.array)};
	}, [tamano]);
	useLayoutEffect(() => {
		const pos = geo.attributes.position;
		for (let i = 0; i < pos.count; i++) {
			const x = base[i * 3];
			const z = base[i * 3 + 2];
			pos.setY(i, alturaSabana(x, z, hundir, profundidad));
		}
		pos.needsUpdate = true;
		geo.computeVertexNormals();
	}, [hundir, geo, base, profundidad]);
	return textura ? (
		<mesh geometry={geo} position={position}>
			<meshStandardMaterial
				map={textura}
				emissiveMap={textura}
				emissive="#FFFFFF"
				emissiveIntensity={0.9}
				roughness={0.6}
				side={THREE.DoubleSide}
			/>
		</mesh>
	) : null;
};

// ---------------------------------------------------------------------------
// Satélite

export const Satelite: React.FC<{t: number; position?: V3; rotation?: V3; scale?: number}> = ({t, position, rotation, scale = 1}) => (
	<group position={position} rotation={rotation} scale={scale}>
		<mesh>
			<boxGeometry args={[0.55, 0.55, 0.75]} />
			<meshStandardMaterial color="#E9C46A" metalness={0.55} roughness={0.3} />
		</mesh>
		{[-1, 1].map((lado) => (
			<group key={lado} position={[lado * 0.95, 0, 0]}>
				<mesh position={[-lado * 0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
					<cylinderGeometry args={[0.025, 0.025, 0.4, 8]} />
					<meshStandardMaterial color="#ADB5BD" metalness={0.6} roughness={0.3} />
				</mesh>
				{[0, 1, 2].map((i) => (
					<mesh key={i} position={[lado * (i - 1) * 0.34, 0, 0]}>
						<boxGeometry args={[0.31, 0.03, 0.62]} />
						<meshStandardMaterial color="#1D4ED8" emissive="#1E3A8A" emissiveIntensity={0.3} metalness={0.4} roughness={0.25} />
					</mesh>
				))}
			</group>
		))}
		<mesh position={[0, -0.35, 0.25]} rotation={[Math.PI * 0.75, 0, 0]}>
			<sphereGeometry args={[0.28, 24, 8, 0, TAU, 0, 0.9]} />
			<meshStandardMaterial color="#F8F9FA" roughness={0.3} side={THREE.DoubleSide} />
		</mesh>
		<mesh position={[0, 0.34, 0]} geometry={GEO_ESFERA} scale={0.05}>
			<meshBasicMaterial color={Math.sin(t * 6) > 0 ? '#FF4D6D' : '#5A0F1F'} toneMapped={false} />
		</mesh>
	</group>
);

// ---------------------------------------------------------------------------
// Celular con mapa

const dibujarMapa = (ctx: CanvasRenderingContext2D) => {
	const W = ctx.canvas.width;
	const H = ctx.canvas.height;
	ctx.fillStyle = '#EEF2E6';
	ctx.fillRect(0, 0, W, H);
	// parque y río
	ctx.fillStyle = '#B7E4C7';
	ctx.fillRect(W * 0.08, H * 0.08, W * 0.4, H * 0.16);
	ctx.fillStyle = '#A9D6F5';
	ctx.beginPath();
	ctx.moveTo(0, H * 0.62);
	ctx.bezierCurveTo(W * 0.3, H * 0.55, W * 0.6, H * 0.75, W, H * 0.66);
	ctx.lineTo(W, H * 0.72);
	ctx.bezierCurveTo(W * 0.6, H * 0.81, W * 0.3, H * 0.61, 0, H * 0.68);
	ctx.fill();
	// calles
	ctx.strokeStyle = '#FFFFFF';
	ctx.lineWidth = 18;
	for (let i = 1; i < 6; i++) {
		ctx.beginPath();
		ctx.moveTo(0, (i / 6) * H);
		ctx.lineTo(W, (i / 6) * H + 30);
		ctx.stroke();
	}
	for (let i = 1; i < 4; i++) {
		ctx.beginPath();
		ctx.moveTo((i / 4) * W, 0);
		ctx.lineTo((i / 4) * W - 20, H);
		ctx.stroke();
	}
	ctx.strokeStyle = '#FFD166';
	ctx.lineWidth = 26;
	ctx.beginPath();
	ctx.moveTo(W * 0.1, H);
	ctx.lineTo(W * 0.9, 0);
	ctx.stroke();
	// ruta
	ctx.strokeStyle = '#3A86FF';
	ctx.lineWidth = 14;
	ctx.setLineDash([]);
	ctx.beginPath();
	ctx.moveTo(W * 0.5, H * 0.95);
	ctx.lineTo(W * 0.5, H * 0.5);
	ctx.lineTo(W * 0.6, H * 0.32);
	ctx.stroke();
};

/**
 * Celular con un mapa. El punto azul ("estás acá") se aleja del lugar real según `desvio` (0..1),
 * unido por una línea roja punteada que muestra el error.
 */
export const Celular: React.FC<{t: number; desvio: number; position?: V3; rotation?: V3; scale?: number}> = ({
	t,
	desvio,
	position,
	rotation,
	scale = 1,
}) => {
	const mapa = useTexturaCanvas('mapa', 512, 1024, dibujarMapa);
	const cuerpo = useMemo(() => new RoundedBoxGeometry(1.15, 2.25, 0.12, 4, 0.14), []);
	const real: V3 = [0.12, 0.38, 0.075];
	const punto: V3 = [real[0] - 0.5 * desvio, real[1] - 0.85 * desvio, 0.08];
	const pulso = (t * 1.2) % 1;
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<mesh geometry={cuerpo}>
				<meshStandardMaterial color="#1B1B2F" roughness={0.35} metalness={0.2} />
			</mesh>
			{mapa ? (
				<mesh position={[0, 0, 0.062]}>
					<planeGeometry args={[1.02, 2.04]} />
					<meshBasicMaterial map={mapa} toneMapped={false} />
				</mesh>
			) : null}
			{/* pin del destino real */}
			<group position={[real[0], real[1] + 0.1, 0.12]}>
				<mesh geometry={GEO_ESFERA} scale={0.075}>
					<meshStandardMaterial color="#EF233C" roughness={0.35} />
				</mesh>
				<mesh position={[0, -0.09, 0]} rotation={[Math.PI, 0, 0]}>
					<coneGeometry args={[0.055, 0.12, 16]} />
					<meshStandardMaterial color="#EF233C" roughness={0.35} />
				</mesh>
			</group>
			{/* línea de error */}
			{desvio > 0.02
				? new Array(8).fill(0).map((_, i) => {
						const a = i / 8;
						const b = (i + 0.5) / 8;
						const p1: V3 = [real[0] + (punto[0] - real[0]) * a, real[1] + (punto[1] - real[1]) * a, 0.09];
						const p2: V3 = [real[0] + (punto[0] - real[0]) * b, real[1] + (punto[1] - real[1]) * b, 0.09];
						const largo = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
						return (
							<mesh
								key={i}
								position={[(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, 0.09]}
								rotation={[0, 0, Math.atan2(p2[1] - p1[1], p2[0] - p1[0])]}
							>
								<boxGeometry args={[largo, 0.022, 0.01]} />
								<meshBasicMaterial color="#EF233C" toneMapped={false} />
							</mesh>
						);
					})
				: null}
			{/* punto azul con halo */}
			<group position={punto}>
				<mesh scale={0.1 + 0.12 * pulso}>
					<circleGeometry args={[1, 32]} />
					<meshBasicMaterial color="#3A86FF" transparent opacity={0.35 * (1 - pulso)} toneMapped={false} />
				</mesh>
				<mesh position={[0, 0, 0.005]}>
					<circleGeometry args={[0.075, 32]} />
					<meshBasicMaterial color="#FFFFFF" toneMapped={false} />
				</mesh>
				<mesh position={[0, 0, 0.01]}>
					<circleGeometry args={[0.055, 32]} />
					<meshBasicMaterial color="#1E6FFF" toneMapped={false} />
				</mesh>
			</group>
		</group>
	);
};

// ---------------------------------------------------------------------------
// Signo de pregunta y lamparita

const curvaPregunta = new THREE.CatmullRomCurve3(
	[
		[-0.42, 0.52],
		[-0.32, 0.82],
		[0, 0.95],
		[0.33, 0.82],
		[0.42, 0.52],
		[0.28, 0.26],
		[0.05, 0.1],
		[0, -0.1],
		[0, -0.32],
	].map(([x, y]) => new THREE.Vector3(x, y, 0)),
	false,
	'catmullrom',
	0.5,
);

/** Signo de pregunta 3D. `luz` (0..1) lo enciende con brillo y rayos. */
export const SignoPregunta: React.FC<{t: number; luz?: number; color?: string; position?: V3; rotation?: V3; scale?: number}> = ({
	t,
	luz = 0,
	color = '#FFD23F',
	position,
	rotation,
	scale = 1,
}) => (
	<group position={position} rotation={rotation} scale={scale}>
		{luz > 0.01 ? (
			<group rotation={[0, 0, t * 0.4]}>
				{new Array(10).fill(0).map((_, i) => (
					<mesh key={i} rotation={[0, 0, (i / 10) * TAU]} position={[0, 0, -0.3]}>
						<planeGeometry args={[0.09, 4.2 * luz]} />
						<meshBasicMaterial color="#FFF3B0" transparent opacity={0.28 * luz} toneMapped={false} depthWrite={false} />
					</mesh>
				))}
			</group>
		) : null}
		<Resplandor color="#FFD23F" escala={1.2 + 3.2 * luz} opacidad={0.25 + 0.6 * luz} position={[0, 0.25, -0.2]} />
		<mesh>
			<tubeGeometry args={[curvaPregunta, 80, 0.13, 16, false]} />
			<meshStandardMaterial color={color} emissive="#FFB703" emissiveIntensity={0.15 + 1.4 * luz} roughness={0.3} />
		</mesh>
		{[curvaPregunta.getPoint(0), curvaPregunta.getPoint(1)].map((p, i) => (
			<mesh key={i} geometry={GEO_ESFERA} position={p} scale={0.13}>
				<meshStandardMaterial color={color} emissive="#FFB703" emissiveIntensity={0.15 + 1.4 * luz} roughness={0.3} />
			</mesh>
		))}
		<mesh geometry={GEO_ESFERA} position={[0, -0.66, 0]} scale={0.15}>
			<meshStandardMaterial color={color} emissive="#FFB703" emissiveIntensity={0.15 + 1.4 * luz} roughness={0.3} />
		</mesh>
	</group>
);

let geoBulbo: THREE.LatheGeometry | null = null;
const obtenerBulbo = () => {
	if (geoBulbo) return geoBulbo;
	const puntos: THREE.Vector2[] = [];
	puntos.push(new THREE.Vector2(0.42, -0.85));
	puntos.push(new THREE.Vector2(0.45, -0.55));
	for (let i = 0; i <= 30; i++) {
		const th = 2.35 - (i / 30) * 2.35; // de abajo hacia arriba por el globo
		puntos.push(new THREE.Vector2(Math.max(0.0001, Math.sin(th)), 0.45 + Math.cos(th)));
	}
	geoBulbo = new THREE.LatheGeometry(puntos, 48);
	return geoBulbo;
};

/** Lamparita con un signo de pregunta adentro. `brillo` 0..1. */
export const Lamparita: React.FC<{t: number; brillo?: number; position?: V3; rotation?: V3; scale?: number}> = ({
	t,
	brillo = 1,
	position,
	rotation,
	scale = 1,
}) => (
	<group position={position} rotation={rotation} scale={scale}>
		<Resplandor color="#FFD23F" escala={3.2 + 2.5 * brillo} opacidad={0.35 + 0.5 * brillo} position={[0, 0.45, -0.6]} />
		<SignoPregunta t={t} luz={0.35 + 0.65 * brillo} position={[0, 0.36, 0]} scale={0.62} />
		<mesh geometry={obtenerBulbo()}>
			<meshStandardMaterial
				color="#FFF3B0"
				emissive="#FFD23F"
				emissiveIntensity={0.25 + 0.6 * brillo}
				transparent
				opacity={0.45}
				roughness={0.08}
				depthWrite={false}
				side={THREE.DoubleSide}
			/>
		</mesh>
		{[0, 1, 2, 3].map((i) => (
			<mesh key={i} position={[0, -0.92 - i * 0.12, 0]}>
				<cylinderGeometry args={[0.44 - i * 0.03, 0.44 - i * 0.03, 0.1, 32]} />
				<meshStandardMaterial color={i % 2 === 0 ? '#ADB5BD' : '#868E96'} metalness={0.7} roughness={0.3} />
			</mesh>
		))}
		<mesh position={[0, -1.43, 0]}>
			<cylinderGeometry args={[0.18, 0.26, 0.14, 24]} />
			<meshStandardMaterial color="#343A40" roughness={0.4} />
		</mesh>
	</group>
);
