#pragma strict

class GeneralTrackableTarget extends TargettableObject {
	
	var sounds : AudioClip[];
	private var parts : ParticleSystem;
	
	private var randomSound : int = 0;
	
	function Start () {
		super.Start();
		//theShip = GameObject.Find("TheShip").transform;
		randomSound = Random.Range(0,sounds.Length);
		parts = GetComponentInChildren.<ParticleSystem>();	
		scanCode = Mathf.FloorToInt(Random.Range(0, 10000));
		
//		if(statNames == null || statValues == null){
//			statNames = new String[2];
//			statValues = new float[2];
//			
//		}
		statNames[0] = "health";
		
		
		GameObject.Find("TheShip").GetComponent.<TargettingSystem>().addObject(this);
		
	}
	
	function Update () {
	
		statValues[0] = health;
		
		
	}
	
	//strength is whatever the 
	function GetShot(damage : float){
		if(damageable){
			health -=damage;
			if(health <= 0){
				targetted = false;
				explode();
			}
		}
	}
	
	function explode(){
		if(! exploding){
			exploding = true;
			
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


