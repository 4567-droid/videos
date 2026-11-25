import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara} from '../componentes/Camara';
import {Pizarron} from '../componentes/Ciencia';
import {Resplandor} from '../componentes/Efectos';
import {Atomo, CajaMisterio, EscenarioMisterio, Gato, Schrodinger} from '../componentes/Misterio';
import {TAU} from '../componentes/utilidades3d';
import {FUENTE} from '../lib/fuente';
import {useEscena} from '../lib/escena';
import {camaraPlanos} from '../lib/planos';

/**
 * "Año 1935. El físico Erwin Schrödinger imagina una caja cerrada con un gato adentro, un átomo
 * radiactivo y un mecanismo. Si el átomo se desintegra, algo malo le pasa al gato."
 * Schrödinger (bata, anteojos redondos) dibuja en un pizarrón flotante. La caja se vuelve
 * translúcida: adentro hay un gato, un átomo brillante y un mecanismo con luz roja. Con
 * "algo malo" la caja se cierra a la vista, las luces bajan y solo queda el signo de pregunta.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const dibujarIdea = (ctx: CanvasRenderingContext2D) => {
	const W = ctx.canvas.width;
	const H = ctx.canvas.height;
	ctx.fillStyle = '#1F3B4A';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = 'rgba(255,255,255,0.05)';
	for (let i = 0; i < 9; i++) {
		ctx.beginPath();
		ctx.ellipse((i * 337) % W, (i * 211) % H, 120, 40, i, 0, TAU);
		ctx.fill();
	}
	const tiza = 'rgba(246,248,250,0.92)';
	ctx.strokeStyle = tiza;
	ctx.fillStyle = tiza;
	ctx.lineWidth = 9;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	// 1935 en un círculo
	ctx.font = `900 96px ${FUENTE}`;
	ctx.fillText('1935', 190, 120);
	ctx.beginPath();
	ctx.ellipse(190, 120, 150, 78, -0.08, 0, TAU);
	ctx.stroke();
	// la caja en perspectiva con un gatito adentro
	ctx.beginPath();
	ctx.rect(400, 250, 300, 230);
	ctx.moveTo(400, 250);
	ctx.lineTo(470, 190);
	ctx.lineTo(770, 190);
	ctx.lineTo(700, 250);
	ctx.moveTo(770, 190);
	ctx.lineTo(770, 420);
	ctx.lineTo(700, 480);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(480, 440);
	ctx.lineTo(480, 360);
	ctx.lineTo(505, 320);
	ctx.lineTo(530, 350);
	ctx.lineTo(570, 350);
	ctx.lineTo(595, 320);
	ctx.lineTo(620, 360);
	ctx.lineTo(620, 440);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(527, 385, 8, 0, TAU);
	ctx.arc(573, 385, 8, 0, TAU);
	ctx.fill();
	// átomo
	ctx.strokeStyle = '#9DFFB0';
	ctx.lineWidth = 7;
	for (let i = 0; i < 3; i++) {
		ctx.beginPath();
		ctx.ellipse(880, 300, 90, 32, (i * Math.PI) / 3, 0, TAU);
		ctx.stroke();
	}
	ctx.fillStyle = '#9DFFB0';
	ctx.beginPath();
	ctx.arc(880, 300, 16, 0, TAU);
	ctx.fill();
	// flecha y signo de pregunta
	ctx.strokeStyle = tiza;
	ctx.fillStyle = tiza;
	ctx.lineWidth = 9;
	ctx.beginPath();
	ctx.moveTo(840, 400);
	ctx.quadraticCurveTo(800, 520, 700, 540);
	ctx.moveTo(725, 515);
	ctx.lineTo(700, 540);
	ctx.lineTo(730, 560);
	ctx.stroke();
	ctx.font = `900 150px ${FUENTE}`;
	ctx.fillText('?', 230, 400);
	ctx.font = `900 64px ${FUENTE}`;
	ctx.fillText('50 %', 900, 520);
};

export const SchrodingerPizarron: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;
	const f1935 = momento('1935');
	const fErwin = momento('Erwin');
	const fCaja = momento('caja');
	const fGato = momento('gato');
	const fAtomo = momento('átomo');
	const fMecanismo = momento('mecanismo');
	const fSi = momento('si el átomo');
	const fMalo = momento('algo malo');

	const revelar = interpolate(frame, [4, fMecanismo + 10], [0.05, 1], clamp);
	const escribe = interpolate(frame, [fErwin - 6, fErwin, fCaja - 4, fCaja + 4], [0, 1, 1, 0], clamp);
	const senala = interpolate(frame, [fCaja - 4, fCaja + 6], [0, 1], clamp);
	const rayosX = interpolate(frame, [fCaja - 2, fCaja + 14, fMalo - 6, fMalo + 8], [0, 1, 1, 0], clamp);
	const gato = spring({frame: frame - fGato + 4, fps, config: {damping: 12}});
	const atomo = spring({frame: frame - fAtomo + 4, fps, config: {damping: 10}});
	const mecanismo = spring({frame: frame - fMecanismo + 4, fps, config: {damping: 10}});
	const decae = interpolate(frame, [fSi, fSi + 10], [0, 1], clamp);
	const sombra = interpolate(frame, [fMalo - 4, fMalo + 10], [0, 1], clamp);
	const titila = 0.5 + 0.5 * Math.sin(t * (6 + 10 * decae));

	const {posicion, mirarA, fov} = camaraPlanos(frame, fps, [
		{desde: 0, pos: [-0.6, 2.2, 7.6], mira: [-0.5, 1.4, -0.6], deriva: [0.2, 0, -0.35]},
		{desde: fErwin - 4, pos: [-2.6, 1.9, 3.6], mira: [-1.2, 1.5, -0.6], deriva: [0.15, 0.02, -0.12]},
		{desde: fCaja - 4, pos: [2.9, 2.0, 4.6], mira: [1.4, 0.75, 0], deriva: [-0.18, 0, -0.15], llegada: 12},
		{desde: fSi - 3, pos: [1.0, 1.35, 2.9], mira: [1.45, 0.75, 0.1], deriva: [0.12, 0.02, -0.08]},
		{desde: fMalo - 2, pos: [1.4, 0.9, 5.6], mira: [1.3, 0.85, 0], deriva: [0, 0.05, -0.45]},
		{desde: duracion + 1, pos: [0, 0, 0], mira: [0, 0, 0]},
	]);

	return (
		<EscenarioMisterio t={t} luzPiso={1 - 0.6 * sombra}>
			<Camara posicion={posicion} mirarA={mirarA} fov={fov} />
			<Pizarron
				clave="pizarron-schrodinger"
				dibujar={dibujarIdea}
				revelar={revelar}
				patas={false}
				position={[-0.75, 2.25 + 0.06 * Math.sin(t * 1.4), -1.4]}
				rotation={[0, 0.28, 0.02 * Math.sin(t)]}
				scale={0.85}
			/>
			<Resplandor color="#7CE7FF" escala={4.5} opacidad={0.12} position={[-0.75, 2.25, -1.6]} />
			<Schrodinger
				t={t}
				mezcla={[
					{animacion: 'escribir', peso: escribe},
					{animacion: 'señalar', peso: senala * (1 - escribe)},
					{animacion: 'reposo', peso: Math.max(0, 1 - escribe - senala)},
				]}
				expresion={sombra > 0.5 ? 'preocupada' : 'feliz'}
				position={[-1.55, 0, -0.1]}
				rotation={[0, 0.6 * escribe + 0.5 * senala * (1 - escribe), 0]}
			/>
			<CajaMisterio t={t} temblor={0.12 + 0.3 * sombra} rayosX={rayosX} brilloSigno={0.35 + 0.65 * sombra} position={[1.45, 0, 0]} rotation={[0, -0.35, 0]} scale={0.9}>
				{/* adentro: el gato, el átomo y el mecanismo */}
				{rayosX > 0.02 ? (
					<>
						<Gato t={t} ojos={1} position={[-0.35, 0.06, -0.1]} scale={0.62 * gato} mirar={[0, 0.5 * decae]} pupilas={[0.8 * decae, 0]} cara={decae > 0.5 ? 'sorpresa' : 'normal'} />
						<Atomo t={t} brillo={0.6 + 0.4 * titila} position={[0.45, 0.85, 0.1]} scale={0.42 * atomo} />
						<group position={[0.45, 0.06, 0.1]} scale={mecanismo}>
							<mesh position={[0, 0.2, 0]}>
								<boxGeometry args={[0.42, 0.4, 0.32]} />
								<meshStandardMaterial color="#6C7A89" metalness={0.6} roughness={0.35} />
							</mesh>
							<mesh position={[0.1, 0.32, 0.17]}>
								<sphereGeometry args={[0.05, 12, 8]} />
								<meshBasicMaterial color={titila > 0.5 && decae > 0 ? '#FF3355' : '#5A1020'} toneMapped={false} />
							</mesh>
							<mesh position={[-0.08, 0.18, 0.17]} rotation={[0, 0, t * 2]}>
								<torusGeometry args={[0.08, 0.025, 6, 12]} />
								<meshStandardMaterial color="#FFD23F" metalness={0.5} roughness={0.3} />
							</mesh>
						</group>
					</>
				) : null}
			</CajaMisterio>
			{/* "1935" flotando sobre el pizarrón en el primer plano */}
			{frame > f1935 - 6 && frame < fErwin + 10 ? <Resplandor color="#FFD23F" escala={1.4} opacidad={0.3} position={[-1.65, 2.75, -1.2]} /> : null}
		</EscenarioMisterio>
	);
};
