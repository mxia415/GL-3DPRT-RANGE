#!/usr/bin/env python3
"""Build lightweight, pre-posed TRL reference models for file:// fallback."""

from __future__ import annotations

import json
import re
from pathlib import Path

import numpy as np
import trimesh


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "outputs" / "GL-3DPRT-TRL02.html"
ASSET_DIR = ROOT / "outputs" / "assets" / "trl"
PART_DIR = ASSET_DIR / "parts"


def read_pose_records() -> tuple[list[list[object]], list[float]]:
    source = HTML.read_text(encoding="utf-8")
    records_match = re.search(
        r"const trlPartRecords = (\[.*?\]);\s*const trlToolMatrix",
        source,
        re.DOTALL,
    )
    tool_match = re.search(r"const trlToolMatrix = (\[.*?\]);", source)
    if not records_match or not tool_match:
        raise RuntimeError("TRL pose records were not found in the HTML")
    return json.loads(records_match.group(1)), json.loads(tool_match.group(1))


def three_matrix(values: list[float]) -> np.ndarray:
    return np.asarray(values, dtype=np.float64).reshape((4, 4), order="F")


def load_part(file_name: str, matrix: list[float], target_faces: int | None) -> trimesh.Trimesh:
    scene = trimesh.load(PART_DIR / file_name, force="scene")
    mesh = scene.dump(concatenate=True)
    if target_faces and len(mesh.faces) > target_faces:
        mesh = mesh.simplify_quadric_decimation(face_count=target_faces, aggression=5)
        mesh.remove_unreferenced_vertices()
        mesh.fix_normals()
    mesh.apply_transform(three_matrix(matrix))
    return mesh


def main() -> None:
    records, tool_matrix = read_pose_records()
    targets = {
        "kr210_00_fx_track.glb": 70_000,
        "kr210_10_e1_carriage_base.glb": 50_000,
    }
    base_meshes: list[trimesh.Trimesh] = []
    for _, file_name, matrix in records:
        base_meshes.append(load_part(file_name, matrix, targets.get(file_name)))

    base_scene = trimesh.Scene()
    for index, mesh in enumerate(base_meshes):
        base_scene.add_geometry(mesh, node_name=f"part-{index}", geom_name=f"part-{index}")
    base_output = ASSET_DIR / "reference-base-light.glb"
    base_scene.export(base_output)
    print(
        f"{base_output}: {sum(len(mesh.faces) for mesh in base_meshes)} faces, "
        f"{base_output.stat().st_size} bytes"
    )

    for profile, tool_file in {
        "long": "kr210_90_tool_extension.glb",
        "standard": "kr210_90_tool_extension_standard.glb",
    }.items():
        tool_mesh = load_part(tool_file, tool_matrix, 40_000)
        output = ASSET_DIR / f"reference-tool-{profile}-light.glb"
        tool_mesh.export(output)
        print(f"{output}: {len(tool_mesh.faces)} faces, {output.stat().st_size} bytes")


if __name__ == "__main__":
    main()
