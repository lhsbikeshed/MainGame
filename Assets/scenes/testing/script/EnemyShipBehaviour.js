#pragma strict


class EnemyShipBehaviour extends TargettableObject {
	
	var theShip : Transform;
	var rotateSpeed : float  = 0.1f;
	
	var testing : boolean = false;
	var targetTest : boolean = false;
	var ang : float = 10.0f;
	var nextShotTime : float = 8.0f;
	var isActive : boolean = false;
	var difficulty : float = 1.0f;
	var scanTime : float = 15.0f;
	var reactorDetectTime : float = 5.0f;
	
	private var turrets : LaserTurretBehaviour[];
	private var dynObj : DynamicMapObject;
	
	private var warpEffects: ParticleSystem;
	private var scannerBeam : Transform;
	private var scannerRotation : Quaternion;
	private var scannerAnimationTime : float = 1.0f;
	private var scannerMaterials : Renderer[] ;
	
	var subsystemHealth : float[] = new float[3];
	
	enum AIState {  IDLE,		//do nothing at all, just wait for a jump signal
					JUMPING,	//jumping in
					SCANNING,	//scanning for player
					WAITING, 	//waiting
					HUNTING, 	//seeking out the ship
					ORBITING,	//orbit around 
					AIMING,		//aiming at the target to shoot it	
					RAMMING,		//weapons down, intentionally ram the players	
					HULL_DEATH	
					};	
					
	enum WeaponState { 	DISABLED, 	//wont target or shoot
						OFF, 		//targetting but not shooting
						CHARGING, 	//dur
						FIRING, 	//pewpew
						COOLDOWN };	//wait for cooldowntime below
	
	var currentWeaponState : WeaponState = WeaponState.OFF;				
	var currentAIState : AIState = AIState.WAITING;
	
	var weaponCooldown : float = 5.0f;
	var missileCooldown : float = 5.0f;
	var orbitRange : float = 200.0f;
	var throttle : float = 0.0f;
	
	var targettedSystem : int = 1;		//hull gets targetted by default
	
	
	//sound effects
	var scanPlayerEffect : AudioClip ;
	private var scanSoundPlaying : boolean = false;
	var explosionSound : AudioClip;
	
