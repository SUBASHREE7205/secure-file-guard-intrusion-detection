import os


def load_env():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    for filename in [".env", ".env.example"]:
        env_path = os.path.join(base_dir, filename)
        if not os.path.exists(env_path):
            continue

        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue

                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = value
