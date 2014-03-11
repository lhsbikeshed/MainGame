#pragma strict

var waypoints : Vector3[] ; 
var waypointObj : Transform;
private var mapObjects : GameObject[];
private var mapController : MapController;
var currentWaypoint : int = 0;

/* generate waypoint coordinates before anything else wakes up*/



/* FIX THIS SHIT
* Waypoints are overlaying
* also moving the gate after we've spawned it
*/
function Awake () {
	
	
	
	
}


function Start(){
	mapController = GameObject.Find("SceneScripts").GetComponent.<MapController>();
	mapObjects = new GameObject[14];
	
	spawnWaypoint(0, true);
	//mapController.updateObjectList();
	//mapController.updateObjects();
	
	
}

function gateDone(obj : GameObject){
	var ct : int = 0;
	for(var g: GameObject in mapObjects){
		if (g == obj){
			g.GetComponent.<TargettableObject>().highlighted = false;
			break;
		}
		
		ct++;
	}
	
	if(ct < 13){
		mapObjects[ct+1].GetComponent.<DynamicMapObject>().Activate();
		mapObjects[ct+1].GetComponent.<TargettableObject>().highlighted = true;
		var msg : OSCMessage = new OSCMessage("/game/speedrun/beaconDone");
		msg.Append.<int>(ct+1);
		OSCHandler.Instance.SendMessageToAll(msg);
		currentWaypoint = ct+1;
	}
}

/* actually spawn the items in the scene */
function spawnWaypoint(from : int, createObjects : boolean){

	waypoints = new Vector3[14];
	var xc : int = mapController.sectorPos[0];
	var yc : int = mapController.sectorPos[1];
	for (var a : int = from; a < 14; a++){
		if(Random.Range(0,100) < 50){
			xc += Random.Range(-1,1);
		} else {
			yc += Random.Range(-1,1);
		}
		waypoints[a] = Vector3(xc, yc, a + 1);
	}
	if(Random.Range(0,100) < 50){
		xc += Random.Range(-1,1);
	} else {
		yc += Random.Range(-1,1);
	}
	
	var t : int[] = new int[3];
	t[0] = xc;
	t[1] = yc;
	t[2] = 15;
	mapController.spawnGate(t);
	
	//now spawn them
	var ct : int = 0;
	
	var d : DynamicMapObject;
	for(var v  : Vector3  in waypoints){
		if(ct >= from){
			if(createObjects){
				Debug.Log("Creating wp: " + ct);
				var dynObj : Transform = Instantiate(waypointObj, Vector3(10000,10000,10000), Quaternion.identity);
				d = dynObj.GetComponent.<DynamicMapObject>();
				d.sectorCoord[0] = v.x;
				d.sectorCoord[1] = v.y;
				d.sectorCoord[2] = v.z;
				d.originalPosition = Vector3(0,0,400);
				dynObj.GetComponent.<TargettableObject>().objectName = "Waypoint " + (ct + 1);
				mapObjects[ct] = dynObj.gameObject;
				mapController.updateObject(dynObj.gameObject);
			} else {
			
				d = mapObjects[ct].GetComponent.<DynamicMapObject>();;
				d.sectorCoord[0] = v.x;
				d.sectorCoord[1] = v.y;
				d.sectorCoord[2] = v.z;
				d.originalPosition = Vector3(0,0,400);
				mapObjects[ct] = d.gameObject;
				mapController.updateObject(d.gameObject);
			}
			
		}
		ct ++;
		//dynObj.Deactivate();
	}
	
	mapObjects[from].GetComponent.<TargettableObject>().highlighted = true;
	
}

function FixedUpdate () {
	var minDist : float = 100000;
	var closest : int = 0;
	var ct : int = 0;
	var wpPos : Vector3;
	for(var m : GameObject in mapObjects){
		
		wpPos = m.GetComponent.<DynamicMapObject>().getSectorAsVec();
		var shipPos : Vector3 = mapController.getSectorAsVec();
		var dist : float = (shipPos - wpPos).magnitude;
		if(dist < minDist){
			minDist = dist;
			closest = ct;
		}
		ct++;
	}
	//Debug.Log(closest);
	if(closest > currentWaypoint){
		mapObjects[currentWaypoint].GetComponent.<TargettableObject>().highlighted = false;
		currentWaypoint = closest;
		mapObjects[currentWaypoint].GetComponent.<TargettableObject>().highlighted = true;
	}
	
	wpPos = mapObjects[currentWaypoint].GetComponent.<DynamicMapObject>().getSectorAsVec();
	var closestDist : float = (shipPos - wpPos).magnitude;
	if(closestDist > 1.5 && currentWaypoint < 13){
		Debug.Log("Regenerating waypoints dist = " + dist);

		spawnWaypoint(currentWaypoint, false);
	
	}
	
	
	
	
}