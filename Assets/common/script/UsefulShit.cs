using UnityEngine;
using System;

[System.Serializable]
public class UsefulShit: MonoBehaviour{

	public static AudioSource PlayClipAt(AudioClip clip,Vector3 pos) {
	  GameObject tempGO = new GameObject("TempAudio"); // create the temp object
	  tempGO.transform.position = pos; // set its position
	  AudioSource aSource = tempGO.AddComponent<AudioSource>(); // add an audio source
	  aSource.clip = clip; // define the clip
	  // set other aSource properties here, if desired
	  aSource.Play(); // start the sound
	  Destroy(tempGO, clip.length); // destroy object after clip duration
	  return aSource; // return the AudioSource reference
	}
	
	public static float map(float x,float in_min,float in_max,float out_min,float out_max){
		return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	}
	
}