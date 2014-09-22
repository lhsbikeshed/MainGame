#pragma strict
import System.Collections.Generic;

var objects : Transform[];
var weights : int[];
var maxNumber : int;
var ship : Transform;
var maxDistFront : float = 5000;
var maxDistBehind : float = 5000;


var flameAttachment : Transform; //attaches to bastards

private var objectList: List.<Transform>;
private var cameraObject : Transform;

//field follows the player
// moves objects from behind player (past maxdist) to the front of the player
//gives illusion of infinite debris field whilst keeping polycount down
//take max dist from cameras far clip plane distance


function Start () {
	ship = GameObject.Find("TheShip").transform;
	cameraObject = ship.Find("camera");
	//create a shitload of objects around us first
	objectList = new List.<Transform>(maxNumber);
	for (var a = 0; a < maxNumber; a++){
		var rpos : Vector3;
		rpos = Random.insideUnitSphere * maxDistFront; //ship.camera.farClipPlane;
		//rpos = Quaternion.Euler(Random.Range(0,360), Random.Range(0,360), 0) * Vector3(0, 0,Random.Range(maxDistFront -1000, maxDistFront));
		//a = Instantiate(objects[Mathf.Floor(Random.Range(0,objects.Length))], ship.transform.position + rpos, Random.rotation);
		objectList.Add( Instantiate(objects[randomObjectId()], ship.transform.position + rpos, Random.rotation));
			
		
	}
	//now find all objects tagged with "shitfield", merge the list with our object list
	var extras : GameObject[] = GameObject.FindGameObjectsWithTag("shitfield");
	for (var g : GameObject in extras){
		objectList.Add(g.transform);
	}

}

function setAllVelocities(v : Vector3){
	for(var o : Transform in objectList){
		if(o.rigidbody.isKinematic == false){
			o.rigidbody.velocity = v;
		}
	}
}

function setAllStartVelocities(v : Vector3){
	for(var o : Transform in objectList){
		var d : debrisbehaviour = o.GetComponent.<debrisbehaviour>();
		if(d != null){
			d.startVelocity = v;
		}
	}
}


private function randomObjectId() : int{
	var maxW : int = 0;
	for(var i = 0; i < objects.Length; i++){
		if( i > weights.Length ){
			maxW += 1;
		} else {
			maxW += weights[i];
		}
	}
	var randTarget : int = Mathf.FloorToInt(Random.Range(1, maxW));
	for(var c = 0; c < objects.Length; c++){
		if( c > weights.Length ){
			randTarget -= 1;
		} else {
			randTarget -= weights[c];
		}
		if(randTarget < 0){
			return c;
		}
	}
	return 0;
	
}

function Update () {
	var maxDist : float;
	var newBasePos : Vector3;
	var rpos : Vector3;
	var fov : float;
	
	maxDist = maxDistFront; //ship.camera.farClipPlane;
	newBasePos = ship.transform.position;//+ (Vector3.Normalize(ship.rigidbody.velocity ) * (maxDist));
	fov = cameraObject.camera.fov;
		
	//look for objects that are far away, move to direction of motion + random wiggle
	for (var i = 0; i < objectList.Count; i++){
		var a : Transform = objectList[i];
		//check object is behind ship
		var forward = ship.transform.TransformDirection(Vector3.forward);        
		var toOther = a.position - ship.transform.position;        
		if (Vector3.Dot(forward,toOther) < 0){		
			if ( Vector3.Distance(a.transform.position, ship.transform.position) > maxDistBehind  ){
				//move it
				//rpos = ship.transform.rotation * Vector3(Random.Range(-1500,1500), Random.Range(-1500,1500),Random.Range(0,500));
				//random polar coords in hemisphere in front of ship
				rpos = (ship.transform.rotation * Quaternion.Euler(Random.Range(-fov,fov), Random.Range(-fov,fov), 0)) * Vector3(0, 0,Random.Range(maxDistFront, maxDistFront + 300));
				
				
				//a.transform.position = newBasePos + rpos;
				a.GetComponent.<DynamicFieldObjectBehaviour>().resetTo(newBasePos + rpos);
			}
		}
	}
			

}

function createABastard(){
	
		var maxDist : float;
		var newBasePos : Vector3;
		var rpos : Vector3;
		var fov : float;
		
		maxDist = maxDistFront; //ship.camera.farClipPlane;
		newBasePos = ship.transform.position;//+ (Vector3.Normalize(ship.rigidbody.velocity ) * (maxDist));
		fov = cameraObject.camera.fov / 2.3f;
		//pick a random item and make it a bastard
		var rand : int = Random.Range(0, maxNumber);
		rpos = (ship.transform.rotation * Quaternion.Euler(Random.Range(-fov,fov), Random.Range(-fov,fov), 0)) * Vector3(0, 0,Random.Range(maxDistFront, maxDistFront + 300));
					
		objectList[rand].GetComponent.<DynamicFieldObjectBehaviour>().resetTo(newBasePos + rpos,true);
		
		if(objectList[rand].GetComponent.<DynamicFieldObjectBehaviour>().bastardable == true){
			//attach fire to the piece 
			if(flameAttachment != null){
				var f : Transform  = Instantiate(flameAttachment, Vector3(10000,10000,10000), Quaternion.identity);
				f.transform.parent = objectList[rand];
				f.transform.localPosition = Vector3.zero;
				f.transform.localScale = Vector3.one;
				f.name = "FlameAttachment";
			}
		}
	
		
	
	

}
