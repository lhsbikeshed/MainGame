using System;
using UnityEngine;
using System.Collections;
 
public class SkyVid : MonoBehaviour
{
    public MovieTexture movieTexture;
	public Boolean calc  = false;
	public Color avgColour;
	private WebCamTexture webcamTexture ;
    protected bool streamReady = false;
 
    void Start ()
    {       
		WebCamDevice[] devices  = WebCamTexture.devices;
		for( int i = 0 ; i < devices.Length ; i++ )
			Debug.Log(devices[i].name);
        webcamTexture = new WebCamTexture();
		renderer.material.mainTexture = webcamTexture;
		webcamTexture.Play();	
    }
 
   	void Update(){
		if(calc){
			calc = false;
			updateAvgColour();
		}
	}
	
	void updateAvgColour(){
		Color32[] col = new Color32[webcamTexture.width * webcamTexture.height]; 
		webcamTexture.GetPixels32(col);	
		float r=0,g=0,b=1;
		for(int i = 0; i < col.Length; i++){
			r += col[i].r;
			g += col[i].g;
			b += col[i].b;
		}
		r /= col.Length;
		g /= col.Length;
		b /= col.Length;
		avgColour.r = r / 255;
		avgColour.g = g / 255;
		avgColour.b = b / 255;
					
	}
}
	