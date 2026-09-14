FROM python:3.12.12-slim-bookworm@sha256:593bd06efe90efa80dc4eee3948be7c0fde4134606dd40d8dd8dbcade98e669c
RUN apt-get update && apt-get install -y --no-install-recommends openssh-client git && rm -rf /var/lib/apt/lists/*
COPY requirements.txt requirements.yml /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt && ansible-galaxy collection install -r /tmp/requirements.yml
ENV ANSIBLE_COLLECTIONS_PATH=/root/.ansible/collections
WORKDIR /work/TP3-M2-GIT/ansible
CMD ["ansible-playbook", "site.yml"]
