using UnityEngine;
using System;

[System.Serializable]
public class DoorScript: MonoBehaviour{
	
	 public enum DoorState { OPENING = 1, CLOSING = 2, OPEN = 3, CLOSED = 4 };
	 
	
	
	 public DoorState state;
	
	public float openDistance;
	public float duration;
	public Vector3 localDirection = new Vector3(0.0f,1.0f,0.0f);
	public bool airlockEffect = true;
	public AudioClip shutterClip;
	float changeTime;
	public AirlockEffectBehaviour effectObject;
	Vector3 localStartPosition;
	public bool test = false;
	
	public void Start() {
		state = DoorState.CLOSED;

		//effectObject.stop();
		localStartPosition = transform.localPosition;
	}
	
	public void Update() {
	
	
	}
	
	public void FixedUpdate(){
		if(test){
			test = false;
			openDoor();
		}
	
		float amount = (Time.fixedTime - changeTime) / duration;
		if(state == DoorState.OPENING){
			//transform.localPosition.y = Mathf.Lerp(0,openDistance, amount);
			transform.localPosition = localStartPosition + ((transform.localRotation * localDirection) * Mathf.Lerp(0.0f,openDistance, amount));
			if(airlockEffect){
				effectObject.setAtmosphereLevel(1 - amount);
			}
		} else if (state == DoorState.CLOSING){
			//transform.localPosition.y = Mathf.Lerp(openDistance,0, amount);
			transform.localPosition = localStartPosition + ((transform.localRotation * localDirection) * Mathf.Lerp(openDistance,0.0f, amount));
		}
		if(amount >= 1.0f){
			amount = 1.0f;
			if (state == DoorState.OPENING){
				state = DoorState.OPEN;
				if(airlockEffect){ effectObject.stop(); }
			} else if (state == DoorState.CLOSING){
				state = DoorState.CLOSED;
				
			}
		}
		
	}
	
	public void toggleDoor(){
		if(state == DoorState.OPEN){
			closeDoor();
		}else if (state == DoorState.CLOSED){
			openDoor();
		}
	}
	
	public void openDoor(){
		if(state == DoorState.CLOSED){
			state = DoorState.OPENING;
			changeTime = Time.fixedTime;
			if(airlockEffect){ effectObject.start(); }
			if(shutterClip != null){
				AudioSource.PlayClipAtPoint(shutterClip, transform.position);
			}
		}
	}
	
	public void closeDoor(){
		if(state == DoorState.OPEN){
			state = DoorState.CLOSING;
			changeTime = Time.fixedTime;
			if(shutterClip != null){
				AudioSource.PlayClipAtPoint(shutterClip, transform.position);
			}
		}
	}
}