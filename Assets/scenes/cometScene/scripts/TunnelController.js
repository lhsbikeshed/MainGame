#pragma strict

//waypoints are used to help recentre the ship in the tunnel. Also to decided where rocks etc can be spawned
var wayPoints : Vector3[];

var theShip : Transform;
var test : int = -1;
var testVector : Vector3;

var helpForceAmount : float = 5;

var crossBeamPrefab : Transform;
var moverPrefab : Transform;


public class TunnelController extends MonoBehaviour {

	function Start () {
		theShip = GameObject.Find("TheShip").transform;
		
		
		
		//spawn some cross beams
		var amount : int = Random.Range(14, 18);
		for(var i = 0; i < amount; i++){
		
			//pick a segment to spawn this in
			
			var segmentIndex = Random.Range(1, wayPoints.Length - 1);
			var delta = wayPoints[segmentIndex] - wayPoints[segmentIndex - 1];
			
			var pos = wayPoints[segmentIndex - 1] + delta.normalized * (delta.magnitude * Random.value);
			pos = transform.TransformPoint(pos);
					
			var t : Transform = Instantiate(crossBeamPrefab, pos, Quaternion.identity);
			var rot : Quaternion = Quaternion.FromToRotation( t.right, pos - transform.TransformPoint(wayPoints[segmentIndex])) ;
			
			t.rotation = rot;
			t.Rotate(Vector3.right, Random.Range(0, 360f));
			t.position += t.up * Random.Range(-20, 20);
			t.localScale *= Random.Range(1, 1.5f);
			
			//t.parent = transform;
			//t.Rotate(delta.normalized, Random.Range(0, 360f));
			
			
		}
		
	}
	
	function positionShipAtStart(){
		theShip.position = transform.TransformPoint(wayPoints[0]);
		var mt = Instantiate(moverPrefab, Vector3.zero, Quaternion.identity);
		
		mt.parent = theShip;
		mt.localPosition = Vector3.zero;
		mt.localRotation = Quaternion.Euler(0,0,0);
		moverPrefab = mt;
		theShip.rigidbody.constraints = RigidbodyConstraints.None;
		moverPrefab.GetComponent.<Light>().intensity = 0.0f;
	}

	function FixedUpdate () {
		doPositionHelp();	//slowly recentre the ship in the tunnel as a help toward more challenged pilots
		var intens = moverPrefab.GetComponent.<Light>().intensity;
		intens = Mathf.Lerp(intens, 1.51, Time.fixedDeltaTime);
		moverPrefab.GetComponent.<Light>().intensity = intens;
	}


	/* find the closest pair of waypoints, project the ships position onto the vector formed by them
	* Apply a small force toward this point to keep the ship centred in the tunnel
	*/
	function doPositionHelp(){

		//work out current closest waypoint pair
		var ind : int =  getNextWaypointIndex();
		test = ind;//used to highlight the gizmos
		
		//project force vector onto pair
		if(ind >= 1 && ind < wayPoints.Length -1){
			var forceVector : Vector3 = ClosestPointOnLine(wayPoints[ind-1], wayPoints[ind], transform.InverseTransformPoint(theShip.position));
			forceVector = (transform.TransformPoint(forceVector) - theShip.position).normalized;
			testVector = forceVector * 10f;
			theShip.rigidbody.AddForce(forceVector.normalized * helpForceAmount, ForceMode.Acceleration);
			
		}
			
		
		//zero any x component to prevent the ship being pulled into the tunnel

	}

	function ClosestPointOnLine(vA : Vector3, vB : Vector3, vPoint : Vector3)
	{
	    var vVector1 = vPoint - vA;
	    var vVector2 = (vB - vA).normalized;
	 
	    var d = Vector3.Distance(vA, vB);
	    var t = Vector3.Dot(vVector2, vVector1);
	 
	    if (t <= 0)
	        return vA;
	 
	    if (t >= d)
	        return vB;
	 
	    var vVector3 = vVector2 * t;
	 
	    var vClosestPoint = vA + vVector3;
	 
	    return vClosestPoint;
	}

	function getNextWaypointIndex() : int {
		for(var i = wayPoints.Length - 1; i >= 0; i--){	
			if( transform.TransformPoint(wayPoints[i]).z > theShip.position.z ){
				return i + 1;
			}
		}
		return -1;
	}

	function OnDrawGizmos(){
		for(var i = wayPoints.Length - 1; i >= 1; i--){
			var p1 = transform.TransformPoint(wayPoints[i]);
			var p2 = transform.TransformPoint(wayPoints[i-1]);
			
			if(test == i){
				Gizmos.color = Color(1,1,1);
				if(theShip != null){
					Gizmos.DrawLine(theShip.position, theShip.position + testVector);
				}
			} else {
				Gizmos.color = Color(1,0,0);
			}
			Gizmos.DrawLine(p1,p2);
			
			Gizmos.DrawSphere(p1,15);
			
			
		}
		
			
	}
}