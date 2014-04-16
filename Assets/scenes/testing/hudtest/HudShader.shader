Shader "Custom/HudShader" {
	Properties {
		_Color ("Main Color", Color) = (1.0, 0.0, 0.0, 1.0) 
		_StripeSize("Strip gap", Float) = 2.0
		_StripeThick("Strip Thickness", Float) = 2.0
		_StripeScroll("Stripe scroll", Float) = 1.0
	}
	 SubShader {
        Pass {
        	ZWrite Off
    		Blend SrcAlpha OneMinusSrcAlpha
           	CGPROGRAM
// Upgrade NOTE: excluded shader from DX11 and Xbox360; has structs without semantics (struct v2f members passPos)
#pragma exclude_renderers d3d11 xbox360
			// Upgrade NOTE: excluded shader from Xbox360; has structs without semantics (struct v2f members passPos)
			#pragma exclude_renderers xbox360

			#pragma vertex vert
			#pragma fragment frag
			#include "UnityCG.cginc"
			float4 _Color;
			float _StripeSize;
			float _StripeScroll;
			float _StripeThick;
			
			struct v2f {
			    float4 pos : SV_POSITION;
			    float4 color : COLOR0;
			    float4 passPos;
			};
			
			v2f vert (appdata_base v)
			{
			    v2f o;
			    o.pos = mul (UNITY_MATRIX_MVP, v.vertex);
			    o.passPos = o.pos;
			    //o.color = _Color * float( 1 ) ;
			    
			    return o;
			}
			 
			half4 frag (v2f i) : COLOR
			{
				float f = fmod( abs(i.passPos.y ) + _StripeScroll,  _StripeSize);
				if(f < _StripeThick){
				
					i.color = _Color * (f / _StripeThick);
				} else {
					i.color = float4(0,0,0,0);
				}
			    return half4(i.color);
			}
			ENDCG
        }
    }
}
