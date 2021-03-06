using UnityEngine;
using System;
using System.Collections.Generic;


public class SkyboxJunkField:MonoBehaviour{
	
	public Transform[] objects;
	public int[] weights;
	public int maxNumber;
	public Transform ship;
	public float maxDistFront = 5000.0f;
	public float maxDistBehind = 5000.0f;
	
	
	List<Transform> objectList;
	 public Transform cameraObject;
	
	//field follows the player
	// moves objects from behind player (past maxdist) to the front of the player
	//gives illusion of infinite debris field whilst keeping polycount down
	//take max dist from cameras far clip plane distance
	
	
	public void Start() {
		ship = GameObject.Find("SkyboxCamera").transform;
		
		//create a shitload of objects around us first
		objectList = new System.Collections.Generic.List<UnityEngine.Transform>(maxNumber);
		for(int a = 0; a < maxNumber; a++){
			Vector3 rpos = Vector3.zero;
			//rpos = Random.insideUnitSphere * maxDistFront; //ship.camera.farClipPlane;
			rpos = Quaternion.Euler((float)UnityEngine.Random.Range(0,360), (float)UnityEngine.Random.Range(0,360), 0.0f) * new Vector3(0.0f, 0.0f,UnityEngine.Random.Range(maxDistFront -1000, maxDistFront));
			//a = Instantiate(objects[Mathf.Floor(Random.Range(0,objects.Length))], ship.transform.position + rpos, Random.rotation);
			objectList.Add( Instantiate(objects[randomObjectId()], ship.transform.position + rpos, UnityEngine.Random.rotation) as Transform);
				
			
		}
		//now find all objects tagged with "shitfield", merge the list with our object list
		GameObject[] extras = GameObject.FindGameObjectsWithTag("shitfield");
		foreach(GameObject g in extras){
			objectList.Add(g.transform);
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
		fov = cameraObject.GetComponent<Camera>().fov;
			
		//look for objects that are far away, move to direction of motion + random wiggle
		foreach(UnityEngine.Transform a in objectList){
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
		fov = cameraObject.GetComponent<Camera>().fov / 2.3f;
		//pick a random item and make it a bastard
		int rand = UnityEngine.Random.Range(0, maxNumber);
		rpos = (ship.transform.rotation * Quaternion.Euler(UnityEngine.Random.Range(-fov,fov), UnityEngine.Random.Range(-fov,fov), 0.0f)) * new Vector3(0.0f, 0.0f,UnityEngine.Random.Range(maxDistFront, maxDistFront + 300));
					
		objectList[rand].GetComponent<DynamicFieldObjectBehaviour>().resetTo(newBasePos + rpos,true);
	
	}

}