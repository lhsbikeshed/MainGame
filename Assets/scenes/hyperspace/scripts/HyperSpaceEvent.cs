using UnityEngine;
using System.Collections;

public abstract class HyperSpaceEvent : MonoBehaviour {
	public float triggerTime = 10f;
	public float triggerDelay = 5f;
	public abstract IEnumerator startSequence();
}
