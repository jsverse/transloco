"use strict";(self.webpackChunktransloco_docs=self.webpackChunktransloco_docs||[]).push([[6459],{7112:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>u,contentTitle:()=>i,default:()=>h,frontMatter:()=>s,metadata:()=>c,toc:()=>d});var a=t(4848),o=t(8453),r=(t(6025),t(1470)),l=t(9365);const s={id:"installation",title:"Installation",description:"Installation | Transloco Angular i18n"},i=void 0,c={id:"getting-started/installation",title:"Installation",description:"Installation | Transloco Angular i18n",source:"@site/docs/getting-started/installation.mdx",sourceDirName:"getting-started",slug:"/getting-started/installation",permalink:"/transloco/docs/getting-started/installation",draft:!1,unlisted:!1,editUrl:"https://github.com/jsverse/transloco/edit/master/docs/docs/getting-started/installation.mdx",tags:[],version:"current",frontMatter:{id:"installation",title:"Installation",description:"Installation | Transloco Angular i18n"},sidebar:"docs",next:{title:"Angular Compatability",permalink:"/transloco/docs/getting-started/angular-compatability"}},u={},d=[{value:"Transloco loader",id:"transloco-loader",level:4},{value:"Translation JSON files",id:"translation-json-files",level:4},{value:"Transloco Global Config",id:"transloco-global-config",level:4}];function p(e){const n={a:"a",admonition:"admonition",code:"code",h4:"h4",p:"p",pre:"pre",...(0,o.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.p,{children:"Install the library using Angular CLI:"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-bash",children:"ng add @jsverse/transloco\n# On an nx workspace\nnpm i @jsverse/transloco\nnx g @jsverse/transloco:ng-add\n"})}),"\n",(0,a.jsxs)(n.p,{children:["For more information, see the ",(0,a.jsx)(n.a,{href:"../schematics/ng-add",children:"ng-add"})," command page."]}),"\n",(0,a.jsx)(n.p,{children:"As part of the installation process you'll be presented with questions; Once you answer them, everything you need will\nautomatically be created for you. Let's take a closer look at the updates made and the generated files:"}),"\n",(0,a.jsxs)(r.A,{queryString:"app-type",children:[(0,a.jsxs)(l.A,{value:"standalone",label:"Standalone",children:[(0,a.jsxs)(n.p,{children:["The command will add the ",(0,a.jsx)(n.code,{children:"provideTransloco"})," and ",(0,a.jsx)(n.code,{children:"provideHttpClient"})," to your app providers:"]}),(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-ts",metastring:'title="app.config.ts"',children:"import { ApplicationConfig, isDevMode } from '@angular/core';\nimport { provideHttpClient } from '@angular/common/http';\nimport { provideTransloco } from '@jsverse/transloco';\n\nimport { TranslocoHttpLoader } from './transloco-loader';\n\nexport const appConfig: ApplicationConfig = {\n    providers: [\n        provideHttpClient(),\n        provideTransloco({\n            config: {\n                availableLangs: ['en', 'es'],\n                defaultLang: 'en',\n                // Remove this option if your application doesn't support changing language in runtime.\n                reRenderOnLangChange: true,\n                prodMode: !isDevMode(),\n            },\n            loader: TranslocoHttpLoader\n        })\n    ]\n};\n\n"})})]}),(0,a.jsxs)(l.A,{value:"ng-module",label:"NgModule",children:[(0,a.jsxs)(n.p,{children:["When added to a module based application a new ",(0,a.jsx)(n.code,{children:"transloco-root.module.ts"})," which exposes an Angular module with a default configuration, and inject it into the ",(0,a.jsx)(n.code,{children:"AppModule"}),":"]}),(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-ts",metastring:'title="transloco-root.module.ts"',children:"import {\n    provideTransloco,\n    TranslocoModule\n} from '@jsverse/transloco';\nimport { Injectable, isDevMode, NgModule } from '@angular/core';\n\nimport { TranslocoHttpLoader } from './transloco-loader';\n\n@NgModule({\n    exports: [ TranslocoModule ],\n    providers: [\n        provideTransloco({\n            config: {\n                availableLangs: ['en', 'es'],\n                defaultLang: 'en',\n                // Remove this option if your application doesn't support changing language in runtime.\n                reRenderOnLangChange: true,\n                prodMode: !isDevMode(),\n            },\n            loader: TranslocoHttpLoader\n        }),\n    ],\n})\nexport class TranslocoRootModule {}\n\n"})}),(0,a.jsx)(n.admonition,{type:"note",children:(0,a.jsxs)(n.p,{children:["You should import the ",(0,a.jsx)(n.code,{children:"TranslocoRootModule"})," once in your root module, and use ",(0,a.jsx)(n.code,{children:"TranslocoModule"})," in any other module."]})})]})]}),"\n",(0,a.jsx)(n.h4,{id:"transloco-loader",children:"Transloco loader"}),"\n",(0,a.jsx)(n.p,{children:"A default http loader implementation to fetch the translation files:"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-ts",children:'import { inject, Injectable } from "@angular/core";\nimport { Translation, TranslocoLoader } from "@jsverse/transloco";\nimport { HttpClient } from "@angular/common/http";\n\n@Injectable({ providedIn: \'root\' })\nexport class TranslocoHttpLoader implements TranslocoLoader {\n    private http = inject(HttpClient);\n\n    getTranslation(lang: string) {\n        return this.http.get<Translation>(`/assets/i18n/${lang}.json`);\n    }\n}\n\n'})}),"\n",(0,a.jsxs)(n.admonition,{type:"note",children:[(0,a.jsx)(n.p,{children:"When you deploy your application and Transloco is unable to load your language files it might because you need to use a\nrelative path:"}),(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-ts",children:"getTranslation(langPath: string) {\n  return this.http.get(`./assets/i18n/${langPath}.json`);\n}\n"})})]}),"\n",(0,a.jsx)(n.h4,{id:"translation-json-files",children:"Translation JSON files"}),"\n",(0,a.jsx)(n.p,{children:"Transloco creates boilerplate files for the requested languages with an empty JSON:"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-json",metastring:'title="assets/i18n/{en, es}.json"',children:"{}\n"})}),"\n",(0,a.jsx)(n.h4,{id:"transloco-global-config",children:"Transloco Global Config"}),"\n",(0,a.jsxs)(n.p,{children:["This config is used by tools & plugins such as the ",(0,a.jsx)(n.a,{href:"../tools/scope-lib-extractor",children:"scoped lib extractor"}),"\nand the ",(0,a.jsx)(n.a,{href:"https://github.com/jsverse/transloco-keys-manager",children:"keys-manager"}),"."]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-ts",metastring:'title="transloco.config.ts"',children:"import {TranslocoGlobalConfig} from '@jsverse/transloco-utils';\n\nconst config: TranslocoGlobalConfig = {\n  rootTranslationsPath: 'src/assets/i18n/',\n  langs: [ 'en', 'es' ],\n  keysManager: {}\n};\n\nexport default config;\n"})}),"\n",(0,a.jsx)(n.p,{children:"And that's it! Now we are ready to use it in our project."})]})}function h(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(p,{...e})}):p(e)}},9365:(e,n,t)=>{t.d(n,{A:()=>l});t(6540);var a=t(4164);const o={tabItem:"tabItem_Ymn6"};var r=t(4848);function l(e){let{children:n,hidden:t,className:l}=e;return(0,r.jsx)("div",{role:"tabpanel",className:(0,a.A)(o.tabItem,l),hidden:t,children:n})}},1470:(e,n,t)=>{t.d(n,{A:()=>T});var a=t(6540),o=t(4164),r=t(3104),l=t(6347),s=t(205),i=t(7485),c=t(1682),u=t(679);function d(e){var n,t;return null!=(n=null==(t=a.Children.toArray(e).filter((e=>"\n"!==e)).map((e=>{if(!e||(0,a.isValidElement)(e)&&function(e){const{props:n}=e;return!!n&&"object"==typeof n&&"value"in n}(e))return e;throw new Error("Docusaurus error: Bad <Tabs> child <"+("string"==typeof e.type?e.type:e.type.name)+'>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.')})))?void 0:t.filter(Boolean))?n:[]}function p(e){const{values:n,children:t}=e;return(0,a.useMemo)((()=>{const e=null!=n?n:function(e){return d(e).map((e=>{let{props:{value:n,label:t,attributes:a,default:o}}=e;return{value:n,label:t,attributes:a,default:o}}))}(t);return function(e){const n=(0,c.X)(e,((e,n)=>e.value===n.value));if(n.length>0)throw new Error('Docusaurus error: Duplicate values "'+n.map((e=>e.value)).join(", ")+'" found in <Tabs>. Every value needs to be unique.')}(e),e}),[n,t])}function h(e){let{value:n,tabValues:t}=e;return t.some((e=>e.value===n))}function g(e){let{queryString:n=!1,groupId:t}=e;const o=(0,l.W6)(),r=function(e){let{queryString:n=!1,groupId:t}=e;if("string"==typeof n)return n;if(!1===n)return null;if(!0===n&&!t)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return null!=t?t:null}({queryString:n,groupId:t});return[(0,i.aZ)(r),(0,a.useCallback)((e=>{if(!r)return;const n=new URLSearchParams(o.location.search);n.set(r,e),o.replace({...o.location,search:n.toString()})}),[r,o])]}function m(e){const{defaultValue:n,queryString:t=!1,groupId:o}=e,r=p(e),[l,i]=(0,a.useState)((()=>function(e){var n;let{defaultValue:t,tabValues:a}=e;if(0===a.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!h({value:t,tabValues:a}))throw new Error('Docusaurus error: The <Tabs> has a defaultValue "'+t+'" but none of its children has the corresponding value. Available values are: '+a.map((e=>e.value)).join(", ")+". If you intend to show no default tab, use defaultValue={null} instead.");return t}const o=null!=(n=a.find((e=>e.default)))?n:a[0];if(!o)throw new Error("Unexpected error: 0 tabValues");return o.value}({defaultValue:n,tabValues:r}))),[c,d]=g({queryString:t,groupId:o}),[m,f]=function(e){let{groupId:n}=e;const t=function(e){return e?"docusaurus.tab."+e:null}(n),[o,r]=(0,u.Dv)(t);return[o,(0,a.useCallback)((e=>{t&&r.set(e)}),[t,r])]}({groupId:o}),v=(()=>{const e=null!=c?c:m;return h({value:e,tabValues:r})?e:null})();(0,s.A)((()=>{v&&i(v)}),[v]);return{selectedValue:l,selectValue:(0,a.useCallback)((e=>{if(!h({value:e,tabValues:r}))throw new Error("Can't select invalid tab value="+e);i(e),d(e),f(e)}),[d,f,r]),tabValues:r}}var f=t(2303);const v={tabList:"tabList__CuJ",tabItem:"tabItem_LNqP"};var b=t(4848);function j(e){let{className:n,block:t,selectedValue:a,selectValue:l,tabValues:s}=e;const i=[],{blockElementScrollPositionUntilNextRender:c}=(0,r.a_)(),u=e=>{const n=e.currentTarget,t=i.indexOf(n),o=s[t].value;o!==a&&(c(n),l(o))},d=e=>{var n;let t=null;switch(e.key){case"Enter":u(e);break;case"ArrowRight":{var a;const n=i.indexOf(e.currentTarget)+1;t=null!=(a=i[n])?a:i[0];break}case"ArrowLeft":{var o;const n=i.indexOf(e.currentTarget)-1;t=null!=(o=i[n])?o:i[i.length-1];break}}null==(n=t)||n.focus()};return(0,b.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,o.A)("tabs",{"tabs--block":t},n),children:s.map((e=>{let{value:n,label:t,attributes:r}=e;return(0,b.jsx)("li",{role:"tab",tabIndex:a===n?0:-1,"aria-selected":a===n,ref:e=>i.push(e),onKeyDown:d,onClick:u,...r,className:(0,o.A)("tabs__item",v.tabItem,null==r?void 0:r.className,{"tabs__item--active":a===n}),children:null!=t?t:n},n)}))})}function x(e){let{lazy:n,children:t,selectedValue:o}=e;const r=(Array.isArray(t)?t:[t]).filter(Boolean);if(n){const e=r.find((e=>e.props.value===o));return e?(0,a.cloneElement)(e,{className:"margin-top--md"}):null}return(0,b.jsx)("div",{className:"margin-top--md",children:r.map(((e,n)=>(0,a.cloneElement)(e,{key:n,hidden:e.props.value!==o})))})}function y(e){const n=m(e);return(0,b.jsxs)("div",{className:(0,o.A)("tabs-container",v.tabList),children:[(0,b.jsx)(j,{...n,...e}),(0,b.jsx)(x,{...n,...e})]})}function T(e){const n=(0,f.A)();return(0,b.jsx)(y,{...e,children:d(e.children)},String(n))}},8453:(e,n,t)=>{t.d(n,{R:()=>l,x:()=>s});var a=t(6540);const o={},r=a.createContext(o);function l(e){const n=a.useContext(r);return a.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function s(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:l(e.components),a.createElement(r.Provider,{value:n},e.children)}}}]);