#pragma strict

/* a requirement that a system has to function or do something
* for example "jump wont function in a gravity well"
*/
public class SystemRequirement implements IEquatable.<SystemRequirement>{
	public var tag = "";
	public var clientText = "cant work";
	
	function SystemRequirement(tag : String, clientText : String){
		this.tag = tag;
		this.clientText =clientText;
	}
       
   function Equals(obj : SystemRequirement) : boolean
    {
        if (obj == null) return false;
       
        else return obj.tag == tag;
    }
}