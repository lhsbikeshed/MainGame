#pragma strict


public class SpaceMine extends DynamicFieldObjectBehaviour {

	var isDead : boolean = false;
	
	var sounds : AudioClip[];
	private var parts : ParticleSystem;
	private var randomSound : int = 0;
	private var exploding = false;
		
	function Start () {
		randomSound = Random.Range(0,sounds.Length);
		parts = GetComponentInChildren.<ParticleSystem>();	
	}
	
	function Update () {
	
	}
	function resetTo( newpos : Vector3){
		transform.position = newpos;
		isDead = false;
		GetComponentInChildren.<MeshRenderer>().enabled = true;
		
		
	}
	
	function OnTriggerEnter(c : Collider){
		
		if(c.name == "TheShip" && isDead == false){
			Debug.Log("BOOM!");
			c.gameObject.GetComponent.<ship>().damageShip(Random.Range(8,12), "Blown up by a space mine");
			c.rigidbody.rigidbody.AddExplosionForce(500, transform.position, 100,0,ForceMode.Impulse);
			explode();
			GetComponentInChildren.<MeshRenderer>().enabled = false;
		}
	}
	
	function explode(){
		if(! exploding){
			
			exploding = true;
			isDead = true;
			//trigger particle effects
			if(parts == null){
				parts = GetComponentInChildren.<ParticleSystem>();
			}
			parts.Play();
			AudioSource.PlayClipAtPoint(sounds[randomSound], transform.position);
			yield WaitForSeconds(6);
			Destroy(gameObject);
		}
	}
	
}