	private var targetPoint : Vector3;
	private var orbitTime : float;		//how long have we been orbiting our target?
	private var weaponsTarget : Transform;
	
	
	function Start () {
		super.Start();
		theShip = GameObject.Find("TheShip").transform;

		turrets = GetComponentsInChildren.<LaserTurretBehaviour>();
		dynObj = GetComponent.<DynamicMapObject>();

		
		warpEffects = transform.Find("warpeffects").GetComponent.<ParticleSystem>();
		scannerBeam = transform.Find("ScannerBeam");
		scannerMaterials = scannerBeam.GetComponentsInChildren.<Renderer>();
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
	
	
	
	function FixedUpdate(){
		if(testing){
			testing = false;
			JumpIn();
		}
		
		if(targetTest){
			targetTest = false;
			explode();
		}
		
		//stats
		var firing : boolean = false;
		for(var t : LaserTurretBehaviour in turrets){
			if(t.state == 2){
				firing = true;
				break;
			
			}
			
		}
		setStatFromName("firing", firing == true ? 1.0 : 0.0);
		setStatFromName("health", subsystemHealth[1]);
		//AI
	
		var direction : Vector3 = theShip.position - transform.position;
		var range : float = direction.magnitude;
		
		var angDiff = Vector3.Dot(transform.TransformDirection(Vector3.forward), direction.normalized);
		
		if(currentAIState == AIState.WAITING){
			//in waiting state just track the ship to scare them
			targetPoint = theShip.transform.position;
			
			var q : Quaternion = Quaternion.LookRotation(direction);
			transform.rotation = Quaternion.Slerp(transform.rotation, q, rotateSpeed);
			throttle = 0.0f;
		} else if (currentAIState == AIState.HUNTING){
			//fly toward the players until they are in range
			targetPoint = theShip.transform.position;
			var angledUp : Vector3 = transform.TransformDirection(Vector3.up);
			angledUp = Quaternion.Euler(0,0,20.0f * angDiff) * angledUp;
			
			var q2 : Quaternion = Quaternion.LookRotation(direction, angledUp);
			transform.rotation = Quaternion.Slerp(transform.rotation, q2, rotateSpeed);
			
			throttle = 4.0f * Mathf.Abs(angDiff);
			
			if(range <= orbitRange){
				currentAIState = AIState.ORBITING;
			}
		} else if (currentAIState == AIState.ORBITING){
			//get direction from target to ourselves
			orbitTime += Time.fixedDeltaTime;
			
			//take this direction and rotate it 10 degrees around on a plane formed by direction and our forward axis
			var ourFwd : Vector3 = transform.TransformDirection(Vector3.forward);
			var rotZ : Vector3 = Vector3.Cross(direction.normalized, ourFwd);
			var axisAngle : Quaternion = Quaternion.AngleAxis(ang, rotZ);
			
			targetPoint = axisAngle * (theShip.position + direction.normalized * (orbitRange * 0.9f));
			
			var angledUp2 : Vector3 = transform.TransformDirection(Vector3.up);
			angledUp2 = Quaternion.Euler(0,0,20.0f * -angDiff) * angledUp;
			
			var q3 : Quaternion = Quaternion.LookRotation(targetPoint - transform.position, angledUp2);
			transform.rotation = Quaternion.Slerp(transform.rotation, q3, rotateSpeed);
			throttle = 5.0f;
					
			if(range > orbitRange){
				currentAIState = AIState.HUNTING;
				orbitTime = 0;
			}
			if(orbitTime > 8.0f - difficulty * 4.0f){
				currentAIState = AIState.AIMING;
			}
		} else if (currentAIState == AIState.AIMING){
			
			targetPoint = theShip.transform.position;
			setStatFromName("chargingWeapons", 1.0f);
			
			
			var q4 : Quaternion = Quaternion.LookRotation(direction);
			transform.rotation = Quaternion.Slerp(transform.rotation, q4, rotateSpeed);
			//rigidbody.AddForce(transform.TransformDirection(Vector3.up) * -15, ForceMode.Acceleration);
			
			throttle = 0.0f;
			
			if(angDiff > 0.95f && weaponsTarget != null){
				var miss : boolean = false;
				if(Random.Range(0.0f, 1.0f) > difficulty){
					miss = true;
				}
				for(var t : LaserTurretBehaviour in turrets){
					t.deliberatelyMiss = miss;
					t.penetrating = miss;
					t.startFiring();
					
				}
				
				if( !miss ){
					var diffMod : float = difficulty * 5.0f;
					theShip.GetComponent.<ship>().damageShip(Random.Range(7.0f, 12.0f + diffMod), "Destroyed by hostile fire");
					
				}
				
				nextShotTime =  Random.Range(6.0f, 15.0f);
				currentAIState = AIState.ORBITING;
				setStatFromName("chargingWeapons", 0.0f);
				orbitTime = 0.0f;
				
				
			} 
			
		} else if (currentAIState == AIState.SCANNING){
			if(scannerBeam.gameObject.active == false){
				EnableScanner();
			}
			setStatFromName("scanning", 1.0f);
			
			scannerAnimationTime -= Time.fixedDeltaTime;
			if(scannerAnimationTime < 0.0f){
				scannerAnimationTime = Random.Range(1.0f, 3.0f);
				scannerBeam.localRotation = Quaternion.Euler(Random.onUnitSphere * 360);
				SetScannerAlpha(0.0f);
			} else if(scannerAnimationTime < 0.5f) {
				SetScannerAlpha(0.0f);
			} else {
				SetScannerAlpha(Random.Range(0.4, 1.0));
			}
			
		
			//sit still and rotate around toward the players but very slowly. Send out a "scanning timer" value that is displayed on tactical
			//when that hits zero target the ship
			scanTime -= Time.fixedDeltaTime;
			
			if(scanTime < 0){		//undetected for scanTime, leave the area
				scanDone(true);
				
			}
			
			if(theShip.GetComponent.<Reactor>().systemEnabled ){
				reactorDetectTime -= Time.fixedDeltaTime;
			}
			if(reactorDetectTime < 0){	//if the reactor stays on for more than reactorDetectTime then target and shoot
				scanDone (false);
				
			}
			if(theShip.GetComponent.<ship>().acceleration.magnitude > 5.0f){	//if any point the ship accelerates too much then detect them
				scanDone (false);
				
			}
			if(theShip.rigidbody.angularVelocity.magnitude > 1.0f){				//if the ship rotates too much then attack
				scanDone(false);
				
			}
			
		} else if (currentAIState == AIState.HULL_DEATH){
			throttle = 0.0f;
			rigidbody.AddTorque(Random.onUnitSphere * 10.0f, ForceMode.Impulse);
		}
		
		
		
		
		rigidbody.AddForce( transform.TransformDirection(Vector3.forward) * 10 * throttle, ForceMode.Acceleration);
		
	}
	
	function EnableScanner(){
		yield WaitForSeconds(2.0);
		scannerBeam.gameObject.SetActiveRecursively(true);
	}
	
	function SetScannerAlpha(a : float){
		for(var t in scannerMaterials){
			t.renderer.material.SetColor("_Color", Color(1.0, 1.0, 1.0, a));
		}
	}
	
	
	
	/*the scan of pl{ayer ship is done, target them if they are still online */
	function scanDone(success : boolean){
		setStatFromName("scanning", 0.0f);
		if(!success){
			
			
			setLockState(true);
			SetScannerAlpha(Random.Range(0.0, 1.0));
			var lookPos : Vector3 = theShip.position - theShip.TransformDirection(Vector3.up) * 40.0f;
			var toShip : Quaternion = Quaternion.LookRotation((lookPos - transform.position).normalized, theShip.up);
			scannerBeam.rotation = toShip;
			if(scanSoundPlaying == false){
				AudioSource.PlayClipAtPoint(scanPlayerEffect, theShip.position);
				scanSoundPlaying = true;
			}
			yield WaitForSeconds(4.0);
			
			//tell clients you were detected
			OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "!!WARNING!!", "YOU HAVE BEEN DETECTED", 4000);
		
			//turn off scanner beam
			scannerBeam.gameObject.SetActiveRecursively(false);
			currentAIState = AIState.HUNTING;
				
		} else {
			//jump out, nothing found
			scannerBeam.gameObject.SetActiveRecursively(false);
			JumpOut();
			
		}
		
	}		
	
