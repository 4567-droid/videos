import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara} from '../componentes/Camara';
import {Resplandor} from '../componentes/Efectos';
import {Cartel3D, EscenarioMisterio, Lupa, Schrodinger} from '../componentes/Misterio';
import type {V3} from '../componentes/utilidades3d';
import {FUENTE} from '../lib/fuente';
import {useEscena} from '../lib/escena';
import {camaraPlanos} from '../lib/planos';

/**
 * "Y quedate con esto: a veces una idea se inventa para señalar un problema, no para defenderla.
 * Antes de repetir una frase famosa, fijate quién la dijo y por qué." (enseñanza)
 * Un cartel con la frase famosa ("El gato está vivo y muerto") y, abajo, letra chiquita. Una lupa
 * recorre la frase y después la letra chica, que dentro del vidrio se lee: "Schrödinger, 1935: ¡era
 * una crítica!". Al final, Schrödinger guiña un ojo.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const CARTEL: V3 = [0.35, 1.9, -0.3];

const dibujarFrase = (ctx: CanvasRenderingContext2D) => {
	const W = ctx.canvas.width;
	const H = ctx.canvas.height;
	ctx.fillStyle = '#FFF6E0';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#2B1A4A';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = `900 78px ${FUENTE}`;
	ctx.fillText('“EL GATO ESTÁ', W / 2, H * 0.27);
	ctx.fillText('VIVO Y MUERTO”', W / 2, H * 0.5);
	ctx.fillStyle = '#8A7AA8';
	ctx.font = `700 22px ${FUENTE}`;
	ctx.fillText('Schrödinger, 1935: ¡era una crítica!', W / 2, H * 0.82);
};

const dibujarLetraChica = (ctx: CanvasRenderingContext2D) => {
	const W = ctx.canvas.width;
	const H = ctx.canvas.height;
	ctx.fillStyle = '#FFF6E0';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#E63E6D';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = `900 86px ${FUENTE}`;
	ctx.fillText('Schrödinger, 1935:', W / 2, H * 0.34);
	ctx.fillText('¡era una crítica!', W / 2, H * 0.68);
};

export const LupaFrase: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;
	const fIdea = momento('idea');
	const fSenalar = momento('señalar');
	const fAntes = momento('antes de repetir');
	const fQuien = momento('quién');

	const suave = Easing.inOut(Easing.cubic);
	// recorrido de la lupa: entra, pasa por la frase y baja a la letra chica
	const lx = interpolate(frame, [fIdea - 10, fSenalar, fAntes - 6, fAntes + 12], [2.6, -0.4, 0.6, 0.35], {...clamp, easing: suave});
	const ly = interpolate(frame, [fIdea - 10, fSenalar, fAntes - 6, fAntes + 12], [1.0, 2.05, 2.0, 1.36], {...clamp, easing: suave});
	const lupaSobreLetra = interpolate(frame, [fAntes + 6, fAntes + 16], [0, 1], clamp);
	const guino = interpolate(frame, [fQuien + 4, fQuien + 8, fQuien + 22, fQuien + 26], [0, 1, 1, 0], clamp);

	const {posicion, mirarA, fov} = camaraPlanos(frame, fps, [
		{desde: 0, pos: [0.0, 2.2, 5.2], mira: [0.3, 1.8, -0.3], deriva: [0.08, 0, -0.3]},
		{desde: fSenalar - 4, pos: [-0.5, 2.15, 4.3], mira: [0.25, 1.9, -0.3], deriva: [0.2, 0, -0.08]},
		{desde: fAntes - 2, pos: [0.5, 1.55, 3.0], mira: [0.35, 1.45, -0.3], deriva: [0, 0.02, -0.12], llegada: 10},
		{desde: fQuien - 3, pos: [-0.6, 1.75, 4.4], mira: [-0.8, 1.5, 0], deriva: [0.12, 0, -0.2]},
		{desde: duracion + 1, pos: [0, 0, 0], mira: [0, 0, 0]},
	]);

	return (
		<EscenarioMisterio t={t}>
			<Camara posicion={posicion} mirarA={mirarA} fov={fov} />
			<Cartel3D clave="cartel-frase-famosa" dibujar={dibujarFrase} ancho={2.1} alto={1.2} palo={1.25} position={CARTEL} />
			<Resplandor color="#FFE9B0" escala={4} opacidad={0.15} position={[CARTEL[0], CARTEL[1], CARTEL[2] - 0.3]} />
			{/* la lupa: sobre la letra chica muestra lo que dice, bien grande */}
			<Lupa radio={0.42} position={[lx, ly, CARTEL[2] + 0.45]} rotation={[0, 0, 0.1 * Math.sin(t * 2)]}>
				{lupaSobreLetra > 0.01 ? (
					<Cartel3D clave="cartel-letra-chica" dibujar={dibujarLetraChica} ancho={0.78} alto={0.34} colorMarco="#FFF6E0" position={[0, 0, -0.02]} scale={lupaSobreLetra} />
				) : null}
			</Lupa>
			{/* Schrödinger, que guiña */}
			<Schrodinger t={t} animacion="reposo" guino={guino} expresion="feliz" giroCabeza={[0, 0.25 * guino, 0.12 * guino]} position={[-1.35, 0, 0.3]} rotation={[0, 0.45, 0]} />
		</EscenarioMisterio>
	);
};
