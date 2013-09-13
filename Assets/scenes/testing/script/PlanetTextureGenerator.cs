using UnityEngine;
using System.Collections;

public class PlanetTextureGenerator : MonoBehaviour {

	public Texture2D texture;
	public Vector2 seed;
	public int levels = 1;
	Material m;
	public float scale = 0.1f;
	public bool regen = false;
	
	
	// Use this for initialization
	void Start () {
		m = GetComponentInChildren<Renderer>().material;
		regenerate();
	}
	
	void regenerate(){
		texture = new Texture2D(512,512);
		Color[] pix = new Color[512*512];
		for(int i = 0; i < 512*512;i++){
			pix[i] = new Color(1,1,0);
		}
		float[,] cols = new float[512,512];
		
		for(int l = 0; l < levels; l++){
			for(int x = 0; x < 512; x++){
				for(int y = 0; y < 512; y++){
					cols[x,y] += Mathf.PerlinNoise( (seed.x + x) * (l*scale/100.0f) , (seed.y + y) * (l*scale / 100.0f));
					
					if(l == levels -1){
						cols[x,y] /= (float)levels;
						pix[y * 512 + x] = new Color(cols[x,y],cols[x,y],cols[x,y],1);
					}
				}
			}
		}
		
		
		
		
		texture.SetPixels(pix);
		texture.Apply();
		m.SetTexture("_MainTex", texture);
	}
	
	// Update is called once per frame
	void Update () {
		if(regen){
			regen = false;
			regenerate();
		}
	}
}
