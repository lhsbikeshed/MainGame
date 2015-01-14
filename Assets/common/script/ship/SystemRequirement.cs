using UnityEngine;
using System;

/* a requirement that a system has to function or do something
* for example "jump wont function in a gravity well"
*/
[System.Serializable]
public class SystemRequirement: IEquatable<SystemRequirement>{
	public string tag = "";
	public string clientText = "cant work";
	
	public SystemRequirement(string tag,string clientText){
		this.tag = tag;
		this.clientText =clientText;
	}
       
   public bool Equals(SystemRequirement obj)
    {
        if (obj == null) return false;
       
        else return obj.tag == tag;
    }
}