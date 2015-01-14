using UnityEngine;
using System;
using System.Collections;
using UnityOSC;

[System.Serializable]
public class IncomingMissile: TargettableObject {
	
	/* represents an incoming missile
	 * if identified
	 * move inward toward ship with a given vel
	 * generate a unique 4 digit code for scanning
	 * 
	 */
	
	public Transform targetTransform; //the ship were tracking
	public float velocity;
	
	public float maxDistance = 2500.0f;
	
	public float damping = 2.2f;
	public float lifeTime = 240.0f;
	
	public bool isDummy = false; //dummies just die but dont cause damage to ship
	
	float randVel;
	
	public bool testCamera = false;
	public bool camAttached = false;
	
	public Transform trailPrefab;
	
	
	public AudioClip[] sounds;
	ParticleSystem parts;
	
	int randomSound = 0;
	
	public override void Start() {
		base.Start();
		
		//theShip = GameObject.Find("TheShip").transform;
		randomSound = UnityEngine.Random.Range(0,sounds.Length);
		parts = GetComponentInChildren<ParticleSystem>();	
		scanCode = Mathf.FloorToInt((float)UnityEngine.Random.Range(0, 10000));
		transform.LookAt(targetTransform.transform.position);
		randVel = UnityEngine.Random.Range(0.0f,15.0f);
		statNames = new String[2];
		statValues = new float[2];
		statNames[0] = "health";
		statNames[1] = "fuel";
		objectName = "Missile";
		
		if(UnityEngine.Random.Range(0.0f, 100.0f) < 15.0f){
			attachCam();
		}
		Transform t = (UnityEngine.Transform)Instantiate(trailPrefab, transform.position, transform.rotation);
		t.parent = transform;
		
		
	}
	
	public override void Update() {
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
			Quaternion rotation = Quaternion.LookRotation(targetTransform.position - transform.position);
	
	        transform.rotation = Quaternion.Slerp(transform.rotation, rotation, Time.deltaTime * damping);
	        lifeTime -= Time.deltaTime;
	        if(lifeTime <= 0){
	        	StartCoroutine(explode());
	        }
			
		}
		//if too far away from ship just explode
		float dist = Mathf.Abs( (targetTransform.position - transform.position).magnitude) ;
		if( dist > maxDistance ){
			StartCoroutine(explode());
		} 
		
		
	
	}
	
	/* find dyncam and attach it to ourselves */
	public void attachCam(){
		GameObject cam = GameObject.Find("DynamicCamera");
		if(cam == null){
			return;
		}
		camAttached = true;
		GameObject g = new GameObject();
		g.transform.parent = transform;
		g.transform.localPosition = new Vector3(0.0f, 4.5f, -35.0f);
		g.transform.localRotation = Quaternion.identity;
		CameraPoint cp = g.AddComponent<CameraPoint>();
		cp.followShip = true;
		cam.GetComponent<DynamicCamera>().lookAtShip = true;
		cam.GetComponent<DynamicCamera>().setLocation(g.transform);
		
		
	}
	
	
	//strength is whatever the 
	public override void GetShot(float damage){
	
		
		
		health -=damage;
		if(health <= 0){
			targetted = false;
			StartCoroutine(explode());
		}
	}
	
	public void OnTriggerEnter(Collider c){
		if(c.collider.name == "TheShip" ){
			if(!isDummy){
				StartCoroutine(c.gameObject.GetComponent<ShipCore>().damageShip((float)UnityEngine.Random.Range(8,12), "Exploded by missile"));
			}
			c.rigidbody.rigidbody.AddExplosionForce(200.0f, transform.position, 100.0f,0.0f,ForceMode.Impulse);
			StartCoroutine(explode());
		}
		
	}
	
	
	
	public override IEnumerator explode(){
		if(! exploding){
			exploding = true;
			trackingPlayer = false;
			//trigger particle effects
			if(parts == null){
				parts = GetComponentInChildren<ParticleSystem>();
			}
			parts.Play();
			AudioSource.PlayClipAtPoint(sounds[randomSound], transform.position);
			yield return new WaitForSeconds(6.0f);
			if(camAttached){
				camAttached = false;
				GameObject.Find("DynamicCamera").GetComponent<DynamicCamera>().resetToShip();
			}
			OSCMessage missMsg = new OSCMessage("/scene/warzone/missileexplode");
				
				
			OSCHandler.Instance.SendMessageToAll(missMsg);
			Destroy(gameObject);
		}
	}
}



