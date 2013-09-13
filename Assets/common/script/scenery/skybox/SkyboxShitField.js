#pragma strict
import System.Collections.Generic;

var objects : Transform[];		//objects to spawn
var detailObjects : Transform[];	//detailed objects to spawn
var maxNumber : int;			//max number of objects in scene
var centerObject : Transform;	//center of the current space
var maxDistFront : float = 5000;//bounding sphere for removal of objects
var maxDistBehind : float = 5000;
var minDistance : float = 1500;	//if anything gets within 3000 units of us then respawn
var theShip : Transform;		//reference to ship


private var skyboxCam : SkyboxCamera;
private var objectList: List.<Transform>;
private var cameraObject : Camera;



/* Skyboxshitfield

* field of asteroids that follows the skybox camera, when an asteroid hits the collider around
* the skyboxcamera spawn a real copy of it in the main camera space

*/

function Start () {
	//ship = GameObject.Find("TheShip").transform;
	cameraObject = centerObject.GetComponent.<Camera>();
	//create a shitload of objects around us first
	objectList = new List.<Transform>(maxNumber);
	for (var a = 0; a < maxNumber; a++){
		var rpos : Vector3;
		//rpos = Random.insideUnitSphere * maxDistFront; //ship.camera.farClipPlane;
		rpos = Quaternion.Euler(Random.Range(0,360), Random.Range(0,360), 0) * Vector3(0, 0,Random.Range(maxDistFront -1000, maxDistFront));
		//a = Instantiate(objects[Mathf.Floor(Random.Range(0,objects.Length))], ship.transform.position + rpos, Random.rotation);
		objectList.Add( Instantiate(objects[Mathf.Floor(Random.Range(0,objects.Length))], centerObject.transform.position + rpos, Random.rotation));
			
		
	}
	//now find all objects tagged with "shitfield", merge the list with our object list
	var extras : GameObject[] = GameObject.FindGameObjectsWithTag("shitfield");
	for (var g : GameObject in extras){
		objectList.Add(g.transform);
	}
	theShip = GameObject.Find("TheShip").transform;
	skyboxCam = GameObject.Find("skyboxCamera").GetComponent.<SkyboxCamera>();
}

function Update () {
	var maxDist : float;
	var newBasePos : Vector3;
	var rpos : Vector3;
	var fov : float;
	
	maxDist = maxDistFront; //ship.camera.farClipPlane;
	newBasePos = centerObject.transform.position;//+ (Vector3.Normalize(ship.rigidbody.velocity ) * (maxDist));
	fov = cameraObject.fov;
		
	//look for objects that are far away, move to direction of motion + random wiggle
	for (var a in objectList){
		//check object is behind ship
		var forward = centerObject.transform.TransformDirection(Vector3.forward);        
		var toOther = a.position - centerObject.transform.position;        
		var dist  :float = Vector3.Distance(a.transform.position, centerObject.transform.position);
		if (Vector3.Dot(forward,toOther) < 0){		
			
			if (  dist > maxDistBehind  ){
				//move it
				//rpos = ship.transform.rotation * Vector3(Random.Range(-1500,1500), Random.Range(-1500,1500),Random.Range(0,500));
				//random polar coords in hemisphere in front of ship
				rpos = (centerObject.transform.rotation * Quaternion.Euler(Random.Range(-fov,fov), Random.Range(-fov,fov), 0)) * Vector3(0, 0,Random.Range(maxDistFront, maxDistFront + 300));
				
				
				//a.transform.position = newBasePos + rpos;
				a.GetComponent.<DynamicFieldObjectBehaviour>().resetTo(newBasePos + rpos);
				
				
				
			} 
		} else if (dist < minDistance){
			rpos = (centerObject.transform.rotation * Quaternion.Euler(Random.Range(-fov,fov), Random.Range(-fov,fov), 0)) * Vector3(0, 0,Random.Range(maxDistFront, maxDistFront + 300));
			a.GetComponent.<DynamicFieldObjectBehaviour>().resetTo(newBasePos + rpos);
			//at this point spawn a detailed asteroid in the real world
				//toOther is in scaled space
				var newPos : Vector3 = theShip.position + (toOther * (1.0 / skyboxCam.translateScale));
				Instantiate(detailObjects[0], newPos, Quaternion.identity);
				
		}
	}
}

/*

		
		*/