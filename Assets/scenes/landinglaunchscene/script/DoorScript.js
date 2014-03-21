#pragma strict

public class DoorScript extends MonoBehaviour{
	
	 public enum DoorState { OPENING = 1, CLOSING = 2, OPEN = 3, CLOSED = 4 };
	 
	
	
	 var state : DoorState;
	
	var openDistance : float;
	var duration : float;
	var localDirection : Vector3 = Vector3(0,1,0);
	var airlockEffect : boolean = true;
	var shutterClip : AudioClip;
	private var changeTime: float;
	private var effectObject: AirlockEffectBehaviour;
	private var localStartPosition : Vector3;
	var test : boolean = false;
	
	function Start () {
		state = DoorState.CLOSED;
		if(airlockEffect){
			effectObject = GameObject.Find("AirlockEffects").GetComponent.<AirlockEffectBehaviour>();
		}
		//effectObject.stop();
		localStartPosition = transform.localPosition;
	}
	
	function Update () {
	
	
	}
	
	function FixedUpdate(){
		if(test){
			test = false;
			openDoor();
		}
	
		var amount : float = (Time.fixedTime - changeTime) / duration;
		if(state == DoorState.OPENING){
			//transform.localPosition.y = Mathf.Lerp(0,openDistance, amount);
			transform.localPosition = localStartPosition + ((transform.localRotation * localDirection) * Mathf.Lerp(0,openDistance, amount));
			if(airlockEffect){
				effectObject.setAtmosphereLevel(1 - amount);
			}
		} else if (state == DoorState.CLOSING){
			//transform.localPosition.y = Mathf.Lerp(openDistance,0, amount);
			transform.localPosition = localStartPosition + ((transform.localRotation * localDirection) * Mathf.Lerp(openDistance,0, amount));
		}
		if(amount >= 1.0){
			amount = 1.0;
			if (state == DoorState.OPENING){
				state = DoorState.OPEN;
				if(airlockEffect){ effectObject.stop(); }
			} else if (state == DoorState.CLOSING){
				state = DoorState.CLOSED;
				
			}
		}
		
	}
	
	function toggleDoor(){
		if(state == DoorState.OPEN){
			closeDoor();
		}else if (state == DoorState.CLOSED){
			openDoor();
		}
	}
	
	function openDoor(){
		if(state == DoorState.CLOSED){
			state = DoorState.OPENING;
			changeTime = Time.fixedTime;
			if(airlockEffect){ effectObject.start(); }
			if(shutterClip != null){
				AudioSource.PlayClipAtPoint(shutterClip, transform.position);
			}
		}
	}
	
	function closeDoor(){
		if(state == DoorState.OPEN){
			state = DoorState.CLOSING;
			changeTime = Time.fixedTime;
			if(shutterClip != null){
				AudioSource.PlayClipAtPoint(shutterClip, transform.position);
			}
		}
	}
}