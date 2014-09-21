import System.Collections.Generic;
import System;
/* cabin based effects
 * for now control the cabin lighting, set red alert states and queue voiceovers from ships comp
 * future use:
 * air effects, drop effects etc
 */

var shipsComputerSource : AudioSource;
var loopingAudioSource : AudioSource;
public var redAlertLoop : AudioClip;

public static var _instance : CabinEffects;
private var currentClip : AudioClip;
private var repeatClip : AudioClip;
private var redAlert : boolean = false;

private var clipQueue : List.<AudioEntry>;

private var playing : boolean = false;


//lighting
private var previousLightMode : int = 0;
private var lightMode : int = 0;
private var lightState : boolean = false;
private var airlockLightState : boolean = false;

public static final var LIGHT_IDLE : int = 0;
public static final var LIGHT_WARP : int = 1;
public static final var LIGHT_REDALERT : int = 2;
public static final var LIGHT_BRIEFING : int = 3;


private var sparkClips : Object[];

private var theShip : Transform;



public static function Instance() : CabinEffects {
	
	return _instance;
}

function Start () {
	shipsComputerSource = gameObject.AddComponent(AudioSource);
	loopingAudioSource = gameObject.AddComponent(AudioSource);
	loopingAudioSource.clip = redAlertLoop;
	_instance = this;
	
	clipQueue = new List.<AudioEntry>();

	sparkClips = UnityEngine.Resources.LoadAll("sparks", typeof(AudioClip));
	Debug.Log("loaded " + sparkClips.Length + " spark sounds");
	
	theShip = GameObject.Find("TheShip").transform;
}

function FixedUpdate () {
	if( ! shipsComputerSource.isPlaying) {	//if nothing is playing check the queue
		if(clipQueue.Count > 0){
			//YAY THERE ARE NOISES TO MAKE
			//pop the top off the queue
			currentClip = clipQueue[0].clip;
			clipQueue.RemoveAt(0);
			
			shipsComputerSource.loop = false;
			shipsComputerSource.clip = currentClip;
			shipsComputerSource.Play();
		}
	}
		
		
		
	
}

function setAirlockLightState(state : boolean){
	var msg : OSCMessage = OSCMessage("/system/effect/airlockLight");
	msg.Append.<int>( state == true ? 1 : 0);
	OSCHandler.Instance.SendMessageToAll(msg);
	airlockLightState = state;
}


function setCabinLightingMode(state : int){
	previousLightMode = lightMode;
	lightMode = state;
	var msg : OSCMessage = OSCMessage("/system/effect/lightingMode");
	msg.Append.<int>(state);
	OSCHandler.Instance.SendMessageToAll(msg);
}

function restoreCabinLightingMode(){
	lightingMode = previousLightMode;
	var msg : OSCMessage = OSCMessage("/system/effect/lightingMode");
	msg.Append.<int>(lightingMode);
	OSCHandler.Instance.SendMessageToAll(msg);
}

function setCabinLightPower(state : boolean){
	var msg : OSCMessage = OSCMessage("/system/effect/lightingPower");
	msg.Append.<int>(state == true ? 1 : 0);
	OSCHandler.Instance.SendMessageToAll(msg);
}

/* for now just play what were passed*/
function QueueVoiceOver(audioClip : AudioClip){
	
	QueueVoiceOver(audioClip, 4);
}
function QueueVoiceOver(audioClip : AudioClip, priority : int){
//	currentClip = audioClip;
//	shipsComputerSource.Stop();
//	shipsComputerSource.loop = false;
//	shipsComputerSource.clip = currentClip;
//	shipsComputerSource.Play();

	clipQueue.Add( new AudioEntry(audioClip, priority));
	clipQueue.Sort();
	

}

/* spark the strobe and play a sound */
function CabinSpark(){

	var ra : int = UnityEngine.Random.Range(0, sparkClips.Length);
	
	var source : AudioSource = PlayClipAt(sparkClips[ra], theShip.position);
	source.pan = -1.0f;
 	var msg : OSCMessage = OSCMessage("/ship/effect/flapStrobe");			
	OSCHandler.Instance.SendMessageToAll(msg);
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
	if(state){
		loopingAudioSource.loop = true;
		loopingAudioSource.Play();
		setCabinLightingMode(LIGHT_REDALERT);
	} else {
		restoreCabinLightingMode();
		loopingAudioSource.Stop();
	}
}

function setRedAlertState(state : boolean, repeatClip : AudioClip){
	setRedAlert(state);
	//do looping
	
	
}


function PlayClipAt(clip: AudioClip, pos: Vector3): AudioSource {
  var tempGO = GameObject("TempAudio"); // create the temp object
  tempGO.transform.position = pos; // set its position
  var aSource = tempGO.AddComponent(AudioSource); // add an audio source
  aSource.clip = clip; // define the clip
  // set other aSource properties here, if desired
  aSource.Play(); // start the sound
  Destroy(tempGO, clip.length); // destroy object after clip duration
  return aSource; // return the AudioSource reference
}


public class AudioEntry  implements IComparable.<AudioEntry>{
	public var priority : int = 0;
	public var clip : AudioClip;
	
	public function AudioEntry(clip: AudioClip, priority : int){
		this.priority = priority;
		this.clip = clip;
	}
	
	public function CompareTo(other : AudioEntry) : int {
		if(other.priority == priority){
			return 0;
		} else if (other.priority > priority){
			return -1;
		} else {
			return 1;
		}
			
	}
}