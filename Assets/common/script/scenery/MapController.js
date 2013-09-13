#pragma strict

var ship : GameObject;
var sectorPos : int[];
var cellSize : int = 3000;

private var mapObjects : List.<GameObject>;
var jumpGate : GameObject;
private var currentScene : GenericScene;
private var ps : PersistentScene;

function Awake () {
	mapObjects = new List.<GameObject>();
	ps = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
	sectorPos = new int[3];
	ship = GameObject.Find("TheShip");
	
	currentScene = GameObject.Find("SceneScripts").GetComponent.<GenericScene>();
	
	updateObjectList();
	
}

function Start(){
	currentScene.MapSectorChanged(Vector3 ( sectorPos[0], sectorPos[1], sectorPos[2]), Vector3 ( sectorPos[0], sectorPos[1], sectorPos[2]) );
}

function addObject(obj : GameObject){
	if(!mapObjects.Contains(obj)){
		mapObjects.Add(obj);
	}
	testPosition(obj);
}

function updateObject(obj : GameObject){
	testPosition(obj);
}

function removeObject(obj : GameObject){
	mapObjects.Remove(obj);

}

function updateObjectList(){
	//find all gameobjects that have DynamicMapObject attached
	//mapObjects = GameObject.FindGameObjectsWithTag("dynamic");
	for (var dynObj : GameObject in mapObjects){
		var script = dynObj.GetComponent.<DynamicMapObject>();
		if(dynObj.name == "JumpGate"){
			jumpGate = dynObj;
		}
		script.Deactivate();
		
	}
	//Debug.Log("Found " + mapObjects.size + " objects");
}

function getSectorAsVec() : Vector3 {
	return Vector3(sectorPos[0], sectorPos[1], sectorPos[2]);

}


function OnDrawGizmo(){
	Gizmos.color = Color(255,255,0);
	Gizmos.DrawCube(Vector3.zero, Vector3.one * cellSize);
}

function spawnGate(pos : int[]){
	var script = jumpGate.GetComponent.<DynamicMapObject>();
	script.sectorCoord[0] = pos[0];
	script.sectorCoord[1] = pos[1];
	script.sectorCoord[2] = pos[2];
	//script.Activate();
	testPosition(jumpGate);
	
	//updateObjects();
	//fuck, forgot to tell the radar system
	ship.GetComponent.<TargettingSystem>().clearHighlights();
	jumpGate.GetComponent.<GeneralTrackableTarget>().highlighted = true;
	ship.GetComponent.<TargettingSystem>().addObject(jumpGate);
}

function spawnGate(){
		spawnGate(sectorPos);
		
		
}

function updateObjects(){
//activate all objects in this sector
	for (var dynObj : GameObject in mapObjects){
		
		testPosition(dynObj);
	}
	
}

function testPosition(dynObj : GameObject){
	var script = dynObj.GetComponent.<DynamicMapObject>();
	if(script.enabled == false){ return; };
	
	if(script.isBig == false){
		//if (ArrayUtility.ArrayEquals.<int>(script.sectorCoord,sectorPos)){
		var ok : boolean = true;
		for(var i = 0; i < 3; i++){
			if(script.sectorCoord[i] != sectorPos[i]){
				ok = false;
				break;
			}
		}
		if(ok == true){		
			dynObj.transform.position = script.originalPosition	;
			script.Activate();
		} else {
			script.Deactivate();
		}
	} else {
		var difX : int = sectorPos[0] - script.sectorCoord[0] ;
		var difY : int = sectorPos[1] - script.sectorCoord[1] ;
		var difZ : int = sectorPos[2] - script.sectorCoord[2];
		var sectorSize : int = script.sectorSize;
		//Debug.Log(difX + " " + difY + " " + difZ);

		if(difX >= -sectorSize && difX <= sectorSize && difY >= -sectorSize && difY <= sectorSize && difZ >= -sectorSize && difZ <= sectorSize){
			dynObj.transform.position = script.originalPosition + Vector3(-difX * cellSize, -difY * cellSize, -difZ * cellSize);								
			script.Activate();
		} else {				
			script.Deactivate();
		}
	}	
				
}


function Update () {
	//check that the ship isnt too far away from the game origin as this screws physics
	//if we are then translate EVERYTHING back to the origin
	//actually: should probably just reset the coordinate that went over 1500
	
	var currentPos : Vector3 = ship.transform.position;
	var correctionTransform : Vector3;
	var doCorrection : boolean;
	doCorrection = false;
	for (var i = 0; i < 3; i++){
		//did this coord element go over the sector edge?
		if (Mathf.Abs(currentPos[i]) > cellSize / 2){
			doCorrection = true;
			correctionTransform[i] = (cellSize) * Mathf.Sign(-currentPos[i]);
		}
	}
	if(doCorrection){
		var gameObjs : Transform[] = FindObjectsOfType(Transform) as Transform[];
		
		for (var g : Transform in gameObjs){
			
				if(g.parent == null && g.gameObject.layer != 9 && g.GetComponent.<GUITexture>() == null){
					g.position += correctionTransform;
					
					/*var ps : ParticleSystem[]  = g.GetComponentsInChildren.<ParticleSystem>();
					for(var p in ps){
					p.
						if(p.particleEmitter.useWorldSpace == true){
							var particles : ParticleSystem.Particle[];
							var l : int = p.GetParticles(particles);
							for (var b = 0; b < l; b++) {
	            	
	            	
	            				particles[b].position += correctionTransform;
	            			}
	            			p.SetParticles(particles, l);
						}
					}	*/				
				}
		}
		
		var oldPos : Vector3 = Vector3 ( sectorPos[0], sectorPos[1], sectorPos[2]) ;
		
		//find out which sector wall we crossed and change sector pos
		for (i = 0; i < 3; i++){
			if(Mathf.Abs(correctionTransform[i]) > 0){
			
				sectorPos[i] += 1 * Mathf.Sign(-correctionTransform[i]) ;
			}
		}
		//Debug.Log(sectorPos[0] +"," + sectorPos[1] + "," + sectorPos[2]);
		
		//let the current scene know we moved sectors
		currentScene.MapSectorChanged(oldPos, Vector3 ( sectorPos[0], sectorPos[1], sectorPos[2]) );
		

		
		updateObjects();
	}
	
}