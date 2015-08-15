using UnityEngine;
using UnityOSC;
using System.Collections.Generic;

/* keep an eye on the waypoints
 * when ship approaches one spawn another in adjacent sector
 */
public class WaypointController:MonoBehaviour{

	int poolMax = 7;
	public Transform waypointObj;
	Transform[] waypointPool ;
	int poolPtr = 0;
	public int currentWaypoint = 0;
	int lastSpawnId = 0;

	MapController mapController;

	List<Transform> pool = new List<Transform> ();



	public void Awake() {
		OSCSystem._instance.RegisterRpcClass (this);
		
	}
	
	
	public void Start(){
		mapController = GameObject.Find("SceneScripts").GetComponent<MapController>();
		//now position them
		waypointPool = new Transform[poolMax];
		//spawn 4 waypoints for the pool
		for (int i = 0; i < poolMax; i++) {
			Transform t = Instantiate<Transform> (waypointObj);
			t.GetComponent<WaypointBehaviour>().setController(this);
			DynamicMapObject dObject = t.GetComponent<DynamicMapObject> ();
			/*dObject.originalPosition = Random.onUnitSphere * 40f;
			dObject.sectorCoord = new int[] {0,0,i};*/


			dObject.OnDeactivate += ObjectDeactivated;
			dObject.OnActivate += ObjectActivated;
			dObject.Deactivate();
			waypointPool[i] = t;
		}


		Vector3 currentPos = Random.onUnitSphere * 40;
		currentPos.z += 1000 + Random.Range (-200,200);
		currentPos.x += Random.Range(-300,300);
		currentPos.y += Random.Range (-300,300);
		Transform tNew = spawnNew (currentPos, 0);
		tNew.GetComponent<TargettableObject>().highlighted = true;
		currentPos.z += 1000 + Random.Range (-200,200);
		currentPos.x += Random.Range(-300,300);
		currentPos.y += Random.Range (-300,300);
		spawnNew (currentPos, 1);
		lastSpawnId = 1;

	}

	[OscCallable]
	public void PlayersGotLost(){
		//re-pool all of the waypoints
		foreach (Transform t in waypointPool) {
			t.GetComponent<DynamicMapObject>().Deactivate();

		}
		Vector3 currentPos = mapController.getShipWorldPosition () + Random.onUnitSphere * 100f;
		currentPos.z += 1000 + Random.Range (-200,200);
		currentPos.x += Random.Range(-300,300);
		currentPos.y += Random.Range (-300,300);
		Transform tNew = spawnNew (currentPos, lastSpawnId);
		tNew.GetComponent<TargettableObject>().highlighted = true;
		lastSpawnId ++;

		currentPos.z += 1000 + Random.Range (-200,200);
		currentPos.x += Random.Range(-300,300);
		currentPos.y += Random.Range (-300,300);
		spawnNew (currentPos, lastSpawnId);
		lastSpawnId ++;

	}


	/* pull a gate out of the pool, move it somewhere nice then activate it
	 * returns: the gate spawned
	 */
	Transform spawnNew(Vector3 currentWorldPos, int id){

		//find a free waypoint, set its world pos to currentworldpos, update with map controller
		Transform newWp = null;
		if (pool.Count > 0) {
			newWp = pool [0];
			pool.RemoveAt (0);
		} else {
		
			Debug.Log ("RUN OUT OF WAYPOINTS IN POOL");
			return null;
		}

		DynamicMapObject dObject = newWp.GetComponent<DynamicMapObject> ();
		dObject.setWorldPosition (currentWorldPos);
		newWp.GetComponent<WaypointBehaviour>().id = id;
		newWp.GetComponent<GeneralTrackableTarget> ().objectName = "Waypoint " + (id+1);

		mapController.updateObject (dObject.gameObject);
		return newWp;
	}

	void ObjectActivated(DynamicMapObject dObj){

	}

	/* called when a live gate is hidden by the map engine. Return it to the pool */
	void ObjectDeactivated(DynamicMapObject dObj){
		//return to pool
		pool.Add (dObj.transform);

	}

	/* called by gates when player passes through them 
     * if we've passed the last in the chain then spawn a new one from the pool
	 */
	public void gateDone(GameObject obj){
		int id = obj.GetComponent<WaypointBehaviour> ().id;
		if (id >= currentWaypoint) {
			currentWaypoint = id;

			obj.GetComponent<TargettableObject>().highlighted = false;
			OSCMessage msg2 = new OSCMessage("/radar/wayPointReached");
			OSCHandler.Instance.SendMessageToAll(msg2);
			if(lastSpawnId <= currentWaypoint){
				//spawn another one further out
				Vector3 lastPos = obj.GetComponent<DynamicMapObject> ().getWorldPosition ();
				lastPos.z += 1000 + Random.Range (-200,200);
				lastPos.x += Random.Range(-300,300);
				lastPos.y += Random.Range (-300,300);
				lastSpawnId ++;
				Transform newTransform = spawnNew (lastPos, lastSpawnId);
				if(newTransform != null){
					newTransform.GetComponent<TargettableObject>().highlighted = true;
				}
			}
		}


	}

	public void FixedUpdate() {

		
		
	}
}
