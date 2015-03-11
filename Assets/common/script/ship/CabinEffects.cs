using UnityEngine;
using System;
using System.Collections.Generic;
using UnityOSC;

[System.Serializable]
public class AudioEntry: IComparable<AudioEntry>{
	public int priority = 0;
	public AudioClip clip;
	
	public AudioEntry(AudioClip clip,int priority){
		this.priority = priority;
		this.clip = clip;
	}
	
	public int CompareTo(AudioEntry other) {
		if(other.priority == priority){
			return 0;
		} else if (other.priority > priority){
			return -1;
		} else {
			return 1;
		}
			
	}
}

public class CabinEffects:MonoBehaviour{
	
	/* cabin based effects
	 * for now control the cabin lighting, set red alert states and queue voiceovers from ships comp
	 * future use:
	 * air effects, drop effects etc
	 */
	
	public AudioSource shipsComputerSource;
	public AudioSource loopingAudioSource;
	public AudioClip redAlertLoop;
	
	public static CabinEffects _instance;
	AudioClip currentClip;
	AudioClip repeatClip;
	bool redAlert = false;
	
	List<AudioEntry> clipQueue;
	
	bool playing = false;
	
	
	//lighting
	int previousLightMode = 0;
	int lightMode = 0;
	bool lightState = false;
	bool airlockLightState = false;
	
	public static int LIGHT_IDLE = 0;
	public static int LIGHT_WARP = 1;
	public static int LIGHT_REDALERT = 2;
	public static int LIGHT_BRIEFING = 3;
	
	
	object[] sparkClips;
	
	Transform theShip;
	
	
	
	public static CabinEffects Instance() {
		
		return _instance;
	}
	
	public void Start() {
		shipsComputerSource = gameObject.AddComponent<AudioSource>();
		loopingAudioSource = gameObject.AddComponent<AudioSource>();
		loopingAudioSource.clip = redAlertLoop;
		_instance = this;
		
		clipQueue = new System.Collections.Generic.List<AudioEntry>();
	
		sparkClips = UnityEngine.Resources.LoadAll("sparks", typeof(AudioClip));
		UnityEngine.Debug.Log("loaded " + sparkClips.Length + " spark sounds");
		
		theShip = GameObject.Find("TheShip").transform;
	}
	
	public void FixedUpdate() {
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
	
	public void setAirlockLightState(bool state){
		OSCMessage msg = new OSCMessage("/system/effect/airlockLight");
		msg.Append<int>( state == true ? 1 : 0);
		OSCHandler.Instance.SendMessageToAll(msg);
		airlockLightState = state;
	}
	
	
	public void setCabinLightingMode(int state){
		previousLightMode = lightMode;
		lightMode = state;
		OSCMessage msg = new OSCMessage("/system/effect/lightingMode");
		msg.Append<int>(state);
		OSCHandler.Instance.SendMessageToAll(msg);
	}
	
	public void restoreCabinLightingMode(){
		int lightingMode = previousLightMode;
		OSCMessage msg = new OSCMessage("/system/effect/lightingMode");
		msg.Append<int>(lightingMode);
		OSCHandler.Instance.SendMessageToAll(msg);
	}
	
	public void setCabinLightPower(bool state){
		OSCMessage msg = new OSCMessage("/system/effect/lightingPower");
		msg.Append<int>(state == true ? 1 : 0);
		OSCHandler.Instance.SendMessageToAll(msg);
	}
	
	/* for now just play what were passed*/
	public void QueueVoiceOver(AudioClip audioClip){
		
		QueueVoiceOver(audioClip, 4);
	}
	public void QueueVoiceOver(AudioClip audioClip,int priority){
	//	currentClip = audioClip;
	//	shipsComputerSource.Stop();
	//	shipsComputerSource.loop = false;
	//	shipsComputerSource.clip = currentClip;
	//	shipsComputerSource.Play();
	
		clipQueue.Add( new AudioEntry(audioClip, priority));
		clipQueue.Sort();
		
	
	}
	
	/* spark the strobe and play a sound */
	public void CabinSpark(){
	
		int ra = UnityEngine.Random.Range(0, sparkClips.Length);
		
		AudioSource source = PlayClipAt((AudioClip)sparkClips[ra], theShip.position);
		source.panStereo = -1.0f;
	 	OSCMessage msg = new OSCMessage("/ship/effect/flapStrobe");			
		OSCHandler.Instance.SendMessageToAll(msg);
	}
	
	
	/* set the red alert state
	 * broadcast to clients that red alert has been engaged
	 * todo:
	 * .. set the red alert siren going
	 * .. play a given VO over the top (to replicate the "hull breach detected" alarm that we have now"
	 */
	public void setRedAlert(bool state){
		redAlert = state;
		
		OSCMessage msg = new OSCMessage("/system/effect/redAlert");
		msg.Append<int>(state == true ? 1 : 0);
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
	
	public void setRedAlertState(bool state,AudioClip repeatClip){
		setRedAlert(state);
		//do looping
		
		
	}
	
	
	public AudioSource PlayClipAt(AudioClip clip,Vector3 pos) {
	  GameObject tempGO = new GameObject("TempAudio"); // create the temp object
	  tempGO.transform.position = pos; // set its position
	  AudioSource aSource = tempGO.AddComponent<AudioSource>(); // add an audio source
	  aSource.clip = clip; // define the clip
	  // set other aSource properties here, if desired
	  aSource.Play(); // start the sound
	  Destroy(tempGO, clip.length); // destroy object after clip duration
	  return aSource; // return the AudioSource reference
}

}