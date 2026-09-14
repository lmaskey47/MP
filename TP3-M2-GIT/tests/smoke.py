"""Essai Docker isole : authentification, API non-root et restauration MongoDB."""
import json
import os
from pathlib import Path
import secrets
import subprocess
import sys
import tempfile
import time

image = sys.argv[1] if len(sys.argv) > 1 else "logichain-api:local"
suffix = secrets.token_hex(5)
mongo = f"logichain-smoke-db-{suffix}"
api = f"logichain-smoke-api-{suffix}"
restore = f"logichain-smoke-restore-{suffix}"
created = []


def docker(*args, check=True):
    result = subprocess.run(["docker", *args], capture_output=True, text=True)
    if check and result.returncode:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return result


def wait_for(*args):
    for _ in range(60):
        result = docker(*args, check=False)
        if result.returncode == 0:
            return
        time.sleep(2)
    raise RuntimeError("Le service de test ne devient pas disponible sous 120 secondes")


def start(name, *args):
    docker("run", "-d", "--name", name, *args)
    created.append(name)


try:
    with tempfile.TemporaryDirectory(prefix="logichain-smoke-") as temporary:
        directory = Path(temporary)
        admin_password = secrets.token_hex(32)
        app_password = secrets.token_hex(32)
        mongo_env = directory / "mongo.env"
        mongo_env.write_text(
            f"MONGO_INITDB_ROOT_USERNAME=root\nMONGO_INITDB_ROOT_PASSWORD={admin_password}\n"
            f"APP_PASSWORD={app_password}\n", encoding="utf-8"
        )
        os.chmod(mongo_env, 0o600)
        start(mongo, "--env-file", str(mongo_env), "mongo:8.0.14")
        auth = "db.getSiblingDB('admin').auth('root', process.env.MONGO_INITDB_ROOT_PASSWORD);"
        wait_for("exec", mongo, "mongosh", "--quiet", "--eval",
                 auth + "db.getSiblingDB('admin').getUsers();")
        denied = docker("exec", mongo, "mongosh", "--quiet", "--eval",
                        "db.getSiblingDB('logichain').getCollectionNames();", check=False)
        assert denied.returncode != 0, "MongoDB doit refuser la lecture sans authentification"
        docker("exec", mongo, "mongosh", "--quiet", "--eval", auth +
               "db.getSiblingDB('logichain').createUser({user:'logichain',pwd:process.env.APP_PASSWORD,roles:[{role:'readWrite',db:'logichain'}]});")
        api_env = directory / "api.env"
        api_env.write_text(
            f"NODE_ENV=production\nHOST=127.0.0.1\nPORT=3000\nJWT_SECRET={secrets.token_hex(32)}\n"
            f"MONGODB_URI=mongodb://logichain:{app_password}@127.0.0.1:27017/logichain?authSource=logichain\n",
            encoding="utf-8",
        )
        os.chmod(api_env, 0o600)
        start(api, "--network", f"container:{mongo}", "--env-file", str(api_env),
              "--read-only", "--cap-drop", "ALL", "--security-opt", "no-new-privileges:true",
              "--tmpfs", "/tmp:rw,noexec,nosuid,size=64m", image)
        wait_for("exec", api, "node", "-e",
                 "fetch('http://127.0.0.1:3000/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))")
        uid = docker("exec", api, "node", "-p", "process.getuid()").stdout.strip()
        assert uid == "1000", "L'API doit fonctionner sans root"
        docker("exec", mongo, "mongosh", "--quiet", "--eval", auth +
               "db.getSiblingDB('logichain').smoketests.insertOne({verification:'backup'});")
        docker("stop", api)
        config = directory / "mongotools.yml"
        config.write_text("uri: " + json.dumps(
            f"mongodb://root:{admin_password}@127.0.0.1:27017/?authSource=admin") + "\n", encoding="utf-8")
        os.chmod(config, 0o600)
        docker("cp", str(config), f"{mongo}:/tmp/mongotools.yml")
        docker("exec", mongo, "mongodump", "--config=/tmp/mongotools.yml",
               "--db=logichain", "--archive=/tmp/backup.archive.gz", "--gzip")
        archive = directory / "backup.archive.gz"
        docker("cp", f"{mongo}:/tmp/backup.archive.gz", str(archive))
        start(restore, "--network", "none", "mongo:8.0.14")
        wait_for("exec", restore, "mongosh", "--quiet", "--eval", "db.adminCommand({ping:1});")
        docker("cp", str(archive), f"{restore}:/tmp/backup.archive.gz")
        docker("exec", restore, "mongorestore", "--archive=/tmp/backup.archive.gz", "--gzip")
        count = docker("exec", restore, "mongosh", "logichain", "--quiet", "--eval",
                       "db.smoketests.countDocuments({verification:'backup'})").stdout.strip()
        assert count == "1", "Le document sauvegarde doit etre restaure"
        docker("exec", restore, "mongosh", "logichain", "--quiet", "--eval",
               "if (!db.items.getIndexes().some(i => i.unique && i.key.qrCode === 1)) quit(1);")
        print("PASS : MongoDB authentifie, API prete sous UID 1000, dump et restauration des donnees et index.")
finally:
    for name in reversed(created):
        docker("rm", "-fv", name, check=False)
