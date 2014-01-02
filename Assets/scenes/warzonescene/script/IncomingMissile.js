#pragma strict

class IncomingMissile extends TargettableObject {
	
	/* represents an incoming missile
	 * if identified
	 * move inward toward ship with a given vel
	 * generate a unique 4 digit code for scanning
	 * 
	 */
	
	var targetTransform : Transform; //the ship were tracking
	var velocity : float;
	
	var maxDistance : float = 2500;
	
	var damping : float = 2.2f;
	var lifeTime : float = 240;
	
	var isDummy : boolean = false; //dummies just die but dont cause damage to ship
	
	private var randVel : float;
	
	var testCamera : boolean = false;
	var camAttached : boolean = false;
	
	
	var sounds : AudioClip[];
	private var parts : ParticleSystem;
	
	private var randomSound : int = 0;
	
	function Start () {
		super.Start();
		
		//theShip = GameObject.Find("TheShip").transform;
		randomSound = Random.Range(0,sounds.Length);
		parts = GetComponentInChildren.<ParticleSystem>();	
		scanCode = Mathf.FloorToInt(Random.Range(0, 10000));
		transform.LookAt(targetTransform.transform.position);
		randVel = Random.Range(0,15.0f);
		statNames = new String[2];
		statValues = new float[2];
		statNames[0] = "health";
		statNames[1] = "fuel";
		objectName = "Missile";
		
		if(Random.Range(0.0f, 100.0f) < 15.0f){
			attachCam();
		}
		
	}
	
	function Update () {
		if(testCamera){
			testCamera = false;
			attachCam();
		}
		//transform.position -= targetTransform.transform.position;
		
		if(trackingPlayer){
			statValues[0] = health;
			statValues[1] = lifeTime;
			//scale velocity based on how fast ship is going, otherwise its too damned hard
			velocity = 40 + (targetTransform.rigidbody.velocity.magnitude * 0.8f) + randVel;
			velocity *= Mathf.Abs(Vector3.Dot((transform.position - targetTransform.position).normalized, transform.TransformDirection(Vector3.forward)));
			
			transform.Translate(Vector3.forward * velocity * Time.deltaTime);
			var rotation = Quaternion.LookRotation(targetTransform.position - transform.position);
	
	        transform.rotation = Quaternion.Slerp(transform.rotation, rotation, Time.deltaTime * damping);
	        lifeTime -= Time.deltaTime;
	        if(lifeTime <= 0){
	        	explode();
	        }
			
		}
		//if too far away from ship just explode
		var dist : float = Mathf.Abs( (targetTransform.position - transform.position).magnitude) ;
		if( dist > maxDistance ){
			explode();
		} 
		
		
	
	}
	
	/* find dyncam and attach it to ourselves */
	function attachCam(){
		var cam : GameObject = GameObject.Find("DynamicCamera");
		if(!cam){
			return;
		}
		camAttached = true;
		var g = new GameObject();
		g.transform.parent = transform;
		g.transform.localPosition = Vector3(0.0f, 4.5f, -15.0f);
		g.transform.localRotation = Quaternion.identity;
		var cp : CameraPoint = g.AddComponent("CameraPoint");
		cp.followShip = true;
		cam.GetComponent.<DynamicCamera>().lookAtShip = true;
		cam.GetComponent.<DynamicCamera>().setLocation(g.transform);
		
		
	}
	
	
	//strength is whatever the 
	function GetShot(damage : float){
	
		
		
		health -=damage;
		if(health <= 0){
			targetted = false;
			explode();
		}
	}
	
	function OnTriggerEnter(c : Collider){
		if(c.collider.name == "TheShip" ){
			if(!isDummy){
				c.gameObject.GetComponent.<ship>().damageShip(Random.Range(8,12), "Exploded by missile");
			}
			c.rigidbody.rigidbody.AddExplosionForce(500, transform.position, 100,0,ForceMode.Impulse);
			explode();
		}
		
	}
	
	
	
	function explode(){
		if(! exploding){
			exploding = true;
			trackingPlayer = false;
			//trigger particle effects
			if(parts == null){
				parts = GetComponentInChildren.<ParticleSystem>();
			}
			parts.Play();
			AudioSource.PlayClipAtPoint(sounds[randomSound], transform.position);
			yield WaitForSeconds(6);
			if(camAttached){
				camAttached = false;
				GameObject.Find("DynamicCamera").GetComponent.<DynamicCamera>().resetToShip();
			}
			Destroy(gameObject);
		}
	}
}


