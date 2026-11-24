/**
 * Calcula en qué píxel (1080×1920) cae cada punto 3D para una cámara dada, sin renderizar.
 * Sirve para encuadrar escenas (subtítulos 250–500 px, números 1340–1600 px).
 *   node scripts/proyectar.mjs '{"cam":[0.3,3.1,4.4],"mira":[0.05,0.85,-0.45],"pts":{"cerebro":[-0.35,1.25,-0.95]}}'
 */
import {PerspectiveCamera, Vector3} from 'three';

const a = JSON.parse(process.argv[2] ?? '{}');
if (!a.cam || !a.mira || !a.pts) {
	console.log('Uso: node scripts/proyectar.mjs \'{"cam":[x,y,z],"mira":[x,y,z],"pts":{"nombre":[x,y,z]}}\'');
	process.exit(1);
}
const cam = new PerspectiveCamera(a.fov ?? 45, 1080 / 1920, 0.1, 400);
cam.position.set(...a.cam);
cam.lookAt(...a.mira);
cam.updateMatrixWorld();
for (const [nombre, p] of Object.entries(a.pts)) {
	const v = new Vector3(...p).project(cam);
	console.log(nombre.padEnd(16), Math.round(((v.x + 1) / 2) * 1080), Math.round(((1 - v.y) / 2) * 1920));
}
