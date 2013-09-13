#pragma strict

class warzonescene extends GenericScene {
	
	/*
	 * OSC messages in this scene
	 *
	 * INPUT :
	 * /scene/missileAttemptResult
	 * /scene/beamAttemptResult
	 * /scene/warzonestart
	 * /scene/rodStatus
	 * 
	 * OUTPUT:
	 * /scene/warzone/intruderAlert
	 * /scene/warzone/shipdetected
	 * /scene/warzone/shipcharging
	 * /scene/warzone/shipexploding
	 * /scene/warzone/missilelaunch
	 * /scene/warzone/beamAttempt
	 * /scene/warzone/enableTactical
	 * /scene/warzone/missileOver //misile seq done
	 /scene/warzone/flareResult
	 
	 
	 
	 
	NEW SHIT
	when triggering missies spawn a bunch of "incoming missiles" around the player
	send out tactical updates (position of missiles, scan code, scan state)
	when one has been scanned set its targetstate so that tactical targets it
	need a fireAck/fireNack message for when the beams are outisde range
	
	 
	 */
	
	
	@HideInInspector
	
	var sceneStartTime : float;	//when did scene start
	var introShip : LargeShipBehaviour;
	
	var explosionPrefab : Transform;
	var flarePrefab : Transform;
	
	var test : float;
	
	var beamInSfx : AudioClip;
	var beamFailSfx : AudioClip;
	
	var ejectedDudePrefab : Transform;
	var airlockDumpSfx : AudioClip;
	
	private var lastMissileLaunchTime : float;	//last time a missile launch was started
	private var nextMissileLaunchTime : float; //when does the next missile launch? randomize this
	
	private var missilesLaunched : boolean =  false;
	private var missilesEnabled  : boolean = false;
	
	private var theShip : Transform;
	private var shipSystem : ship;
	
	var dynShitField : DynamicShitField;
	var mapController : MapController;
	
	
	var startBeamTime : float;	
	var maxBeamTime : float; 
	private var outstandingMissiles : int ; //how many missiles left to kill?
	private var beamInProgress : boolean = false;
	private var beamEnabled : boolean = false;
	
	private var beamFailed : boolean = false;
	
	function Start () {
		introShip = GameObject.Find("introShip").GetComponent.<LargeShipBehaviour>();
		//startScene();
		theShip = GameObject.Find("TheShip").transform;
		theShip.rigidbody.useGravity = false;
		
		theShip.rigidbody.drag = 0.7f;
		shipSystem = theShip.GetComponent.<ship>();
	}
	
	/* kick off this mess */
	function startScene(){
		introShip.velocity = Vector3(1.8,0,0);	//start the killing ship move into pos
		//tell clients large target detected
		var msg : OSCMessage = OSCMessage("/scene/warzone/shipdetected");	
		OSCHandler.Instance.SendMessageToAll(msg);
		yield(WaitForSeconds(5));	//wait for a bit then fire at the helper
		introShip.GetComponentInChildren(LaserTurretBehaviour).penetrating = true;
		introShip.fireAtTarget(GameObject.Find("Deadshiptarget").transform);
		msg = OSCMessage("/scene/warzone/shipcharging");	
		OSCHandler.Instance.SendMessageToAll(msg);	
		yield(WaitForSeconds(7));	//begin big splosion and pass the beam through the ship
		
		msg = OSCMessage("/scene/warzone/shipexploding");	
		OSCHandler.Instance.SendMessageToAll(msg);
		
		GameObject.Find("DeadShip").GetComponent.<ExplodingShip>().startExplosion();
		
		theShip.GetComponent.<ExplosionOverlayBehaviour>().explode();
		
		//spawn some explodey things
		GameObject.Find("SceneScripts").GetComponent.<DynamicShitField>().enabled = true;
		theShip.GetComponent.<PropulsionSystem>().enableSystem();
		
		
		yield(WaitForSeconds(12));
		
		
		introShip.velocity = Vector3(0,0,0);	//stop the killer and start firing missiles at the player
		beamFailed = false;
	}
	
