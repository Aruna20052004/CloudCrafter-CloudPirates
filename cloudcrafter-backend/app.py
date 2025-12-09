from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
import yaml
import subprocess
import os
import time
from slack_helper import send_slack_notification

app = Flask(__name__)
CORS(app)


@app.route('/', methods=['GET'])
def root():
    return jsonify({"message": "Hello from Flask backend"})


@app.route('/generate', methods=['POST'])
def generate_code():
    blueprint = request.json or {}

    # if no metadata/appId, create one
    metadata = blueprint.get('metadata') or {}
    app_id = metadata.get('appId') or f"app-{os.urandom(4).hex()}"
    blueprint['metadata'] = metadata
    blueprint['metadata']['appId'] = app_id

    output_dir = Path('generated') / app_id
    output_dir.mkdir(parents=True, exist_ok=True)

    # Static HTML-based demo app
    app_js = '''const express = require('express');
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>CloudCrafter Demo App</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; background: #0f172a; color: #e5e7eb; }
          .card { max-width: 640px; margin: 0 auto; padding: 24px; border-radius: 12px; background: #020617; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
          h1 { font-size: 24px; margin-bottom: 8px; color: #38bdf8; }
          p { margin: 4px 0; }
          .buttons { margin-top: 16px; display: flex; gap: 8px; }
          .btn { padding: 8px 14px; border-radius: 999px; border: none; cursor: pointer; font-size: 13px; }
          .btn-primary { background: #22c55e; color: #022c22; }
          .btn-secondary { background: #1e293b; color: #e5e7eb; }
          .tag { display: inline-block; margin-top: 12px; padding: 4px 10px; border-radius: 999px; background: #1e293b; font-size: 12px; color: #a5b4fc; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>CloudCrafter Demo App</h1>
          <p>This is a fake demo app generated from your visual blueprint.</p>
          <p>In a full version, each blueprint would get its own real UI and backend.</p>
          <div class="buttons">
            <button class="btn btn-primary">Simulate Request</button>
            <button class="btn btn-secondary">View Logs</button>
          </div>
          <div class="tag">Prototype deployment target</div>
        </div>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));'''

    (output_dir / 'app.js').write_text(app_js)

    return jsonify({
        "success": True,
        "codePath": str(output_dir),
        "appId": app_id,
        "blueprint": blueprint
    })


@app.route('/generate-iac', methods=['POST'])
def generate_iac():
    body = request.get_json() or {}

    app_id = (body.get('metadata') or {}).get('appId') or body.get('appId')
    if not app_id:
        return jsonify({"error": "appId is required"}), 400

    output_dir = Path('generated') / app_id / 'k8s'
    output_dir.mkdir(parents=True, exist_ok=True)

    deployment = generate_deployment_yaml(app_id)
    service = generate_service_yaml(app_id)

    (output_dir / 'deployment.yaml').write_text(deployment)
    (output_dir / 'service.yaml').write_text(service)

    return jsonify({
        "success": True,
        "iacPath": str(output_dir),
        "appId": app_id
    })


@app.route('/deploy', methods=['POST'])
def deploy_to_civo():
    body = request.get_json() or {}

    app_id = (body.get('metadata') or {}).get('appId') or body.get('appId')
    if not app_id:
        return jsonify({"error": "appId is required"}), 400

    iac_dir = Path('generated') / app_id / 'k8s'

    if not iac_dir.exists():
        return jsonify({"error": "Run /generate-iac first"}), 400

    cluster_url = "http://212.2.250.91"  # your Civo LoadBalancer IP

    try:
        print("CWD:", os.getcwd())
        print("KUBECONFIG in Flask:", os.environ.get("KUBECONFIG"))

        result = subprocess.run(
            ['kubectl', 'apply', '-f', str(iac_dir)],
            capture_output=True,
            text=True,
            env={**os.environ, "KUBECONFIG": os.path.expanduser(r"~\\.kube\\cloudcrafter-config")}
        )

        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        print("RETURN CODE:", result.returncode)

        logs = [
            "Parsed blueprint",
            "Generated backend code",
            "Generated Kubernetes manifests",
        ]

        if result.returncode == 0:
            logs.append("Applied manifests to Civo cluster")
        else:
            logs.append("kubectl apply failed (prototype – see stdout/stderr)")

        logs.append(f"Service available at {cluster_url}")

        try:
            send_slack_notification(app_id, "DEPLOYED", cluster_url)
        except Exception as e:
            print("Slack notification error:", e)

        return jsonify({
            "success": True,
            "deployed": result.returncode == 0,
            "appId": app_id,
            "clusterUrl": cluster_url,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "logs": logs
        })
    except Exception as e:
        logs = [
            "Parsed blueprint",
            "Generated backend code",
            "Generated Kubernetes manifests",
            "Error applying manifests (prototype)",
            f"Service available at {cluster_url}"
        ]
        return jsonify({
            "success": False,
            "deployed": False,
            "appId": app_id,
            "clusterUrl": cluster_url,
            "error": str(e),
            "logs": logs
        }), 500


def generate_deployment_yaml(app_id):
    deployment = {
        "apiVersion": "apps/v1",
        "kind": "Deployment",
        "metadata": {"name": app_id},
        "spec": {
            "replicas": 1,
            "selector": {"matchLabels": {"app": app_id}},
            "template": {
                "metadata": {"labels": {"app": app_id}},
                "spec": {
                    "containers": [{
                        "name": app_id,
                        "image": f"{app_id}:latest",
                        "ports": [{"containerPort": 8080}]
                    }]
                }
            }
        }
    }
    return yaml.dump(deployment)


def generate_service_yaml(app_id):
    service = {
        "apiVersion": "v1",
        "kind": "Service",
        "metadata": {"name": f"{app_id}-svc"},
        "spec": {
            "type": "LoadBalancer",
            "selector": {"app": app_id},
            "ports": [{"protocol": "TCP", "port": 80, "targetPort": 8080}]
        }
    }
    return yaml.dump(service)


@app.route('/monitor/<app_id>', methods=['GET'])
def monitor(app_id):
    logs = {
        "appId": app_id,
        "requests": 42,
        "statusCodes": {"200": 38, "500": 4},
        "lastDeploy": "2025-12-03 22:00 IST",
        "cpuUsage": "15%",
        "memoryUsage": "128MB/512MB"
    }
    return jsonify(logs)


@app.route('/cost-estimate', methods=['POST'])
def cost_estimate():
    blueprint = request.json or {}
    app_id = (blueprint.get('metadata') or {}).get('appId', 'unknown')
    nodes_count = len(blueprint.get('nodes', []))

    monthly_cost = nodes_count * 5 + 10  # simple demo formula

    return jsonify({
        "appId": app_id,
        "nodes": nodes_count,
        "estimatedMonthlyCost": f"${monthly_cost}",
        "hourlyCost": f"${monthly_cost/730:.2f}"
    })


if __name__ == '__main__':
    app.run(debug=True, port=5003)
