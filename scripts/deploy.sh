#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

# Only serve an image already built and tested on a separate machine or CI.
# No Node, image encoding or browser tests may run on this shared Pi.
image=${NESTOR_WEB_IMAGE:-nestor-web:local}
if ! docker image inspect "$image" >/dev/null 2>&1; then
  echo "Missing prebuilt image: $image. Pull or load a tested image first." >&2
  exit 1
fi
export NESTOR_WEB_IMAGE="$image"
docker compose -f compose.prod.yaml up -d --no-build --wait --wait-timeout 60
python3 - <<'PYSCRIPT'
import os
from pathlib import Path
p=Path('.env')
lines=p.read_text().splitlines() if p.exists() else []
lines=[line for line in lines if not line.startswith('NESTOR_WEB_IMAGE=')]
lines.append('NESTOR_WEB_IMAGE='+os.environ['NESTOR_WEB_IMAGE'])
p.write_text('\n'.join(lines)+'\n')
p.chmod(0o600)
PYSCRIPT
