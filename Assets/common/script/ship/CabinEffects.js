#pragma strict

/* cabin based effects
 * for now control the cabin lighting, set red alert states and queue voiceovers from ships comp
 * future use:
 * air effects, drop effects etc
 */

var shipsComputerSource : AudioSource;

public static var _instance : CabinEffects;
private var currentClip : AudioClip;
private var redAlert : boolean = false;



public static function Instance() : CabinEffects {
	
	return _instance;
}

function Start () {
	shipsComputerSource = gameObject.AddComponent(AudioSource);
	_instance = this;

}

function Update () {

}

/* for now just play what were passed*/
function QueueVoiceOver(audioClip : AudioClip){
	currentClip = audioClip;
	shipsComputerSource.Stop();
	shipsComputerSource.loop = false;
	shipsComputerSource.clip = currentClip;
	shipsComputerSource.Play();
	
}
/* set the red alert state
 * broadcast to clients that red alert has been engaged
 * todo:
 * .. set the red alert siren going
 * .. play a given VO over the top (to replicate the "hull breach detected" alarm that we have now"
 */
function setRedAlert(state : boolean){
	redAlert = state;
	
	var msg : OSCMessage = OSCMessage("/system/effect/redAlert");
	msg.Append.<int>(state == true ? 1 : 0);
	OSCHandler.Instance.SendMessageToAll(msg);
}

function setRedAlertState(state : boolean, repeatClip : AudioClip){
	setRedAlert(state);
	//do looping
}