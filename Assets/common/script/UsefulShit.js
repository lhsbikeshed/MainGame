#pragma strict


public class UsefulShit extends MonoBehaviour{

	static function PlayClipAt(clip: AudioClip, pos: Vector3): AudioSource {
	  var tempGO = GameObject("TempAudio"); // create the temp object
	  tempGO.transform.position = pos; // set its position
	  var aSource = tempGO.AddComponent(AudioSource); // add an audio source
	  aSource.clip = clip; // define the clip
	  // set other aSource properties here, if desired
	  aSource.Play(); // start the sound
	  Destroy(tempGO, clip.length); // destroy object after clip duration
	  return aSource; // return the AudioSource reference
	}
	
	static function map (x : float , in_min : float, in_max : float , out_min : float, out_max : float  ) : float{
		return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	}
	
}