using UnityEngine;
using System;
using System.Collections;
using UnityOSC;

[System.Serializable]
public class EnemyShipBehaviour: TargettableObject {
	
	public Transform theShip;
	public float rotateSpeed  = 0.1f;
	
	public bool testing = false;
	public bool targetTest = false;
	public float ang = 10.0f;
	public float nextShotTime = 8.0f;
	public bool isActive = false;
	public float difficulty = 1.0f;
	public float scanTime = 15.0f;
	public float reactorDetectTime = 5.0f;
	
	LaserTurretBehaviour[] turrets;
	DynamicMapObject dynObj;
	
	ParticleSystem warpEffects;
	Transform scannerBeam;
	Quaternion scannerRotation;
	float scannerAnimationTime = 1.0f;
	Renderer[] scannerMaterials ;
	
	public float[] subsystemHealth = new float[3];
	
	public enum AIState {  IDLE,		//do nothing at all, just wait for a jump signal
					JUMPING,	//jumping in
					SCANNING,	//scanning for player
					WAITING, 	//waiting
					HUNTING, 	//seeking out the ship
					ORBITING,	//orbit around 
					AIMING,		//aiming at the target to shoot it	
					RAMMING,		//weapons down, intentionally ram the players	
					HULL_DEATH	
					};	
					
	public enum WeaponState { 	DISABLED, 	//wont target or shoot
						OFF, 		//targetting but not shooting
						CHARGING, 	//dur
						FIRING, 	//pewpew
						COOLDOWN };	//wait for cooldowntime below
	
	public WeaponState currentWeaponState = WeaponState.OFF;				
	public AIState currentAIState = AIState.WAITING;
	
	public float weaponCooldown = 5.0f;
	public float missileCooldown = 5.0f;
	public float orbitRange = 200.0f;
	public float throttle = 0.0f;
	
	public int targettedSystem = 1;		//hull gets targetted by default
	
	
	//sound effects
	public AudioClip scanPlayerEffect ;
	bool scanSoundPlaying = false;
	public AudioClip explosionSound;
	
	Vector3 targetPoint;
	float orbitTime;		//how long have we been orbiting our target?
	Transform weaponsTarget;
	
	
	public override void Start() {
		base.Start();
		theShip = GameObject.Find("TheShip").transform;

		turrets = GetComponentsInChildren<LaserTurretBehaviour>();
		dynObj = GetComponent<DynamicMapObject>();

		
		warpEffects = transform.Find("warpeffects").GetComponent<ParticleSystem>();
		scannerBeam = transform.Find("ScannerBeam");
		scannerMaterials = scannerBeam.GetComponentsInChildren<Renderer>();
		scannerBeam.gameObject.SetActiveRecursively(false);
		
		//configure subsystem stats
		subsystemHealth = new float[3];
		subsystemHealth[0] = 1.0f; setStatFromName("weaponHealth", 	subsystemHealth[0]);
		subsystemHealth[1] = 1.0f; setStatFromName("hullHealth", 	subsystemHealth[1]);
		subsystemHealth[2] = 1.0f; setStatFromName("engineHealth", 	subsystemHealth[2]);
		 
		//turn off other radar flags
		setStatFromName("scanning", 0.0f);
		setStatFromName("firing", 0.0f);
		setStatFromName("chargingWeapons", 0.0f);
		
		//hide from radar
		visibleAtClient = false;
	}
	
	
	
