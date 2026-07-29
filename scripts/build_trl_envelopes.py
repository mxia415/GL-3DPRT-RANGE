#!/usr/bin/env python3
"""Build TRL browser assets from the authoritative KUKA V9 envelopes."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
import trimesh


PROJECT_ROOT = Path(__file__).resolve().parents[1]
KUKA_ROOT = PROJECT_ROOT.parent.parent / "KUKA-KR210-Rail-Robot"
SOURCE_DIR = KUKA_ROOT / "assets" / "reachability"
DISCOVERY_DIR = KUKA_ROOT / "reachability_workspace" / "data"
OUTPUT_DIR = PROJECT_ROOT / "outputs" / "assets" / "trl"
TARGET_FACES = 60_000
PROFILES = ("long", "standard")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_mesh(mesh: trimesh.Trimesh, label: str) -> None:
    if not mesh.is_watertight:
        raise RuntimeError(f"{label} is not watertight")
    if not mesh.is_winding_consistent:
        raise RuntimeError(f"{label} has inconsistent winding")
    if float(mesh.bounds[0, 1]) < -0.05:
        raise RuntimeError(f"{label} enters Y<0: {mesh.bounds[0, 1]:.6f}")
    if float(mesh.bounds[0, 2]) < -0.05:
        raise RuntimeError(f"{label} enters Z<0: {mesh.bounds[0, 2]:.6f}")
    if abs(float(mesh.bounds[0, 2])) > 0.05:
        raise RuntimeError(f"{label} does not contact Z=0: {mesh.bounds[0, 2]:.6f}")


def export_glb(mesh: trimesh.Trimesh, path: Path) -> None:
    path.write_bytes(trimesh.exchange.gltf.export_glb(mesh))


def build_profile(profile: str) -> dict:
    source = SOURCE_DIR / (
        f"envelope-v9-{profile}-ypos-fullx-50mm-conservative-smooth.json"
    )
    payload = json.loads(source.read_text(encoding="utf-8"))
    if payload.get("version") != 9 or payload.get("nozzleProfile") != profile:
        raise RuntimeError(f"Unexpected V9 source metadata: {source}")
    topology = payload["boundaryMesh"]["displayTopologyAudit"]
    hard = payload["boundaryMesh"]["hardExclusionAudit"]
    if topology.get("closedTwoManifold") is not True:
        raise RuntimeError(f"Source mesh is not a closed two-manifold: {source}")
    if any(int(hard.get(key, 0)) != 0 for key in (
        "trianglesEnteringDevice",
        "verticesBelowGround",
        "verticesInsideDevice",
        "verticesNegativeY",
    )):
        raise RuntimeError(f"Source mesh violates a hard exclusion: {source}")

    mesh = trimesh.Trimesh(
        vertices=np.asarray(payload["boundaryMesh"]["vertices"], dtype=np.float64),
        faces=np.asarray(payload["boundaryMesh"]["triangles"], dtype=np.int64),
        process=False,
        validate=False,
    )
    validate_mesh(mesh, f"{profile} full")
    full_path = OUTPUT_DIR / f"envelope-{profile}.glb"
    export_glb(mesh, full_path)

    light_source = trimesh.load(full_path, force="mesh", process=False)
    light = light_source.simplify_quadric_decimation(
        face_count=TARGET_FACES,
        aggression=8,
    )
    if float(light.vertices[:, 2].min()) < -1.0:
        raise RuntimeError(f"{profile} light simplification entered Z<0 by more than 1 mm")
    if float(light.vertices[:, 1].min()) < -1.0:
        raise RuntimeError(f"{profile} light simplification entered Y<0 by more than 1 mm")
    near_ground = light.vertices[:, 2] < 1.0
    light.vertices[near_ground, 2] = 0.0
    near_y_boundary = np.abs(light.vertices[:, 1]) < 1.0
    light.vertices[near_y_boundary, 1] = 0.0
    light.remove_unreferenced_vertices()
    validate_mesh(light, f"{profile} light")
    light_path = OUTPUT_DIR / f"envelope-{profile}-light.glb"
    export_glb(light, light_path)

    discovery = DISCOVERY_DIR / (
        f"envelope-v9-{profile}-ypos-fullx-50mm-discovery.npz"
    )
    with np.load(discovery, allow_pickle=False) as data:
        rail = data["rail_classification_code"].astype(np.int8)
        outside = data["outside_classification_code"].astype(np.int8)
    if rail.size != 81 * 62 or outside.size != 71 * 62:
        raise RuntimeError(f"Unexpected V9 discovery dimensions: {discovery}")

    return {
        "profile": profile,
        "sourceProject": "KUKA-KR210-Rail-Robot",
        "source": str(source.relative_to(KUKA_ROOT)),
        "sourceSha256": sha256(source),
        "full": {
            "vertices": int(len(mesh.vertices)),
            "triangles": int(len(mesh.faces)),
            "bytes": full_path.stat().st_size,
            "sha256": sha256(full_path),
            "bounds": mesh.bounds.round(3).tolist(),
        },
        "light": {
            "vertices": int(len(light.vertices)),
            "triangles": int(len(light.faces)),
            "bytes": light_path.stat().st_size,
            "sha256": sha256(light_path),
            "bounds": light.bounds.round(3).tolist(),
        },
        "rail": rail.tolist(),
        "outside": outside.tolist(),
    }


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    results = [build_profile(profile) for profile in PROFILES]
    classification = {
        "schema": "trl-ik-collision-templates/v2",
        "version": 9,
        "source": (
            "KUKA KR210 Reachability V9; authoritative constrained IK plus "
            "Collision Model V2 with vertical TCP flat-end ground contact"
        ),
        "profiles": {},
    }
    for result in results:
        classification["profiles"][result["profile"]] = {
            "railY": [float(value) for value in range(0, 4001, 50)],
            "r": [float(value) for value in range(600, 4101, 50)],
            "z": [float(value) for value in range(-50, 3001, 50)],
            "rail": result.pop("rail"),
            "outside": result.pop("outside"),
        }
    classification_path = OUTPUT_DIR / "classification.json"
    classification_path.write_text(
        json.dumps(classification, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    report = {
        "schema": "trl-envelope-build/v1",
        "reachabilityVersion": 9,
        "collisionModelVersion": 2,
        "targetLightTriangles": TARGET_FACES,
        "classificationSha256": sha256(classification_path),
        "profiles": results,
    }
    report_path = OUTPUT_DIR / "envelope-build-report.json"
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
