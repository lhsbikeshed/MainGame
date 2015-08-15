using UnityEngine;
using System;
using System.Collections.Generic;


/*
 * basic ship behaviour:
 * fly to the npc target object
 * one time:
 * 	if damage < 0.2f then stop the ship
 *  call the players and play the "we've taken damage and cant move" clip
 *  stop the ship for some time
 *  repair the ship and carry on
 * 
 */
public class WarzoneNPCShip : MonoBehaviour{

	//where are we flying to?
	public Transform moveTarget;


	//motion params
	public float rotationDamping = 1.0f;
	public float maxVelocity = 15.0f;
	public float lookAheadDistance = 40f;

	//used or force calcs
	float velocity = 0.0f;

	GeneralTrackableTarget targetData;

	public bool engineRunning = true;
	public bool repairing = false;
	public bool shipOffline = false;
	float repairTime = 0.0f;

	bool jumping = false;

	float nextTargetTime = 0.0f;

	//swerving to avoid debris
	float swerveTime = 0.0f;
	Quaternion swerveRotation;
	
	//refs
	public ParticleSystem engineParticles;
	public Light engineLight;


	public bool test = false;

	public float shipOfflineCounter = 0.0f;
	public bool shipOfflineDone = false;
	bool exploding = false;




	
	public void Start() {
		targetData = GetComponent<GeneralTrackableTarget>();
		targetData.targetDestroyed += blownUp;
		targetData.onTakeDamage += takenDamage;
	}

	
	public void startJump(){
		if(!jumping){
			GameObject.Find("JumpEffects").GetComponent<ParticleSystem>().enableEmission = true;
			jumping = true;
		}
	}

	public void setEngineState(bool state){
		if(engineRunning != state){

			foreach(BlinkenFlareBehaviour bl in GetComponentsInChildren<BlinkenFlareBehaviour>()){
				bl.enabled = state;
			}
			if(!state){
				GetComponent<AudioSource>().Stop();
			} else {
				GetComponent<AudioSource>().Play();
			}
			engineRunning = state;
		}
	}

	//delegated from trackable target component
	void blownUp(){
		exploding = true;
		engineRunning = false;
		shipOffline = true;
		//for now just explode and die in 6 seconds time
		//TODO:
		//make this audio call the players and explode in time with a goodbye message
		OSCSystem._instance.incomingAudioClipCall("npcdead");
		StartCoroutine(explosionEffects());
	}

	System.Collections.IEnumerator explosionEffects(){
		yield return new WaitForSeconds(2.5f);
//		GetComponentInChildren<BigExplosionBehaviour>().Start();
		transform.Find("explosion").GetComponent<ParticleSystem>().Play();
		foreach(Transform t in transform){
			MeshRenderer mr = t.GetComponent<MeshRenderer>();
			if(mr != null){
				mr.enabled=  false;
			}
		}
		yield return new WaitForSeconds(1.5f);
		Destroy (gameObject);

	}

	void takenDamage(DamageTypes type, float dam){
		//if the ship hasnt done the "help" sequence then theres a 15% chance this hit will knock it out
		// unless its exploding or the health is too low
		if(	shipOfflineDone == false && 
		   	exploding == false && 
		   	UnityEngine.Random.Range (0,100) < 15 && 
		   	targetData.health > 10.0f)	 {

			//10% chance that this fucks the ship and makes it halt for repairs
			shipOfflineDone = true;
			shipOffline = true;

			shipOfflineCounter = UnityEngine.Random.Range (10f,15f);
			OSCSystem._instance.incomingAudioClipCall("help");

		}
	}

	
	public void Update() {
		//	engineParticles.emissionRate = 50 + (velocity / maxVelocity) * 350;
		//	engineLight.intensity = 1 + (velocity / maxVelocity) * 3.5f;
		if(test){
			test = false;
			GetComponent<GeneralTrackableTarget>().ApplyDamage(DamageTypes.DAMAGE_COLLISION,100);
		}
	}
	