	public void FixedUpdate(){
		if(testing){
			testing = false;
			JumpIn();
		}
		
		if(targetTest){
			targetTest = false;
			StartCoroutine(explode());
		}
		
		//stats
		bool firing = false;
		foreach(LaserTurretBehaviour t in turrets){
			if((int)t.state == 2){
				firing = true;
				break;
			
			}
			
		}
		setStatFromName("firing", firing == true ? 1.0f : 0.0f);
		setStatFromName("health", subsystemHealth[1]);
		//AI
	
		Vector3 direction = theShip.position - transform.position;
		float range = direction.magnitude;
		
		float angDiff = Vector3.Dot(transform.TransformDirection(Vector3.forward), direction.normalized);
		
		Vector3 angledUp = Vector3.zero;
        if(currentAIState == AIState.WAITING){
			//in waiting state just track the ship to scare them
			targetPoint = theShip.transform.position;
			
			Quaternion q = Quaternion.LookRotation(direction);
			transform.rotation = Quaternion.Slerp(transform.rotation, q, rotateSpeed);
			throttle = 0.0f;
		} else if (currentAIState == AIState.HUNTING){
			//fly toward the players until they are in range
			targetPoint = theShip.transform.position;
			angledUp = transform.TransformDirection(Vector3.up);
			angledUp = Quaternion.Euler(0.0f,0.0f,20.0f * angDiff) * angledUp;
			
			Quaternion q2 = Quaternion.LookRotation(direction, angledUp);
			transform.rotation = Quaternion.Slerp(transform.rotation, q2, rotateSpeed);
			
			throttle = 4.0f * Mathf.Abs(angDiff);
			
			if(range <= orbitRange){
				currentAIState = AIState.ORBITING;
			}
		} else if (currentAIState == AIState.ORBITING){
			//get direction from target to ourselves
			orbitTime += Time.fixedDeltaTime;
			
			//take this direction and rotate it 10 degrees around on a plane formed by direction and our forward axis
			Vector3 ourFwd = transform.TransformDirection(Vector3.forward);
			Vector3 rotZ = Vector3.Cross(direction.normalized, ourFwd);
			Quaternion axisAngle = Quaternion.AngleAxis(ang, rotZ);
			
			targetPoint = axisAngle * (theShip.position + direction.normalized * (orbitRange * 0.9f));
			
			Vector3 angledUp2 = transform.TransformDirection(Vector3.up);
			angledUp2 = Quaternion.Euler(0.0f,0.0f,20.0f * -angDiff) * angledUp;
			
			Quaternion q3 = Quaternion.LookRotation(targetPoint - transform.position, angledUp2);
			transform.rotation = Quaternion.Slerp(transform.rotation, q3, rotateSpeed);
			throttle = 5.0f;
					
			if(range > orbitRange){
				currentAIState = AIState.HUNTING;
				orbitTime = 0.0f;
			}
			if(orbitTime > 8.0f - difficulty * 4.0f){
				currentAIState = AIState.AIMING;
			}
		} else if (currentAIState == AIState.AIMING){
			
			targetPoint = theShip.transform.position;
			setStatFromName("chargingWeapons", 1.0f);
			
			
			Quaternion q4 = Quaternion.LookRotation(direction);
			transform.rotation = Quaternion.Slerp(transform.rotation, q4, rotateSpeed);
			//rigidbody.AddForce(transform.TransformDirection(Vector3.up) * -15, ForceMode.Acceleration);
			
			throttle = 0.0f;
			
			if(angDiff > 0.95f && weaponsTarget != null){
				bool miss = false;
				if(UnityEngine.Random.Range(0.0f, 1.0f) > difficulty){
					miss = true;
				}
				foreach(LaserTurretBehaviour t in turrets){
					t.deliberatelyMiss = miss;
					t.penetrating = miss;
					t.startFiring();
					
				}
				
				if( !miss ){
					float diffMod = difficulty * 5.0f;
					StartCoroutine(theShip.GetComponent<ShipCore>().damageShip(UnityEngine.Random.Range(7.0f, 12.0f + diffMod), "Destroyed by hostile fire"));
					
				}
				
				nextShotTime =  UnityEngine.Random.Range(6.0f, 15.0f);
				currentAIState = AIState.ORBITING;
				setStatFromName("chargingWeapons", 0.0f);
				orbitTime = 0.0f;
				
				
			} 
			
		} else if (currentAIState == AIState.SCANNING){
			if(scannerBeam.gameObject.active == false){
				StartCoroutine(EnableScanner());
			}
			setStatFromName("scanning", 1.0f);
			
			scannerAnimationTime -= Time.fixedDeltaTime;
			if(scannerAnimationTime < 0.0f){
				scannerAnimationTime = UnityEngine.Random.Range(1.0f, 3.0f);
				scannerBeam.localRotation = Quaternion.Euler(UnityEngine.Random.onUnitSphere * 360);
				SetScannerAlpha(0.0f);
			} else if(scannerAnimationTime < 0.5f) {
				SetScannerAlpha(0.0f);
			} else {
				SetScannerAlpha(UnityEngine.Random.Range(0.4f, 1.0f));
			}
			
		
			//sit still and rotate around toward the players but very slowly. Send out a "scanning timer" value that is displayed on tactical
			//when that hits zero target the ship
			scanTime -= Time.fixedDeltaTime;
			
			if(scanTime < 0){		//undetected for scanTime, leave the area
				StartCoroutine(scanDone(true));
				
			}
			
			if(theShip.GetComponent<Reactor>().systemEnabled ){
				reactorDetectTime -= Time.fixedDeltaTime;
			}
			if(reactorDetectTime < 0){	//if the reactor stays on for more than reactorDetectTime then target and shoot
				StartCoroutine(scanDone (false));
				
			}
			if(theShip.GetComponent<ShipCore>().acceleration.magnitude > 5.0f){	//if any point the ship accelerates too much then detect them
				StartCoroutine(scanDone (false));
				
			}
			if(theShip.rigidbody.angularVelocity.magnitude > 1.0f){				//if the ship rotates too much then attack
				StartCoroutine(scanDone(false));
				
			}
			
		} else if (currentAIState == AIState.HULL_DEATH){
			throttle = 0.0f;
			rigidbody.AddTorque(UnityEngine.Random.onUnitSphere * 10.0f, ForceMode.Impulse);
		}
		
		
		
		
		rigidbody.AddForce( transform.TransformDirection(Vector3.forward) * 10 * throttle, ForceMode.Acceleration);
		
	}
	
