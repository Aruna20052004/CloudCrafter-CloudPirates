from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import uuid

blueprints = {}  # Simple in-memory storage

app = FastAPI()

# Blueprint data structures
class Node(BaseModel):
    id: str
    type: str  # "form", "function", "database", "response"
    config: Dict[str, Any]

class Edge(BaseModel):
    id: str
    source: str
    target: str

class Blueprint(BaseModel):
    version: str = "1.0"
    projectId: str
    nodes: List[Node]
    edges: List[Edge]

@app.get("/")
async def root():
    return {"message": "Hello CloudCrafter Backend!"}
def validate_blueprint(blueprint: dict) -> list:
    warnings = []
    
    # Rule 1: Every Form must connect to Response
    forms = [n for n in blueprint["nodes"] if n["type"] == "form"]
    for form in forms:
        # Check if this form connects to response
        connected_to_response = any(
            edge["source"] == form["id"] and 
            any(n["id"] == edge["target"] and n["type"] == "response" 
                for n in blueprint["nodes"])
            for edge in blueprint["edges"]
        )
        if not connected_to_response:
            warnings.append({
                "type": "error",
                "nodeId": form["id"],
                "message": "Form must connect to Response node"
            })
    
    # Rule 2: Database needs table name
    dbs = [n for n in blueprint["nodes"] if n["type"] == "database"]
    for db in dbs:
        if "tableName" not in db["config"]:
            warnings.append({
                "type": "warning", 
                "nodeId": db["id"],
                "message": "Database missing tableName"
            })
    
    return warnings

def autocorrect_blueprint(blueprint: dict) -> dict:
    warnings = validate_blueprint(blueprint)
    fixed = blueprint.copy()
    
    for warning in warnings:
        if "Form must connect to Response" in warning["message"]:
            # Auto-add Response node
            response_id = f"auto-response-{len(fixed['nodes'])}"
            fixed["nodes"].append({
                "id": response_id,
                "type": "response",
                "config": {"status": 200, "message": "OK"}
            })
            
            # Auto-connect Form → Response
            fixed["edges"].append({
                "id": f"auto-edge-{response_id}",
                "source": warning["nodeId"],
                "target": response_id
            })
    
    return fixed


@app.post("/blueprint/parse")
async def parse_blueprint(graph_data: dict):
    project_id = str(uuid.uuid4())[:8]
    
    blueprint = Blueprint(
        projectId=project_id,
        nodes=[
            Node(
                id=node["id"], 
                type=node.get("type", "unknown"),
                config=node.get("data", {})
            ) for node in graph_data.get("nodes", [])
        ],
        edges=[
            Edge(**edge) for edge in graph_data.get("edges", [])
        ]
    )
    
    blueprints[project_id] = blueprint.dict()  # ← THIS LINE MUST HAVE 4 spaces
    return blueprint.dict()


@app.post("/blueprint/validate")
async def validate_blueprint_endpoint(data: dict):
    projectId = data.get("projectId", "unknown")
    
    if projectId not in blueprints:
        return {"error": "No blueprint found for this projectId"}
    
    blueprint = blueprints[projectId]
    warnings = validate_blueprint(blueprint)
    
    return {
        "projectId": projectId,
        "warnings": warnings, 
        "isValid": len(warnings) == 0
    }


@app.post("/blueprint/autocorrect")
async def autocorrect_endpoint(data: dict):
    projectId = data.get("projectId", "unknown")
    
    if projectId not in blueprints:
        return {"error": "No blueprint found"}
    
    blueprint = blueprints[projectId]
    fixed_blueprint = autocorrect_blueprint(blueprint)
    
    # Save fixed version
    blueprints[projectId] = fixed_blueprint
    
    return {
        "projectId": projectId,
        "fixedBlueprint": fixed_blueprint,
        "changesMade": len(validate_blueprint(fixed_blueprint)) == 0
    }