	public void FixedUpdate(){

		if(shipOffline){
			shipOfflineCounter -= Time.fixedDeltaTime;
			if(shipOfflineCounter <= 0.0f){
				shipOffline = false;
				//play a THANKS message
				OSCSystem._instance.incomingAudioClipCall("npcthanks");



			}

		} else {
			//if the ship is damaged randomly turn repair on and off
			if(UnityEngine.Random.Range(0,100) < 10 && repairing == false && targetData.health < 0.3f){
				repairTime = UnityEngine.Random.Range(0.1f, 2f);
				repairing = true;
			}
			if(repairing){
				float h = targetData.health;
				h+= 0.05f * Time.fixedDeltaTime;
				h = Mathf.Clamp(h, 0.0f, 1.0f);

				targetData.health = h;
				repairTime -= Time.fixedDeltaTime;
				if(repairTime <= 0.0f){
					repairing = false;
					repairTime = 0.0f;
				}

			}

			if(engineRunning){
					
				//var velocity : float = moveTarget.newVelocity;
				float dist = Mathf.Abs( (moveTarget.transform.position - transform.position).magnitude) ;
				//far enough away to fly toward it
				Quaternion newRotation;

				if(dist > 5){
					velocity = Mathf.Clamp(dist,0.0f,maxVelocity);
					float angmod = Vector3.Dot((moveTarget.transform.position- transform.position ).normalized, transform.TransformDirection(Vector3.forward));
					if(angmod > 0){
						velocity *= angmod;
					}
					if(Math.Abs(1f - angmod) < 0.1f && dist > 100){
						velocity *= 5f;
					}

					newRotation = Quaternion.LookRotation(moveTarget.transform.position - transform.position, moveTarget.transform.TransformDirection(Vector3.up));

				} else {
					//stop the ship if its close enough
					velocity = 0.0f;
					newRotation = transform.rotation;
				}

				//trace ahead and see if we impact anything soon
				RaycastHit rHit;
				bool hit = Physics.Raycast(transform.position,transform.forward, out rHit, lookAheadDistance);
				if(hit){
					//were going to collide, swerve!
					if(swerveTime <= 0.0f){
						swerveTime = 2f;
						swerveRotation = Quaternion.Euler(UnityEngine.Random.onUnitSphere * 20f);
						swerveRotation.z = 0f;
						Debug.Log ("NPC EVASIVE ACTION");

					}
				}

				if(swerveTime > 0.0f){
					swerveTime -= Time.fixedDeltaTime;
					newRotation *= swerveRotation;
				} else {
					swerveTime = 0.0f;
				}

				GetComponent<Rigidbody>().AddRelativeForce(Vector3.forward * velocity, ForceMode.Acceleration);
				float v = GetComponent<Rigidbody>().velocity.magnitude;
				float dampAmount = (v / 200f);
				dampAmount = 1.0f - Mathf.Clamp(dampAmount, 0f, 1f);
				dampAmount = Time.fixedDeltaTime * rotationDamping * dampAmount;

				//transform.rotation = Quaternion.Slerp(transform.rotation, newRotation, dampAmount);
				transform.rotation = Quaternion.RotateTowards(transform.rotation, newRotation, rotationDamping);

				doTargetSelection();
			}
		}

	}

	void doTargetSelection(){
		//look for a missile in range and fire at it
		nextTargetTime -= Time.fixedDeltaTime;
		if(nextTargetTime < 0.0f){
			nextTargetTime = UnityEngine.Random.Range (5f, 7f);	//select and shoot at a new target every 3 - 6 seconds

			//oh god finding a target
			Collider[] colliders = Physics.OverlapSphere(transform.position, 800f);
			float minDist = 10000f;
			Transform bestTarget = null;
//			Debug.Log ("ship gun selectig from " + colliders.Length);
			foreach(Collider c in colliders){
				if(c.gameObject.name.Contains("Missile")){
					//its a missile and ITS COMING RIGHT FOR US
					float tDist = (transform.position - c.transform.position).magnitude;
					if(tDist < minDist){
						bestTarget = c.transform;
						minDist = tDist;
					}
				}
			}
			if(bestTarget != null){
			//	Debug.Log ("shooting at target");
				GetComponentInChildren<ShipsLaser>().fireAtTarget(bestTarget);
			}

		}
	}


	public void OnCollisionStart(Collision c){
		if(c.transform.name.Contains("debris")){
			debrisbehaviour d = c.transform.GetComponent<debrisbehaviour>();
			if(d.hitShip == false){	
				d.hitShip = true;
				targetData.ApplyDamage(DamageTypes.DAMAGE_COLLISION, UnityEngine.Random.Range (1,5) /15f);

			}
		}
	}

	void OnDrawGizmos(){
		Gizmos.DrawLine(transform.position, transform.position + transform.TransformDirection(Vector3.forward * lookAheadDistance));

	}

}