	public IEnumerator EnableScanner(){
		yield return new WaitForSeconds(2.0f);
		scannerBeam.gameObject.SetActiveRecursively(true);
	}
	
	public void SetScannerAlpha(float a){
		foreach(Renderer t in scannerMaterials){
			t.renderer.material.SetColor("_Color", new Color(1.0f, 1.0f, 1.0f, a));
		}
	}
	
	
	
	/*the scan of pl{ayer ship is done, target them if they are still online */
	public IEnumerator scanDone(bool success){
		setStatFromName("scanning", 0.0f);
		if(!success){
			
			
			setLockState(true);
			SetScannerAlpha(UnityEngine.Random.Range(0.0f, 1.0f));
			Vector3 lookPos = theShip.position - theShip.TransformDirection(Vector3.up) * 40.0f;
			Quaternion toShip = Quaternion.LookRotation((lookPos - transform.position).normalized, theShip.up);
			scannerBeam.rotation = toShip;
			if(scanSoundPlaying == false){
				AudioSource.PlayClipAtPoint(scanPlayerEffect, theShip.position);
				scanSoundPlaying = true;
			}
			yield return new WaitForSeconds(4.0f);
			
			//tell clients you were detected
			OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "!!WARNING!!", "YOU HAVE BEEN DETECTED", 4000);
		
			//turn off scanner beam
			scannerBeam.gameObject.SetActiveRecursively(false);
			currentAIState = AIState.HUNTING;
				
		} else {
			//jump out, nothing found
			scannerBeam.gameObject.SetActiveRecursively(false);
			StartCoroutine(JumpOut());
			
		}
		
	}		
	
	public void setLockState(bool s){
		OSCMessage m = null;
		if(s){
			weaponsTarget = theShip;
			//tell clients you have been targetted
			m = new OSCMessage("/scene/warzone/youHaveBeenTargetted");
			OSCHandler.Instance.SendMessageToAll(m);
			//warn the ship that they have a weapons lock on them
			foreach(LaserTurretBehaviour t in turrets){
				t.setTarget(weaponsTarget);
			}
		} else {
			m  = new OSCMessage("/scene/warzone/youWereUntargetted");
			OSCHandler.Instance.SendMessageToAll(m);
			weaponsTarget = null;
		}
	}
	
	public void setWeaponState(bool s){
	}
	
	public IEnumerator JumpOut(){
		if(isActive){
		UnityEngine.Debug.Log("jumpout");
			visibleAtClient = false;
			currentAIState = AIState.IDLE;
			warpEffects.Play();
			transform.Find("body").GetComponent<MeshRenderer>().enabled = false;
			yield return new WaitForSeconds(1.2f);
			//dynObj.Deactivate();
			transform.position = new Vector3(-10000.0f,-15000.0f,-15000.0f);
			transform.Find("body").GetComponent<MeshRenderer>().enabled = true;
		}
	}
	
	public void JumpIn(){
		//work out a target jump pos in front of ship
		if(!isActive){
			
			
			currentAIState = AIState.IDLE;
		
			visibleAtClient = true;
			isActive = true;
			scanTime = 35.0f;
			//calculate a new local pos for the ship, 900 units directly in front of players
			Vector3 newPos = theShip.TransformDirection(Vector3.forward) * 300;
			transform.position = newPos;
			currentAIState = AIState.SCANNING;
			warpEffects.Play();
			
			reactorDetectTime = 15.0f;
			TargettingSystem.instance.addObject(gameObject);
			visibleAtClient = true;
			
		}
	
	}
	
	
	
	public override void GetShot(float damage){
		//find out which subsystem is targetted and whomp it
		//weapons disabled at < 0.0 health
		//hull < 0 = EXPLODSIONS
		// engine < 0.5 = scale the throttle with damage, possible to slow and crippled the ship
		
		UnityEngine.Debug.Log("damage: " + damage);
		switch(targettedSystem){
			case 0 : //weapons
				subsystemHealth[0] -= damage * 0.1f; 
				if(subsystemHealth[0] < 0.0f){
					subsystemHealth[0] = 0.0f;
				}				
				setStatFromName("weaponHealth", 	subsystemHealth[0]);
				break;
			case 1 : // hull
				subsystemHealth[1] -= damage * 0.1f; // scale this properly tom
				setStatFromName("hullHealth", 	subsystemHealth[1]);
				if(subsystemHealth[1] < 0.0f){
					StartCoroutine(explode());
				}
				break;
			case 2 : //engine
				subsystemHealth[2] -= damage * 0.1f;
				if(subsystemHealth[2] < 0.0f){
					subsystemHealth[2] = 0.0f;
				}	
				setStatFromName("engineHealth", 	subsystemHealth[2]);
				break;
		}
	}
	
	
	
	public override IEnumerator explode(){
		transform.Find("explosions").GetComponent<ParticleSystem>().enableEmission = true;
		GetComponent<AudioSource>().Stop();
	
		yield return new WaitForSeconds(4.0f);
		AudioSource a = CabinEffects.Instance().PlayClipAt(explosionSound, transform.position);
		a.rolloffMode = AudioRolloffMode.Linear;
		Transform b = transform.Find("BigExplosion");
		b.parent = null;
		
		b.GetComponent<BigExplosionBehaviour>().Explode();
		
		Destroy(gameObject);
	
	}
	
	public override void onTarget(){	
		targettedSystem = 1;
	}
	
	public override void onUnTarget(){
		targettedSystem = 1;
	}
	

	public override void Update() {
		
	
	}

	public void OnDrawGizmos(){
		if(targetPoint != null){
			Gizmos.DrawSphere(targetPoint, 10.0f);
		}
	}

}