	function setLockState( s : boolean ){
		var m : OSCMessage;
		if(s){
			weaponsTarget = theShip;
			//tell clients you have been targetted
			m = OSCMessage("/scene/warzone/youHaveBeenTargetted");
			OSCHandler.Instance.SendMessageToAll(m);
			//warn the ship that they have a weapons lock on them
			for(var t : LaserTurretBehaviour in turrets){
				t.setTarget(weaponsTarget);
			}
		} else {
			m  = OSCMessage("/scene/warzone/youWereUntargetted");
			OSCHandler.Instance.SendMessageToAll(m);
			weaponsTarget = null;
		}
	}
	
	function setWeaponState (s : boolean){
	}
	
	function JumpOut(){
		if(isActive){
		Debug.Log("jumpout");
			visibleAtClient = false;
			currentAIState = AIState.IDLE;
			warpEffects.Play();
			transform.Find("body").GetComponent.<MeshRenderer>().enabled = false;
			yield WaitForSeconds(1.2);
			//dynObj.Deactivate();
			transform.position = new Vector3(-10000,-15000,-15000);
			transform.Find("body").GetComponent.<MeshRenderer>().enabled = true;
		}
	}
	
	function JumpIn(){
		//work out a target jump pos in front of ship
		if(!isActive){
			
			
			currentAIState = AIState.IDLE;
		
			visibleAtClient = true;
			isActive = true;
			scanTime = 35.0f;
			//calculate a new local pos for the ship, 900 units directly in front of players
			var newPos : Vector3 = theShip.TransformDirection(Vector3.forward) * 300;
			transform.position = newPos;
			currentAIState = AIState.SCANNING;
			warpEffects.Play();
			
			reactorDetectTime = 15.0f;
			TargettingSystem.instance.addObject(gameObject);
			visibleAtClient = true;
			
		}
	
	}
	
	
	
	function GetShot(damage : float){
		//find out which subsystem is targetted and whomp it
		//weapons disabled at < 0.0 health
		//hull < 0 = EXPLODSIONS
		// engine < 0.5 = scale the throttle with damage, possible to slow and crippled the ship
		
		Debug.Log("damage: " + damage);
		switch(targettedSystem){
			case 0 : //weapons
				subsystemHealth[0] -= damage * 0.1f; 
				if(subsystemHealth[0] < 0.0){
					subsystemHealth[0] = 0;
				}				
				setStatFromName("weaponHealth", 	subsystemHealth[0]);
				break;
			case 1 : // hull
				subsystemHealth[1] -= damage * 0.1f; // scale this properly tom
				setStatFromName("hullHealth", 	subsystemHealth[1]);
				if(subsystemHealth[1] < 0.0f){
					explode();
				}
				break;
			case 2 : //engine
				subsystemHealth[2] -= damage * 0.1f;
				if(subsystemHealth[2] < 0.0){
					subsystemHealth[2] = 0;
				}	
				setStatFromName("engineHealth", 	subsystemHealth[2]);
				break;
		}
	}
	
	
	
	function explode() : IEnumerator{
		transform.Find("explosions").GetComponent.<ParticleSystem>().enableEmission = true;
		GetComponent.<AudioSource>().Stop();
	
		yield WaitForSeconds(4);
		var a : AudioSource = CabinEffects.Instance().PlayClipAt(explosionSound, transform.position);
		a.rolloffMode = AudioRolloffMode.Linear;
		var b : Transform = transform.Find("BigExplosion");
		b.parent = null;
		
		b.GetComponent.<BigExplosionBehaviour>().Explode();
		
		Destroy(gameObject);
	
	}
	
	function onTarget(){	
		targettedSystem = 1;
	}
	
	function onUnTarget(){
		targettedSystem = 1;
	}
	

	function Update () {
		
	
	}

	function OnDrawGizmos(){
		if(targetPoint != null){
			Gizmos.DrawSphere(targetPoint, 10);
		}
	}

}