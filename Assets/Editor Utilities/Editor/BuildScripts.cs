using UnityEditor;
using UnityEngine;
using System.Collections;


public class BuildScripts : MonoBehaviour {


	[MenuItem("SpaceTools/Windows Build With Postprocess")]
	public static void BuildGame ()
	{
//		// Get filename.
//		string path = EditorUtility.SaveFolderPanel("Choose Location of Built Game", "", "");
//		string[] levels = new string[] {"Assets/Scene1.unity", "Assets/Scene2.unity"};
//		
//		// Build player.
//		BuildPipeline.BuildPlayer(levels, path + "/BuiltGame.exe", BuildTarget.StandaloneWindows, BuildOptions.None);
//		
//		// Copy a file from the project folder to the build folder, alongside the built game.
//		FileUtil.CopyFileOrDirectory("Assets/WebPlayerTemplates/Readme.txt", path + "Readme.txt");
//		
		
	}

	[MenuItem("SpaceTools/Disable Test Moe")]
	public static void HideTestModeObjects(){
		GameObject g = GameObject.Find ("TheShip");
		if(g != null){
			g.SetActive(false);
		}

		g = GameObject.Find ("PersistentScripts");
		if( g != null){
			g.SetActive(false);
		}

	}


}
