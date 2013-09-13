#pragma strict


var theShip : Transform;
var skyboxCamera : Transform;
var fireballPrefab : Transform;

var atmosphereStart : float;


private var inAtmosphere : boolean;

function Start () {

	theShip = GameObject.Find("TheShip").transform;
	skyboxCamera = GameObject.Find("SkyboxCamera").transform; 

}

function OnDrawGizmosSelected () {
        // Display the explosion radius when selected
    Gizmos.color = Color.white;
    Gizmos.DrawWireSphere (transform.position, atmosphereStart);
   
}

function FixedUpdate () {

}

function OnTriggerStay(c : Collider){
	if(c.transform == skyboxCamera){
		//work out distance
		if(Vector3.Distance(skyboxCamera.position, transform.position) < atmosphereStart) {
			if(inAtmosphere == false){
				inAtmosphere = true;
				Debug.Log("In atmosphere of " + gameObject.name);
			}
		} else { 
			inAtmosphere = false;
		}
	}

}

function OnTriggerEnter(c: Collider){
	//warn the ship that they have entered gravity well
	Debug.Log("Entered well of: " + gameObject.name );
	
}