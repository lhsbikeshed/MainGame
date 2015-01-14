using UnityEngine;
using System;

[System.Serializable]
public class TunnelController: MonoBehaviour {

//waypoints are used to help recentre the ship in the tunnel. Also to decided where rocks etc can be spawned
public Vector3[] wayPoints;

public Transform theShip;
public int test = -1;
public Vector3 testVector;

public float helpForceAmount = 5.0f;

public Transform crossBeamPrefab;
public Transform moverPrefab;

public Vector3 aimVector;

public void Start() {
		theShip = GameObject.Find("TheShip").transform;
		
		
		
		//spawn some cross beams
		int amount = UnityEngine.Random.Range(14, 18);
		for(int i = 0; i < amount; i++){
		
			//pick a segment to spawn this in
			
			int segmentIndex = UnityEngine.Random.Range(1, wayPoints.Length - 1);
			Vector3 delta = wayPoints[segmentIndex] - wayPoints[segmentIndex - 1];
			
			Vector3 pos = wayPoints[segmentIndex - 1] + delta.normalized * (delta.magnitude * UnityEngine.Random.value);
			pos = transform.TransformPoint(pos);
					
			Transform t = (UnityEngine.Transform)Instantiate(crossBeamPrefab, pos, Quaternion.identity);
			Quaternion rot = Quaternion.FromToRotation( t.right, pos - transform.TransformPoint(wayPoints[segmentIndex])) ;
			
			t.rotation = rot;
			t.Rotate(Vector3.right, UnityEngine.Random.Range(0.0f, 360f));
			t.position += t.up * UnityEngine.Random.Range(-20, 20);
			t.localScale *= UnityEngine.Random.Range(1.0f, 1.5f);
			
			//t.parent = transform;
			//t.Rotate(delta.normalized, Random.Range(0, 360f));
			
			
		}
		
	}
	
	public void OnTriggerEnter(Collider col){
		if(col.gameObject.name == "TheShip"){
			UnityEngine.Debug.Log ("exitted tunnel");
			GameObject.Find("SceneScripts").GetComponent<CometScene>().tunnelComplete();
			moverPrefab.parent = null;
		}
	}
	
	public void positionShipAtStart(){
		theShip.position = transform.TransformPoint(wayPoints[0]);
		UnityEngine.Transform mt = (UnityEngine.Transform)Instantiate(moverPrefab, Vector3.zero, Quaternion.identity);
		
		mt.parent = theShip;
		mt.localPosition = Vector3.zero;
		mt.localRotation = Quaternion.Euler(0.0f,0.0f,0.0f);
		moverPrefab = mt;
		theShip.rigidbody.constraints = RigidbodyConstraints.None;
		theShip.rigidbody.velocity = theShip.forward * 100f;
		moverPrefab.GetComponent<Light>().intensity = 0.0f;
		
	}

	public void FixedUpdate() {
		doPositionHelp();	//slowly recentre the ship in the tunnel as a help toward more challenged pilots
		float intens = moverPrefab.GetComponent<Light>().intensity;
		intens = Mathf.Lerp(intens, 1.51f, Time.fixedDeltaTime);
		moverPrefab.GetComponent<Light>().intensity = intens;
	}


	/* find the closest pair of waypoints, project the ships position onto the vector formed by them
	* Apply a small force toward this point to keep the ship centred in the tunnel
	*/
	public void doPositionHelp(){

		//work out current closest waypoint pair
		int ind =  getNextWaypointIndex();
		test = ind;//used to highlight the gizmos
		
		//project force vector onto pair
		if(ind >= 1 && ind < wayPoints.Length -1){
			Vector3 forceVector = ClosestPointOnLine(wayPoints[ind-1], wayPoints[ind], transform.InverseTransformPoint(theShip.position));
			forceVector = (transform.TransformPoint(forceVector) - theShip.position).normalized;
			testVector = forceVector * 10f;
			theShip.rigidbody.AddForce(forceVector.normalized * helpForceAmount, ForceMode.Acceleration);
			
			//calculate aim vector
			aimVector = (wayPoints[ind-1] - wayPoints[ind]).normalized;
			
		}
			
		
		//zero any x component to prevent the ship being pulled into the tunnel

	}

	public Vector3 ClosestPointOnLine(Vector3 vA,Vector3 vB,Vector3 vPoint)
	{
	    Vector3 vVector1 = vPoint - vA;
	    Vector3 vVector2 = (vB - vA).normalized;
	 
	    float d = Vector3.Distance(vA, vB);
	    float t = Vector3.Dot(vVector2, vVector1);
	 
	    if (t <= 0)
	        return vA;
	 
	    if (t >= d)
	        return vB;
	 
	    Vector3 vVector3 = vVector2 * t;
	 
	    Vector3 vClosestPoint = vA + vVector3;
	 
	    return vClosestPoint;
	}

	public int getNextWaypointIndex() {
		for(int i = wayPoints.Length - 1; i >= 0; i--){	
			if( transform.TransformPoint(wayPoints[i]).z > theShip.position.z ){
				return i + 1;
			}
		}
		return -1;
	}

	public void OnDrawGizmos(){
		for(int i = wayPoints.Length - 1; i >= 1; i--){
			Vector3 p1 = transform.TransformPoint(wayPoints[i]);
			Vector3 p2 = transform.TransformPoint(wayPoints[i-1]);
			
			if(test == i){
				Gizmos.color = new Color(1.0f,1.0f,1.0f);
				if(theShip != null){
					Gizmos.DrawLine(theShip.position, theShip.position + testVector);
				}
			} else {
				Gizmos.color = new Color(1.0f,0.0f,0.0f);
			}
			Gizmos.DrawLine(p1,p2);
			
			Gizmos.DrawSphere(p1,15.0f);
			
			
		}			
	}
}
