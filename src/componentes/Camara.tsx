import {useThree} from '@react-three/fiber';
import React, {useLayoutEffect} from 'react';
import {PerspectiveCamera, Vector3} from 'three';
import type * as THREE from 'three';
import type {V3} from './utilidades3d';

type Props = {
	posicion: V3;
	mirarA: V3;
	fov?: number;
	/** Giro de cámara (roll) en radianes. */
	inclinacion?: number;
};

/**
 * Cámara controlada por frame: la escena calcula posición y objetivo a partir
 * de useCurrentFrame() y este componente los aplica antes de dibujar.
 */
export const Camara: React.FC<Props> = ({posicion, mirarA, fov, inclinacion = 0}) => {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	useLayoutEffect(() => {
		camera.position.set(posicion[0], posicion[1], posicion[2]);
		camera.up.set(0, 1, 0);
		camera.lookAt(mirarA[0], mirarA[1], mirarA[2]);
		if (inclinacion) camera.rotateZ(inclinacion);
		if (fov !== undefined && camera.fov !== fov) {
			camera.fov = fov;
			camera.updateProjectionMatrix();
		}
		camera.updateMatrixWorld();
	});
	return null;
};

/**
 * Proyecta un punto 3D a píxeles de pantalla con los mismos parámetros que
 * <Camara/>. Sirve para anclar etiquetas HTML a objetos 3D.
 */
export const proyectar = (
	punto: V3,
	posicion: V3,
	mirarA: V3,
	ancho: number,
	alto: number,
	fov = 45,
): {x: number; y: number} => {
	const cam = new PerspectiveCamera(fov, ancho / alto, 0.1, 400);
	cam.position.set(posicion[0], posicion[1], posicion[2]);
	cam.lookAt(mirarA[0], mirarA[1], mirarA[2]);
	cam.updateMatrixWorld();
	const v = new Vector3(punto[0], punto[1], punto[2]).project(cam);
	return {x: ((v.x + 1) / 2) * ancho, y: ((1 - v.y) / 2) * alto};
};

/** Pequeño temblor de "cámara en mano" determinístico. */
export const temblor = (t: number, intensidad = 1): V3 => [
	(Math.sin(t * 1.9) * 0.6 + Math.sin(t * 4.3) * 0.25) * 0.03 * intensidad,
	(Math.sin(t * 2.3 + 1) * 0.6 + Math.sin(t * 5.1) * 0.2) * 0.03 * intensidad,
	Math.sin(t * 1.3 + 2) * 0.02 * intensidad,
];
