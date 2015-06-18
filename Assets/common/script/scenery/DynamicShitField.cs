using UnityEngine;
using System;
using System.Collections.Generic;


public class DynamicShitField:MonoBehaviour{
	
	public Transform[] objects;
	public int[] weights;
	public int maxNumber;
	public Transform ship;
	public float maxDistFront = 5000.0f;
	public float maxDistBehind = 5000.0f;
	
	
	public Transform flameAttachment; //attaches to bastards
	
	List<Transform> objectList;
	Transform cameraObject;
	
	//field follows the player
	// moves objects from behind player (past maxdist) to the front of the player
	//gives illusion of infinite debris field whilst keeping polycount down
	//take max dist from cameras far clip plane distance
	
	
	public void Start() {
		ship = GameObject.Find("TheShip").transform;
		cameraObject = ship.Find("camera.0");
		//create a shitload of objects around us first
		objectList = new System.Collections.Generic.List<UnityEngine.Transform>(maxNumber);
		for(int a = 0; a < maxNumber; a++){
			Vector3 rpos = Vector3.zero;
			rpos = UnityEngine.Random.insideUnitSphere * maxDistFront; //ship.camera.farClipPlane;
			//rpos = Quaternion.Euler(Random.Range(0,360), Random.Range(0,360), 0) * Vector3(0, 0,Random.Range(maxDistFront -1000, maxDistFront));
			//a = Instantiate(objects[Mathf.Floor(Random.Range(0,objects.Length))], ship.transform.position + rpos, Random.rotation);
			objectList.Add( Instantiate(objects[randomObjectId()], ship.transform.position + rpos, UnityEngine.Random.rotation) as Transform);
				
			
		}
		//now find all objects tagged with "shitfield", merge the list with our object list
		GameObject[] extras = GameObject.FindGameObjectsWithTag("shitfield");
		foreach(GameObject g in extras){
			objectList.Add(g.transform);
		}
	
	}
	
	public void setAllVelocities(Vector3 v){
		foreach(Transform o in objectList){
			if(o.GetComponent<Rigidbody>().isKinematic == false){
				o.GetComponent<Rigidbody>().velocity = v;
			}
		}
	}
	
	public void setAllStartVelocities(Vector3 v){
		foreach(Transform o in objectList){
			debrisbehaviour d = o.GetComponent<debrisbehaviour>();
			if(d != null){
				d.startVelocity = v;
			}
		}
	}
	
	
	int randomObjectId(){
		int maxW = 0;
		for(int i = 0; i < objects.Length; i++){
			if( i > weights.Length ){
				maxW += 1;
			} else {
				maxW += weights[i];
			}
		}
		int randTarget = Mathf.FloorToInt((float)UnityEngine.Random.Range(1, maxW));
		for(int c = 0; c < objects.Length; c++){
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
	
	public void Update() {
		float maxDist = 0.0f;
		Vector3 newBasePos = Vector3.zero;
		Vector3 rpos = Vector3.zero;
		float fov = 0.0f;
		
		maxDist = maxDistFront; //ship.camera.farClipPlane;
		newBasePos = ship.transform.position;//+ (Vector3.Normalize(ship.rigidbody.velocity ) * (maxDist));
		fov = cameraObject.GetComponent<Camera>().fieldOfView;
			
		//look for objects that are far away, move to direction of motion + random wiggle
		for(int i = 0; i < objectList.Count; i++){
			Transform a = objectList[i];
			//check object is behind ship
			Vector3 forward = ship.transform.TransformDirection(Vector3.forward);        
			Vector3 toOther = a.position - ship.transform.position;        
			if (Vector3.Dot(forward,toOther) < 0){		
				if ( Vector3.Distance(a.transform.position, ship.transform.position) > maxDistBehind  ){
					//move it
					//rpos = ship.transform.rotation * Vector3(Random.Range(-1500,1500), Random.Range(-1500,1500),Random.Range(0,500));
					//random polar coords in hemisphere in front of ship
					rpos = (ship.transform.rotation * Quaternion.Euler(UnityEngine.Random.Range(-fov,fov), UnityEngine.Random.Range(-fov,fov), 0.0f)) * new Vector3(0.0f, 0.0f,UnityEngine.Random.Range(maxDistFront, maxDistFront + 300));
					
					
					//a.transform.position = newBasePos + rpos;
					a.GetComponent<DynamicFieldObjectBehaviour>().resetTo(newBasePos + rpos);
				}
			}
		}
				
	
	}
	
	public void createABastard(){
		
			float maxDist = 0.0f;
			Vector3 newBasePos = Vector3.zero;
			Vector3 rpos = Vector3.zero;
			float fov = 0.0f;
			
			maxDist = maxDistFront; //ship.camera.farClipPlane;
			newBasePos = ship.transform.position;//+ (Vector3.Normalize(ship.rigidbody.velocity ) * (maxDist));
			fov = cameraObject.GetComponent<Camera>().fieldOfView / 2.3f;
			//pick a random item and make it a bastard
			int rand = UnityEngine.Random.Range(0, maxNumber);
			rpos = (ship.transform.rotation * Quaternion.Euler(UnityEngine.Random.Range(-fov,fov), UnityEngine.Random.Range(-fov,fov), 0.0f)) * new Vector3(0.0f, 0.0f,UnityEngine.Random.Range(maxDistFront, maxDistFront + 300));
						
			objectList[rand].GetComponent<DynamicFieldObjectBehaviour>().resetTo(newBasePos + rpos,true);
			
			if(objectList[rand].GetComponent<DynamicFieldObjectBehaviour>().bastardable == true){
				//attach fire to the piece 
				if(flameAttachment != null){
					Transform f  = (UnityEngine.Transform)Instantiate(flameAttachment, new Vector3(10000.0f,10000.0f,10000.0f), Quaternion.identity);
					f.transform.parent = objectList[rand];
					f.transform.localPosition = Vector3.zero;
					f.transform.localScale = Vector3.one;
					f.name = "FlameAttachment";
				}
			}
		
			
		
		
	
	}

}
