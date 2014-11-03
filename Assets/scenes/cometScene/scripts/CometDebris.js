#pragma strict


var theShip : Transform;

private var alph:  float = 0.0f;
private var mat : Material;

function Start () {
	theShip = GameObject.Find("TheShip").transform;
	
	rigidbody.angularVelocity = Random.onUnitSphere * 0.1f;
	alph = 0.0f;
	mat = GetComponentInChildren(Renderer).material;
	mat.color.a = alph;
	
}

function OnEnable(){
	alph = 0.0f;
	mat = GetComponentInChildren(Renderer).material;
	mat.color.a = alph;
	
}

function FixedUpdate () {
	if(alph < 1.0f) alph += 0.1f;
	alph = Mathf.Clamp(alph, 0.0f, 1.0f);
	mat.color.a = alph;


	var dir : float = Vector3.Dot((transform.position - theShip.position).normalized, theShip.forward);
	if(dir < 0f){
		//its behind..
		if((transform.position - theShip.position).magnitude > 50f){
			//mark inactive and move out of harms way
			transform.position = Vector3(10000,10000,10000);
			gameObject.SetActive(false);
		}
	} 

}