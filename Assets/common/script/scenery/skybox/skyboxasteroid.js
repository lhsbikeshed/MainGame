#pragma strict


//asteroid behaviour for skybox asteroids
public class skyboxasteroid extends DynamicFieldObjectBehaviour{
	
	private var randomRotationSpeed: Quaternion;
	var alphaLevel : float; 
	
	private var meshRenderer : Renderer;
	
	function Start () {
		randomRotationSpeed = Quaternion.Euler(Random.value * 0.05, Random.value * 0.05, Random.value * 0.05);
		
		meshRenderer = gameObject.GetComponentsInChildren(Renderer)[0];
		
	}
	/*
	function OnCollisionEnter(c : Collision){
		if (c.gameObject.name == "TheShip"){
		
			//rigidbody.isKinematic = false;
			
		}
	
		
	}*/
	function OnTriggerEnter(other : Collider){
		Debug.Log(other.name);
	}
	
	function resetTo( newpos : Vector3){
		//rigidbody.isKinematic = true;
		alphaLevel = 0.0f;
		meshRenderer.material.color =  Color(1.0,1.0,1.0,alphaLevel);
		transform.position = newpos;
		
	}
	
	function Update () {
		transform.rotation *= randomRotationSpeed;
		meshRenderer.material.color =  Color(1.0,1.0,1.0,alphaLevel);
		if(alphaLevel < 1.0f){
			alphaLevel += 0.02f;
		} else {
			alphaLevel = 1.0f;
		}
		
	
	}
}