	function SetMissileState(state : boolean){
		missilesEnabled = state;
		lastMissileLaunchTime = Time.fixedTime;
		nextMissileLaunchTime = 2;
		missilesLaunched = false;
		
	}
	
	function startBeamAttempt(){
		beamInProgress = true;
		
		
	}
	/* 0 = failed to stop beam
	   1 = beam stopped
	   2 = airlock failed
	   3 = airlock passed
	   */
	function beamResult(res : int){
		if(res == 0){
			//play a beam aboard sound
			//consoles will display an intruder alert warning
			AudioSource.PlayClipAtPoint(beamInSfx, theShip.transform.position);
			
		} else if (res == 1){
			//beam was stopped. All consoles see this message
			//anyway and will revert to their normal function
			AudioSource.PlayClipAtPoint(beamFailSfx, theShip.transform.position);
		} else if( res == 2){
			if(beamFailed == false){
				beamFailed = true;
				//schedule a light cutout and death
				yield WaitForSeconds(5);
				GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>().shipDead("Killed by alien invaders");
			}
			
		} else if (res == 3){
			if(beamFailed == false){
	
				//airlock dumped, play door/hiss sound
				//spawn a an alien flying out of ship
				AudioSource.PlayClipAtPoint(airlockDumpSfx, theShip.transform.position);
				yield WaitForSeconds(1.6);
				Instantiate(ejectedDudePrefab, theShip.transform.position, theShip.transform.rotation);
			}
			
			
			
		}
	
	}
	
	function spawnGate(){
	}
	
	
	function Update () {
		test = theShip.rigidbody.angularVelocity.magnitude;
		
		if(missilesEnabled){
			if(lastMissileLaunchTime + nextMissileLaunchTime < Time.fixedTime && missilesLaunched == false){
				//fire another missile to keep the tactical guy busy
				var missMsg : OSCMessage = OSCMessage("/scene/warzone/missilelaunch");
				outstandingMissiles = Random.Range(1,4);
				missMsg.Append.<int>(outstandingMissiles);
				OSCHandler.Instance.SendMessageToAll(missMsg);
				nextMissileLaunchTime = Random.Range(15, 30);
				lastMissileLaunchTime = Time.fixedTime;
				missilesLaunched = true;
				Debug.Log("Missile launched at : " + Time.fixedTime);
			}
		}
	}
	
	/* dont forget to make a noise here
	*/
	function weaponsPower(state : boolean){
			var wepMsg : OSCMessage = OSCMessage("/scene/warzone/tacticalState");
			if(state == true){
				wepMsg.Append.<int>(1);
			} else {
				wepMsg.Append.<int>(0);
			}
			OSCHandler.Instance.SendMessageToAll(wepMsg);
	}
	
	
	
