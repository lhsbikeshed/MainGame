using UnityEngine;
using System;
using UnityOSC;


public class WaypointController:MonoBehaviour{
	
	public Vector3[] waypoints ; 
	public Transform waypointObj;
	GameObject[] mapObjects;
	MapController mapController;
	public int currentWaypoint = 0;
	
	/* generate waypoint coordinates before anything else wakes up*/
	
	
	
	/* FIX THIS SHIT
	* Waypoints are overlaying
	* also moving the gate after we've spawned it
	*/
	public void Awake() {
		
		
		
		
	}
	
	
	public void Start(){
		mapController = GameObject.Find("SceneScripts").GetComponent<MapController>();
		mapObjects = new GameObject[14];
		
		spawnWaypoint(0, true);
		//mapController.updateObjectList();
		//mapController.updateObjects();
		
		
	}
	
	public void gateDone(GameObject obj){
		int ct = 0;
		foreach(GameObject g in mapObjects){
			if (g == obj){
				g.GetComponent<TargettableObject>().highlighted = false;
				OSCMessage msg2 = new OSCMessage("/radar/wayPointReached");
				OSCHandler.Instance.SendMessageToAll(msg2);
				break;
			}
			
			ct++;
		}
		
		if(ct < 13){
			mapObjects[ct+1].GetComponent<DynamicMapObject>().Activate();
			mapObjects[ct+1].GetComponent<TargettableObject>().highlighted = true;
			OSCMessage msg = new OSCMessage("/game/speedrun/beaconDone");
			msg.Append<int>(ct+1);
			OSCHandler.Instance.SendMessageToAll(msg);
			currentWaypoint = ct+1;
		}
	}
	
	/* actually spawn the items in the scene */
	public void spawnWaypoint(int from,bool createObjects){
	
		waypoints = new Vector3[14];
		int xc = mapController.sectorPos[0];
		int yc = mapController.sectorPos[1];
		for(int a = from; a < 14; a++){
			if(UnityEngine.Random.Range(0,100) < 50){
				xc += UnityEngine.Random.Range(-1,1);
			} else {
				yc += UnityEngine.Random.Range(-1,1);
			}
			waypoints[a] = new Vector3((float)xc, (float)yc, (float)(a + 1));
		}
		if(UnityEngine.Random.Range(0,100) < 50){
			xc += UnityEngine.Random.Range(-1,1);
		} else {
			yc += UnityEngine.Random.Range(-1,1);
		}
		
		int[] t = new int[3];
		t[0] = xc;
		t[1] = yc;
		t[2] = 15;
		//mapController.spawnGate(t);
		
		//now spawn them
		int ct = 0;
		
		DynamicMapObject d = null;
		Transform dynObj = null;
		foreach(Vector3 v in waypoints){
			if(ct >= from){
				if(createObjects){
					UnityEngine.Debug.Log("Creating wp: " + ct);


					dynObj = (UnityEngine.Transform)Instantiate(waypointObj, new Vector3(10000.0f,10000.0f,10000.0f), UnityEngine.Random.rotation);

					d = dynObj.GetComponent<DynamicMapObject>();
					d.sectorCoord[0] = (int)v.x;
					d.sectorCoord[1] = (int)v.y;
					d.sectorCoord[2] = (int)v.z;
					d.originalPosition = UnityEngine.Random.onUnitSphere * UnityEngine.Random.Range(40,400);
					dynObj.GetComponent<TargettableObject>().objectName = "Waypoint " + (ct + 1);

					mapObjects[ct] = dynObj.gameObject;
					mapController.updateObject(dynObj.gameObject);
				} else {
				
					d = mapObjects[ct].GetComponent<DynamicMapObject>();;
					d.sectorCoord[0] = (int)v.x;
					d.sectorCoord[1] = (int)v.y;
					d.sectorCoord[2] = (int)v.z;
					d.originalPosition = new Vector3(0.0f,0.0f,400.0f);
					mapObjects[ct] = d.gameObject;
					mapController.updateObject(d.gameObject);
				}
				
			}
			ct ++;
			//dynObj.Deactivate();
		}
		
		mapObjects[from].GetComponent<TargettableObject>().highlighted = true;
		
	}
	
	public void FixedUpdate() {
		float minDist = 100000.0f;
		int closest = 0;
		int ct = 0;
		Vector3 wpPos = Vector3.zero;
		Vector3 shipPos = Vector3.zero;
        float dist = 0.0f;
        foreach(GameObject m in mapObjects){
			
			wpPos = m.GetComponent<DynamicMapObject>().getSectorAsVec();
			shipPos = mapController.getSectorAsVec();
			dist = (shipPos - wpPos).magnitude;
			if(dist < minDist){
				minDist = dist;
				closest = ct;
			}
			ct++;
		}
		//Debug.Log(closest);
		if(closest > currentWaypoint){
			mapObjects[currentWaypoint].GetComponent<TargettableObject>().highlighted = false;
			currentWaypoint = closest;
			mapObjects[currentWaypoint].GetComponent<TargettableObject>().highlighted = true;
		}
		
		wpPos = mapObjects[currentWaypoint].GetComponent<DynamicMapObject>().getSectorAsVec();
		float closestDist = (shipPos - wpPos).magnitude;
		if(closestDist > 1.5f && currentWaypoint < 13){
			UnityEngine.Debug.Log("Regenerating waypoints dist = " + dist);
	
			spawnWaypoint(currentWaypoint, false);
		
		}
		
		
		
		
	}
}
