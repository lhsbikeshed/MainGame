#pragma strict


class WormholeBehaviour extends TargettableObject{

	private var MODE_IDLE :int = 0;
	private var MODE_OPENING :int = 1;
	private var MODE_OPEN :int = 2;
	private var MODE_CLOSING :int = 3;
	
	

	var mode = MODE_IDLE;

	var test : boolean = false;
	var energyLevel : float = 10.0f;
	
	private var sin1: float;
	private var sin2 : float;
	
	private var cloudRenderer  : Renderer;
	private var bitsParticles : Transform;
	private var core : GameObject;
	private var spray : GameObject;
	
	private var cloudColor : Color;
	private var coreScale : float;
	private var coreAnimTime : float;

	private var lastOSCTime : float = 0.0f;
	
	
	function Start () {
		targetId = gameObject.GetHashCode();
		cloudRenderer = gameObject.Find("IdleParticles").GetComponent.<Renderer>();
		bitsParticles = gameObject.Find("FastBits").transform;
		core = gameObject.Find("Core");
		core.transform.localScale = Vector3.one;
		spray = gameObject.Find("Spray");
		spray.GetComponent.<ParticleSystem>().enableEmission = false;
		
		cloudColor = cloudRenderer.material.GetColor("_TintColor");
		
		statNames[0] = "CHARGE";
		statValues[0] = energyLevel;
	}
	
	function Update () {
		if(test){
			test = false;
			open();
		}
	
	}


	function open(){
		
		bitsParticles.particleSystem.Emit(1000);
		mode = MODE_OPENING;
		coreAnimTime = Time.fixedTime;
		
	}

	function FixedUpdate () {
		if(mode == MODE_IDLE){
		
			sin1 = Mathf.Sin(Time.fixedTime) * 0.3;
			sin2 = Mathf.Sin(Time.fixedTime + 0.2f) * 0.3f;
			
			cloudColor.a = ((sin1 + sin2) / 4.0f + 0.3f) * (energyLevel / 30.0f);
			cloudRenderer.material.SetColor("_TintColor", cloudColor);
			
			bitsParticles.particleSystem.startSpeed = -139 * (energyLevel / 30.0f);
			
			energyLevel-= 0.01f;
			if(energyLevel < 10.0f){
				energyLevel = 10.0f;
			} else if (energyLevel > 32.0f){
				open();
			}
			stateText = "";
		} else if (mode == MODE_OPENING){
			bitsParticles.particleSystem.startSpeed = 200;
			//do an open effect, embiggen the event horizon and 
			coreScale = (Time.fixedTime - coreAnimTime) / 0.7f;
			coreScale = Mathf.Clamp(coreScale, 0.0, 1.0f) * 80.0f;
			core.transform.localScale = Vector3.one * coreScale;
			if(Time.fixedTime - coreAnimTime > 0.7f){
				mode = MODE_OPEN;
				spray.GetComponent.<ParticleSystem>().enableEmission = true;
				core.GetComponent.<CoreScript>().open = true;
			}
			stateText = "OPENING";
		} else if (mode == MODE_OPEN){
			energyLevel-= 0.1f;
			cloudColor.a = ((sin1 + sin2) / 4.0f + 0.3f) * (energyLevel / 30.0f);
			cloudRenderer.material.SetColor("_TintColor", cloudColor);
			if(energyLevel < 10.0f){
				energyLevel = 10.0f;
				close();
			} 
			statValues[0] = energyLevel;
			stateText = "OPEN";
		} else if (mode == MODE_CLOSING){
			bitsParticles.particleSystem.startSpeed = 200;
			//do an open effect, embiggen the event horizon and 
			coreScale = 0.7f - (Time.fixedTime - coreAnimTime) / 0.7f;
			coreScale = Mathf.Clamp(coreScale, 0.0, 1.0f) * 80.0f;
			core.transform.localScale = Vector3.one * coreScale;
			cloudColor.a = ((sin1 + sin2) / 4.0f + 0.3f) * (energyLevel / 30.0f);
			cloudRenderer.material.SetColor("_TintColor", cloudColor);
			if(Time.fixedTime - coreAnimTime > 0.7f){
				mode = MODE_IDLE;
				
			}
			stateText = "CLOSING";
		}
		
		if(targetted && lastOSCTime + 0.25f < Time.fixedTime){
			//send an engineer update with the wormhole state in
			var msg : OSCMessage = new OSCMessage("/engineer/wormholeStatus/holeState");
			msg.Append(energyLevel);
			msg.Append(mode);
			
			OSCHandler.Instance.SendMessageToClient("EngineerStation", msg);
			lastOSCTime = Time.fixedTime;
		}
		
		
	}
	
	function close(){
		coreAnimTime = Time.fixedTime;
		spray.GetComponent.<ParticleSystem>().enableEmission = false;
		bitsParticles.particleSystem.startSpeed = -139 * (energyLevel / 30.0f);
		mode = MODE_CLOSING;
		core.GetComponent.<CoreScript>().open = false;
	}
	
	function GetShot(damage : float){
		if(mode == MODE_IDLE || mode == MODE_OPEN){
			energyLevel += damage * 10.0f;
		}
	
	}
	
	function OnTriggerStay(c : Collider){
		if(c.attachedRigidbody != null){
			if( mode == MODE_OPEN){
				c.attachedRigidbody.AddForce( (c.transform.position - transform.position).normalized * -1200.0f, ForceMode.Force);
			} else if (mode == MODE_OPENING){
				c.attachedRigidbody.AddForce( (c.transform.position - transform.position).normalized * 600.0f, ForceMode.Force);
				c.attachedRigidbody.AddTorque(Random.onUnitSphere * Random.Range(300,600));
				
				if(c.name == "TheShip"){
					var dam: float = 10 * (1.0f - Mathf.Clamp((c.transform.position - transform.position).magnitude / 300.0f, 0, 1));
					c.gameObject.GetComponent.<ship>().damageShip(dam, "Destroyed by spatial distortions");
				}
			}
		}
	}
	
	function onTarget(){
		Debug.Log("I got targetted");
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "wormholeStatus");			//give the engineer power man console
		//now start pushing out OSC updates about aperture diameters
		
	}
	function onUnTarget(){
		//OSCHandler.Instance.RevertClientScreen("EngineerStation");
	
	}
}