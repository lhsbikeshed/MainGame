#pragma strict
var pSystem : Transform;
var col : Collider;
var length : float = 250.0;
 var lastTime : float;

function Start () {

}

function blast(){
	//yield WaitForSeconds(2);
	pSystem.GetComponent.<ParticleSystem>().Stop();
	var direction : Vector3 = Random.onUnitSphere;
	var ray : Ray = Ray(transform.position + direction*length, -direction);
	
	Debug.DrawRay(transform.position + direction*length, -direction, Color(255,0,0));
    var hit : RaycastHit;
    col.Raycast (ray, hit, length*2);
    pSystem.transform.position = hit.point;
    pSystem.transform.LookAt(transform.position + direction*length);
   // pSystem.transform.rotation *= Quaternion.Euler(180,0,0);
    pSystem.GetComponent.<ParticleSystem>().Play();
}

function Update () {
	if(lastTime + 3.0f < Time.fixedTime){
		lastTime = Time.fixedTime;
		blast();
	}
		
	
}