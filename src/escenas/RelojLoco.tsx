import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara, temblor} from '../componentes/Camara';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {Reloj3D} from '../componentes/Reloj';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * Gancho: "¿Sabías que el tiempo no pasa igual para todos?"
 * Un despertador gigante suena y sus agujas corren raro (adelantan, frenan, retroceden).
 * En "igual para todos" aparecen dos relojitos que marchan a velocidades distintas.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const RelojLoco: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fNo = momento('no');
	const fIgual = momento('igual');

	// agujas "locas": velocidad que va y viene (a veces hacia atrás)
	const hora = 10.1 + 1.3 * t - 0.8 * Math.cos(3.4 * t) + 0.8 + 0.25 * Math.sin(t * 9) * interpolate(frame, [fNo, fNo + 10], [0, 1], clamp);
	const sonar = interpolate(frame, [0, 4, fNo - 6, fNo], [1, 1, 1, 0.15], clamp);
	const estirar = 0.35 * interpolate(frame, [fIgual - 4, fIgual + 6], [0, 1], clamp) * (0.6 + 0.4 * Math.sin(t * 6));
	const chicos = spring({frame: frame - fIgual + 2, fps, config: {damping: 11, stiffness: 140}});

	// cámara: muy cerca al principio, se abre de a poco
	const abrir = Easing.inOut(Easing.cubic)(interpolate(frame, [0, duracion], [0, 1], clamp));
	const ang = -0.3 + 0.5 * abrir;
	const dist = 4.9 + 1.4 * abrir;
	const sacudon = temblor(t, 1 + 1.5 * sonar);
	const posicion: V3 = [Math.sin(ang) * dist + sacudon[0], 0.3 + sacudon[1], Math.cos(ang) * dist];

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 44%, #9D8CFF 0%, #5E3BEE 34%, #2D1B8F 66%, #0F0A3C 100%)"
			colorContraluz="#7DF9FF"
		>
			<Camara posicion={posicion} mirarA={[0, 0.05, 0]} />
			<Reloj3D hora={hora} t={t} sonar={sonar} estirar={estirar} position={[0, 0.35, 0]} rotation={[0.05, 0.1 * Math.sin(t * 1.3), 0]} scale={1.02} />
			{/* relojitos: uno apurado y otro lento */}
			<Reloj3D hora={3 + t * 4} t={t} color="#06D6A0" position={[-0.82, -1.3, 0.9]} rotation={[0, 0.35, 0.1]} scale={0.36 * chicos} />
			<Reloj3D hora={3 + t * 0.15} t={t} color="#FFD166" position={[0.82, -1.3, 0.9]} rotation={[0, -0.35, -0.1]} scale={0.36 * chicos} />
			<Destellos t={t} cantidad={60} rango={[7, 9, 4]} centro={[0, 0.2, -2]} tamano={0.05} semilla="reloj-loco" colores={['#FFFFFF', '#7DF9FF', '#FFD166']} />
		</Escenario3D>
	);
};
