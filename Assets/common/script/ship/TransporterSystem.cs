using UnityEngine;
using System;
using System.Collections;
using UnityOSC;

[System.Serializable]
public class TransporterSystem: BaseSubsystem , JammingListener {
	
	
	
	public Transform ejectedDudePrefab;
	public AudioClip airlockDumpSfx;
	
	public float startBeamTime;	
	public float maxBeamTime; 
	
	bool beamInProgress = false;
	bool beamEnabled = false;
	
	bool beamFailed = false;
	
	
	public override void Start() {
		base.Start();
	}
	
	public void Update() {
	
	}
	
	
	
	public void jammingResult(int state){
		UnityEngine.Debug.Log("cb");
		if(state == 0){	//failed to jam
//			UsefulShit.PlayClipAt(beamInSfx, theShip.transform.position);
			
			OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "!!WARNING!!", "INTRUDER DETECTED IN TRANSPORTER ROOM, PREPARE TO DUMP AIRLOCK CONTENTS", 1500);
			OSCHandler.Instance.ChangeClientScreen("EngineerStation", "airlockdump", true);
		} else if (state == 1){
			//beam was stopped. All consoles see this message
			//anyway and will revert to their normal function
			//UsefulShit.PlayClipAt(beamFailSfx, theShip.transform.position);
			//yield WaitForSeconds(2);
			OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");
		}
	}
	
	public IEnumerator startBeamAttempt(int diff){
		UnityEngine.Debug.Log("Beam attempt at diff: " + diff);
		beamInProgress = true;
		OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "!!WARNING!!", "SOMEONE IS TRYING TO BEAM ABOARD, PREPARE TO JAM THE SIGNAL", 2000);
		yield return new WaitForSeconds(1.0f);
		theShip.GetComponent<JammingSystem>().startJammer( this, diff);
		

		
	}
	
	public IEnumerator beamAttemptResult(int res){
	
		UnityEngine.Debug.Log("beam attempt result " + res);
		if(res == 0){
			//play a beam aboard sound
			//consoles will display an intruder alert warning
			/*UsefulShit.PlayClipAt(beamInSfx, theShip.transform.position);
			OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "!!WARNING!!", "INTRUDER DETECTED IN TRANSPORTER ROOM, PREPARE TO DUMP AIRLOCK CONTENTS", 1500);
			OSCHandler.Instance.ChangeClientScreen("EngineerStation", "airlockdump");*/
		} else if (res == 1){
			//beam was stopped. All consoles see this message
			//anyway and will revert to their normal function
			/*UsefulShit.PlayClipAt(beamFailSfx, theShip.transform.position);
			yield WaitForSeconds(2);
			OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");*/
		} else if( res == 2){
			if(beamFailed == false){
			
				OSCHandler.Instance.DisplayBannerAtClient("PilotStation", "!!WARNING!!", "INTRUDER HAS DISABLED AIRLOCK DOOR, PREPARE FOR BOARDING", 10000);
				OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "!!WARNING!!", "INTRUDER HAS DISABLED AIRLOCK DOOR, PREPARE FOR BOARDING", 10000);
				OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "!!WARNING!!", "INTRUDER HAS DISABLED AIRLOCK DOOR, PREPARE FOR BOARDING", 10000);
				beamFailed = true;
				//schedule a light cutout and death
				yield return new WaitForSeconds(5.0f);
				GameObject.Find("PersistentScripts").GetComponent<PersistentScene>().shipDead("Killed by alien invaders");
			}
			
		} else if (res == 3){
			if(beamFailed == false){
	
				//airlock dumped, play door/hiss sound
				//spawn a an alien flying out of ship
				//UsefulShit.PlayClipAt(airlockDumpSfx, theShip.transform.position);
				OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "!!WARNING!!", "DUMPING AIRLOCK CONTENTS..", 2000);
				yield return new WaitForSeconds(1.6f);
				Instantiate(ejectedDudePrefab, theShip.transform.position, theShip.transform.rotation);
				OSCHandler.Instance.RevertClientScreen("EngineerStation", "airlockdump");
				//OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");
				//switch engineer back to power
				
			}
			
			
			
		}
	}
	
	
	
	public override void processOSCMessage(OSCMessage message){
		String[] msgAddress = message.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		String system = msgAddress[2];
		String target = msgAddress[3];
		switch (target){
			case "startBeamAttempt":
				int diff = 0;
				if(message.Data.Count >=1){
					diff = (int)message.Data[0];
				} else {
					diff = 1;
				}
				StartCoroutine(startBeamAttempt(diff));			
				break;
			case "beamAttemptResult":
				
				StartCoroutine(beamAttemptResult((int)message.Data[0]));
					
				
				break;
				
		}
		
		
	}
	
}
