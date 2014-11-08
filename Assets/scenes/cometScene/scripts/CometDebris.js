#pragma strict


var theShip : Transform;
var fadeMaterial : Material;
var mainMaterial : Material;


private var alph:  float = 0.0f;
private var mat : Material;
private var fadeDone : boolean = false;

function Start () {
	theShip = GameObject.Find("TheShip").transform;
	
	rigidbody.angularVelocity = Random.onUnitSphere * 0.1f;
	alph = 0.0f;
	
	mat = GetComponentInChildren(Renderer).material;
	mat.color.a = alph;
	fadeDone = false;
	
}

function OnEnable(){
	GetComponentInChildren(Renderer).material = fadeMaterial;
	alph = 0.0f;
	mat = GetComponentInChildren(Renderer).material;
	mat.color.a = alph;
	transform.rotation = Random.rotation;
	fadeDone = false;
	GetComponent.<TargettableObject>().highlighted = false;
}

function OnCollisionEnter(c : Collision){
	
	if(c.gameObject.name == "TheShip" && c.relativeVelocity.magnitude > 11f){
		theShip.GetComponent.<ShipCore>().damageShip(Random.Range(10,15), "Hull cracked open by cometary fragments");
	}
}

function OnTriggerEnter(c : Collider){
	if(c.name == "ShipMover"){
		var trackable : TargettableObject = GetComponent.<TargettableObject>();
		if(trackable != null){
			trackable.highlighted = true;
		}
	}
}

function OnTriggerExit(c : Collider){
	if(c.name == "ShipMover"){
		var trackable : TargettableObject = GetComponent.<TargettableObject>();
		if(trackable != null){
			trackable.highlighted = false;
		}
	}
}

function FixedUpdate () {
	if(alph < 1.0f) {
		alph += 0.05f;
	} else {
		alph = 1.0f;
		fadeDone = true;
		GetComponentInChildren(Renderer).material = mainMaterial;
	}
	alph = Mathf.Clamp(alph, 0.0f, 1.0f);
	mat.color.a = alph;


	var dir : float = Vector3.Dot((transform.position - theShip.position).normalized, theShip.forward);
	if(dir < 0f){
		//its behind..
		//if((transform.position - theShip.position).magnitude > 50f){
		if(transform.position.z > 100f){
			//mark inactive and move out of harms way
			transform.position = Vector3(0,0,-10000);
			transform.rotation = Random.rotation;
			gameObject.SetActive(false);
		}
	} 

}