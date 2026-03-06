import * as THREE from "three";
import { CSG } from "three-csg-ts";

/**
 * STABILITY RULE: Geometry is never mutated in place.
 * Every operation returns a fresh BufferGeometry or Mesh.
 */
export class GeometryEngine {

    // ── 3D Modeling Operations ───────────────────────────────────────────────

    static extrude(shapePoints: [number, number][], depth: number): THREE.BufferGeometry {
        const shape = new THREE.Shape(shapePoints.map(p => new THREE.Vector2(p[0], p[1])));
        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth,
            bevelEnabled: false
        });
        return geometry;
    }

    static revolve(shapePoints: [number, number][], segments: number = 32): THREE.BufferGeometry {
        const points = shapePoints.map(p => new THREE.Vector2(p[0], p[1]));
        const geometry = new THREE.LatheGeometry(points, segments);
        return geometry;
    }

    static sweep(profilePoints: [number, number][], pathPoints: [number, number, number][]): THREE.BufferGeometry {
        const profile = new THREE.Shape(profilePoints.map(p => new THREE.Vector2(p[0], p[1])));
        const curve = new THREE.CatmullRomCurve3(pathPoints.map(p => new THREE.Vector3(...p)));
        const geometry = new THREE.ExtrudeGeometry(profile, {
            extrudePath: curve,
            bevelEnabled: false
        });
        return geometry;
    }

    static loft(sections: [number, number, number][][]): THREE.BufferGeometry {
        // Simplified loft implementation using BufferGeometry manually if needed
        // For demonstration, we'll return a basic placeholder or complex geometry
        const geometry = new THREE.BufferGeometry();
        // Placeholder for complex lofting logic
        return geometry;
    }

    // ── Boolean Operations (CSG) ───────────────────────────────────────────

    static subtract(baseMesh: THREE.Mesh, cutterMesh: THREE.Mesh): THREE.BufferGeometry {
        baseMesh.updateMatrix();
        cutterMesh.updateMatrix();
        const res = CSG.fromMesh(baseMesh).subtract(CSG.fromMesh(cutterMesh));
        return CSG.toMesh(res, new THREE.Matrix4()).geometry;
    }

    static union(meshA: THREE.Mesh, meshB: THREE.Mesh): THREE.BufferGeometry {
        meshA.updateMatrix();
        meshB.updateMatrix();
        const res = CSG.fromMesh(meshA).union(CSG.fromMesh(meshB));
        return CSG.toMesh(res, new THREE.Matrix4()).geometry;
    }

    static intersect(meshA: THREE.Mesh, meshB: THREE.Mesh): THREE.BufferGeometry {
        meshA.updateMatrix();
        meshB.updateMatrix();
        const res = CSG.fromMesh(meshA).intersect(CSG.fromMesh(meshB));
        return CSG.toMesh(res, new THREE.Matrix4()).geometry;
    }

    // ── 2D Primitive Helpers ───────────────────────────────────────────────

    static createArc(center: [number, number], radius: number, startAngle: number, endAngle: number): THREE.BufferGeometry {
        const curve = new THREE.ArcCurve(center[0], center[1], radius, startAngle, endAngle, false);
        const points = curve.getPoints(50);
        return new THREE.BufferGeometry().setFromPoints(points);
    }

    static createEllipse(center: [number, number], xRadius: number, yRadius: number): THREE.BufferGeometry {
        const curve = new THREE.EllipseCurve(center[0], center[1], xRadius, yRadius, 0, 2 * Math.PI, false, 0);
        const points = curve.getPoints(50);
        return new THREE.BufferGeometry().setFromPoints(points);
    }

    // ── Architectural Primitives ───────────────────────────────────────────

    static createWall(width: number, height: number, thickness: number): THREE.BufferGeometry {
        return new THREE.BoxGeometry(width, height, thickness);
    }

    static createSlab(width: number, depth: number, thickness: number): THREE.BufferGeometry {
        return new THREE.BoxGeometry(width, thickness, depth);
    }

    static createStair(stepCount: number, riserHeight: number, treadDepth: number, width: number): THREE.BufferGeometry {
        const geometries = [];
        for (let i = 0; i < stepCount; i++) {
            const stepGeom = new THREE.BoxGeometry(width, riserHeight, treadDepth);
            stepGeom.translate(0, (i + 0.5) * riserHeight, i * treadDepth);
            geometries.push(stepGeom);
        }

        // Manual merging if BufferGeometryUtils is not available, 
        // but for now we'll return a container or the first one as a placeholder
        // In a real Three.js app, we'd use mergeBufferGeometries
        return geometries[0]; // TODO: Proper merging
    }

    static createRoof(width: number, depth: number, pitch: number): THREE.BufferGeometry {
        const shape = new THREE.Shape();
        const height = (width / 2) * Math.tan((pitch * Math.PI) / 180);

        shape.moveTo(-width / 2, 0);
        shape.lineTo(width / 2, 0);
        shape.lineTo(0, height);
        shape.closePath();

        const extrudeSettings = {
            steps: 1,
            depth: depth,
            bevelEnabled: false
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }

    static cutOpeningInWall(wallGeometry: THREE.BufferGeometry, wallPos: [number, number, number], openingGeometry: THREE.BufferGeometry, openingPos: [number, number, number]): THREE.BufferGeometry {
        const wallMesh = new THREE.Mesh(wallGeometry);
        wallMesh.position.set(...wallPos);
        wallMesh.updateMatrix();

        const openingMesh = new THREE.Mesh(openingGeometry);
        openingMesh.position.set(...openingPos);
        openingMesh.updateMatrix();

        const wallCSG = CSG.fromMesh(wallMesh);
        const openingCSG = CSG.fromMesh(openingMesh);
        const resultCSG = wallCSG.subtract(openingCSG);

        return CSG.toMesh(resultCSG, new THREE.Matrix4()).geometry;
    }

    // ── Annotation Primitives ───────────────────────────────────────────

    static createDimensionLines(start: THREE.Vector3, end: THREE.Vector3, offset: number = 0.5): THREE.BufferGeometry {
        // Simple 3-line dimension (main line + 2 tick marks)
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        const normal = new THREE.Vector3(-direction.y, direction.x, 0).multiplyScalar(offset);

        const p1 = start.clone().add(normal);
        const p2 = end.clone().add(normal);

        const points = [
            start, p1, // Extension 1
            p1, p2,     // Main dim line
            p2, end     // Extension 2
        ];

        return new THREE.BufferGeometry().setFromPoints(points);
    }
}
