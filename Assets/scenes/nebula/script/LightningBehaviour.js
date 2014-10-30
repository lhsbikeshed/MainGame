#pragma strict
/* lightning storm clouds
 * spawned randomly
 * if the ship gets within trigger range then start charging and alert the consoles, update with charge state
 * at 100% charge fire at the ship, if the reactor is softoff then minor damage
 * if reactor is on then hard kill it and damage the ship badly
 */
public class LightningBehaviour extends DynamicFieldObjectBehaviour{

	var alphaLevel : float; 
	var flashRate : float;	//chance that we do a lightning flash
	var numberOfPlanes : int  = 15;
	var buildDistance : float  = 600;
	var chargeAmount : float = 0.0;

	var isDead : boolean = false;
	
	public static var STATE_IDLE : int = 0;
	public static var STATE_CHARGING : int = 1;
	public static var STATE_FIRING : int = 2;
	var state : int = STATE_IDLE; 
	
	var strikeClip : AudioClip;
	var dischargeWarning : AudioClip;
	
	private var meshRenderer : Renderer[];
	private var planes : Transform[];
	private var theShip :GameObject;
	private var flashTimer : float;
	private var lineRenderer : LineRenderer;
	

	function Awake () {
			
			theShip = GameObject.Find("TheShip");
			transform.LookAt(theShip.transform);
			var p : Transform = transform.Find("LightningPlane");
			planes = new Transform[numberOfPlanes];
			meshRenderer = new Renderer[numberOfPlanes];
			for(var i = 0; i < numberOfPlanes; i++){
				var b : Transform = Instantiate(p, Vector3(Random.Range(-1,1), Random.Range(-1,1),0), Quaternion.Euler(90,0,0));
				//b.parent = transform;
				b.transform.position =  Vector3(Random.Range(-4,4), Random.Range(-4,4), 0);	
				b.transform.rotation = Quaternion.Euler(90,Random.Range(0,360),0);
				b.localScale = Vector3.one * 100;
				planes[i] = b;
				meshRenderer[i] = b.GetComponent.<Renderer>();
			}
			
			//meshRenderer = gameObject.GetComponentsInChildren.<Renderer>();
			for (m in meshRenderer){
				m.material.SetColor("_TintColor",  Color(1.0,1.0,1.0,0));
			}
			lineRenderer  = GetComponent.<LineRenderer>();
			lineRenderer.enabled = false;
			
	}	
	
	function Update () {
		//keep cloud aimed at ship and fade it out when the ship gets close
		var dist : float = Vector3.Distance(theShip.transform.position, transform.position);
		if (dist < 800){
			alphaLevel = ((dist - 500) / 300.0f);
			if(alphaLevel < 0.0f) { alphaLevel = 0.0f; }
			for (m in meshRenderer){
				//m.material.SetColor("_TintColor",  Color(1.0,1.0,1.0, alphaLevel));
			}
		} else if (dist > 3000){
			isDead = true;
			transform.position = Vector3(10000,10000,10000);
			gameObject.active = false;
			
		}
		
		
		
			
	}
	
	
	/* place lightning clouds around ship and start charging */
	function buildAroundShip(){
		for (var b : Transform in planes){
			var pos : Vector3 = theShip.transform.position + (Random.onUnitSphere * buildDistance);
			
			b.position =  pos;
			b.LookAt(theShip.transform.position);
			b.rotation *= Quaternion.Euler(-90,0,0);
			
		}
		state = STATE_CHARGING;
		AudioSource.PlayClipAtPoint(dischargeWarning, theShip.transform.position);
	}
	
	function FixedUpdate(){
		if(isDead) return;
		
		if(state == STATE_IDLE){
		
			
			if(Random.value < flashRate){
				flashTimer = Time.fixedTime;
			}
		} else if (state == STATE_CHARGING){
			chargeAmount += 0.005f;
			chargeAmount = Mathf.Clamp(chargeAmount, 0, 1.0);
			for (m in meshRenderer){
				m.material.SetColor("_TintColor",  Color(1.0,1.0,1.0, chargeAmount));
			}
			
			var msg : OSCMessage = OSCMessage("/nebulascene/cloudState");
			msg.Append.<int>(2);
			msg.Append.<float>(chargeAmount);
			OSCHandler.Instance.SendMessageToAll(msg);
			if(chargeAmount >= 1.0f){
				state = STATE_FIRING;	//we are now firing
				AudioSource.PlayClipAtPoint(strikeClip, theShip.transform.position);	//SOUND
				var msg2 : OSCMessage = OSCMessage("/nebulascene/cloudState");	//tell the clients we got whomped
				msg2.Append.<int>(3);
				msg2.Append.<float>(chargeAmount);
				OSCHandler.Instance.SendMessageToAll(msg);
				
				var reactor : Reactor = theShip.GetComponent.<Reactor>();
				//reactor.lightningStrike();
				//if(!reactor.runningQuiet){
					//bump the ship
				//	theShip.rigidbody.AddExplosionForce(100,theShip.transform.position + Random.onUnitSphere * 5.0f, 100,0, ForceMode.Impulse);
				//}
			}
		} else if (state == STATE_FIRING){
			chargeAmount -= 0.01f + Random.Range(-0.05, 0.05);
			chargeAmount = Mathf.Clamp(chargeAmount, 0.0, 1.0);
			
			for (m in meshRenderer){
				m.material.SetColor("_TintColor",  Color(1.0,1.0,1.0, chargeAmount));
			}
			var randVec = transform.rotation * Vector3(Random.Range(-52,52), Random.Range(-52,52), 0); 
			lineRenderer.SetPosition(0, transform.position +  randVec);
			lineRenderer.SetPosition(1, theShip.transform.position);
			lineRenderer.GetComponent.<Renderer>().material.mainTextureOffset.x += 0.05f;
			if(lineRenderer.enabled == false){
				lineRenderer.enabled = true;
			}
			if(chargeAmount <= 0.0f){
				state = STATE_IDLE;
				lineRenderer.enabled = false;
				for(p in planes){
					Destroy(p.gameObject);
				}
				Destroy(gameObject);
				
			}
		}
	}
	
	
	function resetTo( newpos : Vector3){
		/*for (m in meshRenderer){
			m.material.color =  Color(1.0,1.0,1.0,1.0);
		}
		transform.position = newpos;
		//transform.LookAt(theShip.transform);
		alphaLevel = 1.0f;*/
		transform.position = newpos;
		isDead = false;
		state = STATE_IDLE;
		
		
	
	}
	
	
	function OnTriggerEnter(col : Collider){
		if(state == STATE_IDLE){
			buildAroundShip();
			
		}
	}
	
	function OnTriggerExit(col : Collider){
		state = STATE_IDLE;
		chargeAmount = 0.0f;
		var msg : OSCMessage = OSCMessage("/nebulascene/cloudState");
		msg.Append.<int>(1);
		msg.Append.<float>(chargeAmount);
		OSCHandler.Instance.SendMessageToAll(msg);
	}
	
}