using UnityEngine;
using System.Collections;

[ExecuteInEditMode]
public class TextureScroller : MonoBehaviour {

	public Vector2 speed;

	Renderer r;
	// Use this for initialization
	void Start () {
		r = GetComponent<Renderer>();
	}
	
	// Update is called once per frame
	void FixedUpdate () {
		r.material.mainTextureOffset += speed;



	}
}