	/* change bool to int 0== fail, 1==pass, 2==flare pass 
	*/
	function MissileAttemptResult(pass : int){
	
		var randDir : Quaternion;
		var expPos : Vector3;
		var miss : Transform;
		var flar : Transform ;
		
		if(pass == 0){					// ----------- failed totally and ship was hit
			//blow some shit up
			//instantiate an explosion in front of the ship
			randDir = Quaternion.Euler(Random.Range(-20,20), Random.Range(-20,20),0);
			expPos = theShip.position + theShip.TransformDirection(randDir * (Vector3.forward * (theShip.rigidbody.velocity.magnitude + 5.0)) );
			miss = Instantiate(explosionPrefab, expPos, Quaternion.identity);
			miss.GetComponent.<MissileBehaviour>().explode();
			
			theShip.rigidbody.AddExplosionForce(20500.0,expPos,0,0);
			outstandingMissiles--;
			
			//let clients know we got whomped
			var damMes : OSCMessage = OSCMessage("/ship/damage");
			OSCHandler.Instance.SendMessageToAll(damMes);
			
			theShip.GetComponent.<ship>().damageShip(Random.Range(15,25), "Exploded by missiles");
			
				
						
		} else if (pass == 1){			// ----------- passed and missile was layzored
			//work out if the missile was destroyed or just winged
			//base ths on weapons power
			var se : OSCMessage = OSCMessage("/scene/warzone/missileResult");
			if(Random.Range(0,100) < shipSystem.weaponsPower * 25.0){
				//success!
		
				randDir = Quaternion.Euler(Random.Range(-20,20), Random.Range(-20,20),0);
				expPos = theShip.position + theShip.TransformDirection(randDir * (Vector3.forward * (theShip.rigidbody.velocity.magnitude + 400.0)) );
				miss  = Instantiate(explosionPrefab, expPos, Quaternion.identity);
			
			
				theShip.Find("ShipLaser").GetComponent.<ShipsLaser>().fireAtTarget(miss);
				yield WaitForSeconds(2);
				miss.GetComponent.<MissileBehaviour>().explode();
				outstandingMissiles--;
				se.Append(1);
				
			} else {
				se.Append(0);
				randDir = Quaternion.Euler(Random.Range(-20,20), Random.Range(-20,20),0);
				expPos = theShip.position + theShip.TransformDirection(randDir * (Vector3.forward * (theShip.rigidbody.velocity.magnitude + 400.0)) );
				miss  = Instantiate(explosionPrefab, expPos, Quaternion.identity);
				theShip.Find("ShipLaser").GetComponent.<ShipsLaser>().fireAtTarget(miss);
				yield WaitForSeconds(2);
				miss.GetComponent.<MissileBehaviour>().silentDie();
			}
			OSCHandler.Instance.SendMessageToAll(se);	
	
		} else {
			//start the flare dodging process
			//fire a flare out the front and then asplode the missile
			//take a small amount of damage perhaps?
			flar = Instantiate(flarePrefab, theShip.transform.position, theShip.rotation);
			yield WaitForSeconds(1);
			var s : OSCMessage = OSCMessage("/scene/warzone/flareResult");
			if(theShip.rigidbody.angularVelocity.magnitude > 0.2){
			
				flar.GetComponent.<MissileFlareBehaviour>().successful = true;
				outstandingMissiles--;
				s.Append.<int>(1);
			} else {
				flar.GetComponent.<MissileFlareBehaviour>().successful = false;
				s.Append.<int>(0);
				/*randDir = Quaternion.Euler(Random.Range(-20,20), Random.Range(-20,20),0);
				expPos = theShip.position + theShip.TransformDirection(randDir * (Vector3.forward * (theShip.rigidbody.velocity.magnitude + 5.0)) );
				miss = Instantiate(explosionPrefab, expPos, Quaternion.identity);
				miss.GetComponent.<MissileBehaviour>().explode();
				
				theShip.rigidbody.AddExplosionForce(20500.0,expPos,0,0);*/
			}
			
			OSCHandler.Instance.SendMessageToAll(s);	
			
		}
		
		
		
		if(outstandingMissiles == 0){
				
			missilesLaunched = false;
			//reset the timers for another launch
			nextMissileLaunchTime = Random.Range(20, 40);
			lastMissileLaunchTime = Time.fixedTime;
			OSCHandler.Instance.SendMessageToAll(OSCMessage("/scene/warzone/missileOver"));	
		}
	}
	
	
	//OSC HANDLERS
	
	function ProcessOSCMessage(message : OSCPacket){
		
		var msgAddress = message.Address.Split(separator);
		var target = msgAddress.length >= 3 ? msgAddress[3] : 0;
		
		switch(target){
			
			case "createBastard":
				dynShitField.createABastard();
				break;
			case "startBeamAttempt":
				startBeamAttempt();			
				break;
			case "beamAttemptResult":
				
				beamResult(message.Data[0]);
					
				
				break;
			case "missileAttemptResult":
				MissileAttemptResult(message.Data[0]);			
				break;
			case "warzonestart":
				startScene();
				break;
			case "rodState":
				
				if (message.Data[0]  == 1){	
					weaponsPower(true);
				} else {
					weaponsPower(false);
				}
				
				break;
			case "missileLauncherStatus":
				
				if (message.Data[0]  == 1){	
					SetMissileState(true);
				} else {
					SetMissileState(false);
				}
				
				break;
			case "spawnGate":
				mapController.spawnGate();				
				
				break;
				
			
		}
	
	
	}
	
	
	/* send out tacitcal updates */
	function SendOSCMessage(){
	
	
	}
	
	
	
	
}