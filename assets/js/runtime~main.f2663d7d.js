(()=>{"use strict";var e,a,t,r,d,c={},f={};function o(e){var a=f[e];if(void 0!==a)return a.exports;var t=f[e]={id:e,loaded:!1,exports:{}};return c[e].call(t.exports,t,t.exports,o),t.loaded=!0,t.exports}o.m=c,o.c=f,e=[],o.O=(a,t,r,d)=>{if(!t){var c=1/0;for(i=0;i<e.length;i++){t=e[i][0],r=e[i][1],d=e[i][2];for(var f=!0,b=0;b<t.length;b++)(!1&d||c>=d)&&Object.keys(o.O).every((e=>o.O[e](t[b])))?t.splice(b--,1):(f=!1,d<c&&(c=d));if(f){e.splice(i--,1);var n=r();void 0!==n&&(a=n)}}return a}d=d||0;for(var i=e.length;i>0&&e[i-1][2]>d;i--)e[i]=e[i-1];e[i]=[t,r,d]},o.n=e=>{var a=e&&e.__esModule?()=>e.default:()=>e;return o.d(a,{a:a}),a},t=Object.getPrototypeOf?e=>Object.getPrototypeOf(e):e=>e.__proto__,o.t=function(e,r){if(1&r&&(e=this(e)),8&r)return e;if("object"==typeof e&&e){if(4&r&&e.__esModule)return e;if(16&r&&"function"==typeof e.then)return e}var d=Object.create(null);o.r(d);var c={};a=a||[null,t({}),t([]),t(t)];for(var f=2&r&&e;"object"==typeof f&&!~a.indexOf(f);f=t(f))Object.getOwnPropertyNames(f).forEach((a=>c[a]=()=>e[a]));return c.default=()=>e,o.d(d,c),d},o.d=(e,a)=>{for(var t in a)o.o(a,t)&&!o.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:a[t]})},o.f={},o.e=e=>Promise.all(Object.keys(o.f).reduce(((a,t)=>(o.f[t](e,a),a)),[])),o.u=e=>"assets/js/"+({42:"b46bbad0",251:"828e241f",498:"4687851f",957:"c141421f",1011:"ea313555",1021:"45d7e894",1054:"57575c16",1090:"177de9e1",1235:"a7456010",1698:"2428b542",1745:"1895fca9",1864:"0db64d9d",2138:"1a4e3797",2363:"066c37e2",2415:"11049548",2490:"578a8fbd",2634:"c4f5d8e4",3011:"36dc5c97",3047:"711e5342",3535:"d16f17f3",3585:"f8289b03",4241:"50fbf339",4255:"6ebf2a3a",4582:"34418544",4798:"2c8f1445",4860:"1dc2873a",4967:"b6de4ce1",5002:"10e5051b",5201:"4dc7fb17",5221:"edca4672",5304:"6b158a97",5437:"bc25c4a6",5460:"4bb42e48",5643:"584eeadd",5675:"d707b4a9",5706:"3f0d6008",5731:"54a4611d",5742:"aba21aa0",6459:"6459b84b",7098:"a7bd4aaa",7189:"3e47ec67",7272:"25290e68",7617:"a3e68599",8350:"f5916a9d",8401:"17896441",8751:"2d91c6cb",8892:"138741eb",8906:"e427aef3",9048:"a94703ab",9498:"a675d0dd",9647:"5e95c892"}[e]||e)+"."+{42:"ae2aaadd",251:"5e846c7a",498:"259799e7",957:"79729249",1011:"56f5ff72",1021:"4b8fc50d",1054:"c213e00b",1090:"ed85221d",1235:"ce228a1e",1698:"138b720a",1745:"ec67e75c",1864:"2ce701d4",2138:"02139235",2363:"5bf9433a",2415:"87807c77",2490:"61246a4c",2634:"fbff3246",3011:"da11f075",3047:"9bcc9865",3431:"9221ed7a",3535:"ca4559ff",3585:"545e3ada",4241:"bd90bed3",4255:"26da2ddd",4582:"f8ef4012",4798:"9d8afa1a",4860:"f8f9c278",4967:"2c34afc5",5002:"982ef3ec",5201:"5dfb2088",5221:"e76f9fe8",5304:"d0f44c34",5437:"356edb6d",5460:"8bd4e8fe",5643:"27beaf6e",5675:"73619918",5706:"2f20f2aa",5731:"a94e4e83",5742:"ac22c7b2",6026:"7c3a5c1b",6459:"ebc5327e",7098:"99517121",7189:"2d390d92",7272:"be9c9190",7617:"af7c49c8",8350:"735b18d4",8401:"58cec9d7",8751:"4b2baa9b",8892:"67375936",8906:"0236501d",8973:"e19d4cb0",9048:"69ffc457",9498:"3a3cad78",9647:"6319bebc",9714:"22bd6081"}[e]+".js",o.miniCssF=e=>{},o.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),o.o=(e,a)=>Object.prototype.hasOwnProperty.call(e,a),r={},d="transloco-docs:",o.l=(e,a,t,c)=>{if(r[e])r[e].push(a);else{var f,b;if(void 0!==t)for(var n=document.getElementsByTagName("script"),i=0;i<n.length;i++){var l=n[i];if(l.getAttribute("src")==e||l.getAttribute("data-webpack")==d+t){f=l;break}}f||(b=!0,(f=document.createElement("script")).charset="utf-8",f.timeout=120,o.nc&&f.setAttribute("nonce",o.nc),f.setAttribute("data-webpack",d+t),f.src=e),r[e]=[a];var u=(a,t)=>{f.onerror=f.onload=null,clearTimeout(s);var d=r[e];if(delete r[e],f.parentNode&&f.parentNode.removeChild(f),d&&d.forEach((e=>e(t))),a)return a(t)},s=setTimeout(u.bind(null,void 0,{type:"timeout",target:f}),12e4);f.onerror=u.bind(null,f.onerror),f.onload=u.bind(null,f.onload),b&&document.head.appendChild(f)}},o.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.p="/transloco/",o.gca=function(e){return e={11049548:"2415",17896441:"8401",34418544:"4582",b46bbad0:"42","828e241f":"251","4687851f":"498",c141421f:"957",ea313555:"1011","45d7e894":"1021","57575c16":"1054","177de9e1":"1090",a7456010:"1235","2428b542":"1698","1895fca9":"1745","0db64d9d":"1864","1a4e3797":"2138","066c37e2":"2363","578a8fbd":"2490",c4f5d8e4:"2634","36dc5c97":"3011","711e5342":"3047",d16f17f3:"3535",f8289b03:"3585","50fbf339":"4241","6ebf2a3a":"4255","2c8f1445":"4798","1dc2873a":"4860",b6de4ce1:"4967","10e5051b":"5002","4dc7fb17":"5201",edca4672:"5221","6b158a97":"5304",bc25c4a6:"5437","4bb42e48":"5460","584eeadd":"5643",d707b4a9:"5675","3f0d6008":"5706","54a4611d":"5731",aba21aa0:"5742","6459b84b":"6459",a7bd4aaa:"7098","3e47ec67":"7189","25290e68":"7272",a3e68599:"7617",f5916a9d:"8350","2d91c6cb":"8751","138741eb":"8892",e427aef3:"8906",a94703ab:"9048",a675d0dd:"9498","5e95c892":"9647"}[e]||e,o.p+o.u(e)},(()=>{var e={5354:0,1869:0};o.f.j=(a,t)=>{var r=o.o(e,a)?e[a]:void 0;if(0!==r)if(r)t.push(r[2]);else if(/^(1869|5354)$/.test(a))e[a]=0;else{var d=new Promise(((t,d)=>r=e[a]=[t,d]));t.push(r[2]=d);var c=o.p+o.u(a),f=new Error;o.l(c,(t=>{if(o.o(e,a)&&(0!==(r=e[a])&&(e[a]=void 0),r)){var d=t&&("load"===t.type?"missing":t.type),c=t&&t.target&&t.target.src;f.message="Loading chunk "+a+" failed.\n("+d+": "+c+")",f.name="ChunkLoadError",f.type=d,f.request=c,r[1](f)}}),"chunk-"+a,a)}},o.O.j=a=>0===e[a];var a=(a,t)=>{var r,d,c=t[0],f=t[1],b=t[2],n=0;if(c.some((a=>0!==e[a]))){for(r in f)o.o(f,r)&&(o.m[r]=f[r]);if(b)var i=b(o)}for(a&&a(t);n<c.length;n++)d=c[n],o.o(e,d)&&e[d]&&e[d][0](),e[d]=0;return o.O(i)},t=self.webpackChunktransloco_docs=self.webpackChunktransloco_docs||[];t.forEach(a.bind(null,0)),t.push=a.bind(null,t.push.bind(t))})()})();